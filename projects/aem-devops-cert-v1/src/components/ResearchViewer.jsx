import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import TopicSidebar from './TopicSidebar'
import { cn } from '@/lib/utils'

function CitationBadge({ num }) {
  return (
    <span className="inline-flex items-center justify-center bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded leading-none font-bold align-top ml-0.5 cursor-pointer hover:bg-primary/30 transition-colors">
      {num}
    </span>
  )
}

function parseCitations(text) {
  if (!text) return text
  const parts = text.split(/(\[\d+\])/g)
  return parts.map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/)
    if (match) return <CitationBadge key={i} num={match[1]} />
    return part
  })
}

const SYNTHESIS_PRIORITIES = ['HIGH PRIORITY', 'MEDIUM', 'LOW']
const SYNTHESIS_COLORS = ['text-tertiary', 'text-secondary', 'text-outline']

export default function ResearchViewer({ topicTree }) {
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Auto-select first leaf topic on load
  useEffect(() => {
    if (!topicTree || selectedTopic) return
    const domains = topicTree.topics || []
    for (const domain of domains) {
      for (const sub of domain.subtopics || []) {
        for (const leaf of sub.subtopics || []) {
          setSelectedTopic(leaf)
          return
        }
      }
    }
  }, [topicTree])

  useEffect(() => {
    if (!selectedTopic) return
    setLoading(true)
    setError(null)
    setContent(null)

    // Convert topic id to filename format
    const filename = selectedTopic.id.replace(/\./g, '_') + '.md'
    fetch(`/research/${filename}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: Research file not found`)
        return res.text()
      })
      .then(text => {
        setContent(text)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [selectedTopic])

  // Extract breadcrumb from topicTree
  const getBreadcrumb = (topicId) => {
    if (!topicTree || !topicId) return []
    const parts = topicId.split('.')
    const result = []
    const domains = topicTree.topics || []
    for (const domain of domains) {
      if (domain.id === parts[0] || topicId.startsWith(domain.id)) {
        result.push(domain.title)
        for (const sub of domain.subtopics || []) {
          if (topicId.startsWith(sub.id) || sub.id === parts.slice(0, 2).join('.')) {
            result.push(sub.title)
          }
        }
      }
    }
    return result
  }

  const breadcrumb = selectedTopic ? getBreadcrumb(selectedTopic.id) : []

  // Extract sources section from markdown
  const extractSources = (markdown) => {
    if (!markdown) return []
    const sourceSection = markdown.split(/^#+\s*SOURCES?/mi)[1]
    if (!sourceSection) return []
    const lines = sourceSection.split('\n').filter(l => l.trim())
    return lines.slice(0, 4).map((line, i) => ({
      id: i + 1,
      text: line.replace(/^\-\s*/, '').trim()
    }))
  }

  const sources = content ? extractSources(content) : []

  // Generate synthesis links from peer topics
  const getSynthesisLinks = () => {
    if (!topicTree || !selectedTopic) return []
    const domains = topicTree.topics || []
    const all = []
    for (const domain of domains) {
      for (const sub of domain.subtopics || []) {
        for (const leaf of sub.subtopics || []) {
          if (leaf.id !== selectedTopic.id) all.push(leaf)
        }
      }
    }
    return all.slice(0, 3).map((t, i) => ({
      topic: t,
      priority: SYNTHESIS_PRIORITIES[i] || 'LOW',
      color: SYNTHESIS_COLORS[i] || 'text-outline',
    }))
  }

  const synthesisLinks = getSynthesisLinks()

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Left: Knowledge Graph / Topic Tree */}
      <aside className="w-[260px] shrink-0 bg-surface-container border-r border-outline-variant/15 flex-col hidden md:flex overflow-hidden">
        <TopicSidebar
          topicTree={topicTree}
          selectedTopic={selectedTopic?.id}
          onSelectTopic={setSelectedTopic}
        />
      </aside>

      {/* Center: Research Content */}
      <section className="flex-1 flex flex-col overflow-hidden bg-surface-dim">
        {/* Breadcrumb / toolbar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-3 bg-surface-dim/90 backdrop-blur-md border-b border-outline-variant/10">
          <div className="flex items-center gap-1.5 text-[10px] tracking-widest font-headline uppercase text-on-surface-variant flex-wrap">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="material-symbols-outlined text-[12px]">chevron_right</span>}
                <span className={i === breadcrumb.length - 1 ? 'text-primary font-bold' : ''}>{crumb}</span>
              </span>
            ))}
            {!selectedTopic && <span className="text-outline">Select a topic from the sidebar</span>}
          </div>
          <div className="flex items-center gap-3">
            {sources.length > 0 && (
              <div className="flex items-center gap-2 bg-surface-container rounded-full px-3 py-1 border border-outline-variant/20">
                <span className="material-symbols-outlined text-sm text-secondary">format_quote</span>
                <span className="text-[10px] font-bold">{sources.length} SOURCES</span>
              </div>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto">
          {!selectedTopic && (
            <div className="flex flex-col items-center justify-center h-full text-center p-12">
              <span className="material-symbols-outlined text-4xl text-primary mb-4">search_insights</span>
              <h3 className="font-headline font-bold text-xl mb-2">Select a Topic</h3>
              <p className="text-on-surface-variant text-sm max-w-sm">Choose a topic from the Knowledge Graph sidebar to view its research content.</p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-on-surface-variant text-sm">Loading research...</p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="max-w-2xl mx-auto px-8 py-12">
              <div className="p-6 bg-surface-container-high rounded-xl border border-error/20">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-error">warning</span>
                  <h3 className="font-headline font-bold text-error">Research Not Available</h3>
                </div>
                <p className="text-on-surface-variant text-sm">
                  Research file not found for <span className="text-primary font-mono text-xs">{selectedTopic?.id}</span>.
                  Run the RESEARCH phase to generate content.
                </p>
              </div>
            </div>
          )}

          {content && !loading && (
            <article className="max-w-3xl mx-auto px-6 lg:px-10 py-10 space-y-6">
              <div className="h-1 w-20 bg-gradient-to-r from-secondary to-tertiary rounded-full" />
              <div className="prose prose-invert max-w-none space-y-4 [&>h1]:font-headline [&>h1]:font-bold [&>h1]:text-3xl [&>h1]:text-on-surface [&>h1]:tracking-tight [&>h2]:font-headline [&>h2]:font-semibold [&>h2]:text-xl [&>h2]:text-on-surface [&>h2]:mt-8 [&>h3]:font-headline [&>h3]:font-semibold [&>h3]:text-base [&>h3]:text-on-surface [&>p]:text-on-surface-variant [&>p]:leading-relaxed [&>ul]:text-on-surface-variant [&>ol]:text-on-surface-variant [&>li]:leading-relaxed [&>blockquote]:border-l-4 [&>blockquote]:border-secondary [&>blockquote]:pl-4 [&>blockquote]:text-on-surface-variant [&>blockquote]:italic [&>code]:bg-surface-container [&>code]:text-tertiary [&>code]:text-xs [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>pre]:bg-surface-container [&>pre]:text-tertiary [&>pre]:text-xs [&>pre]:p-4 [&>pre]:rounded-xl [&>strong]:text-on-surface [&>a]:text-primary [&>a]:underline [&>table]:w-full [&>table]:text-sm [&>th]:text-left [&>th]:text-on-surface-variant [&>th]:font-bold [&>th]:pb-2 [&>td]:text-on-surface-variant [&>td]:py-1.5">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>

              {sources.length > 0 && (
                <footer className="pt-10 mt-10 border-t border-outline-variant/30 space-y-4 pb-20">
                  <h2 className="font-headline font-bold text-base">SOURCES</h2>
                  <div className="space-y-3">
                    {sources.map(source => (
                      <div key={source.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-container-high transition-colors">
                        <span className="text-primary font-bold font-headline text-sm flex-shrink-0">[{source.id}]</span>
                        <p className="text-sm text-on-surface-variant">{source.text}</p>
                      </div>
                    ))}
                  </div>
                </footer>
              )}
            </article>
          )}
        </div>
      </section>

      {/* Right: Synthesis Links */}
      <aside className="w-[220px] shrink-0 bg-surface-container-low border-l border-outline-variant/15 flex flex-col hidden xl:flex overflow-y-auto">
        <div className="p-5">
          <h2 className="font-headline font-bold text-[10px] tracking-[0.2em] uppercase text-on-surface-variant mb-5">
            SYNTHESIS LINKS
          </h2>
          <div className="space-y-3">
            {synthesisLinks.map(({ topic, priority, color }) => (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(topic)}
                className="glass-panel w-full p-4 rounded-xl border border-outline-variant/10 hover:border-primary/30 transition-all text-left"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={cn('text-[10px] font-bold tracking-widest font-headline', color)}>{priority}</span>
                  <span className="material-symbols-outlined text-[14px] text-on-surface-variant">link</span>
                </div>
                <h4 className="text-xs font-headline font-bold text-on-surface mb-1 leading-tight">{topic.title}</h4>
                <p className="text-[10px] text-on-surface-variant leading-relaxed">Related concept</p>
              </button>
            ))}
          </div>

          <div className="mt-6">
            <div className="bg-surface-container-lowest rounded-xl p-3 border border-outline-variant/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Study Tip</p>
              <p className="text-xs text-secondary italic leading-relaxed">
                Link concepts across domains to reinforce deep understanding for the exam.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
