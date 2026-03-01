import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

function getLeafTopics(topics) {
  const leaves = []
  function walk(nodes, parentTitle) {
    for (const node of nodes) {
      const subs = node.subtopics || []
      if (subs.length === 0) {
        leaves.push({
          id: node.id,
          title: node.title,
          parentTitle: parentTitle || node.title,
        })
      } else {
        walk(subs, parentTitle || node.title)
      }
    }
  }
  walk(topics, null)
  return leaves
}

function topicIdToFilename(topicId) {
  // Topic IDs use dots for hierarchy: "prompt-engineering.fundamentals.clarity-and-structure"
  // File names use underscores: "prompt-engineering_fundamentals_clarity-and-structure.md"
  return topicId.replace(/\./g, '_')
}

export default function ResearchViewer({ topicTree, researchDir, initialDomain }) {
  const topics = topicTree?.topics || []
  const leaves = getLeafTopics(topics)

  const [selectedLeaf, setSelectedLeaf] = useState(null)
  const [content, setContent] = useState('')
  const [contentLoading, setContentLoading] = useState(false)
  const [contentError, setContentError] = useState(null)

  // Pre-select first topic of initial domain
  useEffect(() => {
    if (initialDomain && leaves.length > 0) {
      const match = leaves.find((l) => l.id.startsWith(initialDomain + '.'))
      if (match) {
        setSelectedLeaf(match.id)
        return
      }
    }
    if (leaves.length > 0 && !selectedLeaf) {
      setSelectedLeaf(leaves[0].id)
    }
  }, [initialDomain, leaves.length])

  // Fetch research file when selection changes
  useEffect(() => {
    if (!selectedLeaf) return

    setContentLoading(true)
    setContentError(null)

    const filename = topicIdToFilename(selectedLeaf)
    const dir = researchDir || 'research/'
    const path = `/${dir}${filename}.md`

    fetch(path)
      .then((res) => {
        if (!res.ok) throw new Error('not-found')
        return res.text()
      })
      .then((text) => {
        setContent(text)
        setContentLoading(false)
      })
      .catch(() => {
        setContent('')
        setContentError('Research not yet available for this topic')
        setContentLoading(false)
      })
  }, [selectedLeaf, researchDir])

  if (leaves.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center py-8">
            No research topics available. Run the pipeline to generate research content.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Group leaves by parent domain
  const grouped = {}
  for (const leaf of leaves) {
    const domainId = leaf.id.split('.')[0]
    if (!grouped[domainId]) {
      grouped[domainId] = { title: leaf.parentTitle, items: [] }
    }
    grouped[domainId].items.push(leaf)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Topic list */}
      <div className="md:col-span-1 space-y-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
        {Object.entries(grouped).map(([domainId, group]) => (
          <div key={domainId}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-2">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((leaf) => (
                <Button
                  key={leaf.id}
                  variant={selectedLeaf === leaf.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start text-left h-auto py-2 text-sm"
                  onClick={() => setSelectedLeaf(leaf.id)}
                  aria-label={`View research: ${leaf.title}`}
                  aria-pressed={selectedLeaf === leaf.id}
                >
                  <span className="truncate">{leaf.title}</span>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Content panel */}
      <div className="md:col-span-2">
        <Card>
          <CardContent className="pt-6">
            {contentLoading && (
              <p className="text-muted-foreground">Loading research...</p>
            )}
            {contentError && (
              <p className="text-muted-foreground py-8 text-center">
                {contentError}
              </p>
            )}
            {!contentLoading && !contentError && content && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
