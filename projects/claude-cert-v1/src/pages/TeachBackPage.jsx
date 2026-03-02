import useManifest from '@/hooks/useManifest'
import TeachBackInput from '@/components/TeachBackInput'
import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'

export default function TeachBackPage() {
  const { manifest, loading, error } = useManifest()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground animate-pulse">Loading teach-back module...</p>
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

  if (!topicTree) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Teach-Back</h1>
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <MessageSquare className="size-12 mx-auto text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">No topics available for teach-back</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="space-y-2 mb-6">
        <h1 className="text-2xl font-bold">Teach-Back</h1>
        <p className="text-muted-foreground text-sm">
          The best way to learn is to teach. Pick a topic and explain it as if you were teaching someone else.
          This technique, known as the Feynman method, exposes gaps in your understanding.
        </p>
      </div>
      <TeachBackInput topicTree={topicTree} />
    </div>
  )
}
