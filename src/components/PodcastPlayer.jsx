import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

export default function PodcastPlayer({ episode, onEnded }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const audioRef = useRef(null)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.load()
      setIsPlaying(false)
      setCurrentTime(0)
    }
  }, [episode])

  const togglePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleSeek = (e) => {
    const seekTime = (e.target.value / 100) * duration
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime
      setCurrentTime(seekTime)
    }
  }

  const handleSkip = (seconds) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        0,
        Math.min(duration, audioRef.current.currentTime + seconds)
      )
    }
  }

  const handleSpeedChange = (rate) => {
    setPlaybackRate(rate)
    if (audioRef.current) {
      audioRef.current.playbackRate = rate
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    if (onEnded) {
      onEnded()
    }
  }

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  if (!episode) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        Select an episode to play
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-lg">{episode.title}</h3>
        <p className="text-sm text-muted-foreground">Duration: {episode.duration}</p>
      </div>

      <audio
        ref={audioRef}
        src={`/${episode.audioPath}`}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Progress Bar */}
      <div className="space-y-2">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${progress}%, hsl(var(--secondary)) ${progress}%, hsl(var(--secondary)) 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleSkip(-15)}
          title="Rewind 15 seconds"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          size="icon"
          onClick={togglePlayPause}
          className="h-12 w-12"
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6" />
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => handleSkip(15)}
          title="Forward 15 seconds"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Playback Speed */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm text-muted-foreground mr-2">Speed:</span>
        {[1, 1.5, 2].map((rate) => (
          <Button
            key={rate}
            variant={playbackRate === rate ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSpeedChange(rate)}
          >
            {rate}x
          </Button>
        ))}
      </div>
    </div>
  )
}
