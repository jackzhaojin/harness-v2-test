import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from '@/layouts/AppLayout'
import HomePage from '@/pages/HomePage'
import ResearchPage from '@/pages/ResearchPage'
import QuizPage from '@/pages/QuizPage'
import PodcastPage from '@/pages/PodcastPage'
import TeachBackPage from '@/pages/TeachBackPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/podcast" element={<PodcastPage />} />
          <Route path="/teach-back" element={<TeachBackPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
