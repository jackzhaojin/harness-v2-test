import { useState } from 'react'
import useManifest from '@/hooks/useManifest'
import PodcastPlayer from '@/components/PodcastPlayer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function PodcastPage() {
  const { manifest, loading, error } = useManifest()
  const [selectedId, setSelectedId] = useState(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading podcast episodes...</p>
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

  const episodes = manifest?.podcastEpisodes || []

  if (episodes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Podcast</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">
              No podcast episodes generated yet. Run the pipeline to generate audio content.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const selected = episodes.find((ep) => ep.id === selectedId) || null

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Podcast Episodes</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Episode list */}
        <div className="md:col-span-1 space-y-1">
          {episodes.map((ep) => (
            <Button
              key={ep.id}
              variant={selectedId === ep.id ? 'secondary' : 'ghost'}
              className="w-full justify-start text-left h-auto py-3"
              onClick={() => setSelectedId(ep.id)}
              aria-label={`Play ${ep.title}`}
              aria-pressed={selectedId === ep.id}
            >
              <span className="truncate">{ep.title}</span>
            </Button>
          ))}
        </div>

        {/* Player */}
        <div className="md:col-span-2">
          <PodcastPlayer episode={selected} />
        </div>
      </div>
    </div>
  )
}
