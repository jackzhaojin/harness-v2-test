import { useState } from 'react'
import { useManifest } from '@/hooks/useManifest'
import PodcastPlayer from '@/components/PodcastPlayer'
import { cn } from '@/lib/utils'

export default function PodcastPage() {
  const { manifest, loading, error } = useManifest()
  const [selectedEpisode, setSelectedEpisode] = useState(null)

  const episodes = manifest?.podcastEpisodes || []
  const currentEpisode = selectedEpisode || episodes[0] || null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-on-surface-variant text-sm">Loading episodes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col lg:flex-row overflow-hidden">
      {/* Main Player */}
      <section className="flex-1 flex flex-col p-5 lg:p-8 overflow-y-auto">
        {episodes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="glass-panel p-10 rounded-xl border border-outline-variant/20 max-w-md text-center">
              <span className="material-symbols-outlined text-on-surface-variant text-5xl mb-4 block">headphones</span>
              <h3 className="font-headline font-bold text-xl mb-3">No Podcasts Yet</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Podcast episodes will appear here once the CONTENT phase generates them with the <span className="text-primary font-mono text-xs">--include-podcasts</span> flag.
              </p>
            </div>
          </div>
        ) : (
          <PodcastPlayer episode={currentEpisode} />
        )}
      </section>

      {/* Episode List Sidebar */}
      <aside className="w-full lg:w-80 bg-surface-container border-t lg:border-t-0 lg:border-l border-outline-variant/10 flex flex-col overflow-hidden">
        <div className="p-5 border-b border-outline-variant/10">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-headline font-bold text-base text-on-background">Episodes</h3>
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded border border-primary/20">
              {episodes.length}
            </span>
          </div>
          <p className="text-[10px] text-on-surface-variant">
            {manifest?.title || 'Study podcast episodes'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {episodes.length === 0 && (
            <p className="text-xs text-on-surface-variant text-center py-8 italic">
              No episodes generated yet
            </p>
          )}
          {episodes.map((ep, i) => (
            <button
              key={ep.id || i}
              onClick={() => setSelectedEpisode(ep)}
              className={cn(
                'w-full text-left p-4 rounded-xl transition-all',
                (currentEpisode?.id === ep.id || (!selectedEpisode && i === 0))
                  ? 'bg-surface-container-high border border-primary/30 shadow-[0_0_15px_rgba(157,143,255,0.1)]'
                  : 'bg-surface-container-low border border-outline-variant/10 hover:bg-surface-container hover:border-primary/20'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-headline font-bold',
                  (currentEpisode?.id === ep.id || (!selectedEpisode && i === 0))
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant'
                )}>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold font-headline text-on-surface truncate mb-1">
                    {ep.title || ep.name || `Episode ${i + 1}`}
                  </h4>
                  {ep.domain && (
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider truncate">{ep.domain}</p>
                  )}
                  {ep.duration && (
                    <p className="text-[10px] text-outline mt-1">{ep.duration}</p>
                  )}
                </div>
                {ep.audioSrc || ep.audioPath ? (
                  <span className="material-symbols-outlined text-sm text-tertiary flex-shrink-0">audio_file</span>
                ) : (
                  <span className="material-symbols-outlined text-sm text-outline flex-shrink-0">schedule</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}
