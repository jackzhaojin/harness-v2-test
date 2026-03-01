import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Lightbulb } from 'lucide-react'

export default function CoachingPanel({ question, userAnswer }) {
  // Placeholder for agent coaching
  // In production, this would make an API call to get personalized coaching

  const getCoachingMessage = () => {
    if (userAnswer.isCorrect) {
      return {
        title: 'Great job!',
        message: 'You demonstrated a solid understanding of this concept. To deepen your knowledge, consider reviewing the related topics and exploring edge cases that might come up in real-world scenarios.',
        tips: [
          'Review the reference materials to reinforce your understanding',
          'Try explaining this concept to someone else to solidify your knowledge',
          'Look for similar patterns in other questions'
        ]
      }
    } else {
      return {
        title: 'Learning Opportunity',
        message: 'This is a great chance to strengthen your understanding. Focus on the key concepts mentioned in the explanation and how they apply to the scenario.',
        tips: [
          'Re-read the scenario carefully, paying attention to specific details',
          'Review the official explanation and identify what you missed',
          'Check the reference materials for deeper understanding',
          'Try to rephrase the correct answer in your own words'
        ]
      }
    }
  }

  const coaching = getCoachingMessage()

  return (
    <Card className="border-primary/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{coaching.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{coaching.message}</p>

        <div>
          <h4 className="font-semibold mb-2 text-sm">Study Tips:</h4>
          <ul className="space-y-2">
            {coaching.tips.map((tip, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                <span className="text-primary">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-muted p-3 rounded-md">
          <p className="text-xs text-muted-foreground italic">
            Note: In the future, this panel will provide personalized coaching from an AI agent
            based on your answer and learning patterns.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
