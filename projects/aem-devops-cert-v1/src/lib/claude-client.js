const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL = 'claude-haiku-4-5'

/**
 * Evaluate a teach-back explanation using the Claude API.
 *
 * @param {Object} params
 * @param {string} params.apiKey - Claude API key from localStorage
 * @param {string} params.explanation - The learner's explanation text
 * @param {string} params.topicTitle - Human-readable topic title
 * @param {string} params.researchContent - Source research markdown for the topic
 * @returns {Promise<{ logicAccuracy: number, depth: number, flow: string, suggestions: string[], semanticGaps: { name: string, status: string }[] }>}
 */
export async function evaluateExplanation({ apiKey, explanation, topicTitle, researchContent }) {
  const systemPrompt = `You are an expert technical educator evaluating a learner's explanation of a topic.
You must return ONLY a valid JSON object — no prose, no markdown fences, no extra text.

The JSON must match this exact schema:
{
  "logicAccuracy": <number 0-100>,
  "depth": <number 0-100>,
  "flow": <"Optimal" | "Good" | "Fair" | "Needs Work">,
  "suggestions": [<string>, ...],
  "semanticGaps": [{ "name": <string>, "status": <"covered" | "missing"> }, ...]
}

Scoring guidelines:
- logicAccuracy: What percentage of statements are technically correct? (0-100)
- depth: How deeply does the learner go beyond surface definitions? (0-100)
- flow: How well does the explanation flow logically and didactically?
- suggestions: 2-4 actionable improvement suggestions
- semanticGaps: 3-6 key concepts from the research, each marked "covered" or "missing"`

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
  const rawText = data?.content?.[0]?.text || ''

  let parsed
  try {
    parsed = JSON.parse(rawText)
  } catch {
    throw new Error('Claude returned an unexpected response format. Please try again.')
  }

  // Validate and normalise required fields
  const logicAccuracy = typeof parsed.logicAccuracy === 'number' ? Math.max(0, Math.min(100, parsed.logicAccuracy)) : 70
  const depth = typeof parsed.depth === 'number' ? Math.max(0, Math.min(100, parsed.depth)) : 60
  const flow = typeof parsed.flow === 'string' ? parsed.flow : 'Fair'
  const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 4) : []
  const semanticGaps = Array.isArray(parsed.semanticGaps)
    ? parsed.semanticGaps.map(g => ({
        name: String(g.name || ''),
        status: g.status === 'covered' ? 'covered' : 'missing',
      }))
    : []

  return { logicAccuracy, depth, flow, suggestions, semanticGaps }
}
