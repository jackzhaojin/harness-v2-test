import { cn } from '@/lib/utils'

const DOMAIN_COLORS = ['bg-secondary', 'bg-tertiary', 'bg-primary', 'bg-error', 'bg-secondary', 'bg-primary']

export default function PerformancePanel({ score, total, correctCount, domains }) {
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0
  const gaugePercent = accuracy
  const remaining = 100 - gaugePercent

  const gaugeStyle = {
    background: `conic-gradient(#b4d400 ${gaugePercent}%, #142449 0)`,
  }

  const domainEntries = domains || []

  return (
    <div className="glass-panel p-6 border border-outline-variant/10 h-fit">
      <h3 className="font-headline font-bold text-sm tracking-widest uppercase mb-6">Performance Matrix</h3>

      {/* Accuracy Gauge */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative w-28 h-28 rounded-full flex items-center justify-center" style={gaugeStyle}>
          <div className="absolute inset-2 bg-surface rounded-full flex flex-col items-center justify-center">
            <span className="text-2xl font-headline font-bold text-secondary">{accuracy}%</span>
            <span className="text-[9px] text-on-surface-variant uppercase font-mono tracking-tighter">Accuracy</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-5">
        <div className="flex justify-between items-end">
          <div className="space-y-0.5">
            <p className="text-[10px] text-on-surface-variant font-mono uppercase">Questions Answered</p>
            <p className="text-xl font-headline font-bold">{total}</p>
          </div>
          <div className="text-right space-y-0.5">
            <p className="text-[10px] text-on-surface-variant font-mono uppercase">Correct</p>
            <p className="text-xl font-headline font-bold text-secondary">{correctCount}</p>
          </div>
        </div>

        {/* Domain Mastery */}
        {domainEntries.length > 0 && (
          <div className="pt-4 border-t border-outline-variant/10">
            <p className="text-[10px] text-on-surface-variant font-mono uppercase tracking-widest mb-3">Domain Breakdown</p>
            <div className="space-y-3">
              {domainEntries.slice(0, 4).map((domain, i) => (
                <div key={domain.name} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-on-surface truncate max-w-[120px]">{domain.name}</span>
                    <span>{domain.count}</span>
                  </div>
                  <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className={cn('h-full', DOMAIN_COLORS[i % DOMAIN_COLORS.length])} style={{ width: `${Math.min(domain.count * 10, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
