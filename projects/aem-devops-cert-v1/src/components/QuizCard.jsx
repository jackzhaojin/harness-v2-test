import { useState } from 'react'
import { cn } from '@/lib/utils'

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E']

// Normalize options to { letter, text } format
// Handles: string arrays, { label, text, isCorrect }, { key, text }, etc.
function normalizeOptions(options) {
  if (!options || !options.length) return []
  return options.map((opt, i) => {
    if (typeof opt === 'string') return { letter: OPTION_LETTERS[i], text: opt }
    // { label: 'A', text: '...', isCorrect: bool }
    const letter = opt.label || opt.key || OPTION_LETTERS[i]
    const text = opt.text || opt.value || String(opt)
    return { letter, text, isCorrect: opt.isCorrect }
  })
}

// Determine correct answer letter from options or correctAnswer field
function getCorrectLetter(question) {
  if (question.correctAnswer) return question.correctAnswer
  const opts = normalizeOptions(question.options)
  const found = opts.find(o => o.isCorrect)
  return found?.letter || null
}

export default function QuizCard({ question, questionIndex, totalQuestions, onNext, onScore }) {
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (!selected) return
    setSubmitted(true)
    const isCorrect = selected === getCorrectLetter(question)
    onScore?.(isCorrect)
  }

  const handleNext = () => {
    setSelected(null)
    setSubmitted(false)
    onNext?.()
  }

  const progress = totalQuestions > 0 ? ((questionIndex) / totalQuestions) * 100 : 0

  const options = normalizeOptions(question.options)
  const correctAnswer = getCorrectLetter(question)
  const explanation = question.explanation || question.rationale || ''

  return (
    <div>
      {/* Progress bar */}
      <div className="w-full h-1 bg-surface-container-highest relative mb-2">
        <div
          className="absolute top-0 left-0 h-full progress-gradient transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between items-center px-1 py-2 text-[10px] font-mono tracking-widest text-on-surface-variant uppercase mb-4">
        <span>Progress: {Math.round(progress)}%</span>
        <span>Question {questionIndex + 1} of {totalQuestions}</span>
      </div>

      {/* Domain / Difficulty tags */}
      <div className="flex gap-3 mb-5 flex-wrap">
        {(question.domain || question.topic) && (
          <span className="px-3 py-1 border border-outline-variant text-[10px] font-bold tracking-widest uppercase text-tertiary">
            {question.domain || question.topic}
          </span>
        )}
        {question.difficulty && (
          <span className={cn('px-3 py-1 border border-outline-variant text-[10px] font-bold tracking-widest uppercase',
            question.difficulty === 'hard' ? 'text-error' : question.difficulty === 'medium' ? 'text-secondary' : 'text-primary'
          )}>
            {question.difficulty}
          </span>
        )}
      </div>

      {/* Question card */}
      <div className="glass-panel p-6 lg:p-8 border border-outline-variant/10 shadow-2xl relative mb-6">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary/30 rounded-l-xl" />
        {question.scenario && question.scenario !== question.question && (
          <p className="font-body text-sm text-on-surface-variant leading-relaxed mb-4 italic">
            {question.scenario}
          </p>
        )}
        <p className="font-body text-lg lg:text-xl leading-relaxed text-on-surface mb-8">
          {question.question || question.scenario}
        </p>

        <div className="space-y-3">
          {options.map((option) => {
            const letter = option.letter
            const optionText = option.text
            const isSelected = selected === letter
            const isCorrect = submitted && letter === correctAnswer
            const isWrong = submitted && isSelected && letter !== correctAnswer

            return (
              <button
                key={letter}
                disabled={submitted}
                onClick={() => !submitted && setSelected(letter)}
                className={cn(
                  'answer-card w-full p-4 lg:p-5 flex items-center gap-4 rounded-lg text-left transition-all',
                  !submitted && isSelected && 'answer-card-selected',
                  submitted && isCorrect && 'answer-card-correct',
                  submitted && isWrong && 'answer-card-wrong',
                  !submitted && !isSelected && 'hover:shadow-[0_0_20px_rgba(157,143,255,0.1)]'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0',
                  submitted && isCorrect ? 'bg-secondary text-on-secondary' :
                  submitted && isWrong ? 'bg-error text-on-error' :
                  'bg-primary text-on-primary'
                )}>
                  {submitted && isCorrect ? <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span> :
                   submitted && isWrong ? <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>close</span> :
                   letter}
                </div>
                <span className={cn(
                  'font-body transition-colors',
                  submitted && isCorrect ? 'text-secondary font-semibold' :
                  submitted && isWrong ? 'text-error' :
                  isSelected ? 'text-on-surface' : 'text-on-surface-variant group-hover:text-primary'
                )}>
                  {optionText}
                </span>
              </button>
            )
          })}
        </div>

        {!submitted && (
          <button
            onClick={handleSubmit}
            disabled={!selected}
            className={cn(
              'mt-8 w-full py-4 gradient-cta text-on-primary-container font-headline font-bold tracking-widest uppercase rounded-xl transition-all',
              selected ? 'opacity-100 hover:shadow-[0_0_20px_rgba(157,143,255,0.4)] cursor-pointer' : 'opacity-40 cursor-not-allowed'
            )}
          >
            SUBMIT ANSWER
          </button>
        )}
      </div>

      {/* Explanation panel — shown after submit */}
      {submitted && (
        <div className={cn(
          'glass-panel p-6 lg:p-8 border space-y-5',
          selected === correctAnswer ? 'border-secondary/20 bg-secondary/5' : 'border-error/20 bg-error/5'
        )}>
          <div className="flex items-center justify-between">
            <h3 className={cn('font-headline font-bold text-base tracking-widest', selected === correctAnswer ? 'text-secondary' : 'text-error')}>
              NEURAL ANALYSIS
            </h3>
            <span className={cn('px-2 py-1 text-[10px] font-bold', selected === correctAnswer ? 'bg-secondary text-on-secondary' : 'bg-error text-on-error')}>
              {selected === correctAnswer ? 'CORRECT' : 'INCORRECT'}
            </span>
          </div>

          {explanation && (
            <div className={cn(
              'p-4 border-l-4 shadow-[0_0_15px_rgba(0,0,0,0.1)]',
              selected === correctAnswer ? 'bg-secondary/10 border-secondary' : 'bg-error/10 border-error'
            )}>
              <p className="text-on-surface leading-relaxed text-sm">{explanation}</p>
            </div>
          )}

          {selected !== correctAnswer && (
            <div className="p-4 bg-surface-container-lowest border border-outline-variant/10">
              <p className="text-[10px] font-mono text-tertiary mb-1 uppercase tracking-tighter">Correct Answer</p>
              <p className="text-sm font-semibold text-secondary">
                Option {correctAnswer}: {options.find(o => o.letter === correctAnswer)?.text || correctAnswer}
              </p>
            </div>
          )}

          <button
            onClick={handleNext}
            className="w-full py-3 gradient-cta text-on-primary-container font-headline font-bold tracking-widest uppercase rounded-xl hover:shadow-[0_0_20px_rgba(157,143,255,0.4)] transition-all"
          >
            NEXT QUESTION
          </button>
        </div>
      )}
    </div>
  )
}
