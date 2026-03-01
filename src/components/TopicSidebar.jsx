import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronDown } from 'lucide-react'

function TopicNode({ topic, depth = 0, selectedTopic, onSelectTopic }) {
  const [expanded, setExpanded] = useState(depth === 0)
  const hasChildren = topic.subtopics && topic.subtopics.length > 0
  const isLeaf = !hasChildren
  const isSelected = selectedTopic === topic.id

  return (
    <div>
      <Button
        variant={isSelected ? 'secondary' : 'ghost'}
        className={`w-full justify-start text-left h-auto py-1.5 px-2 font-normal text-sm ${
          depth > 0 ? `ml-${Math.min(depth * 4, 12)}` : ''
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          if (hasChildren) {
            setExpanded(!expanded)
          }
          onSelectTopic(topic.id)
        }}
        aria-expanded={hasChildren ? expanded : undefined}
        aria-label={topic.title}
      >
        {hasChildren && (
          <span className="mr-1 flex-shrink-0">
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </span>
        )}
        {isLeaf && <span className="mr-1 w-3.5 flex-shrink-0" />}
        <span className="truncate">{topic.title}</span>
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
  if (!topicTree || !topicTree.topics) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Loading topics...
      </div>
    )
  }

  return (
    <nav className="py-2 overflow-y-auto h-full" aria-label="Topic navigation">
      <div className="px-3 pb-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Topics
        </h2>
      </div>
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
