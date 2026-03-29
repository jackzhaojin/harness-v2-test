import { useState, useEffect, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getAssetUrl } from '@/lib/sitePaths'

function getLeafTopics(topics, result = []) {
  if (!topics) return result
  for (const t of topics) {
    const children = t.subtopics || []
    if (children.length === 0) {
      result.push(t)
    } else {
      getLeafTopics(children, result)
    }
  }
  return result
}

function parseSources(markdown) {
  const citations = {}
  // Match patterns like: [1] **Title**\n    URL: https://...\n
  const sourceSection = markdown.split(/^## Sources/m)[1] || markdown.split(/^# Sources/m)[1]
  if (!sourceSection) return citations

  const entryPattern = /\[(\d+)\]\s+\*\*(.+?)\*\*(?:\s*\n\s*URL:\s*(https?:\/\/[^\s\n]+))?/g
  let match
  while ((match = entryPattern.exec(sourceSection)) !== null) {
    citations[parseInt(match[1])] = {
      title: match[2].trim(),
      url: match[3] ? match[3].trim() : null,
    }
  }
  return citations
}

function CitationLink({ num, citations }) {
  const citation = citations[num]
  if (!citation) {
    return <sup className="text-blue-600 dark:text-blue-400 text-xs font-semibold">[{num}]</sup>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <sup
          className="text-blue-600 dark:text-blue-400 cursor-pointer text-xs font-semibold hover:underline"
          onClick={() => {
            if (citation.url) {
              window.open(citation.url, '_blank', 'noopener,noreferrer')
            }
          }}
          role="button"
          aria-label={`Citation ${num}: ${citation.title}`}
        >
          [{num}]
        </sup>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm">
        <p className="font-medium text-xs">{citation.title}</p>
        {citation.url && (
          <p className="text-xs text-muted-foreground truncate mt-1">{citation.url}</p>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

function MarkdownWithCitations({ content, citations }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => {
          // Process children to replace [n] patterns with citation links
          const processed = processChildren(children, citations)
          // Use <div> instead of <p> to prevent React DOM nesting warnings
          // when react-markdown renders block-level elements (pre, code blocks)
          // inside what it considers a paragraph. Visually identical with Tailwind.
          return <div className="mb-4 leading-relaxed">{processed}</div>
        },
        h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-3">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-semibold mt-5 mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
        h4: ({ children }) => <h4 className="text-base font-semibold mt-3 mb-1">{children}</h4>,
        ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>,
        li: ({ children }) => {
          const processed = processChildren(children, citations)
          return <li className="leading-relaxed">{processed}</li>
        },
        code: ({ inline, children, ...props }) => {
          if (inline) {
            return <code className="bg-muted px-1.5 py-0.5 rounded text-sm" {...props}>{children}</code>
          }
          return (
            <pre className="bg-muted rounded-md p-4 overflow-x-auto mb-4">
              <code className="text-sm" {...props}>{children}</code>
            </pre>
          )
        },
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground mb-4">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
          >
            {children}
          </a>
        ),
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

function processChildren(children, citations) {
  if (!children) return children
  if (!Array.isArray(children)) {
    children = [children]
  }

  return children.flatMap((child, idx) => {
    if (typeof child !== 'string') return [child]

    // Split on [n] patterns
    const parts = child.split(/(\[\d+\])/)
    return parts.map((part, partIdx) => {
      const citMatch = part.match(/^\[(\d+)\]$/)
      if (citMatch) {
        const num = parseInt(citMatch[1])
        return <CitationLink key={`${idx}-${partIdx}`} num={num} citations={citations} />
      }
      return part
    })
  })
}

export default function ResearchViewer({ topicTree, researchDir }) {
  const [selectedTopicId, setSelectedTopicId] = useState(null)
  const [content, setContent] = useState('')
  const [loadingContent, setLoadingContent] = useState(false)
  const [contentError, setContentError] = useState(null)

  const leafTopics = useMemo(() => {
    if (!topicTree?.topics) return []
    return getLeafTopics(topicTree.topics)
  }, [topicTree])

  // Auto-select first topic
  useEffect(() => {
    if (!selectedTopicId && leafTopics.length > 0) {
      setSelectedTopicId(leafTopics[0].id)
    }
  }, [leafTopics, selectedTopicId])

  // Load research file
  useEffect(() => {
    if (!selectedTopicId || !researchDir) return

    let cancelled = false
    setLoadingContent(true)
    setContentError(null)

    // Convert topic ID like "prompt-engineering.system-prompts.structure"
    // to filename like "prompt-engineering_system-prompts_structure.md"
    const sanitized = selectedTopicId.replace(/\./g, '_')
    const filePath = getAssetUrl(`${researchDir}${sanitized}.md`)

    async function load() {
      try {
        const res = await fetch(filePath)
        if (!res.ok) {
          if (res.status === 404) {
            if (!cancelled) {
              setContent('')
              setContentError('not-found')
              setLoadingContent(false)
            }
            return
          }
          throw new Error(`Failed to load: ${res.status}`)
        }
        const text = await res.text()
        if (!cancelled) {
          setContent(text)
          setLoadingContent(false)
        }
      } catch (err) {
        if (!cancelled) {
          setContentError(err.message)
          setLoadingContent(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [selectedTopicId, researchDir])

  const citations = useMemo(() => parseSources(content), [content])

  // Group leaf topics by their parent domain for organized display
  const topicsByDomain = useMemo(() => {
    if (!topicTree?.topics) return []
    return topicTree.topics.map((domain) => ({
      domain,
      leaves: getLeafTopics([domain]),
    }))
  }, [topicTree])

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 max-w-6xl">
      {/* Left panel - topic list */}
      <div className="overflow-y-auto max-h-[calc(100vh-10rem)] space-y-4">
        {topicsByDomain.map(({ domain, leaves }) => (
          <div key={domain.id}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-2">
              {domain.title}
            </p>
            <div className="space-y-0.5">
              {leaves.map((topic) => (
                <Button
                  key={topic.id}
                  variant={selectedTopicId === topic.id ? 'secondary' : 'ghost'}
                  size="sm"
                  className="w-full justify-start text-left h-auto py-1.5 px-2 font-normal"
                  onClick={() => setSelectedTopicId(topic.id)}
                >
                  <FileText className="size-3.5 mr-1.5 shrink-0" />
                  <span className="truncate text-xs">{topic.title}</span>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Right panel - markdown content */}
      <Card className="min-h-[400px]">
        <CardContent className="p-6">
          {loadingContent && (
            <p className="text-muted-foreground animate-pulse py-12 text-center">
              Loading research content...
            </p>
          )}
          {contentError === 'not-found' && (
            <div className="py-12 text-center space-y-3">
              <BookOpen className="size-10 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground">
                Research not yet available for this topic.
              </p>
            </div>
          )}
          {contentError && contentError !== 'not-found' && (
            <p className="text-destructive py-12 text-center">
              Error loading content: {contentError}
            </p>
          )}
          {!loadingContent && !contentError && content && (
            <div className="prose-sm">
              <MarkdownWithCitations content={content} citations={citations} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Export for use by ResearchPage to set initial selection
export { getLeafTopics }
