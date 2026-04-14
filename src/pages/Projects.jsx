import { useState, useRef, useEffect } from 'react'
import NavBar from '../components/NavBar'
import SubwayBackground from '../components/SubwayBackground'
import './Projects.css'

const PROJECTS = [
  {
    id: 1,
    name: 'Bus Network Redesign — Atlanta',
    tags: ['Transit Planning', 'GIS', 'Equity Analysis'],
    color: '#E3001B',
    thumbnail: null,
    thumbnailType: 'placeholder',
    description: `A comprehensive redesign of the Atlanta Metro bus network aimed at improving frequency, coverage, and equity across underserved corridors. Using GTFS data and ridership modeling, we identified 14 underperforming routes and proposed a restructured network that increases access to jobs within 45 minutes by 22% for low-income households.\n\nThe project involved extensive community engagement across 8 neighborhoods, GIS-based accessibility mapping, and cost-benefit analysis across three investment scenarios. Final recommendations were presented to MARTA's planning board and are currently under review for the 2026 capital budget.`,
  },
  {
    id: 2,
    name: 'Bike-Share Equity Dashboard',
    tags: ['Data Visualization', 'Python', 'Urban Mobility'],
    color: '#0065BD',
    thumbnail: null,
    thumbnailType: 'placeholder',
    description: `An interactive web dashboard built with Python and Dash that tracks equity metrics across a city bike-share system. The tool ingests real-time trip data and overlays census demographic information to surface disparities in station placement, rebalancing frequency, and membership penetration by income quintile.\n\nPresented at the 2024 Transportation Research Board Annual Meeting. The methodology has since been adopted by two mid-sized cities for their own equity assessments. Open-source code available on GitHub.`,
  },
  {
    id: 3,
    name: 'High-Speed Rail Corridor Study',
    tags: ['Rail Planning', 'Policy', 'Environmental Review'],
    color: '#D4861A',
    thumbnail: null,
    thumbnailType: 'pdf',
    thumbnailPdf: '/sample-project.pdf',
    description: `A feasibility study evaluating three alignment alternatives for a proposed high-speed rail corridor connecting two major metropolitan regions. The study encompassed ridership demand modeling, environmental impact screening, ROW cost estimation, and interoperability analysis with existing commuter rail systems.\n\nDelivered as part of a federal planning grant. The preferred alternative was selected based on a weighted multi-criteria analysis balancing capital cost, travel time savings, environmental impacts, and economic development potential.`,
  },
  {
    id: 4,
    name: 'Transit & Climate Resilience',
    tags: ['Climate Adaptation', 'Risk Analysis', 'Infrastructure'],
    color: '#00A651',
    thumbnail: null,
    thumbnailType: 'youtube',
    youtubeId: 'dQw4w9WgXcQ',
    description: `A research project examining the vulnerability of urban transit infrastructure to climate-induced disruptions including flooding, extreme heat, and wildfire smoke. Using FEMA flood maps, NOAA climate projections, and agency asset data, we scored over 1,200 transit assets by risk exposure and adaptive capacity.\n\nThis work was published as a joint report with a regional planning agency and informed the development of a $40M resilience investment program. The video above features a summary presentation delivered at the National Academy of Sciences.`,
  },
]

function TagPill({ label, color }) {
  return (
    <span className="tag-pill" style={{ borderColor: color, color: color }}>
      {label}
    </span>
  )
}

function PdfThumbnail({ src }) {
  const canvasRef = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function render() {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString()
        const pdf = await pdfjsLib.getDocument(src).promise
        const page = await pdf.getPage(1)
        const viewport = page.getViewport({ scale: 0.5 })
        const canvas = canvasRef.current
        if (!canvas || cancelled) return
        canvas.width = viewport.width
        canvas.height = viewport.height
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
        if (!cancelled) setLoaded(true)
      } catch (e) {
        console.warn('PDF thumbnail failed:', e)
      }
    }
    render()
    return () => { cancelled = true }
  }, [src])

  return (
    <div className="thumb-pdf-wrap">
      <canvas ref={canvasRef} className={`thumb-pdf-canvas ${loaded ? 'visible' : ''}`} />
      {!loaded && <div className="thumb-placeholder pdf-placeholder"><span>PDF</span></div>}
    </div>
  )
}

function Thumbnail({ project, expanded }) {
  if (project.thumbnailType === 'youtube') {
    return (
      <div className={`thumb-youtube-wrap ${expanded ? 'expanded' : ''}`}>
        <iframe
          className="thumb-youtube"
          src={`https://www.youtube.com/embed/${project.youtubeId}`}
          title={project.name}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }
  if (project.thumbnailType === 'pdf' && project.thumbnailPdf) {
    return <PdfThumbnail src={project.thumbnailPdf} />
  }
  return (
    <div className="thumb-placeholder" style={{ background: project.color + '22', borderColor: project.color }}>
      <span style={{ color: project.color }}>{project.name.charAt(0)}</span>
    </div>
  )
}

function ProjectCard({ project }) {
  const [expanded, setExpanded] = useState(false)
  const bodyRef = useRef(null)

  return (
    <div
      className={`project-card ${expanded ? 'expanded' : ''}`}
      style={{ '--card-accent': project.color }}
    >
      {/* ── PREVIEW ROW (always visible) ── */}
      <button
        className="project-preview"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <div className="preview-thumb">
          <Thumbnail project={project} expanded={false} />
        </div>

        <div className="preview-info">
          <div className="preview-top">
            <span className="preview-line-dot" style={{ background: project.color }}></span>
            <h2 className="preview-name">{project.name}</h2>
            <span className="preview-chevron">{expanded ? '▲' : '▼'}</span>
          </div>
          <div className="preview-tags">
            {project.tags.map(t => <TagPill key={t} label={t} color={project.color} />)}
          </div>
          {!expanded && (
            <p className="preview-desc-truncated">
              {project.description.split('\n')[0].slice(0, 140)}…
            </p>
          )}
        </div>
      </button>

      {/* ── EXPANDED BODY ── */}
      <div
        ref={bodyRef}
        className="project-expanded-body"
        style={{
          maxHeight: expanded ? (bodyRef.current ? bodyRef.current.scrollHeight + 'px' : '1000px') : '0px',
        }}
      >
        <div className="expanded-inner">
          <div className="expanded-media">
            <Thumbnail project={project} expanded={true} />
          </div>
          <div className="expanded-text">
            {project.description.split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Projects() {
  return (
    <div className="page-wrap">
      <SubwayBackground />
      <NavBar />
      <main className="projects-main">
        <div className="page-header">
          <div className="page-header-strip">
            <span style={{background:'#E3001B'}}></span>
            <span style={{background:'#D4861A'}}></span>
          </div>
          <h1>PROJECTS</h1>
        </div>

        <div className="projects-list">
          {PROJECTS.map(p => <ProjectCard key={p.id} project={p} />)}
        </div>
      </main>
    </div>
  )
}
