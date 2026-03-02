import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { CheckCircle2, XCircle, ChevronRight } from 'lucide-react'

export default function QuizCard({ question, onNext, questionNumber, totalQuestions }) {
  const [selectedOption, setSelectedOption] = useState(null)
  const [rationale, setRationale] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (selectedOption === null) return
    setSubmitted(true)
  }

  const handleNext = () => {
    setSelectedOption(null)
    setRationale('')
    setSubmitted(false)
    onNext()
  }

  const selectedIdx = selectedOption !== null ? parseInt(selectedOption) : -1
  const isCorrect = selectedIdx >= 0 && question.options[selectedIdx]?.isCorrect

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">
            Question {questionNumber} of {totalQuestions}
          </CardTitle>
          <div className="flex gap-2">
            {question.difficulty && (
              <Badge
                variant="outline"
                className={cn(
                  'capitalize',
                  question.difficulty === 'easy' && 'text-green-600 border-green-600/30',
                  question.difficulty === 'medium' && 'text-yellow-600 border-yellow-600/30',
                  question.difficulty === 'hard' && 'text-red-600 border-red-600/30'
                )}
              >
                {question.difficulty}
              </Badge>
            )}
            {question.topic && (
              <Badge variant="secondary">{question.topic}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scenario */}
        {question.scenario && (
          <div className="bg-muted/50 rounded-md p-4 text-sm leading-relaxed">
            {question.scenario}
          </div>
        )}

        {/* Question */}
        <p className="font-medium">{question.question}</p>

        {/* Options */}
        <RadioGroup
          value={selectedOption}
          onValueChange={setSelectedOption}
          disabled={submitted}
          aria-label="Answer options"
        >
          {question.options.map((opt, idx) => {
            const optValue = String(idx)
            let optionClass = ''
            if (submitted) {
              if (opt.isCorrect) {
                optionClass = 'border-green-500/50 bg-green-500/10'
              } else if (selectedIdx === idx && !opt.isCorrect) {
                optionClass = 'border-red-500/50 bg-red-500/10'
              }
            }

            return (
              <div key={idx} className={cn('flex items-start gap-3 border rounded-md p-3 transition-colors', optionClass)}>
                <RadioGroupItem
                  value={optValue}
                  id={`option-${idx}`}
                  className="mt-0.5"
                />
                <Label
                  htmlFor={`option-${idx}`}
                  className="text-sm leading-relaxed cursor-pointer flex-1 font-normal"
                >
                  <span className="font-semibold mr-1.5">{opt.label || String.fromCharCode(65 + idx)}.</span>
                  {opt.text}
                </Label>
                {submitted && opt.isCorrect && (
                  <CheckCircle2 className="size-4 text-green-500 shrink-0 mt-0.5" />
                )}
                {submitted && selectedIdx === idx && !opt.isCorrect && (
                  <XCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
                )}
              </div>
            )
          })}
        </RadioGroup>

        {/* Rationale textarea */}
        {!submitted && (
          <div className="space-y-2">
            <Label htmlFor="rationale" className="text-sm font-medium">
              Explain your reasoning (optional)
            </Label>
            <Textarea
              id="rationale"
              placeholder="Why did you choose this answer? Writing your reasoning helps reinforce learning..."
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        )}

        {/* Submit or Result */}
        {!submitted ? (
          <Button
            onClick={handleSubmit}
            disabled={selectedOption === null}
            className="w-full"
          >
            Submit Answer
          </Button>
        ) : (
          <div className="space-y-4">
            {/* Result banner */}
            <div className={cn(
              'flex items-center gap-2 p-3 rounded-md',
              isCorrect ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-red-500/10 text-red-700 dark:text-red-400'
            )}>
              {isCorrect ? (
                <>
                  <CheckCircle2 className="size-5" />
                  <span className="font-medium">Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="size-5" />
                  <span className="font-medium">Incorrect</span>
                </>
              )}
            </div>

            {/* Official rationale */}
            {question.rationale && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Explanation:</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{question.rationale}</p>
              </div>
            )}

            {/* Coaching panel placeholder */}
            <div className="border border-dashed rounded-md p-4 text-center text-sm text-muted-foreground">
              Coaching feedback will appear here
            </div>

            {/* Next button */}
            <Button onClick={handleNext} variant="outline" className="w-full">
              Next Question <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
