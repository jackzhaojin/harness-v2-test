import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Mic, Send, RotateCcw, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react'

export default function TeachBackInput({ topic, onClear }) {
  const [explanation, setExplanation] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [evaluation, setEvaluation] = useState(null)

  const handleSubmit = () => {
    if (!explanation.trim()) {
      alert('Please write your explanation before submitting')
      return
    }

    // Simulate evaluation - in production this would call an AI agent
    const mockEvaluation = {
      score: Math.floor(Math.random() * 30) + 70, // 70-100
      strengths: [
        'Clear structure and organization',
        'Good use of examples',
        'Accurate technical terminology'
      ],
      improvements: [
        'Could expand on edge cases',
        'Consider adding more real-world applications',
        'Explain the "why" behind certain decisions'
      ],
      followUpQuestions: [
        'How would this concept apply in a production environment?',
        'What are the potential pitfalls or common mistakes?',
        'Can you compare this to alternative approaches?'
      ]
    }

    setEvaluation(mockEvaluation)
    setSubmitted(true)
  }

  const handleReset = () => {
    setExplanation('')
    setSubmitted(false)
    setEvaluation(null)
  }

  const handleNewTopic = () => {
    handleReset()
    onClear()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Explain: {topic}</CardTitle>
            <Button variant="outline" size="sm" onClick={handleNewTopic}>
              Change Topic
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!submitted ? (
            <>
              <Textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain this topic in your own words, as if you were teaching it to someone else. Include key concepts, examples, and practical applications..."
                rows={12}
                className="resize-none font-mono text-sm"
              />

              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">
                  <Send className="h-4 w-4 mr-2" />
                  Submit Explanation
                </Button>
                <Button variant="outline" disabled className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Voice Input (Coming Soon)
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Your Explanation:</h4>
                <div className="bg-muted p-4 rounded-lg text-sm whitespace-pre-wrap font-mono">
                  {explanation}
                </div>
              </div>

              <Button onClick={handleReset} variant="outline" className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evaluation Display */}
      {submitted && evaluation && (
        <>
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Evaluation Score: {evaluation.score}/100
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Strengths
                </h4>
                <ul className="space-y-1">
                  {evaluation.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-green-500">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Areas for Improvement
                </h4>
                <ul className="space-y-1">
                  {evaluation.improvements.map((improvement, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-yellow-500">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Follow-Up Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Deepen your understanding by considering these questions:
              </p>
              <div className="space-y-2">
                {evaluation.followUpQuestions.map((question, idx) => (
                  <div key={idx} className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">{idx + 1}. {question}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-xs text-muted-foreground italic">
              Note: This is a placeholder evaluation. In production, an AI agent would provide
              personalized feedback based on your explanation, identifying specific gaps and
              suggesting targeted improvements.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
