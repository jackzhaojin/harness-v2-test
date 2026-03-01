import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import ReactMarkdown from 'react-markdown'

export default function ResearchViewer({ topic }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!topic) return

    setLoading(true)
    setError(null)

    fetch(`/research/${topic.file}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load: ${res.statusText}`)
        }
        return res.text()
      })
      .then(text => {
        setContent(text)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load research content:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [topic])

  if (!topic) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Topic Selected</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Select a topic to view research materials</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{topic.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
            <p className="font-semibold">Error loading content</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && content && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-3xl font-bold mt-8 mb-4 border-b pb-2" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-2xl font-bold mt-6 mb-3" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-xl font-semibold mt-4 mb-2" {...props} />
                ),
                h4: ({ node, ...props }) => (
                  <h4 className="text-lg font-semibold mt-3 mb-2" {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p className="my-3 leading-relaxed" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="my-3 ml-6 list-disc space-y-1" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="my-3 ml-6 list-decimal space-y-1" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="my-1" {...props} />
                ),
                code: ({ node, inline, ...props }) =>
                  inline ? (
                    <code
                      className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                      {...props}
                    />
                  ) : (
                    <code
                      className="block bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono my-3"
                      {...props}
                    />
                  ),
                pre: ({ node, ...props }) => (
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-3" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-4 border-primary pl-4 italic my-3 text-muted-foreground"
                    {...props}
                  />
                ),
                a: ({ node, ...props }) => (
                  <a
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  />
                ),
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border-collapse" {...props} />
                  </div>
                ),
                th: ({ node, ...props }) => (
                  <th className="border border-border bg-muted px-4 py-2 text-left font-semibold" {...props} />
                ),
                td: ({ node, ...props }) => (
                  <td className="border border-border px-4 py-2" {...props} />
                ),
                hr: ({ node, ...props }) => (
                  <hr className="my-6 border-border" {...props} />
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}

        {!loading && !error && !content && (
          <p className="text-muted-foreground">No content available</p>
        )}
      </CardContent>
    </Card>
  )
}
