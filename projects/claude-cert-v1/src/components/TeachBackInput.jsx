import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Mic, Send } from 'lucide-react'

function getLeafTopics(topics, result = []) {
  if (!topics) return result
  for (const t of topics) {
    const children = t.subtopics || []
    if (children.length === 0) {
      result.push(t)
    } else {
      getLeafTopics(children, result)
    }
  }
  return result
}

export default function TeachBackInput({ topicTree }) {
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [explanations, setExplanations] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const leafTopics = useMemo(() => {
    if (!topicTree?.topics) return []
    return getLeafTopics(topicTree.topics)
  }, [topicTree])

  const currentExplanation = explanations[selectedTopicId] || ''

  const handleExplanationChange = (e) => {
    setExplanations((prev) => ({
      ...prev,
      [selectedTopicId]: e.target.value,
    }))
    setSubmitted(false)
  }

  const handleSubmit = () => {
    if (!currentExplanation.trim() || !selectedTopicId) return
    setSubmitted(true)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Topic Selector */}
      <div className="space-y-2">
        <Label htmlFor="topic-select" className="text-sm font-medium">
          Select a topic to explain
        </Label>
        <select
          id="topic-select"
          value={selectedTopicId}
          onChange={(e) => {
            setSelectedTopicId(e.target.value)
            setSubmitted(false)
          }}
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Select topic"
        >
          <option value="">Choose a topic...</option>
          {leafTopics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.title}
            </option>
          ))}
        </select>
      </div>

      {/* Explanation textarea */}
      <div className="space-y-2">
        <Label htmlFor="explanation" className="text-sm font-medium">
          Explain this concept in your own words
        </Label>
        <Textarea
          id="explanation"
          placeholder={selectedTopicId
            ? 'Imagine you are teaching this concept to a colleague who has never heard of it. Explain it clearly and completely...'
            : 'Select a topic above to start explaining...'
          }
          value={currentExplanation}
          onChange={handleExplanationChange}
          rows={8}
          disabled={!selectedTopicId}
          className="resize-y min-h-[200px]"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {currentExplanation.length > 0
              ? `${currentExplanation.split(/\s+/).filter(Boolean).length} words`
              : 'Write your explanation above'
            }
          </p>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" disabled aria-label="Voice input coming soon">
                <Mic className="size-4 mr-1" />
                Voice Input
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Voice input coming soon</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!selectedTopicId || !currentExplanation.trim()}
        className="w-full"
      >
        <Send className="size-4 mr-2" />
        Submit Explanation
      </Button>

      {/* Evaluation area */}
      {submitted && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evaluation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border border-dashed rounded-md p-6 text-center text-sm text-muted-foreground">
              Evaluation will appear here after you submit your explanation.
              In a future update, this will connect to the coaching agent.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
