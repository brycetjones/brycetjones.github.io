import { useState } from 'react'
import { Link } from 'react-router-dom'
import SubwayBackground from '../components/SubwayBackground'
import SocialsModal from '../components/SocialsModal'
import './Landing.css'

/*
  Arrow images live in /public:
    /Right.svg  — used for RESUME (card 1) and PROJECTS (card 2)
    /Down.svg   — used for CONNECT (card 3), flipped 90° via CSS transform
*/
const CARDS = [
  {
    label: 'RESUME',
    sublabel: 'Curriculum Vitae',
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
    sublabel: 'LinkedIn · Email',
    arrowSrc: '/Down.svg',
    arrowClass: 'arrow-img arrow-flip-down',  // Down.svg, rotated 90° CW = pointing down
    color: '#00A651',
    type: 'modal',
  },
]

export default function Landing() {
  const [showSocials, setShowSocials] = useState(false)

  return (
    <div className="landing">
      <SubwayBackground />

      {showSocials && <SocialsModal onClose={() => setShowSocials(false)} />}

      <div className="landing-content">
        {/* Profile */}
        <div className="profile-block">
          <div className="profile-photo-wrap">
            <div className="profile-photo-placeholder">
              <span>TN</span>
            </div>
            <div className="profile-photo-ring ring-red"></div>
            <div className="profile-photo-ring ring-blue"></div>
          </div>

          <div className="profile-text">
            <div className="profile-line-tag">
              <span style={{background:'#E3001B'}}></span>
              <span style={{background:'#0065BD'}}></span>
              <span style={{background:'#D4861A'}}></span>
              <span style={{background:'#00A651'}}></span>
            </div>
            <h1 className="profile-name">Test Name</h1>
            <p className="profile-title">Transportation Planner</p>
            <p className="profile-bio">
              Graduate of Georgia Tech &amp; Brown University. Passionate about
              designing equitable, data-driven transit systems that connect
              communities and reduce car dependency. Specializing in multimodal
              network analysis, transit equity research, and urban mobility planning.
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
                    className={card.arrowClass}
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