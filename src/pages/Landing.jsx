import { useState } from 'react'
import { Link } from 'react-router-dom'
import SubwayBackground from '../components/SubwayBackground'
import SocialsModal from '../components/SocialsModal'
import './Landing.css'

const CARDS = [
  {
    label: 'RESUME',
    sublabel: 'View as PDF',
    arrowSrc: '/Right.svg',
    arrowClass: 'arrow-img',           // points right → (↗ intent, Right.svg rotated 45° up-right)
    color: '#E3001B',
    to: '/resume',
    type: 'link',
  },
  {
    label: 'PROJECTS',
    sublabel: 'Work & Research',
    arrowSrc: '/Right.svg',
    arrowClass: 'arrow-img',           // points right →
    color: '#0065BD',
    to: '/projects',
    type: 'link',
  },
  {
    label: 'CONNECT',
    sublabel: 'Contact Me',
    arrowSrc: '/Down.svg',
    arrowClass: 'arrow-img',  // Down.svg, rotated 90° CW = pointing down
    color: '#00A651',
    type: 'modal',
  },
]

export default function Landing() {
  const [showSocials, setShowSocials] = useState(false)

  const USE_PHOTO = true
  const PHOTO_SRC = '/profile.png'

  return (
    <div className="landing">
      <SubwayBackground />

      {showSocials && <SocialsModal onClose={() => setShowSocials(false)} />}

      <div className="landing-content">
        {/* Profile */}
        <div className="profile-block">
          <div className="profile-photo-wrap">
            {USE_PHOTO ? (
              <img
                src={PHOTO_SRC}
                alt="Profile photo"
                className="profile-photo-img"
              />
            ) : (
              <div className="profile-photo-placeholder">
                <span>TN</span>
              </div>
            )}
            <div className="profile-photo-ring ring-inner"></div>
            <div className="profile-photo-ring ring-outer"></div>
          </div>

          <div className="profile-text">
            <div className="profile-line-tag">
              <span style={{background:'#E3001B'}}></span>
              <span style={{background:'#0065BD'}}></span>
              <span style={{background:'#D4861A'}}></span>
              <span style={{background:'#00A651'}}></span>
            </div>
            <h1 className="profile-name">Bryce Jones</h1>
            <p className="profile-title">Planning, Transportation, More</p>
            <p className="profile-bio">
              Georgia Tech master's student, Brown University graduate. Applying my 
              background in computer science to the world of planning. Interested 
              in the intersection of design, data, and transportation. Lover of 
              trains. 
            </p>
          </div>
        </div>

        {/* MTA-style sign cards */}
        <div className="cards-row">
          {CARDS.map((card) => {
            const inner = (
              <div className="sign-card" style={{ '--card-color': card.color }}>
                <div className="sign-card-stripe" style={{ background: card.color }}></div>
                <div className="sign-card-body">
                  <img
                    src={card.arrowSrc}
                    alt=""
                    className="arrow-img"
                    style={card.arrowStyle}
                    aria-hidden="true"
                  />
                  <div className="sign-text">
                    <span className="sign-label">{card.label}</span>
                    <span className="sign-sublabel">{card.sublabel}</span>
                  </div>
                </div>
                <div className="sign-card-bottom">
                  <span className="sign-bullet" style={{ background: card.color }}></span>
                  <span className="sign-bullet" style={{ background: '#fff' }}></span>
                </div>
              </div>
            )

            if (card.type === 'link') {
              return <Link key={card.label} to={card.to} className="card-wrapper">{inner}</Link>
            }
            return (
              <button key={card.label} className="card-wrapper" onClick={() => setShowSocials(true)}>
                {inner}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}