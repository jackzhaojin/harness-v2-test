import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import PodcastPlayer from '../components/PodcastPlayer'

export default function Podcast() {
  const [manifest, setManifest] = useState(null)
  const [selectedEpisode, setSelectedEpisode] = useState(null)
  const [episodesByTopic, setEpisodesByTopic] = useState({})

  useEffect(() => {
    // Load manifest
    fetch('/manifest.json')
      .then(res => res.json())
      .then(data => {
        setManifest(data)

        // Group episodes by topic
        const grouped = {}
        data.podcastEpisodes?.forEach(episode => {
          if (!grouped[episode.topicId]) {
            grouped[episode.topicId] = []
          }
          grouped[episode.topicId].push(episode)
        })
        setEpisodesByTopic(grouped)

        // Set first episode as selected
        if (data.podcastEpisodes?.[0]) {
          setSelectedEpisode(data.podcastEpisodes[0])
        }
      })
      .catch(err => console.error('Failed to load manifest:', err))
  }, [])

  const topicIdToTitle = (topicId) => {
    return topicId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const topics = Object.keys(episodesByTopic)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Podcast Episodes</h1>
        <p className="text-muted-foreground">
          Listen to comprehensive audio lessons covering all certification topics
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Episode List */}
        <Card>
          <CardHeader>
            <CardTitle>Episodes by Topic</CardTitle>
            <CardDescription>
              {manifest?.podcastEpisodes?.length || 0} episodes available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={topics[0]} className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 mb-4">
                {topics.slice(0, 6).map(topicId => (
                  <TabsTrigger key={topicId} value={topicId}>
                    {topicIdToTitle(topicId).split(' ').slice(0, 2).join(' ')}
                  </TabsTrigger>
                ))}
              </TabsList>

              {topics.map(topicId => (
                <TabsContent key={topicId} value={topicId} className="space-y-2">
                  <h3 className="font-semibold mb-3">{topicIdToTitle(topicId)}</h3>
                  {episodesByTopic[topicId]?.map((episode, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedEpisode(episode)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedEpisode?.audioPath === episode.audioPath
                          ? 'bg-accent border-primary'
                          : 'hover:bg-accent/50'
                      }`}
                    >
                      <div className="font-medium">{episode.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Duration: {episode.duration}
                      </div>
                    </button>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Audio Player */}
        <div className="lg:sticky lg:top-20 h-fit">
          <PodcastPlayer episode={selectedEpisode} />
        </div>
      </div>
    </div>
  )
}
