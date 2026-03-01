import useManifest from '@/hooks/useManifest'
import TeachBackInput from '@/components/TeachBackInput'
import { Card, CardContent } from '@/components/ui/card'

export default function TeachBackPage() {
  const { manifest, loading, error } = useManifest()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading topics...</p>
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

  const topics = manifest?.topicTree?.topics || []

  if (topics.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Teach-Back</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">
              No topics available. Run the pipeline to generate study content.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Teach-Back</h1>
        <p className="text-muted-foreground mt-2">
          Select a topic and explain it in your own words. Teaching a concept is one of
          the most effective ways to solidify your understanding.
        </p>
      </div>
      <TeachBackInput topics={topics} />
    </div>
  )
}
