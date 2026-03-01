import { useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import QuizCard from '../components/QuizCard'
import { useQuizData } from '../hooks/useQuizData'

export default function Quiz() {
  const { quizData, loading } = useQuizData()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [filter, setFilter] = useState('all')

  const questions = quizData?.questions || []

  const filteredQuestions = filter === 'all'
    ? questions
    : questions.filter(q => q.difficulty === filter)

  const currentQuestion = filteredQuestions[currentIndex]

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setCurrentIndex(0) // Loop back to start
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!quizData || questions.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Questions Available</h2>
        <p className="text-muted-foreground">
          Quiz questions will appear here once loaded.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Practice Quiz</h1>
            <p className="text-muted-foreground">
              Test your knowledge with scenario-based questions
            </p>
          </div>
        </div>
      </div>

      {/* Stats and Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-muted/50">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setFilter('all')
              setCurrentIndex(0)
            }}
          >
            All ({questions.length})
          </Button>
          <Button
            variant={filter === 'easy' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setFilter('easy')
              setCurrentIndex(0)
            }}
          >
            Easy ({quizData.difficultyDistribution.easy})
          </Button>
          <Button
            variant={filter === 'medium' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setFilter('medium')
              setCurrentIndex(0)
            }}
          >
            Medium ({quizData.difficultyDistribution.medium})
          </Button>
          <Button
            variant={filter === 'hard' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setFilter('hard')
              setCurrentIndex(0)
            }}
          >
            Hard ({quizData.difficultyDistribution.hard})
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Question {currentIndex + 1} of {filteredQuestions.length}
          </Badge>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <Button
          variant="outline"
          onClick={handleNext}
        >
          {currentIndex === filteredQuestions.length - 1 ? 'Start Over' : 'Skip'}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Quiz Card */}
      {currentQuestion && (
        <QuizCard
          key={currentQuestion.id}
          question={currentQuestion}
          onNext={handleNext}
        />
      )}
    </div>
  )
}
