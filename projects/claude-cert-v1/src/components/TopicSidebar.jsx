import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

function TopicNode({ topic, depth = 0, selectedTopic, onSelectTopic }) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = topic.subtopics && topic.subtopics.length > 0
  const isSelected = selectedTopic === topic.id

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'w-full justify-start text-left h-auto py-1.5 px-2 font-normal',
          isSelected && 'bg-accent text-accent-foreground font-medium'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (hasChildren) {
            setExpanded(!expanded)
          }
          onSelectTopic(topic.id)
        }}
        aria-label={`${topic.title}${hasChildren ? (expanded ? ', expanded' : ', collapsed') : ''}`}
      >
        {hasChildren && (
          <span className="mr-1 shrink-0">
            {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          </span>
        )}
        <span className="truncate text-xs">{topic.title}</span>
      </Button>
      {hasChildren && expanded && (
        <div>
          {topic.subtopics.map((sub) => (
            <TopicNode
              key={sub.id}
              topic={sub}
              depth={depth + 1}
              selectedTopic={selectedTopic}
              onSelectTopic={onSelectTopic}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TopicSidebar({ topicTree, selectedTopic, onSelectTopic }) {
  if (!topicTree || !topicTree.topics || topicTree.topics.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No topics available yet.
      </div>
    )
  }

  return (
    <nav className="overflow-y-auto h-full py-2" aria-label="Topic navigation">
      {topicTree.topics.map((topic) => (
        <TopicNode
          key={topic.id}
          topic={topic}
          depth={0}
          selectedTopic={selectedTopic}
          onSelectTopic={onSelectTopic}
        />
      ))}
    </nav>
  )
}
