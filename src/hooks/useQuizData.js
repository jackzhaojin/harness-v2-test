import { useState, useEffect } from 'react'

export function useQuizData() {
  const [quizData, setQuizData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/quizzes.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to load quiz data')
        }
        return res.json()
      })
      .then((data) => {
        setQuizData(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return { quizData, loading, error }
}
