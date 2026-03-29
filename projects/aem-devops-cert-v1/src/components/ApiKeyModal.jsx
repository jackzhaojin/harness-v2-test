import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'claude-api-key'

/**
 * Modal for entering and managing the user's Claude API key.
 * The key is stored in localStorage under 'claude-api-key'.
 *
 * Props:
 *   open       {boolean}  — whether the modal is visible
 *   onClose    {function} — called when the modal should close (no key saved)
 *   onSave     {function} — called with the saved key when the user saves
 */
export default function ApiKeyModal({ open, onClose, onSave }) {
  const [inputValue, setInputValue] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [hasStoredKey, setHasStoredKey] = useState(false)

  useEffect(() => {
    if (open) {
      const stored = localStorage.getItem(STORAGE_KEY) || ''
      setHasStoredKey(!!stored)
      // Pre-fill with existing key so user can see it's already set
      setInputValue(stored)
      setShowKey(false)
    }
  }, [open])

  if (!open) return null

  const handleSave = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return
    localStorage.setItem(STORAGE_KEY, trimmed)
    onSave(trimmed)
  }

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY)
    setInputValue('')
    setHasStoredKey(false)
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6, 14, 32, 0.85)', backdropFilter: 'blur(8px)' }}
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md glass-panel rounded-2xl border border-outline-variant/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-lg">key</span>
            <h2 className="text-sm font-headline font-bold tracking-widest uppercase text-on-surface">
              Claude API Key
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/10">
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Your API key is used only to evaluate teach-back explanations. It is stored locally in your browser and is never sent anywhere except directly to{' '}
              <span className="text-primary font-medium">api.anthropic.com</span>.
            </p>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full', hasStoredKey ? 'bg-secondary' : 'bg-error')} />
            <span className="text-xs text-on-surface-variant">
              {hasStoredKey ? 'API key stored' : 'No API key stored'}
            </span>
          </div>

          {/* Input */}
          <div className="space-y-2">
            <label className="text-[10px] font-headline font-bold text-on-surface-variant uppercase tracking-widest">
              API Key
            </label>
            <div className="relative flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full bg-surface-container-low rounded-xl px-4 py-3 pr-12 text-sm text-on-surface placeholder:text-outline/40 border border-outline-variant/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors font-mono"
                onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 p-1 text-on-surface-variant hover:text-on-surface transition-colors"
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                <span className="material-symbols-outlined text-sm">
                  {showKey ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-outline-variant/10">
          <button
            onClick={handleClear}
            className={cn(
              'text-xs text-error hover:underline uppercase tracking-wider font-bold transition-opacity',
              !hasStoredKey && 'opacity-30 pointer-events-none'
            )}
          >
            Clear key
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface border border-outline-variant/20 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!inputValue.trim()}
              className={cn(
                'px-5 py-2 text-xs font-headline font-black uppercase tracking-wider rounded-xl transition-all',
                inputValue.trim()
                  ? 'gradient-cta text-on-background hover:shadow-[0_0_20px_rgba(157,143,255,0.4)]'
                  : 'bg-surface-variant text-outline cursor-not-allowed opacity-50'
              )}
            >
              Save Key
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
