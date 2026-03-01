import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { BookOpen, Headphones, FileQuestion, MessageSquare, FileText } from 'lucide-react'

export default function Home() {
  const [topicTree, setTopicTree] = useState(null)
  const [quizData, setQuizData] = useState(null)
  const [manifest, setManifest] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Load manifest
    fetch('/manifest.json')
      .then(res => res.json())
      .then(data => setManifest(data))
      .catch(err => console.error('Failed to load manifest:', err))

    // Load topic tree
    fetch('/research/topic-tree.json')
      .then(res => res.json())
      .then(data => setTopicTree(data))
      .catch(err => console.error('Failed to load topic tree:', err))

    // Load quiz data
    fetch('/quizzes.json')
      .then(res => res.json())
      .then(data => setQuizData(data))
      .catch(err => console.error('Failed to load quiz data:', err))
  }, [])

  const getTopicCount = (topics) => {
    if (!topics) return 0
    let count = topics.length
    topics.forEach(topic => {
      if (topic.subtopics) {
        count += getTopicCount(topic.subtopics)
      }
    })
    return count
  }

  const studyModes = [
    {
      title: 'Research',
      description: 'Browse comprehensive study materials organized by topic',
      icon: BookOpen,
      path: '/research',
      stats: topicTree ? `${topicTree.totalLeafTopics} topics` : 'Loading...',
      color: 'text-blue-500'
    },
    {
      title: 'Podcast Episodes',
      description: 'Listen to audio lessons covering all certification topics',
      icon: Headphones,
      path: '/podcast',
      stats: manifest ? `${manifest.podcastEpisodes?.length || 0} episodes` : 'Loading...',
      color: 'text-purple-500'
    },
    {
      title: 'Quiz Practice',
      description: 'Test your knowledge with scenario-based questions',
      icon: FileQuestion,
      path: '/quiz',
      stats: quizData ? `${quizData.totalQuestions} questions` : 'Loading...',
      color: 'text-green-500'
    },
    {
      title: 'Teach-Back',
      description: 'Explain concepts in your own words to reinforce learning',
      icon: MessageSquare,
      path: '/teach-back',
      stats: 'Practice active recall',
      color: 'text-orange-500'
    }
  ]

  // Mock progress data - in real app this would come from user's study history
  const progress = {
    overall: 0,
    research: 0,
    podcast: 0,
    quiz: 0,
    teachBack: 0
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {manifest?.title || 'Claude Developer Certification Study Environment'}
        </h1>
        <p className="text-muted-foreground">
          Master the Claude Developer Certification with interactive study tools
        </p>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
          <CardDescription>Track your journey to certification</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Completion</span>
              <span className="text-muted-foreground">{progress.overall}%</span>
            </div>
            <Progress value={progress.overall} />
          </div>
        </CardContent>
      </Card>

      {/* Study Modes Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {studyModes.map((mode) => {
          const Icon = mode.icon
          return (
            <Card
              key={mode.path}
              className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
              onClick={() => navigate(mode.path)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${mode.color}`} />
                      {mode.title}
                    </CardTitle>
                    <CardDescription>{mode.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Badge variant="secondary">{mode.stats}</Badge>
                  {progress[mode.path.slice(1)] !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{progress[mode.path.slice(1)]}%</span>
                      </div>
                      <Progress value={progress[mode.path.slice(1)]} className="h-2" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Stats */}
      {topicTree && (
        <Card>
          <CardHeader>
            <CardTitle>Certification Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Exam Title</p>
                <p className="text-2xl font-bold">{topicTree.examTitle}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Topics</p>
                <p className="text-2xl font-bold">{topicTree.totalLeafTopics}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Quiz Questions</p>
                <p className="text-2xl font-bold">{quizData?.totalQuestions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
