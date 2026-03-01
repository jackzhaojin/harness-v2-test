import { Link } from 'react-router-dom'
import { BookOpen, Radio, MessageSquare, FileText } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { Badge } from '../components/ui/badge'
import { useManifest } from '../hooks/useManifest'
import { useQuizData } from '../hooks/useQuizData'

export default function Home() {
  const { manifest, loading } = useManifest()
  const { quizData } = useQuizData()

  const getTopicStats = (topicId) => {
    if (!quizData) return { total: 0, completed: 0, progress: 0 }

    // Get all leaf topic IDs for this topic
    const getLeafTopics = (topic) => {
      if (!topic.children || topic.children.length === 0) {
        return [topic.id, topic.name]
      }
      return topic.children.flatMap(getLeafTopics)
    }

    const topic = manifest?.topics.find(t => t.id === topicId)
    if (!topic) return { total: 0, completed: 0, progress: 0 }

    const leafTopics = getLeafTopics(topic)
    const topicNames = leafTopics.filter((_, i) => i % 2 === 1)

    const questions = quizData.questions.filter(q =>
      topicNames.includes(q.topic) || q.topic.includes(topic.name)
    )

    const total = questions.length
    const completed = Math.floor(Math.random() * total * 0.6) // Mock completed data
    const progress = total > 0 ? (completed / total) * 100 : 0

    return { total, completed, progress }
  }

  const activities = [
    {
      icon: Radio,
      title: 'Podcast Episodes',
      description: 'Listen to audio explanations of key concepts',
      link: '/podcast',
      color: 'text-blue-500',
      count: manifest?.podcastEpisodes?.length || 0,
    },
    {
      icon: BookOpen,
      title: 'Practice Quizzes',
      description: 'Test your knowledge with scenario-based questions',
      link: '/quiz',
      color: 'text-green-500',
      count: quizData?.totalQuestions || 0,
    },
    {
      icon: MessageSquare,
      title: 'Teach-Back',
      description: 'Explain concepts in your own words for deeper learning',
      link: '/teach-back',
      color: 'text-purple-500',
      count: 'Interactive',
    },
    {
      icon: FileText,
      title: 'Research Materials',
      description: 'Deep dive into comprehensive documentation',
      link: '/research',
      color: 'text-orange-500',
      count: '55+ docs',
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight">
          {manifest?.title || 'Study Environment'}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Interactive learning environment for exam preparation
        </p>
      </div>

      {/* Activity Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {activities.map((activity) => {
          const Icon = activity.icon
          return (
            <Link key={activity.title} to={activity.link}>
              <Card className="h-full transition-all hover:shadow-lg hover:scale-105">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Icon className={`h-8 w-8 ${activity.color}`} />
                    <Badge variant="secondary">{activity.count}</Badge>
                  </div>
                  <CardTitle className="mt-4">{activity.title}</CardTitle>
                  <CardDescription>{activity.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Topic Overview */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Study Progress by Topic</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {manifest?.topics.map((topic) => {
            const stats = getTopicStats(topic.id)
            return (
              <Card key={topic.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{topic.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {topic.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {stats.completed} / {stats.total} questions
                      </span>
                    </div>
                    <Progress value={stats.progress} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
