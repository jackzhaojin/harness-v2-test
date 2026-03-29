import { useNavigate } from 'react-router-dom'
import { useManifest } from '@/hooks/useManifest'
import { cn } from '@/lib/utils'

const DOMAIN_COLORS = {
  'aem-configuration': { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  'cloud-manager-operations': { color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' },
  'web-proxy-infrastructure': { color: 'text-tertiary', bg: 'bg-tertiary/10', border: 'border-tertiary/20' },
  'build-deployments': { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  'monitoring-quality': { color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' },
  'admin-console': { color: 'text-on-primary-fixed-variant', bg: 'bg-on-primary-fixed-variant/10', border: 'border-on-primary-fixed-variant/20' },
}

const MODULE_CARDS = [
  {
    title: 'Knowledge Graph',
    subtitle: (manifest) => {
      const count = manifest?.topics?.length || 0
      const domains = manifest?.topicTree?.topics?.length || 0
      return `${count} topics across ${domains} domains`
    },
    icon: 'search_insights',
    iconColor: 'text-primary',
    tag: 'Research Hub',
    tagColor: 'text-primary',
    link: '/research',
    metric: (manifest) => null,
    progress: 0,
  },
  {
    title: 'Reasoning Arena',
    subtitle: (manifest) => {
      const count = manifest?.quizPath ? 'Questions loaded' : 'No quiz data'
      return count
    },
    icon: 'quiz',
    iconColor: 'text-secondary',
    tag: 'Assessment',
    tagColor: 'text-secondary',
    link: '/quiz',
    metric: null,
    progress: null,
  },
  {
    title: 'Audio Lab',
    subtitle: (manifest) => {
      const eps = manifest?.podcastEpisodes?.length || 0
      return eps > 0 ? `${eps} episodes` : 'No episodes yet'
    },
    icon: 'headphones',
    iconColor: 'text-tertiary',
    tag: 'Audio Stream',
    tagColor: 'text-tertiary',
    link: '/podcast',
    metric: null,
    progress: null,
  },
  {
    title: 'Teach Back',
    subtitle: () => 'Master concepts by teaching the AI',
    icon: 'school',
    iconColor: 'text-on-primary-fixed-variant',
    tag: 'Verification',
    tagColor: 'text-on-primary-fixed-variant',
    link: '/teach-back',
    metric: null,
    progress: null,
  },
]

function ModuleCard({ card, manifest, navigate }) {
  return (
    <div
      onClick={() => navigate(card.link)}
      className="glass-panel-light p-6 rounded-xl transition-all cursor-pointer group hover:shadow-[0_0_25px_rgba(157,143,255,0.15)] hover:bg-[rgba(20,36,73,0.6)] border border-outline-variant/10 hover:border-primary/30"
    >
      <div className="flex items-start justify-between mb-4">
        <span className={cn('material-symbols-outlined text-3xl', card.iconColor)}>{card.icon}</span>
        <span className={cn('text-[10px] font-bold uppercase tracking-tighter', card.tagColor)}>{card.tag}</span>
      </div>
      <h3 className="font-headline font-bold text-lg mb-1">{card.title}</h3>
      <p className="text-xs text-on-surface-variant mb-4">
        {typeof card.subtitle === 'function' ? card.subtitle(manifest) : card.subtitle}
      </p>
      <div className="flex items-center gap-2">
        <span className={cn('text-xs font-bold uppercase tracking-wider', card.iconColor)}>
          <span className="material-symbols-outlined text-sm align-middle mr-1">arrow_forward</span>
          Explore
        </span>
      </div>
    </div>
  )
}

function DomainExamWeightCard({ topic }) {
  const colors = DOMAIN_COLORS[topic.id] || DOMAIN_COLORS['aem-configuration']
  const leafCount = topic.subtopics?.reduce((sum, sub) =>
    sum + (sub.subtopics?.length || 1), 0) || 0

  return (
    <div className={cn('p-4 rounded-xl border bg-surface-container-low flex items-center gap-4', colors.border)}>
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', colors.bg)}>
        <span className={cn('material-symbols-outlined text-sm', colors.color)}>folder</span>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold font-headline text-on-surface truncate">{topic.title}</h4>
        <p className="text-[10px] text-on-surface-variant">{leafCount} leaf topics</p>
      </div>
      <div className={cn('text-xs font-bold font-headline', colors.color)}>
        {topic.estimatedComplexity === 'high' ? 'HIGH' : 'MED'}
      </div>
    </div>
  )
}

export default function HomePage() {
  const { manifest, loading, error } = useManifest()
  const navigate = useNavigate()

  const domains = manifest?.topicTree?.topics || []
  const totalTopics = manifest?.topics?.length || 0

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <section className="mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-secondary font-headline uppercase tracking-[0.3em] text-xs font-bold">
              Systems Operational
            </span>
            <h2 className="text-3xl lg:text-4xl font-black font-headline mt-1 tracking-tight uppercase text-on-surface">
              Study Command Center
            </h2>
            {manifest && (
              <p className="text-sm text-on-surface-variant mt-1 font-body max-w-xl">
                {manifest.title}
              </p>
            )}
          </div>
          <div className="flex items-center gap-6 text-on-surface-variant border-l border-outline-variant/30 pl-6 h-12">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold tracking-widest">Total Topics</p>
              <p className="text-xl font-headline font-bold text-on-surface">{totalTopics}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold tracking-widest">Domains</p>
              <p className="text-xl font-headline font-bold text-secondary">{domains.length}</p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-3 p-6 glass-panel rounded-xl">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-on-surface-variant text-sm">Loading study manifest...</span>
          </div>
        )}

        {error && (
          <div className="p-6 glass-panel rounded-xl border border-error/20">
            <p className="text-error text-sm font-medium">Failed to load manifest: {error}</p>
            <p className="text-on-surface-variant text-xs mt-1">Make sure manifest.json is in the public directory.</p>
          </div>
        )}

        {/* Module Hub Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 4 module cards */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {MODULE_CARDS.map(card => (
              <ModuleCard key={card.title} card={card} manifest={manifest} navigate={navigate} />
            ))}
          </div>

          {/* Resume Session / Exam Info card */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="glass-panel rounded-xl p-6 border border-primary/20 flex flex-col justify-between min-h-[280px] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-6xl">terminal</span>
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-headline font-bold text-base tracking-tight uppercase">Exam Info</h3>
                  <span className="material-symbols-outlined text-secondary animate-pulse">keyboard_double_arrow_right</span>
                </div>
                {manifest ? (
                  <div className="mb-6">
                    <p className="text-primary font-bold text-sm mb-2 leading-tight">{manifest.title}</p>
                    <div className="space-y-2 text-xs text-on-surface-variant">
                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">topic</span>
                        {totalTopics} topics to master
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">category</span>
                        {domains.length} exam domains
                      </p>
                      {manifest.podcastEpisodes?.length > 0 && (
                        <p className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[14px]">headphones</span>
                          {manifest.podcastEpisodes.length} podcast episodes
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 h-16" />
                )}
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-secondary to-tertiary" style={{ width: '15%' }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-outline uppercase tracking-tighter">
                    <span>Getting Started</span>
                    <span>Phase 1 of 5</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/quiz')}
                className="relative z-10 w-full mt-6 py-3 gradient-cta text-on-primary-container rounded-xl font-headline font-bold text-xs tracking-widest uppercase hover:shadow-[0_0_20px_rgba(157,143,255,0.4)] transition-all"
              >
                START STUDYING
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Exam Domains Section */}
      {domains.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">category</span>
              <h2 className="text-xl font-headline font-bold tracking-tight uppercase">Exam Domains</h2>
            </div>
            <button onClick={() => navigate('/research')} className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors uppercase tracking-widest">
              View Research
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {domains.map(domain => (
              <DomainExamWeightCard key={domain.id} topic={domain} />
            ))}
          </div>
        </section>
      )}

      {/* Study Insights */}
      <section className="mb-16">
        <h2 className="text-xl font-headline font-bold tracking-tight mb-6 uppercase">Study Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mastery gauge placeholder */}
          <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-surface-container-low border border-outline-variant/10">
            <div className="relative w-28 h-28 rounded-full flex items-center justify-center mb-5"
              style={{ background: 'conic-gradient(#b4d400 0%, #142449 0)' }}>
              <div className="absolute inset-1.5 rounded-full bg-surface-container-low flex flex-col items-center justify-center">
                <span className="text-2xl font-headline font-bold text-on-surface">0%</span>
                <span className="text-[8px] font-bold text-outline uppercase tracking-widest">Mastery</span>
              </div>
            </div>
            <h4 className="font-headline font-bold text-center">Overall Mastery</h4>
            <p className="text-[10px] text-on-surface-variant text-center mt-1">Complete quizzes to track progress</p>
          </div>

          {/* Quick links */}
          <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/10 flex flex-col">
            <h4 className="font-headline font-bold text-base mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-sm">bolt</span>
              Quick Actions
            </h4>
            <div className="space-y-3 flex-1">
              {[
                { label: 'Start Quiz Session', icon: 'psychology', link: '/quiz', color: 'text-secondary' },
                { label: 'Browse Research', icon: 'search_insights', link: '/research', color: 'text-primary' },
                { label: 'Teach Back', icon: 'school', link: '/teach-back', color: 'text-tertiary' },
              ].map(action => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.link)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors text-left"
                >
                  <span className={cn('material-symbols-outlined text-sm', action.color)}>{action.icon}</span>
                  <span className="text-sm font-medium text-on-surface">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Exam readiness */}
          <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/10 flex flex-col items-center justify-center text-center">
            <span className="material-symbols-outlined text-primary text-5xl mb-3">emoji_events</span>
            <h4 className="font-headline font-bold text-3xl mb-1 text-on-surface">{totalTopics}</h4>
            <p className="text-sm font-bold text-primary uppercase tracking-widest mb-3">Topics Available</p>
            <p className="text-[10px] text-on-surface-variant">
              {manifest?.title?.includes('AD0-E124') ? 'AEM DevOps Expert (AD0-E124)' : 'Exam study material ready'}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
