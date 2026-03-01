import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import QuizCard from '../components/QuizCard'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'

export default function Quiz() {
  const [quizData, setQuizData] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState({})
  const [filterTopic, setFilterTopic] = useState('all')
  const [filterDifficulty, setFilterDifficulty] = useState('all')

  useEffect(() => {
    // Load quiz data
    fetch('/quizzes.json')
      .then(res => res.json())
      .then(data => {
        setQuizData(data)
      })
      .catch(err => console.error('Failed to load quiz data:', err))
  }, [])

  const handleAnswerSubmit = (questionId, answer) => {
    setAnsweredQuestions(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const resetQuiz = () => {
    setAnsweredQuestions({})
    setCurrentQuestionIndex(0)
  }

  const nextQuestion = () => {
    if (filteredQuestions && currentQuestionIndex < filteredQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  if (!quizData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading quiz questions...</p>
      </div>
    )
  }

  // Get unique topics and difficulties
  const topics = ['all', ...new Set(quizData.questions.map(q => q.topic))]
  const difficulties = ['all', 'easy', 'medium', 'hard']

  // Filter questions
  const filteredQuestions = quizData.questions.filter(q => {
    const topicMatch = filterTopic === 'all' || q.topic === filterTopic
    const difficultyMatch = filterDifficulty === 'all' || q.difficulty === filterDifficulty
    return topicMatch && difficultyMatch
  })

  const currentQuestion = filteredQuestions[currentQuestionIndex]
  const progress = Object.keys(answeredQuestions).length
  const totalQuestions = filteredQuestions.length

  const difficultyColors = {
    easy: 'bg-green-500/10 text-green-500 border-green-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    hard: 'bg-red-500/10 text-red-500 border-red-500/20'
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Quiz Practice</h1>
        <p className="text-muted-foreground">
          Test your knowledge with scenario-based certification questions
        </p>
      </div>

      {/* Progress and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Progress</CardTitle>
              <CardDescription>
                {progress} of {totalQuestions} questions attempted
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={resetQuiz}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Filter by Topic</label>
              <select
                value={filterTopic}
                onChange={(e) => {
                  setFilterTopic(e.target.value)
                  setCurrentQuestionIndex(0)
                }}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {topics.map(topic => (
                  <option key={topic} value={topic}>
                    {topic === 'all' ? 'All Topics' : topic}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Filter by Difficulty</label>
              <select
                value={filterDifficulty}
                onChange={(e) => {
                  setFilterDifficulty(e.target.value)
                  setCurrentQuestionIndex(0)
                }}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {difficulties.map(diff => (
                  <option key={diff} value={diff}>
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      {currentQuestion && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{currentQuestion.topic}</Badge>
              <Badge className={difficultyColors[currentQuestion.difficulty]}>
                {currentQuestion.difficulty}
              </Badge>
            </div>
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
          </div>

          <QuizCard
            question={currentQuestion}
            userAnswer={answeredQuestions[currentQuestion.id]}
            onSubmit={handleAnswerSubmit}
          />

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={nextQuestion}
              disabled={currentQuestionIndex === totalQuestions - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
