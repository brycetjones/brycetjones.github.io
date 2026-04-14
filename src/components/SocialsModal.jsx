import './SocialsModal.css'

export default function SocialsModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="modal-header">
          <div className="modal-line-strip">
            <span style={{background:'#E3001B'}}></span>
            <span style={{background:'#0065BD'}}></span>
            <span style={{background:'#D4861A'}}></span>
            <span style={{background:'#00A651'}}></span>
          </div>
          <h2>CONNECT</h2>
        </div>
        <div className="modal-links">
          <a
            className="social-link linkedin"
            href="https://linkedin.com/in/brycetjones"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="social-icon">in</span>
            <span className="social-label">
              <span className="social-service">LinkedIn</span>
              <span className="social-handle">linkedin.com/in/brycetjones</span>
            </span>
            <span className="social-arrow">→</span>
          </a>
          <a
            className="social-link email"
            href="mailto:brycetjones@gmail.com"
          >
            <span className="social-icon">@</span>
            <span className="social-label">
              <span className="social-service">Email</span>
              <span className="social-handle">brycetjones@gmail.com</span>
            </span>
            <span className="social-arrow">→</span>
          </a>
        </div>
      </div>
    </div>
  )
}
