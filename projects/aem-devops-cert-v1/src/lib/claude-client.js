const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL = 'claude-haiku-4-5'

/**
 * Evaluate a teach-back explanation using the Claude API.
 * Output schema matches the deposited score-explanation skill.
 *
 * @param {Object} params
 * @param {string} params.apiKey - Claude API key from localStorage
 * @param {string} params.explanation - The learner's explanation text
 * @param {string} params.topicTitle - Human-readable topic title
 * @param {string} params.researchContent - Source research markdown for the topic
 * @returns {Promise<{
 *   completeness: number,
 *   accuracy: number,
 *   depth: "surface" | "moderate" | "deep",
 *   coveredWell: string[],
 *   partiallyCorrect: string[],
 *   missing: string[],
 *   followUpQuestion: string,
 *   overallFeedback: string
 * }>}
 */
export async function evaluateExplanation({ apiKey, explanation, topicTitle, researchContent }) {
  const systemPrompt = `You are an expert technical educator evaluating a learner's explanation of a topic.
You must return ONLY a valid JSON object — no prose, no markdown fences, no extra text.

The JSON must match this exact schema:
{
  "completeness": <number 0-100>,
  "accuracy": <number 0-100>,
  "depth": <"surface" | "moderate" | "deep">,
  "coveredWell": [<string>, ...],
  "partiallyCorrect": [<string>, ...],
  "missing": [<string>, ...],
  "followUpQuestion": <string>,
  "overallFeedback": <string>
}

Evaluation dimensions:
- completeness (0-100): What percentage of key concepts from the research did the learner cover? Count covered concepts against total key concepts.
- accuracy (0-100): Were the learner's statements technically correct? Deduct for factual errors, overgeneralizations, or misleading claims.
- depth: Classify overall depth as one of:
  "surface" — Recites definitions or bullet points without elaboration
  "moderate" — Explains how and why, not just what
  "deep" — Demonstrates genuine understanding through examples, analogies, trade-off analysis, or connections to other topics
- coveredWell: List 2-5 concepts the learner explained accurately and thoroughly. Be specific.
- partiallyCorrect: List concepts the learner addressed but got partially wrong or missed important nuance. Briefly note what was missing.
- missing: List 2-5 key concepts from the research that the learner did not mention at all.
- followUpQuestion: Craft one targeted Socratic question probing their weakest area. Invite deeper thinking, not just fact recall.
- overallFeedback: A 2-3 sentence summary of where they stand and what to focus on next. Be specific and actionable.

Coaching principles:
- Do not penalize for informal language or unconventional structure. Judge understanding, not polish.
- A learner who uses their own examples or analogies (even imperfect ones) demonstrates deeper understanding than one who parrots the source material.`

  const userPrompt = `Topic: ${topicTitle}

Source research material:
${researchContent || '(No research content available — evaluate based on the topic title alone.)'}

Learner's explanation:
${explanation}

Evaluate the explanation against the research material and return the JSON grading object.`

  let response
  try {
    response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })
  } catch (networkError) {
    throw new Error(`Network error: unable to reach api.anthropic.com. Check your internet connection.`)
  }

  if (response.status === 401) {
    throw new Error('invalid-api-key')
  }
  if (response.status === 429) {
    throw new Error('Rate limit exceeded. Please wait a moment and try again.')
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`API error ${response.status}: ${body || response.statusText}`)
  }

  const data = await response.json()
  let rawText = data?.content?.[0]?.text || ''

  // Strip markdown code fences if present (Claude sometimes wraps JSON in ```json ... ```)
  rawText = rawText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()

  let parsed
  try {
    parsed = JSON.parse(rawText)
  } catch {
    throw new Error('Claude returned an unexpected response format. Please try again.')
  }

  // Validate and normalise all fields with sensible defaults
  const completeness = typeof parsed.completeness === 'number' ? Math.max(0, Math.min(100, parsed.completeness)) : 60
  const accuracy = typeof parsed.accuracy === 'number' ? Math.max(0, Math.min(100, parsed.accuracy)) : 70
  const depthValues = ['surface', 'moderate', 'deep']
  const depth = depthValues.includes(parsed.depth) ? parsed.depth : 'moderate'
  const coveredWell = Array.isArray(parsed.coveredWell) ? parsed.coveredWell.slice(0, 6) : []
  const partiallyCorrect = Array.isArray(parsed.partiallyCorrect) ? parsed.partiallyCorrect.slice(0, 6) : []
  const missing = Array.isArray(parsed.missing) ? parsed.missing.slice(0, 6) : []
  const followUpQuestion = typeof parsed.followUpQuestion === 'string' ? parsed.followUpQuestion : ''
  const overallFeedback = typeof parsed.overallFeedback === 'string' ? parsed.overallFeedback : ''

  return { completeness, accuracy, depth, coveredWell, partiallyCorrect, missing, followUpQuestion, overallFeedback }
}
