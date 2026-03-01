import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Play, Pause } from 'lucide-react'

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function PodcastPlayer({ episode }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [audioError, setAudioError] = useState(false)

  useEffect(() => {
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setAudioError(false)
    if (audioRef.current) {
      audioRef.current.playbackRate = speed
    }
  }, [episode?.id])

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      audioRef.current.playbackRate = speed
    }
  }

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
    setCurrentTime(newTime)
  }

  const togglePlay = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => {
        setAudioError(true)
      })
    }
    setPlaying(!playing)
  }

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed)
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed
    }
  }

  const handleEnded = () => {
    setPlaying(false)
  }

  const handleError = () => {
    setAudioError(true)
    setPlaying(false)
  }

  if (!episode) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-8">
            Select an episode to start listening
          </p>
        </CardContent>
      </Card>
    )
  }

  const speeds = [1, 1.5, 2]

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <h3 className="text-lg font-semibold">{episode.title}</h3>

        <audio
          ref={audioRef}
          src={`/${episode.audioPath}`}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onError={handleError}
          preload="metadata"
        />

        {audioError && (
          <p className="text-sm text-muted-foreground">
            Audio file not available. The audio may not have been generated yet.
          </p>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={togglePlay}
            disabled={audioError}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <span className="text-sm text-muted-foreground w-12 text-right tabular-nums">
            {formatTime(currentTime)}
          </span>

          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-2 accent-primary cursor-pointer"
            aria-label="Seek position"
            disabled={audioError}
          />

          <span className="text-sm text-muted-foreground w-12 tabular-nums">
            {formatTime(duration)}
          </span>
        </div>

        {/* Speed selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Speed:</span>
          {speeds.map((s) => (
            <Button
              key={s}
              variant={speed === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSpeedChange(s)}
              aria-label={`${s}x speed`}
              aria-pressed={speed === s}
            >
              {s}x
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
