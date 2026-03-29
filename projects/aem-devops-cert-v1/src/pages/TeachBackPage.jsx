import { useManifest } from '@/hooks/useManifest'
import TeachBackInput from '@/components/TeachBackInput'

function getLeafTopics(nodes) {
  const leaves = []
  function traverse(node) {
    if (!node.subtopics || node.subtopics.length === 0) {
      leaves.push(node)
    } else {
      node.subtopics.forEach(traverse)
    }
  }
  nodes.forEach(traverse)
  return leaves
}

export default function TeachBackPage() {
  const { manifest, loading, error } = useManifest()

  const leafTopics = manifest?.topicTree?.topics
    ? getLeafTopics(manifest.topicTree.topics).slice(0, 20)
    : []

  return (
    <div className="p-5 lg:p-8 max-w-[1400px] mx-auto">
      {/* Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-8">
        <div className="lg:col-span-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-secondary/10 border border-secondary/20 text-secondary text-[10px] font-bold tracking-widest uppercase rounded-full">
              Teaching Console
            </span>
            <span className="text-on-surface-variant text-sm">{manifest?.title || 'Loading...'}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-headline font-bold tracking-tighter mb-3">
            Teach the Loom:{' '}
            <span className="text-primary drop-shadow-[0_0_8px_rgba(157,143,255,0.5)]">
              AEM DevOps
            </span>
          </h1>
          <p className="text-on-surface-variant text-base max-w-2xl font-light leading-relaxed">
            The Loom is listening. Select a topic and explain it as if teaching a neural peer. Focus on clarity, logical flow, and technical precision. Your explanation will be analyzed and graded.
          </p>
        </div>
        <div className="lg:col-span-4 flex flex-col justify-end">
          <div className="bg-surface-container-high rounded-xl p-5 border border-outline-variant/10">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-headline font-medium text-on-surface-variant uppercase tracking-widest">
                Logic Fidelity
              </span>
              <span className="text-secondary font-headline font-bold">Ready</span>
            </div>
            <div className="h-1 bg-surface-variant w-full overflow-hidden rounded-full">
              <div className="h-full bg-gradient-to-r from-secondary to-tertiary w-0 shadow-[0_0_10px_#b4d400]" />
            </div>
            <p className="text-[10px] text-on-surface-variant mt-2">Submit an explanation to begin scoring</p>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-3 p-6 glass-panel rounded-xl mb-6">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-on-surface-variant text-sm">Loading topic tree...</span>
        </div>
      )}

      {/* Teach Back Input */}
      <TeachBackInput topics={leafTopics} />
    </div>
  )
}
