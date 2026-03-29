import { useState } from 'react'
import { cn } from '@/lib/utils'

function getLeafCount(node) {
  if (!node.subtopics || node.subtopics.length === 0) return 1
  return node.subtopics.reduce((sum, child) => sum + getLeafCount(child), 0)
}

function TopicNode({ node, depth, selectedTopic, onSelectTopic, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || depth === 0)
  const hasChildren = node.subtopics && node.subtopics.length > 0
  const isSelected = selectedTopic === node.id
  const leafCount = getLeafCount(node)

  if (!hasChildren) {
    return (
      <button
        onClick={() => onSelectTopic(node)}
        className={cn(
          'flex items-center gap-2 w-full text-left p-2 rounded-lg transition-colors text-xs',
          isSelected
            ? 'bg-surface-container-high border border-secondary/40 shadow-[0_0_10px_rgba(180,212,0,0.1)]'
            : 'hover:bg-surface-container/50'
        )}
      >
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', isSelected ? 'bg-secondary' : 'border border-primary')} />
        <span className={cn('font-medium leading-tight', isSelected ? 'text-secondary' : 'text-on-surface-variant hover:text-on-surface')}>
          {node.title}
        </span>
      </button>
    )
  }

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-on-surface-variant mb-2 px-2 hover:text-on-surface transition-colors"
      >
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase font-headline">{node.title}</span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-outline bg-surface-container px-1.5 py-0.5 rounded">{leafCount}</span>
          <span className="material-symbols-outlined text-sm">
            {open ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}
          </span>
        </div>
      </button>
      {open && (
        <div className="space-y-1 pl-1">
          {node.subtopics.map(child => (
            <TopicNode
              key={child.id}
              node={child}
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
  const [filter, setFilter] = useState('')

  if (!topicTree) return null

  const domains = topicTree.topics || []

  const filterTopics = (nodes, query) => {
    if (!query) return nodes
    return nodes.reduce((acc, node) => {
      if (node.title.toLowerCase().includes(query.toLowerCase())) {
        acc.push(node)
      } else if (node.subtopics?.length) {
        const filtered = filterTopics(node.subtopics, query)
        if (filtered.length > 0) acc.push({ ...node, subtopics: filtered })
      }
      return acc
    }, [])
  }

  const visibleDomains = filterTopics(domains, filter)

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-outline-variant/15">
        <h2 className="font-headline font-bold text-base tracking-tight mb-3">KNOWLEDGE GRAPH</h2>
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full bg-surface-container-lowest border-none rounded-lg text-[10px] py-2 px-3 focus:ring-1 focus:ring-secondary/50 font-headline tracking-widest placeholder:text-outline/30 outline-none text-on-surface"
          placeholder="FILTER DOMAINS..."
        />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {visibleDomains.length === 0 ? (
          <p className="text-xs text-on-surface-variant text-center mt-8">No topics match your filter</p>
        ) : (
          visibleDomains.map(domain => (
            <TopicNode
              key={domain.id}
              node={domain}
              depth={0}
              selectedTopic={selectedTopic}
              onSelectTopic={onSelectTopic}
              defaultOpen={true}
            />
          ))
        )}
      </div>
    </div>
  )
}
