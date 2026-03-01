import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import TeachBackInput from '../components/TeachBackInput'

export default function TeachBack() {
  const [selectedTopic, setSelectedTopic] = useState('')

  const suggestedTopics = [
    'Prompt Caching',
    'Extended Thinking',
    'Tool Use Fundamentals',
    'Agent Orchestration',
    'Context Management',
    'Batch Processing',
    'Vision Capabilities',
    'LLM-Based Grading',
    'Claude Code CLI',
    'Rate Limits and Usage Tiers'
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Teach-Back Practice</h1>
        <p className="text-muted-foreground">
          Explain concepts in your own words to reinforce your understanding through active recall
        </p>
      </div>

      {/* Topic Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Choose a Topic</CardTitle>
          <CardDescription>
            Select a topic you want to practice explaining, or write your own
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Topic</label>
            <input
              type="text"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              placeholder="Enter a topic or select from suggestions below..."
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <div>
            <p className="text-sm font-medium mb-3">Suggested Topics:</p>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {suggestedTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className={`text-left p-3 rounded-lg border transition-colors ${
                    selectedTopic === topic
                      ? 'border-primary bg-accent'
                      : 'border-border hover:border-primary/50 hover:bg-accent/50'
                  }`}
                >
                  <span className="text-sm">{topic}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teach-Back Input */}
      {selectedTopic && (
        <TeachBackInput topic={selectedTopic} onClear={() => setSelectedTopic('')} />
      )}

      {/* Instructions */}
      {!selectedTopic && (
        <Card>
          <CardHeader>
            <CardTitle>How Teach-Back Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Select a Topic</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose a certification topic you want to practice explaining
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Explain in Your Own Words</h4>
                  <p className="text-sm text-muted-foreground">
                    Write or speak your explanation as if teaching someone else
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Get Feedback</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive evaluation and follow-up questions to deepen understanding
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Refine and Improve</h4>
                  <p className="text-sm text-muted-foreground">
                    Address gaps and try again to strengthen your knowledge
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg mt-6">
              <p className="text-sm font-medium mb-2">Why Teach-Back?</p>
              <p className="text-sm text-muted-foreground">
                Teaching a concept forces you to organize your thoughts, identify gaps in
                understanding, and articulate ideas clearly. Research shows that explaining
                concepts to others (or imagining you are) is one of the most effective
                learning strategies for long-term retention.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
