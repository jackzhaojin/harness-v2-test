import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function TeachBackInput({ topics, onSubmit }) {
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [explanations, setExplanations] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const currentExplanation = explanations[selectedTopicId] || ''

  const handleExplanationChange = (e) => {
    setExplanations((prev) => ({
      ...prev,
      [selectedTopicId]: e.target.value,
    }))
    if (submitted) setSubmitted(false)
  }

  const handleSubmit = () => {
    if (selectedTopicId && currentExplanation.trim()) {
      setSubmitted(true)
      if (onSubmit) {
        onSubmit({ topicId: selectedTopicId, explanation: currentExplanation })
      }
    }
  }

  // Build a flat list of leaf topics for the selector
  const flatTopics = []
  function flatten(nodes, prefix) {
    for (const node of nodes) {
      const subs = node.subtopics || []
      if (subs.length === 0) {
        flatTopics.push({ id: node.id, title: prefix ? `${prefix} > ${node.title}` : node.title })
      } else {
        flatten(subs, prefix ? `${prefix} > ${node.title}` : node.title)
      }
    }
  }
  flatten(topics, '')

  return (
    <div className="space-y-6">
      {/* Topic selector */}
      <div>
        <label
          htmlFor="topic-select"
          className="text-sm font-medium block mb-2"
        >
          Select a topic to explain
        </label>
        <select
          id="topic-select"
          value={selectedTopicId}
          onChange={(e) => {
            setSelectedTopicId(e.target.value)
            setSubmitted(false)
          }}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Select topic"
        >
          <option value="">Choose a topic...</option>
          {flatTopics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      {/* Explanation textarea */}
      {selectedTopicId && (
        <>
          <div>
            <label
              htmlFor="explanation-input"
              className="text-sm font-medium block mb-2"
            >
              Explain this concept in your own words
            </label>
            <Textarea
              id="explanation-input"
              placeholder="Teach this concept as if you were explaining it to a colleague who has never heard of it before..."
              value={currentExplanation}
              onChange={handleExplanationChange}
              rows={8}
              className="min-h-[200px]"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={!currentExplanation.trim()}
              className="flex-1"
            >
              Submit Explanation
            </Button>
            <Button
              variant="outline"
              disabled
              title="Voice input coming soon"
              aria-label="Voice input coming soon"
            >
              Voice Input (Coming Soon)
            </Button>
          </div>

          {/* Evaluation panel */}
          {submitted && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evaluation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Evaluation will appear here after you submit your explanation.
                  In a future update, this will connect to the coaching agent.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
