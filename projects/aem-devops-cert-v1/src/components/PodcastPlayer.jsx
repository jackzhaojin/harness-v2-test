import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

const SPEEDS = [0.75, 1, 1.25, 1.5, 2]

function WaveformBar({ height, active, played }) {
  return (
    <div
      className={cn(
        'w-1 rounded-full transition-all duration-100',
        played ? 'bg-secondary' : active ? 'bg-primary' : 'bg-outline-variant'
      )}
      style={{ height: `${height}px` }}
    />
  )
}

export default function PodcastPlayer({ episode }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speedIndex, setSpeedIndex] = useState(1)
  const [volume, setVolume] = useState(0.8)

  const audioSrc = episode?.audioSrc || episode?.audioPath || null

  useEffect(() => {
    setPlaying(false)
    setCurrentTime(0)
  }, [episode?.id])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onUpdate = () => setCurrentTime(audio.currentTime)
    const onLoaded = () => setDuration(audio.duration)
    const onEnded = () => setPlaying(false)
    audio.addEventListener('timeupdate', onUpdate)
    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onUpdate)
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio || !audioSrc) return
    if (playing) {
      audio.pause()
    } else {
      audio.play()
    }
    setPlaying(!playing)
  }

  const seek = (e) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audio.currentTime = ratio * duration
  }

  const cycleSpeed = () => {
    const next = (speedIndex + 1) % SPEEDS.length
    setSpeedIndex(next)
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next]
  }

  const formatTime = (t) => {
    if (!t || isNaN(t)) return '0:00'
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const progressRatio = duration > 0 ? currentTime / duration : 0

  // Waveform bars (decorative)
  const BARS = [4, 6, 3, 8, 10, 4, 12, 7, 10, 8, 4, 6, 3, 5, 8, 4, 6, 3, 5, 10, 4, 12, 7, 10, 8, 4]
  const barCount = BARS.length
  const playedBars = Math.round(progressRatio * barCount)

  if (!episode) {
    return (
      <div className="flex items-center justify-center h-40 glass-panel rounded-xl border border-outline-variant/10">
        <p className="text-on-surface-variant text-sm">Select an episode to begin</p>
      </div>
    )
  }

  return (
    <div>
      {/* Episode header */}
      <div className="mb-6 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 text-secondary font-headline font-bold text-xs tracking-tighter uppercase mb-2">
            <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
            {playing ? 'Now Playing' : 'Paused'}
          </div>
          <h2 className="text-2xl font-headline font-black text-on-background leading-tight tracking-tighter uppercase">
            {episode.title || episode.name || 'Episode'}
          </h2>
          {episode.domain && (
            <p className="text-on-surface-variant mt-1 text-sm font-medium">
              {episode.domain}
            </p>
          )}
        </div>
        <div className="hidden sm:flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-surface-container-high border border-outline-variant/30 text-xs font-bold hover:bg-surface-bright transition-colors">
            SHARE
          </button>
        </div>
      </div>

      {/* Player section */}
      <div className="grid grid-cols-12 gap-4 mb-6">
        {/* Artwork */}
        <div className="col-span-12 md:col-span-8 relative">
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-surface-container-high flex items-center justify-center relative">
            <span className="material-symbols-outlined text-6xl text-outline-variant">headphones</span>
            <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-60" />
            {!audioSrc && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="glass-panel p-4 rounded-xl border border-secondary/20 max-w-xs text-center">
                  <span className="material-symbols-outlined text-secondary text-2xl mb-2 block">info</span>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    No audio file available. Run the TTS phase to generate podcast audio.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side stats */}
        <div className="col-span-12 md:col-span-4 flex flex-col gap-3">
          <div className="bg-surface-container-high p-4 rounded-xl border-t border-white/5 flex-1">
            <h3 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-3">Episode Info</h3>
            <div className="space-y-2">
              {episode.topics?.slice(0, 3).map((t, i) => (
                <div key={i} className={cn('p-2 bg-surface-container-low rounded-lg border-l-2', i === 0 ? 'border-secondary' : i === 1 ? 'border-primary' : 'border-tertiary opacity-50')}>
                  <span className="text-[9px] text-on-surface-variant uppercase font-black block mb-0.5">Concept {String(i+1).padStart(2, '0')}</span>
                  <p className="text-xs font-bold text-on-surface">{t}</p>
                </div>
              ))}
              {(!episode.topics || episode.topics.length === 0) && (
                <p className="text-xs text-on-surface-variant italic">No concepts listed</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Waveform & Controls */}
      <div className="bg-surface-container-highest rounded-2xl p-5 border border-outline-variant/10 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-mono text-outline w-10">{formatTime(currentTime)}</span>
          <div
            className="flex-1 h-12 flex items-center justify-center gap-[2px] cursor-pointer"
            onClick={seek}
          >
            {BARS.map((h, i) => (
              <WaveformBar key={i} height={h} played={i < playedBars} active={playing && i === playedBars} />
            ))}
          </div>
          <span className="text-xs font-mono text-outline w-10 text-right">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 lg:gap-6">
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">shuffle</span>
            </button>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-3xl">skip_previous</span>
            </button>
            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-lg shadow-secondary/20 hover:scale-110 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                {playing ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-3xl">skip_next</span>
            </button>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">repeat</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="material-symbols-outlined text-outline text-sm">volume_up</span>
              <div className="w-20 h-1 bg-surface-container-low rounded-full cursor-pointer">
                <div className="h-full bg-tertiary rounded-full" style={{ width: `${volume * 100}%` }} />
              </div>
            </div>
            <button
              onClick={cycleSpeed}
              className="px-3 py-1.5 bg-surface-container-high rounded-lg text-[10px] font-black text-on-surface border border-outline-variant/20 hover:bg-surface-bright transition-colors"
            >
              {SPEEDS[speedIndex]}x
            </button>
          </div>
        </div>
      </div>

      {audioSrc && (
        <audio ref={audioRef} src={audioSrc} preload="metadata" />
      )}
    </div>
  )
}
