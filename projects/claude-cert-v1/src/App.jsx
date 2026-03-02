import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import useManifest from '@/hooks/useManifest'
import AppLayout from '@/layouts/AppLayout'
import HomePage from '@/pages/HomePage'
import PodcastPage from '@/pages/PodcastPage'
import QuizPage from '@/pages/QuizPage'
import TeachBackPage from '@/pages/TeachBackPage'
import ResearchPage from '@/pages/ResearchPage'

function App() {
  const { manifest } = useManifest()
  const [selectedTopic, setSelectedTopic] = useState(null)

  return (
    <Routes>
      <Route
        element={
          <AppLayout
            topicTree={manifest?.topicTree || null}
            selectedTopic={selectedTopic}
            onSelectTopic={setSelectedTopic}
          />
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/podcast" element={<PodcastPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/teach-back" element={<TeachBackPage />} />
        <Route path="/research" element={<ResearchPage />} />
      </Route>
    </Routes>
  )
}

export default App
