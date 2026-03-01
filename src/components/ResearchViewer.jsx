import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { FileText } from 'lucide-react'

export default function ResearchViewer({ filePath }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!filePath) {
      setContent('')
      return
    }

    setLoading(true)
    setError(null)

    fetch(`/${filePath}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load research file')
        }
        return res.text()
      })
      .then((text) => {
        setContent(text)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [filePath])

  if (!filePath) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Document Selected</h3>
        <p className="text-muted-foreground">
          Select a research document from the list to view its contents
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-3/4"></div>
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-2/3"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border-2 border-destructive/50 bg-destructive/10 p-6 text-center">
        <p className="text-destructive font-medium">Error loading document</p>
        <p className="text-sm text-muted-foreground mt-2">{error}</p>
      </div>
    )
  }

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-3xl font-bold mt-8 mb-4 text-foreground" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-2xl font-bold mt-6 mb-3 text-foreground" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xl font-semibold mt-4 mb-2 text-foreground" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-4 leading-7 text-foreground" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside mb-4 space-y-2 text-foreground" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside mb-4 space-y-2 text-foreground" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="ml-4 text-foreground" {...props} />
          ),
          code: ({ node, inline, ...props }) =>
            inline ? (
              <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-sm" {...props} />
            ) : (
              <code className="block p-4 rounded-lg bg-muted text-foreground font-mono text-sm overflow-x-auto" {...props} />
            ),
          pre: ({ node, ...props }) => (
            <pre className="mb-4 p-4 rounded-lg bg-muted overflow-x-auto" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="text-primary hover:underline" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-border" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-2 bg-muted text-left font-semibold text-foreground" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-2 border-t border-border text-foreground" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
