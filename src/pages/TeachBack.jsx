import { useState } from 'react'
import { MessageSquare, Mic, Send, RotateCcw } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Badge } from '../components/ui/badge'
import { useManifest } from '../hooks/useManifest'

export default function TeachBack() {
  const { manifest } = useManifest()
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [explanation, setExplanation] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [evaluation, setEvaluation] = useState(null)

  // Get all leaf topics from manifest
  const getAllTopics = (topics) => {
    const result = []
    const traverse = (items) => {
      items.forEach(item => {
        if (!item.children || item.children.length === 0) {
          result.push(item)
        } else {
          result.push(item)
          traverse(item.children)
        }
      })
    }
    traverse(topics)
    return result
  }

  const allTopics = manifest ? getAllTopics(manifest.topics) : []

  const handleSubmit = () => {
    if (!explanation.trim()) return

    // Mock evaluation - in production this would come from an AI agent
    const mockEvaluation = {
      score: Math.floor(Math.random() * 30) + 70, // 70-100
      strengths: [
        "Clear explanation of the core concept",
        "Good use of examples to illustrate points",
        "Logical flow of ideas"
      ],
      improvements: [
        "Could elaborate more on edge cases",
        "Consider discussing practical applications",
        "Add more technical depth to certain points"
      ],
      followUpQuestions: [
        "How would you apply this concept in a production environment?",
        "What are the potential pitfalls to avoid?",
        "Can you compare this approach with alternative solutions?"
      ]
    }

    setEvaluation(mockEvaluation)
    setSubmitted(true)
  }

  const handleReset = () => {
    setExplanation('')
    setSubmitted(false)
    setEvaluation(null)
    setSelectedTopic(null)
  }

  const handleNewTopic = () => {
    setExplanation('')
    setSubmitted(false)
    setEvaluation(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <MessageSquare className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Teach-Back Exercise</h1>
          <p className="text-muted-foreground">
            Explain concepts in your own words for deeper learning
          </p>
        </div>
      </div>

      {/* Topic Selection */}
      {!selectedTopic && (
        <Card>
          <CardHeader>
            <CardTitle>Choose a Topic to Explain</CardTitle>
            <CardDescription>
              Select a topic you'd like to practice explaining
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {allTopics.map(topic => (
                <Button
                  key={topic.id}
                  variant="outline"
                  onClick={() => setSelectedTopic(topic)}
                  className="h-auto py-3 px-4 justify-start text-left"
                >
                  <div>
                    <div className="font-semibold">{topic.name}</div>
                    {topic.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {topic.description}
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input Card */}
      {selectedTopic && !submitted && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Explain: {selectedTopic.name}</CardTitle>
                <CardDescription>
                  Write your explanation in your own words
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedTopic(null)}>
                Change Topic
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Text Input */}
            <div className="space-y-2">
              <label className="font-semibold block">Your Explanation</label>
              <Textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Start typing your explanation here... Try to explain the concept as if you were teaching it to someone else."
                className="min-h-[300px]"
              />
              <p className="text-sm text-muted-foreground">
                {explanation.length} characters
              </p>
            </div>

            {/* Voice Input Placeholder */}
            <div className="rounded-lg border-2 border-dashed p-6 text-center">
              <Mic className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="font-medium mb-1">Voice Input</p>
              <p className="text-sm text-muted-foreground mb-3">
                Voice recording feature coming soon
              </p>
              <Button variant="outline" disabled>
                <Mic className="h-4 w-4 mr-2" />
                Record Voice Explanation
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={!explanation.trim()}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                Submit for Evaluation
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evaluation Display */}
      {submitted && evaluation && (
        <div className="space-y-4">
          {/* Score */}
          <Card className="border-2 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-2">
                  {evaluation.score}%
                </div>
                <p className="text-muted-foreground">Overall Score</p>
              </div>
            </CardContent>
          </Card>

          {/* Your Explanation */}
          <Card>
            <CardHeader>
              <CardTitle>Your Explanation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {explanation}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600 dark:text-green-400">
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {evaluation.strengths.map((strength, index) => (
                  <li key={index} className="flex gap-2 text-sm">
                    <span className="text-green-600 dark:text-green-400">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Areas for Improvement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600 dark:text-orange-400">
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {evaluation.improvements.map((improvement, index) => (
                  <li key={index} className="flex gap-2 text-sm">
                    <span className="text-orange-600 dark:text-orange-400">→</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Follow-up Questions */}
          <Card>
            <CardHeader>
              <CardTitle>Follow-up Questions</CardTitle>
              <CardDescription>
                Deepen your understanding by considering these questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {evaluation.followUpQuestions.map((question, index) => (
                  <div key={index} className="rounded-lg bg-muted p-3">
                    <p className="text-sm font-medium">{index + 1}. {question}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Agent Integration Note */}
          <Card className="border-2 border-dashed">
            <CardContent className="pt-6">
              <div className="text-center text-sm">
                <p className="font-medium mb-1">🤖 Agent Evaluation Ready</p>
                <p className="text-muted-foreground">
                  This evaluation panel is designed to receive personalized feedback from an external AI agent.
                  The agent can analyze your explanation and provide detailed, context-aware coaching.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handleNewTopic} className="flex-1">
              Try Another Topic
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Start Over
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
