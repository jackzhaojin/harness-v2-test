import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { CheckCircle2, XCircle, MessageSquare } from 'lucide-react'

export default function CoachingPanel({ isCorrect, question, userAnswer, userRationale }) {
  // This is a placeholder that would be populated by an external agent
  // For now, we'll show a structured coaching template

  const coaching = {
    assessment: isCorrect
      ? "Great job! Your answer is correct."
      : "Not quite right, but let's review together.",
    keyPoints: isCorrect
      ? [
          "You correctly identified the key concept",
          "Your reasoning aligns with best practices",
          "Consider how this applies to similar scenarios"
        ]
      : [
          "Review the key concept in the scenario",
          "Consider the constraints mentioned",
          "Think about the trade-offs between options"
        ],
    nextSteps: isCorrect
      ? "Try applying this concept to more complex scenarios in related topics."
      : "Review the reference materials and try a similar question to reinforce the concept."
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" />
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              Coaching Feedback
              {isCorrect ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Assessment */}
        <div>
          <h4 className="font-semibold mb-2">Assessment</h4>
          <p className="text-sm leading-relaxed">{coaching.assessment}</p>
        </div>

        {/* Key Points */}
        <div>
          <h4 className="font-semibold mb-2">Key Learning Points</h4>
          <ul className="space-y-2">
            {coaching.keyPoints.map((point, index) => (
              <li key={index} className="flex gap-2 text-sm">
                <span className="text-primary">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Next Steps */}
        <div>
          <h4 className="font-semibold mb-2">Next Steps</h4>
          <p className="text-sm leading-relaxed">{coaching.nextSteps}</p>
        </div>

        {/* Agent Integration Note */}
        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground border border-dashed">
          <p className="font-medium mb-1">🤖 Agent Integration Ready</p>
          <p>
            This coaching panel is designed to receive personalized feedback from an external AI agent.
            The agent can analyze your rationale and provide targeted guidance.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
