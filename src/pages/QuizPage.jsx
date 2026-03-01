import { useState, useEffect } from 'react'
import useManifest from '@/hooks/useManifest'
import QuizCard from '@/components/QuizCard'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

function shuffle(array) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function QuizPage() {
  const { manifest, loading: manifestLoading, error: manifestError } = useManifest()
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(0)
  const [quizLoading, setQuizLoading] = useState(true)
  const [quizError, setQuizError] = useState(null)

  useEffect(() => {
    if (!manifest) return

    const quizPath = manifest.quizPath
    if (!quizPath) {
      setQuizError('No quiz path in manifest')
      setQuizLoading(false)
      return
    }

    fetch(`/${quizPath}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load quiz: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        const shuffled = shuffle(data.questions || [])
        setQuestions(shuffled)
        setQuizLoading(false)
      })
      .catch((err) => {
        setQuizError(err.message)
        setQuizLoading(false)
      })
  }, [manifest])

  if (manifestLoading || quizLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading quiz questions...</p>
      </div>
    )
  }

  if (manifestError || quizError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-destructive">
          Error: {manifestError || quizError}
        </p>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Quiz</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">
              No quiz questions available yet. Run the pipeline to generate quiz content.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const total = questions.length
  const progressPercent = total > 0 ? (answered / total) * 100 : 0
  const currentQuestion = questions[currentIndex]
  const quizComplete = currentIndex >= total

  const handleNext = () => {
    // Check if the answer was correct by looking at the QuizCard state
    // We track score at the page level when moving to next
    setAnswered((prev) => prev + 1)
    setCurrentIndex((prev) => prev + 1)
  }

  const handleRestart = () => {
    setQuestions(shuffle(questions))
    setCurrentIndex(0)
    setScore(0)
    setAnswered(0)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quiz</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {Math.min(answered + 1, total)} of {total}
          </Badge>
        </div>
      </div>

      {/* Progress bar */}
      <Progress value={progressPercent} aria-label="Quiz progress" />

      {quizComplete ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            <h2 className="text-xl font-bold">Quiz Complete</h2>
            <p className="text-muted-foreground">
              You answered {answered} of {total} questions.
            </p>
            <Button onClick={handleRestart}>Restart Quiz</Button>
          </CardContent>
        </Card>
      ) : (
        <QuizCard
          key={currentQuestion?.id}
          question={currentQuestion}
          onNext={handleNext}
        />
      )}
    </div>
  )
}
