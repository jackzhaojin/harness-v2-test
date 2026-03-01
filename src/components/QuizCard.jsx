import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import CoachingPanel from './CoachingPanel'

export default function QuizCard({ question, userAnswer, onSubmit }) {
  const [selectedOption, setSelectedOption] = useState(userAnswer?.selectedOption || null)
  const [rationale, setRationale] = useState(userAnswer?.rationale || '')
  const [submitted, setSubmitted] = useState(!!userAnswer)

  const handleSubmit = () => {
    if (!selectedOption) {
      alert('Please select an answer')
      return
    }
    if (!rationale.trim()) {
      alert('Please write your rationale before submitting')
      return
    }

    const answer = {
      selectedOption,
      rationale,
      isCorrect: question.options.find(o => o.label === selectedOption)?.isCorrect || false,
      submittedAt: new Date().toISOString()
    }

    setSubmitted(true)
    onSubmit(question.id, answer)
  }

  const handleReset = () => {
    setSelectedOption(null)
    setRationale('')
    setSubmitted(false)
  }

  const correctOption = question.options.find(o => o.isCorrect)
  const isCorrect = submitted && selectedOption === correctOption?.label

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Scenario</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{question.scenario}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{question.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Answer Options */}
          <div className="space-y-2">
            {question.options.map((option) => {
              const isSelected = selectedOption === option.label
              const showCorrect = submitted && option.isCorrect
              const showIncorrect = submitted && isSelected && !option.isCorrect

              return (
                <button
                  key={option.label}
                  onClick={() => !submitted && setSelectedOption(option.label)}
                  disabled={submitted}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    showCorrect
                      ? 'border-green-500 bg-green-500/10'
                      : showIncorrect
                      ? 'border-red-500 bg-red-500/10'
                      : isSelected
                      ? 'border-primary bg-accent'
                      : 'border-border hover:border-primary/50 hover:bg-accent/50'
                  } ${submitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 min-w-[24px]">
                      <span className="font-semibold">{option.label}.</span>
                      {showCorrect && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                      {showIncorrect && <XCircle className="h-5 w-5 text-red-500" />}
                    </div>
                    <span className="flex-1">{option.text}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Rationale Input */}
          {!submitted && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Write your rationale before submitting
              </label>
              <Textarea
                placeholder="Explain why you chose this answer and your reasoning process..."
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          )}

          {/* Submit/Reset Button */}
          {!submitted ? (
            <Button onClick={handleSubmit} className="w-full">
              Submit Answer
            </Button>
          ) : (
            <Button onClick={handleReset} variant="outline" className="w-full">
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Results and Rationale */}
      {submitted && (
        <Card className={isCorrect ? 'border-green-500' : 'border-red-500'}>
          <CardHeader>
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              <CardTitle className={isCorrect ? 'text-green-500' : 'text-red-500'}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Your Rationale:</h4>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                {rationale}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Official Explanation:</h4>
              <p className="text-sm leading-relaxed">{question.rationale}</p>
            </div>

            {question.references && question.references.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">References:</h4>
                <div className="flex flex-wrap gap-2">
                  {question.references.map((ref, idx) => (
                    <Badge key={idx} variant="secondary">
                      {ref}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Coaching Panel */}
      {submitted && <CoachingPanel question={question} userAnswer={{ selectedOption, rationale, isCorrect }} />}
    </div>
  )
}
