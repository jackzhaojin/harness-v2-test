import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import useManifest from '@/hooks/useManifest'
import ResearchViewer from '@/components/ResearchViewer'

export default function ResearchPage() {
  const { manifest, loading, error } = useManifest()
  const [searchParams] = useSearchParams()
  const domain = searchParams.get('domain')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading research topics...</p>
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

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Research Notes</h1>
      <ResearchViewer
        topicTree={manifest?.topicTree}
        researchDir={manifest?.researchDir}
        initialDomain={domain}
      />
    </div>
  )
}
