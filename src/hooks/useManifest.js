import { useState, useEffect } from 'react'

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

    fetch('/manifest.json')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load manifest: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!cancelled) {
          cachedManifest = data
          setManifest(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { manifest, loading, error }
}
