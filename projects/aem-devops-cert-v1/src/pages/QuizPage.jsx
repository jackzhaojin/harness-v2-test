import { useState, useEffect, useMemo } from 'react'
import { useManifest } from '@/hooks/useManifest'
import QuizCard from '@/components/QuizCard'
import PerformancePanel from '@/components/PerformancePanel'
import { cn } from '@/lib/utils'

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function computeDomainBreakdown(answeredQuestions) {
  const map = {}
  answeredQuestions.forEach(q => {
    const d = q.domain || q.topic || 'General'
    map[d] = (map[d] || 0) + 1
  })
  return Object.entries(map).map(([name, count]) => ({ name, count }))
}

export default function QuizPage() {
  const { manifest, loading: manifestLoading } = useManifest()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState([])
  const [quizComplete, setQuizComplete] = useState(false)
  const [domainFilter, setDomainFilter] = useState('all')

  // Load quiz data
  useEffect(() => {
    if (manifestLoading) return
    const quizPath = manifest?.quizPath || 'quizzes.json'
    fetch(`/${quizPath}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        // Handle both array and nested object formats
        let qs = []
        if (Array.isArray(data)) {
          qs = data
        } else if (data.questions) {
          qs = data.questions
        } else if (typeof data === 'object') {
          // Flatten domain-keyed object
          Object.values(data).forEach(val => {
            if (Array.isArray(val)) qs = qs.concat(val)
            else if (val?.questions) qs = qs.concat(val.questions)
          })
        }
        setQuestions(shuffleArray(qs))
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [manifest, manifestLoading])

  const domains = useMemo(() => {
    const all = new Set()
    questions.forEach(q => { if (q.domain || q.topic) all.add(q.domain || q.topic) })
    return ['all', ...Array.from(all)]
  }, [questions])

  const filteredQuestions = useMemo(() => {
    if (domainFilter === 'all') return questions
    return questions.filter(q => (q.domain || q.topic) === domainFilter)
  }, [questions, domainFilter])

  const currentQuestion = filteredQuestions[currentIndex]

  const handleScore = (isCorrect) => {
    if (isCorrect) setCorrectCount(c => c + 1)
    if (currentQuestion) {
      setAnsweredQuestions(prev => [...prev, currentQuestion])
    }
  }

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      setQuizComplete(true)
    }
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setCorrectCount(0)
    setAnsweredQuestions([])
    setQuizComplete(false)
    setQuestions(prev => shuffleArray(prev))
  }

  const domainBreakdown = computeDomainBreakdown(answeredQuestions)

  if (loading || manifestLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-on-surface-variant text-sm">Loading quiz questions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-8">
        <div className="glass-panel p-8 rounded-xl border border-error/20 max-w-md text-center">
          <span className="material-symbols-outlined text-error text-4xl mb-3">quiz</span>
          <h3 className="font-headline font-bold text-xl mb-2 text-on-surface">Quiz Not Available</h3>
          <p className="text-on-surface-variant text-sm mb-4">{error}</p>
          <p className="text-[10px] text-outline">Run the CONTENT phase to generate quiz questions.</p>
        </div>
      </div>
    )
  }

  if (filteredQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-8">
        <div className="glass-panel p-8 rounded-xl border border-outline-variant/20 max-w-md text-center">
          <span className="material-symbols-outlined text-on-surface-variant text-4xl mb-3">search_off</span>
          <h3 className="font-headline font-bold text-xl mb-2">No Questions Found</h3>
          <p className="text-on-surface-variant text-sm">No quiz questions available{domainFilter !== 'all' ? ` for domain "${domainFilter}"` : ''}.</p>
          {domainFilter !== 'all' && (
            <button onClick={() => setDomainFilter('all')} className="mt-4 text-xs text-primary hover:underline">
              Show all domains
            </button>
          )}
        </div>
      </div>
    )
  }

  if (quizComplete) {
    const finalAccuracy = filteredQuestions.length > 0 ? Math.round((correctCount / filteredQuestions.length) * 100) : 0
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-8">
        <div className="glass-panel p-10 rounded-xl border border-primary/20 max-w-lg w-full text-center">
          <span className="material-symbols-outlined text-secondary text-5xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>
            {finalAccuracy >= 80 ? 'emoji_events' : finalAccuracy >= 60 ? 'thumb_up' : 'school'}
          </span>
          <h2 className="font-headline font-bold text-3xl mb-2 text-on-surface">Session Complete</h2>
          <p className="text-on-surface-variant mb-6">
            You answered {filteredQuestions.length} questions
          </p>
          <div className="flex justify-center gap-10 mb-8">
            <div>
              <p className="text-4xl font-headline font-bold text-secondary">{finalAccuracy}%</p>
              <p className="text-[10px] text-outline uppercase tracking-widest">Accuracy</p>
            </div>
            <div>
              <p className="text-4xl font-headline font-bold text-on-surface">{correctCount}</p>
              <p className="text-[10px] text-outline uppercase tracking-widest">Correct</p>
            </div>
          </div>
          <button
            onClick={handleRestart}
            className="w-full py-3 gradient-cta text-on-primary-container font-headline font-bold tracking-widest uppercase rounded-xl hover:shadow-[0_0_20px_rgba(157,143,255,0.4)] transition-all"
          >
            NEW SESSION
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <div className="max-w-[1400px] mx-auto p-4 lg:p-6">
        {/* Domain filter */}
        {domains.length > 2 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {domains.map(d => (
              <button
                key={d}
                onClick={() => { setDomainFilter(d); setCurrentIndex(0) }}
                className={cn(
                  'px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full border transition-all',
                  domainFilter === d
                    ? 'border-primary text-primary bg-primary/10'
                    : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/50 hover:text-primary'
                )}
              >
                {d === 'all' ? 'All Domains' : d}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main quiz area */}
          <div className="lg:col-span-8">
            {currentQuestion && (
              <QuizCard
                key={currentIndex}
                question={currentQuestion}
                questionIndex={currentIndex}
                totalQuestions={filteredQuestions.length}
                onNext={handleNext}
                onScore={handleScore}
              />
            )}
          </div>

          {/* Performance panel */}
          <div className="lg:col-span-4 lg:max-w-[320px]">
            <PerformancePanel
              total={answeredQuestions.length}
              correctCount={correctCount}
              domains={domainBreakdown}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
