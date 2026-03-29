import { useState, useEffect } from 'react'
import { getAssetUrl } from '@/lib/sitePaths'

let cachedManifest = null

export default function useManifest() {
  const [manifest, setManifest] = useState(cachedManifest)
  const [loading, setLoading] = useState(!cachedManifest)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (cachedManifest) {
      setManifest(cachedManifest)
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      try {
        const res = await fetch(getAssetUrl('manifest.json'))
        if (!res.ok) throw new Error(`Failed to load manifest: ${res.status}`)
        const data = await res.json()
        cachedManifest = data
        if (!cancelled) {
          setManifest(data)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { manifest, loading, error }
}
