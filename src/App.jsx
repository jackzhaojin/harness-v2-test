import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './hooks/useTheme'
import Layout from './components/Layout'
import Home from './pages/Home'
import Podcast from './pages/Podcast'
import Quiz from './pages/Quiz'
import TeachBack from './pages/TeachBack'
import Research from './pages/Research'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="podcast" element={<Podcast />} />
            <Route path="quiz" element={<Quiz />} />
            <Route path="teach-back" element={<TeachBack />} />
            <Route path="research" element={<Research />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App
