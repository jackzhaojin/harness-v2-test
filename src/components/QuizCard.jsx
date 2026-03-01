import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export default function QuizCard({ question, onNext }) {
  const [selectedOption, setSelectedOption] = useState('')
  const [rationale, setRationale] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (!question) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-8">
            No question loaded.
          </p>
        </CardContent>
      </Card>
    )
  }

  const correctOption = question.options.find((o) => o.isCorrect)
  const isCorrect = submitted && selectedOption === correctOption?.label

  const handleSubmit = () => {
    if (selectedOption) {
      setSubmitted(true)
    }
  }

  const handleNext = () => {
    setSelectedOption('')
    setRationale('')
    setSubmitted(false)
    onNext()
  }

  const difficultyColor = {
    easy: 'bg-green-500/10 text-green-700 dark:text-green-400',
    medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
    hard: 'bg-red-500/10 text-red-700 dark:text-red-400',
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{question.topic}</CardTitle>
          <Badge className={difficultyColor[question.difficulty] || ''}>
            {question.difficulty}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scenario */}
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm font-medium text-muted-foreground mb-1">Scenario</p>
          <p className="text-sm">{question.scenario}</p>
        </div>

        {/* Question */}
        <p className="font-medium">{question.question}</p>

        {/* Options */}
        <RadioGroup
          value={selectedOption}
          onValueChange={setSelectedOption}
          disabled={submitted}
          aria-label="Answer options"
        >
          {question.options.map((opt) => {
            let optionClass = ''
            if (submitted) {
              if (opt.isCorrect) {
                optionClass = 'border-green-500 bg-green-500/10'
              } else if (opt.label === selectedOption && !opt.isCorrect) {
                optionClass = 'border-red-500 bg-red-500/10'
              }
            }

            return (
              <label
                key={opt.label}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-accent/50 ${optionClass}`}
              >
                <RadioGroupItem
                  value={opt.label}
                  id={`option-${opt.label}`}
                  aria-label={`Option ${opt.label}: ${opt.text}`}
                />
                <span className="text-sm">
                  <span className="font-medium mr-1">{opt.label}.</span>
                  {opt.text}
                </span>
              </label>
            )
          })}
        </RadioGroup>

        {/* Rationale input */}
        {!submitted && (
          <div>
            <label
              htmlFor="rationale-input"
              className="text-sm font-medium text-muted-foreground block mb-2"
            >
              Your rationale (optional)
            </label>
            <Textarea
              id="rationale-input"
              placeholder="Explain why you chose this answer..."
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={3}
            />
          </div>
        )}

        {/* Submit / Next buttons */}
        {!submitted ? (
          <Button
            onClick={handleSubmit}
            disabled={!selectedOption}
            className="w-full"
          >
            Submit Answer
          </Button>
        ) : (
          <div className="space-y-4">
            {/* Result */}
            <div
              className={`rounded-lg p-4 ${
                isCorrect
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-red-500/10 border border-red-500/30'
              }`}
            >
              <p className="font-medium mb-1">
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </p>
              <p className="text-sm">{question.rationale}</p>
            </div>

            {/* Coaching panel placeholder */}
            <div className="rounded-lg border border-dashed p-4">
              <p className="text-sm text-muted-foreground">
                Coaching feedback will appear here
              </p>
            </div>

            <Button onClick={handleNext} className="w-full">
              Next Question
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
