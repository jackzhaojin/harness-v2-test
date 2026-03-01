import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { useManifest } from '../hooks/useManifest'
import { cn } from '../lib/utils'

function TopicNode({ topic, level = 0, selectedTopic, onSelect }) {
  const [isOpen, setIsOpen] = useState(level < 2)
  const hasChildren = topic.children && topic.children.length > 0

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen)
    }
    onSelect(topic.id)
  }

  const isSelected = selectedTopic === topic.id

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent',
          isSelected && 'bg-accent font-medium',
          level > 0 && 'ml-4'
        )}
        style={{ paddingLeft: `${level * 0.75 + 0.75}rem` }}
      >
        {hasChildren && (
          <span className="flex-shrink-0">
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        )}
        {!hasChildren && <span className="w-4" />}
        <span className="flex-1 text-left truncate">{topic.name}</span>
      </button>
      {hasChildren && isOpen && (
        <div className="mt-1">
          {topic.children.map((child) => (
            <TopicNode
              key={child.id}
              topic={child}
              level={level + 1}
              selectedTopic={selectedTopic}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TopicSidebar({ onTopicSelect }) {
  const { manifest, loading } = useManifest()
  const [selectedTopic, setSelectedTopic] = useState(null)

  const handleTopicSelect = (topicId) => {
    setSelectedTopic(topicId)
    if (onTopicSelect) {
      onTopicSelect(topicId)
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!manifest) {
    return <div className="p-4 text-muted-foreground">No topics available</div>
  }

  return (
    <div className="h-full overflow-auto p-4">
      <h2 className="mb-4 px-3 text-lg font-semibold">Topics</h2>
      <nav className="space-y-1">
        {manifest.topics.map((topic) => (
          <TopicNode
            key={topic.id}
            topic={topic}
            selectedTopic={selectedTopic}
            onSelect={handleTopicSelect}
          />
        ))}
      </nav>
    </div>
  )
}
