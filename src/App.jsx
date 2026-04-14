import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Resume from './pages/Resume'
import Projects from './pages/Projects'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/resume" element={<Resume />} />
      <Route path="/projects" element={<Projects />} />
    </Routes>
  )
}
