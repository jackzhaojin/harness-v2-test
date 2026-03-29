import scoreExplanationSkill from '../../.claude/skills/score-explanation/SKILL.md?raw'

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL = 'claude-haiku-4-5'

/**
 * Evaluate a teach-back explanation using the Claude API.
 * System prompt is loaded from the score-explanation skill definition
 * (.claude/skills/score-explanation/SKILL.md) so the skill is the single
 * source of truth for evaluation criteria.
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

Follow the evaluation procedure and output format defined in the skill below:

${scoreExplanationSkill}`

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
