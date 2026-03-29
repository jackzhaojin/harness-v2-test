import { useState } from 'react'
import { cn } from '@/lib/utils'
import ApiKeyModal from '@/components/ApiKeyModal'
import { evaluateExplanation } from '@/lib/claude-client'
import { getAssetUrl } from '@/lib/sitePaths'

const STORAGE_KEY = 'claude-api-key'

function MetricBar({ label, value, color = 'bg-primary', displayValue }) {
  return (
    <div>
      <div className="flex justify-between items-end mb-1.5">
        <span className="text-xs text-on-surface-variant uppercase font-medium">{label}</span>
        <span className="text-lg font-headline font-bold text-on-background">{displayValue || `${value}%`}</span>
      </div>
      <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

function DotBar({ value, max = 10 }) {
  const filled = Math.round((value / 100) * max)
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${max}, 1fr)` }}>
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} className={cn('h-1.5 rounded-full', i < filled ? 'bg-secondary' : 'bg-surface-variant')} />
      ))}
    </div>
  )
}

export default function TeachBackInput({ topics = [] }) {
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [grading, setGrading] = useState(false)
  const [results, setResults] = useState(null)
  const [showApiKeyModal, setShowApiKeyModal] = useState(false)
  const [apiError, setApiError] = useState(null)

  const handleSubmit = async () => {
    if (!text.trim()) return

    // Check for stored API key
    const apiKey = localStorage.getItem(STORAGE_KEY)
    if (!apiKey) {
      setShowApiKeyModal(true)
      return
    }

    setGrading(true)
    setApiError(null)

    // Fetch research content for the selected topic (if any)
    let researchContent = ''
    if (selectedTopic?.id) {
      try {
        const url = getAssetUrl(`research/${selectedTopic.id}.md`)
        const res = await fetch(url)
        if (res.ok) {
          researchContent = await res.text()
        }
      } catch {
        // If research file fetch fails, proceed without it
      }
    }

    try {
      const gradeResults = await evaluateExplanation({
        apiKey,
        explanation: text,
        topicTitle: selectedTopic?.title || 'General AEM DevOps',
        researchContent,
      })
      setResults(gradeResults)
      setSubmitted(true)
    } catch (err) {
      if (err.message === 'invalid-api-key') {
        setApiError('Invalid API key. Please check your key and try again.')
        setShowApiKeyModal(true)
      } else {
        setApiError(err.message || 'An unexpected error occurred. Please try again.')
      }
    } finally {
      setGrading(false)
    }
  }

  const handleApiKeySave = (savedKey) => {
    setShowApiKeyModal(false)
    // If we have text ready, auto-submit after key is saved
    if (text.trim() && savedKey) {
      handleSubmit()
    }
  }

  const handleReset = () => {
    setText('')
    setSubmitted(false)
    setResults(null)
    setGrading(false)
    setApiError(null)
  }

  const charCount = text.length

  return (
    <>
      <ApiKeyModal
        open={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleApiKeySave}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Input */}
        <div className="lg:col-span-2 space-y-5">
          {/* Topic selector */}
          {topics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {topics.map(topic => (
                <button
                  key={topic.id}
                  onClick={() => setSelectedTopic(topic)}
                  className={cn(
                    'px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase rounded border transition-all',
                    selectedTopic?.id === topic.id
                      ? 'border-secondary text-secondary bg-secondary/10'
                      : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/50'
                  )}
                >
                  {topic.title}
                </button>
              ))}
            </div>
          )}

          {/* Main text input */}
          <div className="bg-surface-container-low rounded-xl p-6 min-h-[380px] flex flex-col relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className={cn('w-2 h-2 rounded-full', submitted ? 'bg-secondary' : 'bg-secondary animate-pulse')} />
                <span className="text-xs font-headline font-bold text-on-surface tracking-widest uppercase">
                  {selectedTopic ? selectedTopic.title : 'Input Module: Alpha-9'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowApiKeyModal(true)}
                  className="p-2 bg-surface-variant rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                  title="Manage Claude API key"
                >
                  <span className="material-symbols-outlined text-sm">key</span>
                </button>
                <button disabled className="p-2 bg-surface-variant rounded-lg text-outline cursor-not-allowed opacity-50" title="Voice input (coming soon)">
                  <span className="material-symbols-outlined text-sm">mic</span>
                </button>
                <button disabled className="p-2 bg-surface-variant rounded-lg text-outline cursor-not-allowed opacity-50" title="Attach file (coming soon)">
                  <span className="material-symbols-outlined text-sm">attach_file</span>
                </button>
              </div>
            </div>

            {/* API error banner */}
            {apiError && (
              <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-error text-sm mt-0.5">error</span>
                <div className="flex-1">
                  <p className="text-xs text-error leading-relaxed">{apiError}</p>
                </div>
                <button
                  onClick={() => setApiError(null)}
                  className="text-error/60 hover:text-error transition-colors"
                  aria-label="Dismiss error"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}

            {!submitted ? (
              <>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-xl font-light text-on-surface placeholder:text-outline/30 resize-none leading-relaxed min-h-[220px]"
                  placeholder={selectedTopic
                    ? `Explain ${selectedTopic.title} as if teaching a neural peer...`
                    : "Begin your explanation here... Select a topic above or start teaching the AI your understanding."}
                />
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[10px] text-outline font-mono">{charCount} chars</span>
                  <button
                    onClick={handleSubmit}
                    disabled={!text.trim() || grading}
                    className={cn(
                      'px-8 py-3 bg-secondary text-on-secondary font-headline font-black rounded-xl hover:shadow-[0_0_25px_rgba(180,212,0,0.5)] transition-all',
                      (!text.trim() || grading) && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    SUBMIT LOGIC
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1">
                <div className="p-4 bg-surface-container rounded-xl border border-secondary/20 mb-4">
                  <p className="text-on-surface text-base leading-relaxed">{text}</p>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-primary hover:underline uppercase tracking-wider font-bold"
                >
                  Clear and try again
                </button>
              </div>
            )}

            {grading && (
              <div className="absolute inset-0 flex items-center justify-center bg-surface-container-low/90 rounded-xl backdrop-blur-sm">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-on-surface-variant text-sm">Analyzing your logic...</p>
                </div>
              </div>
            )}
          </div>

          {/* Visualization panels (post-submit) */}
          {submitted && results && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-high rounded-xl p-5 border border-outline-variant/5">
                <h3 className="text-[10px] font-headline font-bold text-on-surface-variant uppercase tracking-widest mb-5">
                  Node Map
                </h3>
                <div className="h-28 flex items-end gap-1">
                  {[30, 50, 35, 100, 25, 15, 75, 40].map((h, i) => (
                    <div
                      key={i}
                      className={cn('flex-1 rounded-t-sm transition-all duration-500', i === 3 ? 'bg-secondary shadow-[0_0_10px_#b4d400]' : 'bg-primary/30')}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="bg-surface-container-high rounded-xl p-5 border border-outline-variant/5">
                <h3 className="text-[10px] font-headline font-bold text-on-surface-variant uppercase tracking-widest mb-4">
                  Semantic Gaps
                </h3>
                <div className="space-y-3">
                  {results.semanticGaps.map((gap, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-on-surface font-medium">{gap.name}</span>
                      <span className={cn('text-[10px] font-bold uppercase tracking-tighter', gap.status === 'missing' ? 'text-error' : 'text-secondary')}>
                        {gap.status === 'missing' ? 'Missing' : 'Covered'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Side: Grading Dashboard */}
        <div className="space-y-5">
          <div className="bg-surface-container rounded-xl p-6 border border-primary/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary text-sm">terminal</span>
              <h2 className="text-sm font-headline font-bold tracking-widest uppercase">Grading Dashboard</h2>
            </div>

            {!submitted ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-outline text-3xl mb-3 block">psychology</span>
                <p className="text-xs text-on-surface-variant">Submit your explanation to receive AI feedback</p>
              </div>
            ) : results ? (
              <div className="space-y-7">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs text-on-surface-variant uppercase font-medium">Logic Accuracy</span>
                    <span className="text-xl font-headline font-bold text-on-background">
                      {results.logicAccuracy >= 90 ? 'A+' : results.logicAccuracy >= 80 ? 'A' : results.logicAccuracy >= 70 ? 'B' : 'C'}
                    </span>
                  </div>
                  <DotBar value={results.logicAccuracy} />
                </div>
                <MetricBar label="Depth of Understanding" value={results.depth} color="bg-primary" />
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs text-on-surface-variant uppercase font-medium">Instructional Flow</span>
                    <span className="text-xl font-headline font-bold text-on-background">{results.flow}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-3 bg-surface-variant rounded-sm border border-outline-variant/10" />
                    <div className="flex-1 h-3 bg-secondary rounded-sm shadow-[0_0_8px_#b4d400]" />
                    <div className="flex-1 h-3 bg-surface-variant rounded-sm border border-outline-variant/10" />
                  </div>
                </div>

                {results.suggestions.length > 0 && (
                  <div className="pt-6 border-t border-outline-variant/10">
                    <h4 className="text-[10px] font-headline font-black text-on-surface-variant uppercase tracking-widest mb-4">
                      Neural Suggestions
                    </h4>
                    <div className="space-y-3">
                      {results.suggestions.map((s, i) => (
                        <div key={i} className={cn('p-3 bg-surface-container-low rounded-lg border-l-2', i === 0 ? 'border-primary/40' : 'border-tertiary/40')}>
                          <p className="text-xs text-on-surface-variant leading-relaxed">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Mastery Progress */}
          <div className="bg-gradient-to-br from-surface-container-high to-surface-container rounded-xl p-5 overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-[10px] font-headline font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                Mastery Progress
              </h3>
              <div className="text-3xl font-headline font-bold mb-3 italic text-on-surface">
                {submitted ? '642' : '0'}{' '}
                <span className="text-xs font-normal not-italic text-outline">pts</span>
              </div>
              <p className="text-xs text-on-surface-variant">
                {submitted ? 'Points earned from this session' : 'Submit explanations to earn points'}
              </p>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/10 blur-2xl rounded-full" />
          </div>
        </div>
      </div>
    </>
  )
}
