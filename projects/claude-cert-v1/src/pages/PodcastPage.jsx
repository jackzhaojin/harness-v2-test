import { useState } from 'react'
import useManifest from '@/hooks/useManifest'
import PodcastPlayer from '@/components/PodcastPlayer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Headphones } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PodcastPage() {
  const { manifest, loading, error } = useManifest()
  const [selectedEpisode, setSelectedEpisode] = useState(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground animate-pulse">Loading podcast episodes...</p>
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Podcast Episodes</h1>
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <Headphones className="size-12 mx-auto text-muted-foreground/50" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-muted-foreground">No podcast episodes generated yet</p>
              <p className="text-sm text-muted-foreground/70">
                Podcast generation was not enabled for this study environment.
                To generate podcast episodes, re-run the pipeline with the <code className="bg-muted px-1.5 py-0.5 rounded text-xs">--include-podcasts</code> flag.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Podcast Episodes</h1>
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
        {/* Episode list */}
        <div className="space-y-1">
          {episodes.map((ep) => (
            <Button
              key={ep.id}
              variant={selectedEpisode?.id === ep.id ? 'secondary' : 'ghost'}
              size="sm"
              className={cn('w-full justify-start text-left h-auto py-2')}
              onClick={() => setSelectedEpisode(ep)}
            >
              <Headphones className="size-4 mr-2 shrink-0" />
              <span className="truncate text-sm">{ep.title}</span>
            </Button>
          ))}
        </div>

        {/* Player */}
        <div>
          <PodcastPlayer episode={selectedEpisode} />
        </div>
      </div>
    </div>
  )
}
