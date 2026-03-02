import { Link } from 'react-router-dom'
import useManifest from '@/hooks/useManifest'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Headphones, HelpCircle, Layers } from 'lucide-react'

function countLeafTopics(topics) {
  if (!topics || topics.length === 0) return 0
  let count = 0
  for (const t of topics) {
    const children = t.subtopics || t.topics || []
    if (children.length === 0) {
      count += 1
    } else {
      count += countLeafTopics(children)
    }
  }
  return count
}

function countSubtopics(topic) {
  const children = topic.subtopics || []
  if (children.length === 0) return 0
  let count = 0
  for (const sub of children) {
    const grandchildren = sub.subtopics || []
    if (grandchildren.length === 0) {
      count += 1
    } else {
      count += countLeafTopics(grandchildren)
    }
  }
  return count
}

export default function HomePage() {
  const { manifest, loading, error } = useManifest()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground animate-pulse">Loading study environment...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-destructive">Error loading manifest: {error}</p>
      </div>
    )
  }

  const topicTree = manifest?.topicTree
  const domains = topicTree?.topics || []
  const totalLeafTopics = topicTree?.totalLeafTopics || countLeafTopics(domains)
  const podcastCount = manifest?.podcastEpisodes?.length || 0
  const quizPath = manifest?.quizPath

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Claude Developer Certification</h1>
        <p className="text-muted-foreground">
          Interactive study environment for exam preparation. Browse domains, take quizzes, and deepen your understanding.
        </p>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <Layers className="size-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{domains.length}</p>
              <p className="text-xs text-muted-foreground">Domains</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <BookOpen className="size-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{totalLeafTopics}</p>
              <p className="text-xs text-muted-foreground">Topics</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <Headphones className="size-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{podcastCount}</p>
              <p className="text-xs text-muted-foreground">Podcasts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 flex items-center gap-3">
            <HelpCircle className="size-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{quizPath ? '75' : '0'}</p>
              <p className="text-xs text-muted-foreground">Quiz Questions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Domain Cards Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Study Domains</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {domains.map((domain) => {
            const subtopicCount = countSubtopics(domain)
            return (
              <Link
                key={domain.id}
                to={`/research?domain=${domain.id}`}
                className="block group"
              >
                <Card className="h-full transition-colors group-hover:border-primary/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{domain.title}</CardTitle>
                      <Badge variant="secondary" className="shrink-0">
                        {subtopicCount} topics
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm line-clamp-3">
                      {domain.description || 'Explore this domain to learn more.'}
                    </CardDescription>
                    {domain.estimatedComplexity && (
                      <Badge
                        variant="outline"
                        className="mt-3 capitalize"
                      >
                        {domain.estimatedComplexity} complexity
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
