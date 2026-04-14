import NavBar from '../components/NavBar'
import SubwayBackground from '../components/SubwayBackground'
import './Resume.css'

export default function Resume() {
  return (
    <div className="page-wrap">
      <SubwayBackground />
      <NavBar />
      <main className="resume-main">
        <div className="page-header">
          <div className="page-header-strip">
            <span style={{background:'#0065BD'}}></span>
            <span style={{background:'#E3001B'}}></span>
          </div>
          <h1>RÉSUMÉ</h1>
          <a
            className="download-btn"
            href="/resume.pdf"
            download
            target="_blank"
            rel="noopener noreferrer"
          >
            ↓ Download PDF
          </a>
        </div>

        <div className="pdf-frame-wrap">
          <iframe
            src="/resume.pdf"
            title="Resume PDF"
            className="pdf-iframe"
          />
          <p className="pdf-fallback">
            Can't see the PDF?{' '}
            <a href="/resume.pdf" target="_blank" rel="noopener noreferrer">
              Open in new tab →
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
