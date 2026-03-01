import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'

export default function TopicSidebar({ onTopicSelect }) {
  const [topics, setTopics] = useState([])
  const [expanded, setExpanded] = useState({})
  const [selectedTopic, setSelectedTopic] = useState(null)

  useEffect(() => {
    // Load topic tree from manifest
    fetch('/research/topic-tree.json')
      .then(res => res.json())
      .then(data => {
        setTopics(data.topics || [])
        // Expand first level by default
        const initialExpanded = {}
        data.topics?.forEach(topic => {
          initialExpanded[topic.id] = true
        })
        setExpanded(initialExpanded)
      })
      .catch(err => console.error('Failed to load topics:', err))
  }, [])

  const toggleExpand = (topicId) => {
    setExpanded(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }))
  }

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic.id)
    if (onTopicSelect) {
      onTopicSelect(topic)
    }
  }

  const renderTopic = (topic, depth = 0) => {
    const hasSubtopics = topic.subtopics && topic.subtopics.length > 0
    const isExpanded = expanded[topic.id]
    const isSelected = selectedTopic === topic.id

    return (
      <div key={topic.id} className="select-none">
        <div
          className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer rounded-md transition-colors ${
            isSelected
              ? 'bg-accent text-accent-foreground font-medium'
              : 'hover:bg-accent/50'
          }`}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
          onClick={() => {
            if (hasSubtopics) {
              toggleExpand(topic.id)
            }
            handleTopicClick(topic)
          }}
        >
          {hasSubtopics && (
            <button
              className="p-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleExpand(topic.id)
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {!hasSubtopics && <div className="w-4" />}
          <span className="flex-1">{topic.title}</span>
        </div>
        {hasSubtopics && isExpanded && (
          <div>
            {topic.subtopics.map(subtopic => renderTopic(subtopic, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto py-4">
      <div className="px-3 pb-2">
        <h2 className="text-lg font-semibold tracking-tight">Topics</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Explore the certification topics
        </p>
      </div>
      <div className="space-y-1 mt-4">
        {topics.map(topic => renderTopic(topic))}
      </div>
    </div>
  )
}
