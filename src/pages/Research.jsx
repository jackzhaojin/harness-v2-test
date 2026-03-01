import { useState, useEffect } from 'react'
import { FileText, Search, Folder, File } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import ResearchViewer from '../components/ResearchViewer'
import { useManifest } from '../hooks/useManifest'
import { cn } from '../lib/utils'

export default function Research() {
  const { manifest } = useManifest()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [allFiles, setAllFiles] = useState([])
  const [groupedFiles, setGroupedFiles] = useState({})

  useEffect(() => {
    // In production, this would fetch the file list from the server
    // For now, we'll create a mock structure based on common research topics
    const mockFiles = [
      // Tool Use
      'research/tool-use_basics_tool-definitions.md',
      'research/tool-use_basics_tool-results.md',
      'research/tool-use_advanced_tool-choice.md',
      'research/tool-use_advanced_strict-tool-use.md',
      'research/tool-use_advanced_parallel-and-sequential.md',
      'research/tool-use_server-tools_code-execution.md',

      // Prompt Engineering
      'research/prompt-engineering_fundamentals_role-prompting.md',
      'research/prompt-engineering_fundamentals_few-shot-examples.md',
      'research/prompt-engineering_long-context_document-structure.md',
      'research/_combined_prompt-engineering.md',

      // Agents
      'research/agents_thinking_interleaved-thinking.md',
      'research/agents_thinking_adaptive-thinking.md',
      'research/agents_long-horizon_state-management.md',
      'research/_combined_agents.md',

      // Context Management
      'research/context-management_optimization_token-counting.md',
      'research/_combined_context-management.md',

      // Claude Code
      'research/claude-code_customization_skills.md',
      'research/claude-code_cli_memory.md',
      'research/_combined_claude-code.md',

      // Multimodal & Safety
      'research/_combined_multimodal.md',
      'research/_combined_safety-alignment.md',
      'research/safety-alignment_principles_autonomy-balance.md',

      // Synthesis
      'research/synthesis.md',
    ]

    setAllFiles(mockFiles)

    // Group files by category
    const grouped = mockFiles.reduce((acc, file) => {
      const parts = file.split('/')
      const filename = parts[parts.length - 1]

      // Extract category from filename
      const category = filename.startsWith('_combined_')
        ? 'Combined Guides'
        : filename.split('_')[0].split('-').map(w =>
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join(' ')

      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push({ path: file, name: filename })
      return acc
    }, {})

    setGroupedFiles(grouped)
  }, [])

  const filteredFiles = allFiles.filter(file =>
    file.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredGrouped = Object.entries(groupedFiles).reduce((acc, [category, files]) => {
    const filtered = files.filter(file =>
      file.path.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (filtered.length > 0) {
      acc[category] = filtered
    }
    return acc
  }, {})

  const formatFileName = (filename) => {
    return filename
      .replace('.md', '')
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Research Materials</h1>
          <p className="text-muted-foreground">
            Deep dive into comprehensive documentation
          </p>
        </div>
      </div>

      {/* Layout */}
      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Sidebar - File Browser */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* File List */}
          <Card className="max-h-[calc(100vh-300px)] overflow-auto">
            <CardContent className="pt-6">
              <div className="space-y-4">
                {Object.entries(filteredGrouped).map(([category, files]) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-2 px-2">
                      <Folder className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm">{category}</h3>
                      <Badge variant="outline" className="ml-auto">
                        {files.length}
                      </Badge>
                    </div>
                    <div className="space-y-1 ml-6">
                      {files.map((file) => (
                        <button
                          key={file.path}
                          onClick={() => setSelectedFile(file.path)}
                          className={cn(
                            'flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm transition-colors hover:bg-accent',
                            selectedFile === file.path && 'bg-accent font-medium'
                          )}
                        >
                          <File className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate text-left">
                            {formatFileName(file.name)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {Object.keys(filteredGrouped).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No documents found</p>
                    {searchQuery && (
                      <p className="text-sm mt-2">
                        Try adjusting your search query
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Document Viewer */}
        <Card className="min-h-[600px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedFile ? formatFileName(selectedFile.split('/').pop()) : 'Document Viewer'}
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[calc(100vh-300px)] overflow-auto">
            <ResearchViewer filePath={selectedFile} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
