import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card'
import ResearchViewer from '../components/ResearchViewer'

export default function Research() {
  const [topicTree, setTopicTree] = useState(null)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [availableFiles, setAvailableFiles] = useState([])

  useEffect(() => {
    // Load topic tree
    fetch('/research/topic-tree.json')
      .then(res => res.json())
      .then(data => {
        setTopicTree(data)
      })
      .catch(err => console.error('Failed to load topic tree:', err))

    // Get list of available research files
    const files = [
      { id: 'prompt-engineering', title: 'Prompt Engineering', file: '_combined_prompt-engineering.md' },
      { id: 'tool-use', title: 'Tool Use and Function Calling', file: '_combined_tool-use.md' },
      { id: 'agents', title: 'Agentic Patterns', file: '_combined_agents.md' },
      { id: 'context-management', title: 'Context Window Management', file: '_combined_context-management.md' },
      { id: 'api-integration', title: 'API Integration', file: '_combined_api-integration.md' },
      { id: 'multimodal', title: 'Multimodal Capabilities', file: '_combined_multimodal.md' },
      { id: 'evaluation', title: 'Evaluation and Testing', file: '_combined_evaluation.md' },
      { id: 'claude-code', title: 'Claude Code and Skills', file: '_combined_claude-code.md' },
      { id: 'enterprise', title: 'Enterprise Patterns', file: '_combined_enterprise.md' },
      { id: 'safety-alignment', title: 'Safety and Alignment', file: '_combined_safety-alignment.md' }
    ]
    setAvailableFiles(files)
    setSelectedTopic(files[0])
  }, [])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Research Materials</h1>
        <p className="text-muted-foreground">
          Browse comprehensive study materials organized by certification topic
        </p>
      </div>

      {topicTree && (
        <Card>
          <CardHeader>
            <CardTitle>Study Materials</CardTitle>
            <CardDescription>
              {topicTree.totalLeafTopics} topics across {topicTree.topics.length} main areas
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Topic Selector */}
        <Card className="h-fit lg:sticky lg:top-20">
          <CardHeader>
            <CardTitle className="text-lg">Topics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {availableFiles.map((file) => (
              <button
                key={file.id}
                onClick={() => setSelectedTopic(file)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedTopic?.id === file.id
                    ? 'border-primary bg-accent'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }`}
              >
                <span className="text-sm font-medium">{file.title}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Research Viewer */}
        <ResearchViewer topic={selectedTopic} />
      </div>
    </div>
  )
}
