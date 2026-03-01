import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react'
import CoachingPanel from './CoachingPanel'

export default function QuizCard({ question, onNext }) {
  const [selectedOption, setSelectedOption] = useState(null)
  const [rationale, setRationale] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showCoaching, setShowCoaching] = useState(false)

  const handleSubmit = () => {
    if (!selectedOption || !rationale.trim()) {
      return
    }
    setSubmitted(true)
    setShowCoaching(true)
  }

  const handleReset = () => {
    setSelectedOption(null)
    setRationale('')
    setSubmitted(false)
    setShowCoaching(false)
    if (onNext) {
      onNext()
    }
  }

  const isCorrect = selectedOption === question.options.find(opt => opt.isCorrect)?.label

  const difficultyColors = {
    easy: 'bg-green-500',
    medium: 'bg-yellow-500',
    hard: 'bg-red-500',
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{question.topic}</Badge>
                <Badge className={difficultyColors[question.difficulty]}>
                  {question.difficulty}
                </Badge>
              </div>
              <CardTitle className="text-xl">Question {question.id}</CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Scenario */}
          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Scenario
            </h4>
            <p className="text-sm leading-relaxed">{question.scenario}</p>
          </div>

          {/* Question */}
          <div>
            <h4 className="font-semibold mb-3">{question.question}</h4>

            {/* Options */}
            <div className="space-y-2">
              {question.options.map((option) => {
                const isSelected = selectedOption === option.label
                const showResult = submitted
                const isThisCorrect = option.isCorrect

                return (
                  <label
                    key={option.label}
                    className={`
                      flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${!submitted && isSelected ? 'border-primary bg-primary/5' : 'border-border'}
                      ${showResult && isThisCorrect ? 'border-green-500 bg-green-500/10' : ''}
                      ${showResult && isSelected && !isThisCorrect ? 'border-red-500 bg-red-500/10' : ''}
                      ${submitted ? 'cursor-default' : 'hover:border-primary/50'}
                    `}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={option.label}
                      checked={isSelected}
                      onChange={() => !submitted && setSelectedOption(option.label)}
                      disabled={submitted}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{option.label}.</span>
                        <span>{option.text}</span>
                        {showResult && isThisCorrect && (
                          <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />
                        )}
                        {showResult && isSelected && !isThisCorrect && (
                          <XCircle className="h-5 w-5 text-red-500 ml-auto" />
                        )}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Rationale Input */}
          {!submitted && (
            <div className="space-y-2">
              <label className="font-semibold block">
                Your Rationale
                <span className="text-sm text-muted-foreground font-normal ml-2">
                  (Explain your reasoning before submitting)
                </span>
              </label>
              <Textarea
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Write your reasoning here..."
                className="min-h-[100px]"
              />
            </div>
          )}

          {/* User's Rationale Display */}
          {submitted && (
            <div className="space-y-2">
              <label className="font-semibold block">Your Rationale</label>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm leading-relaxed">{rationale}</p>
              </div>
            </div>
          )}

          {/* Official Rationale */}
          {submitted && (
            <div className="space-y-2">
              <label className="font-semibold block">Official Explanation</label>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm leading-relaxed">{question.rationale}</p>
              </div>
              {question.references && question.references.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-sm text-muted-foreground">References:</span>
                  {question.references.map((ref, i) => (
                    <Badge key={i} variant="outline">{ref}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!submitted ? (
              <Button
                onClick={handleSubmit}
                disabled={!selectedOption || !rationale.trim()}
                className="flex-1"
              >
                Submit Answer
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleReset}
                  className="flex-1"
                >
                  Next Question
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Coaching Panel */}
      {showCoaching && (
        <CoachingPanel
          isCorrect={isCorrect}
          question={question}
          userAnswer={selectedOption}
          userRationale={rationale}
        />
      )}
    </div>
  )
}
