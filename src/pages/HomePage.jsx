import { Link } from 'react-router-dom'
import useManifest from '@/hooks/useManifest'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function countLeafTopics(topics) {
  if (!topics || topics.length === 0) return 0
  let count = 0
  for (const t of topics) {
    const subs = t.subtopics || []
    if (subs.length === 0) {
      count += 1
    } else {
      count += countLeafTopics(subs)
    }
  }
  return count
}

function countSubtopics(topic) {
  const subs = topic.subtopics || []
  return countLeafTopics(subs.length > 0 ? subs : [])
}

export default function HomePage() {
  const { manifest, loading, error } = useManifest()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading study materials...</p>
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
  const totalEpisodes = manifest?.podcastEpisodes?.length || 0

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {manifest?.title || 'Study App'}
        </h1>
        <p className="text-muted-foreground mt-2">
          Interactive study environment for exam preparation
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{domains.length}</div>
            <p className="text-sm text-muted-foreground">Domains</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{totalLeafTopics}</div>
            <p className="text-sm text-muted-foreground">Topics</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{totalEpisodes}</div>
            <p className="text-sm text-muted-foreground">Podcast Episodes</p>
          </CardContent>
        </Card>
      </div>

      {/* Domain cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Study Domains</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {domains.map((domain) => {
            const leafCount = countLeafTopics(domain.subtopics || [])
            return (
              <Link
                key={domain.id}
                to={`/research?domain=${domain.id}`}
                className="block group"
              >
                <Card className="transition-colors group-hover:border-primary/50 h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{domain.title}</CardTitle>
                      <Badge variant="secondary">
                        {leafCount} {leafCount === 1 ? 'topic' : 'topics'}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1">
                      {domain.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5">
                      {(domain.subtopics || []).map((sub) => (
                        <Badge key={sub.id} variant="outline" className="text-xs">
                          {sub.title}
                        </Badge>
                      ))}
                    </div>
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
