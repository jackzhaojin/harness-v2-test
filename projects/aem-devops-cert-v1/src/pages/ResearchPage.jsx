import { useManifest } from '@/hooks/useManifest'
import ResearchViewer from '@/components/ResearchViewer'

export default function ResearchPage() {
  const { manifest, loading, error } = useManifest()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-on-surface-variant text-sm">Loading knowledge graph...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] p-8">
        <div className="glass-panel p-8 rounded-xl border border-error/20 max-w-md text-center">
          <span className="material-symbols-outlined text-error text-4xl mb-3">error</span>
          <p className="text-error font-bold mb-2">Failed to load manifest</p>
          <p className="text-on-surface-variant text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return <ResearchViewer topicTree={manifest?.topicTree} />
}
