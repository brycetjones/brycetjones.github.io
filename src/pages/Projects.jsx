import { useState, useRef, useEffect } from 'react'
import NavBar from '../components/NavBar'
import SubwayBackground from '../components/SubwayBackground'
import PROJECTS from '../data/projects.json'
import './Projects.css'

// ─── TAG PILL ───────────────────────────────────────────────
function TagPill({ label, color }) {
  return (
    <span className="tag-pill" style={{ borderColor: color, color }}>
      {label}
    </span>
  )
}

// ─── PDF RENDERER ───────────────────────────────────────────
function PdfMedia({ src }) {
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
        const viewport = page.getViewport({ scale: 1.2 })
        const canvas = canvasRef.current
        if (!canvas || cancelled) return
        canvas.width = viewport.width
        canvas.height = viewport.height
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise
        if (!cancelled) setLoaded(true)
      } catch (e) {
        console.warn('PDF render failed:', e)
      }
    }
    render()
    return () => { cancelled = true }
  }, [src])

  return (
    <div className="media-pdf-wrap">
      <canvas ref={canvasRef} className={`media-pdf-canvas ${loaded ? 'visible' : ''}`} />
      {!loaded && <div className="media-placeholder"><span>PDF</span></div>}
    </div>
  )
}

// ─── SINGLE MEDIA ITEM ──────────────────────────────────────
function MediaItem({ item, color, name }) {
  if (item.type === 'youtube') {
    return (
      <div className="media-youtube-wrap">
        <iframe
          className="media-youtube"
          src={`https://www.youtube.com/embed/${item.youtubeId}`}
          title={name}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }
  if (item.type === 'image') {
    return (
      <div className="media-image-wrap">
        <img src={item.src} alt={item.caption || name} className="media-image" />
      </div>
    )
  }
  if (item.type === 'pdf') {
    return <PdfMedia src={item.src} />
  }
  // placeholder
  return (
    <div className="media-placeholder" style={{ background: color + '18', borderColor: color }}>
      <span style={{ color }}>{name.charAt(0)}</span>
    </div>
  )
}

// ─── THUMBNAIL (preview size, first media item only) ────────
function Thumbnail({ project }) {
  const first = project.media?.[0]
  if (!first) return (
    <div className="thumb-placeholder" style={{ background: project.color + '22', borderColor: project.color }}>
      <span style={{ color: project.color }}>{project.name.charAt(0)}</span>
    </div>
  )

  if (first.type === 'youtube') {
    return (
      <div className="thumb-youtube-wrap">
        <img
          src={`https://img.youtube.com/vi/${first.youtubeId}/mqdefault.jpg`}
          alt="Video thumbnail"
          className="thumb-img"
        />
        <div className="thumb-play-badge">▶</div>
      </div>
    )
  }
  if (first.type === 'image') {
    return <img src={first.src} alt={first.caption || project.name} className="thumb-img" />
  }
  if (first.type === 'pdf') {
    return (
      <div className="thumb-placeholder pdf-placeholder">
        <span>PDF</span>
      </div>
    )
  }
  return (
    <div className="thumb-placeholder" style={{ background: project.color + '22', borderColor: project.color }}>
      <span style={{ color: project.color }}>{project.name.charAt(0)}</span>
    </div>
  )
}

// ─── CAROUSEL ───────────────────────────────────────────────
function Carousel({ project }) {
  const media = project.media || []
  const [idx, setIdx] = useState(0)

  if (media.length === 0) return null

  const prev = () => setIdx(i => (i - 1 + media.length) % media.length)
  const next = () => setIdx(i => (i + 1) % media.length)
  const current = media[idx]

  return (
    <div className="carousel">
      <div className="carousel-media">
        <MediaItem item={current} color={project.color} name={project.name} />
      </div>

      {/* Caption */}
      {current.caption && (
        <p className="carousel-caption">{current.caption}</p>
      )}

      {/* Controls — only show if more than one item */}
      {media.length > 1 && (
        <div className="carousel-controls">
          <button
            className="carousel-btn carousel-btn-prev"
            onClick={prev}
            aria-label="Previous"
            style={{ '--btn-color': project.color }}
          >
            <img src="/Right.svg" alt="Previous" className="carousel-arrow-img carousel-arrow-flip" />
          </button>

          <div className="carousel-dots">
            {media.map((_, i) => (
              <button
                key={i}
                className={`carousel-dot ${i === idx ? 'active' : ''}`}
                style={{ '--dot-color': project.color }}
                onClick={() => setIdx(i)}
                aria-label={`Go to item ${i + 1}`}
              />
            ))}
          </div>

          <button
            className="carousel-btn carousel-btn-next"
            onClick={next}
            aria-label="Next"
            style={{ '--btn-color': project.color }}
          >
            <img src="/Right.svg" alt="Next" className="carousel-arrow-img" />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── PROJECT CARD ───────────────────────────────────────────
function ProjectCard({ project }) {
  const [expanded, setExpanded] = useState(false)
  const bodyRef = useRef(null)

  return (
    <div
      className={`project-card ${expanded ? 'expanded' : ''}`}
      style={{ '--card-accent': project.color }}
    >
      {/* Preview row */}
      <button
        className="project-preview"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <div className="preview-thumb">
          <Thumbnail project={project} />
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

      {/* Expanded body */}
      <div
        ref={bodyRef}
        className="project-expanded-body"
        style={{
          maxHeight: expanded
            ? (bodyRef.current ? bodyRef.current.scrollHeight + 'px' : '1200px')
            : '0px',
        }}
      >
        <div className="expanded-inner">
          <Carousel project={project} />
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

// ─── PAGE ───────────────────────────────────────────────────
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
