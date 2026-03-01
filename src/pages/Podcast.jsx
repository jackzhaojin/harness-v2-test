import { useState } from 'react'
import { Radio } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { Badge } from '../components/ui/badge'
import PodcastPlayer from '../components/PodcastPlayer'
import { useManifest } from '../hooks/useManifest'
import { cn } from '../lib/utils'

export default function Podcast() {
  const { manifest, loading } = useManifest()
  const [selectedEpisode, setSelectedEpisode] = useState(null)
  const [selectedTopic, setSelectedTopic] = useState('all')

  const topics = manifest?.topics || []
  const episodes = manifest?.podcastEpisodes || []

  const filteredEpisodes = selectedTopic === 'all'
    ? episodes
    : episodes.filter(ep => ep.topicId === selectedTopic)

  const groupedEpisodes = filteredEpisodes.reduce((acc, episode) => {
    const topicId = episode.topicId
    if (!acc[topicId]) {
      acc[topicId] = []
    }
    acc[topicId].push(episode)
    return acc
  }, {})

  const handleEpisodeEnded = () => {
    const currentIndex = filteredEpisodes.findIndex(
      ep => ep.audioPath === selectedEpisode?.audioPath
    )
    if (currentIndex < filteredEpisodes.length - 1) {
      setSelectedEpisode(filteredEpisodes[currentIndex + 1])
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Radio className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Podcast Episodes</h1>
          <p className="text-muted-foreground">
            Listen to audio explanations of key concepts
          </p>
        </div>
      </div>

      {/* Player */}
      <PodcastPlayer episode={selectedEpisode} onEnded={handleEpisodeEnded} />

      {/* Episodes List */}
      <Tabs value={selectedTopic} onValueChange={setSelectedTopic}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">All Episodes</TabsTrigger>
          {topics.map(topic => (
            <TabsTrigger key={topic.id} value={topic.id}>
              {topic.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedTopic} className="mt-6">
          {selectedTopic === 'all' ? (
            <div className="space-y-6">
              {Object.entries(groupedEpisodes).map(([topicId, topicEpisodes]) => {
                const topic = topics.find(t => t.id === topicId)
                return (
                  <div key={topicId}>
                    <h2 className="text-xl font-semibold mb-3">
                      {topic?.name || topicId}
                    </h2>
                    <div className="grid gap-3">
                      {topicEpisodes.map((episode, index) => (
                        <EpisodeCard
                          key={episode.audioPath}
                          episode={episode}
                          index={index}
                          isPlaying={selectedEpisode?.audioPath === episode.audioPath}
                          onClick={() => setSelectedEpisode(episode)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredEpisodes.map((episode, index) => (
                <EpisodeCard
                  key={episode.audioPath}
                  episode={episode}
                  index={index}
                  isPlaying={selectedEpisode?.audioPath === episode.audioPath}
                  onClick={() => setSelectedEpisode(episode)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EpisodeCard({ episode, index, isPlaying, onClick }) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isPlaying && 'ring-2 ring-primary'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">Episode {index + 1}</Badge>
              {isPlaying && <Badge>Now Playing</Badge>}
            </div>
            <CardTitle className="text-base">{episode.title}</CardTitle>
            <CardDescription className="mt-1">
              Duration: {episode.duration}
            </CardDescription>
          </div>
          <Radio className={cn('h-5 w-5', isPlaying && 'text-primary')} />
        </div>
      </CardHeader>
    </Card>
  )
}
