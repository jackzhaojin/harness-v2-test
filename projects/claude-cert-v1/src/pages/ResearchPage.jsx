import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useManifest from '@/hooks/useManifest'
import ResearchViewer from '@/components/ResearchViewer'
import { Card, CardContent } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'

export default function ResearchPage() {
  const { manifest, loading, error } = useManifest()
  const [searchParams] = useSearchParams()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground animate-pulse">Loading research browser...</p>
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
  const researchDir = manifest?.researchDir

  if (!topicTree || !researchDir) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Research Browser</h1>
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <BookOpen className="size-12 mx-auto text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">No research content available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Research Browser</h1>
      <ResearchViewer
        topicTree={topicTree}
        researchDir={researchDir}
      />
    </div>
  )
}
