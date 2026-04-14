import './SubwayBackground.css'

/*
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  COORDINATE SYSTEM
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  viewBox="0 0 800 1100": (0,0)=top-left, X→right, Y↓down.
  M x,y  = move to start
  L x,y  = straight line to (x,y)
  Q cx,cy x,y = quadratic bezier, bends toward (cx,cy), ends at (x,y)

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  HOW PARALLEL OFFSET WORKS (and why previous version broke)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  All our curves are axis-aligned 90° turns. A turn is described
  by a corner point (kx,ky) and a radius r. The SVG for it is:
    L  (kx - r*inDx),  (ky - r*inDy)       ← stop r before the corner
    Q  kx, ky                               ← control point = exact corner
       (kx + r*outDx), (ky + r*outDy)       ← end point = r past the corner

  For a PARALLEL track offset by d perpendicular to travel:
  - On straight segments: shift the endpoint laterally by d (perpendicular to travel)
  - On a curve:
      * The corner point shifts DIAGONALLY outward by d*sqrt(2) along the
        bisector direction (45° between incoming and outgoing perpendiculars)
      * The radius changes: outer track r+d, inner track r-d
      * This keeps the track exactly d apart at every point

  The bisector diagonal shift must be exactly d*sqrt(2) — NOT d*1 — because
  the corner moves diagonally. If you only shift by d, the track spacing is
  wrong by a factor of sqrt(2) at corners (this was the previous bug causing
  lines to split: the corner was under-shifted so inner tracks all converged
  to the same corner point).

  The perpendicular direction is always 90° CCW from travel direction:
    traveling right (+x,0) → perp = (0,-1) = upward
    traveling down  (0,+y) → perp = (+1,0) = rightward
    traveling left  (-x,0) → perp = (0,+1) = downward
    traveling up    (0,-y) → perp = (-1,0) = leftward

  We store only the centerline (d=0). Positive d offsets to the left of travel,
  negative d offsets to the right. We generate N tracks symmetrically.
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

const N_TRACKS  = 4     // number of parallel tracks per color
const GAP       = 14    // px between track centerlines
const THICKNESS = 10    // px stroke width of each colored line
const STRIPE    = 3     // px width of white center stripe

// Rotate a unit vector 90° counter-clockwise: (dx,dy) → (-dy,dx)
function perp(dx, dy) { return { x: -dy, y: dx } }

/*
  buildPath(segments, d)
  ──────────────────────
  segments: array of { type:'M'|'L'|'Q', x, y, kx, ky }
    M: start point  { type:'M', x, y }
    L: line to      { type:'L', x, y }  (these are the RAW centerline endpoints)
    Q: 90° turn at corner (kx,ky)  { type:'Q', kx, ky }
       The L before Q is the segment that LEADS INTO the curve.
       The L after Q is the segment that LEAVES the curve.
       The radius r is derived from the distance from the pre-curve L to the corner.

  d: lateral offset from centerline (positive = left of travel, negative = right)

  Returns an SVG path string for one track.
*/
function buildPath(segments, d) {
  // Pre-compute travel direction for every segment.
  // We need to know direction at each L endpoint to compute perp offset.
  // Direction at a point = direction of the segment leaving that point.
  // For the final point, use the direction of the arriving segment.

  // Build a list of "resolved nodes" with position and travel context
  const nodes = []

  for (let i = 0; i < segments.length; i++) {
    const s = segments[i]
    if (s.type === 'M' || s.type === 'L') {
      // Find travel direction leaving this point
      // = direction to next non-Q segment (or direction of next Q's corner)
      let travDx = 0, travDy = 0
      for (let j = i + 1; j < segments.length; j++) {
        const nxt = segments[j]
        if (nxt.type === 'Q') {
          travDx = Math.sign(nxt.kx - s.x)
          travDy = Math.sign(nxt.ky - s.y)
          break
        }
        if (nxt.type === 'L' || nxt.type === 'M') {
          travDx = Math.sign(nxt.x - s.x)
          travDy = Math.sign(nxt.y - s.y)
          break
        }
      }
      // If no next segment, use direction from previous
      if (travDx === 0 && travDy === 0 && i > 0) {
        const prev = nodes[nodes.length - 1]
        if (prev) { travDx = prev.travDx; travDy = prev.travDy }
      }
      const p = perp(travDx, travDy)
      nodes.push({ type: s.type, x: s.x, y: s.y, travDx, travDy, perpX: p.x, perpY: p.y })
    } else if (s.type === 'Q') {
      const prevSeg = segments[i - 1]  // L before Q
      const nextSeg = segments[i + 1]  // L after Q

      const inDx = Math.sign(s.kx - prevSeg.x)
      const inDy = Math.sign(s.ky - prevSeg.y)
      const outDx = Math.sign(nextSeg.x - s.kx)
      const outDy = Math.sign(nextSeg.y - s.ky)

      // Radius = distance from pre-curve point to corner along incoming axis
      const r = Math.abs(inDx !== 0 ? s.kx - prevSeg.x : s.ky - prevSeg.y)

      // Perpendicular to incoming and outgoing directions
      const pIn  = perp(inDx, inDy)   // left of incoming travel
      const pOut = perp(outDx, outDy) // left of outgoing travel

      // Bisector: average of the two perpendiculars, then normalize
      // For a 90° turn the bisector is always at 45°, magnitude = sqrt(2)/2 each component
      // so pIn + pOut has magnitude sqrt(2), and normalized = (pIn+pOut)/sqrt(2)
      // Corner offset = d * sqrt(2) * normalized = d * (pIn + pOut) / sqrt(2) * sqrt(2) = d*(pIn+pOut)
      // Wait — let's be precise:
      //   pIn and pOut are unit vectors at 90° to each other (for a 90° turn)
      //   |pIn + pOut| = sqrt(2)
      //   bisector unit = (pIn + pOut) / sqrt(2)
      //   corner shift = d / sin(45°) = d * sqrt(2)  [because the offset d is measured perpendicular
      //                                                to travel, but the corner moves diagonally]
      //   So corner shift vector = d*sqrt(2) * bisector_unit = d*sqrt(2) * (pIn+pOut)/sqrt(2) = d*(pIn+pOut)
      const cornerShiftX = d * (pIn.x + pOut.x)
      const cornerShiftY = d * (pIn.y + pOut.y)

      // Determine if offset d is toward the inside or outside of this curve.
      // Inside of curve = direction the curve bends toward.
      // The curve bends toward the corner from the perspective of the centerline,
      // i.e., the corner is at (prevSeg + inDir * r), so "inward" = inDir direction.
      // If pIn points in same direction as inDir, d moves inward → radius shrinks.
      const inwardDot = pIn.x * inDx + pIn.y * inDy
      // inwardDot > 0: pIn is toward inside → r decreases as d increases
      // inwardDot < 0: pIn is toward outside → r increases as d increases
      const newR = r - inwardDot * d

      nodes.push({
        type: 'Q',
        kx: s.kx + cornerShiftX,
        ky: s.ky + cornerShiftY,
        r: newR,
        inDx, inDy, outDx, outDy,
        pIn, pOut,
      })
    }
  }

  // Now build the path string
  let path = ''

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i]

    if (n.type === 'M') {
      // Check if first move is into a Q
      const nextNode = nodes[i + 1]
      if (nextNode && nextNode.type === 'Q') {
        // Start point = Q.corner - Q.r * inDir (offset already in Q)
        const q = nextNode
        path += `M ${q.kx - q.r * q.inDx},${q.ky - q.r * q.inDy} `
      } else {
        path += `M ${n.x + n.perpX * d},${n.y + n.perpY * d} `
      }
    }

    else if (n.type === 'L') {
      const prevNode = nodes[i - 1]
      const nextNode = nodes[i + 1]

      if (nextNode && nextNode.type === 'Q') {
        // This L leads into a curve — its endpoint is the curve's start
        const q = nextNode
        const ex = q.kx - q.r * q.inDx
        const ey = q.ky - q.r * q.inDy
        path += `L ${ex},${ey} `
      } else if (prevNode && prevNode.type === 'Q') {
        // This L comes out of a curve — its start is the curve's end (emitted by Q)
        // Its own endpoint uses the outgoing perpendicular from the Q
        path += `L ${n.x + prevNode.pOut.x * d},${n.y + prevNode.pOut.y * d} `
      } else {
        // Plain straight segment
        path += `L ${n.x + n.perpX * d},${n.y + n.perpY * d} `
      }
    }

    else if (n.type === 'Q') {
      // Emit: Q corner  outEnd
      const ex = n.kx + n.r * n.outDx
      const ey = n.ky + n.r * n.outDy
      path += `Q ${n.kx},${n.ky} ${ex},${ey} `
    }
  }

  return path.trim()
}

function buildTracks(segments) {
  const tracks = []
  const half = (N_TRACKS - 1) / 2
  for (let i = 0; i < N_TRACKS; i++) {
    const d = (i - half) * GAP
    tracks.push(buildPath(segments, d))
  }
  return tracks
}

// ─── LINE DEFINITIONS ───────────────────────────────────────
// Only define the centerline. Parallel tracks are generated automatically.
// Q segments: { type:'Q', kx, ky } — the exact corner point of the turn.
// The radius is computed from the distance between the preceding L and the corner.
// Make the corner radius larger (move Q further from preceding L) for wider turns.

const redSegments = [
  { type: 'M', x: 310, y: 0 },
  { type: 'L', x: 310, y: 185 },
  { type: 'Q', kx: 310, ky: 235 },
  { type: 'L', x: 55,  y: 235 },
  { type: 'Q', kx: 15,  ky: 235 },
  { type: 'L', x: 15,  y: 490 },
  { type: 'Q', kx: 15,  ky: 535 },
  { type: 'L', x: 210, y: 535 },
  { type: 'Q', kx: 255, ky: 535 },
  { type: 'L', x: 255, y: 1100 },
]

const blueSegments = [
  { type: 'M', x: 0,   y: 305 },
  { type: 'L', x: 160, y: 305 },
  { type: 'Q', kx: 205, ky: 305 },
  { type: 'L', x: 205, y: 510 },
  { type: 'Q', kx: 205, ky: 553 },
  { type: 'L', x: 415, y: 553 },
  { type: 'Q', kx: 458, ky: 553 },
  { type: 'L', x: 458, y: 790 },
  { type: 'Q', kx: 458, ky: 833 },
  { type: 'L', x: 150, y: 833 },
  { type: 'Q', kx: 108, ky: 833 },
  { type: 'L', x: 108, y: 1100 },
]

const orangeSegments = [
  { type: 'M', x: 505, y: 0 },
  { type: 'L', x: 505, y: 92 },
  { type: 'Q', kx: 505, ky: 138 },
  { type: 'L', x: 692, y: 138 },
  { type: 'Q', kx: 738, ky: 138 },
  { type: 'L', x: 738, y: 508 },
  { type: 'Q', kx: 738, ky: 553 },
  { type: 'L', x: 548, y: 553 },
  { type: 'Q', kx: 503, ky: 553 },
  { type: 'L', x: 503, y: 760 },
  { type: 'Q', kx: 503, ky: 805 },
  { type: 'L', x: 692, y: 805 },
  { type: 'Q', kx: 738, ky: 805 },
  { type: 'L', x: 738, y: 1100 },
]

const greenSegments = [
  { type: 'M', x: 792, y: 0 },
  { type: 'L', x: 792, y: 612 },
  { type: 'Q', kx: 792, ky: 657 },
  { type: 'L', x: 610, y: 657 },
  { type: 'Q', kx: 565, ky: 657 },
  { type: 'L', x: 565, y: 905 },
  { type: 'Q', kx: 565, ky: 950 },
  { type: 'L', x: 792, y: 950 },
  { type: 'L', x: 792, y: 1100 },
]

// ─── RENDER ─────────────────────────────────────────────────

function LineBundle({ segments, color, animClass }) {
  const tracks = buildTracks(segments)
  return (
    <g className={animClass}>
      {tracks.map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke={color}     strokeWidth={THICKNESS} strokeLinecap="butt" strokeLinejoin="round" />
          <path d={d} fill="none" stroke="#ffffff"   strokeWidth={STRIPE}    strokeLinecap="butt" strokeLinejoin="round" />
        </g>
      ))}
    </g>
  )
}

export default function SubwayBackground() {
  return (
    <div className="subway-bg" aria-hidden="true">
      <svg
        className="subway-svg"
        viewBox="0 0 800 1100"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>{`
            .grp-red    { stroke-dasharray: 3500; stroke-dashoffset: 3500; animation: draw 2.2s ease forwards 0.1s; }
            .grp-blue   { stroke-dasharray: 3500; stroke-dashoffset: 3500; animation: draw 2.0s ease forwards 0.3s; }
            .grp-orange { stroke-dasharray: 3500; stroke-dashoffset: 3500; animation: draw 2.4s ease forwards 0.2s; }
            .grp-green  { stroke-dasharray: 3500; stroke-dashoffset: 3500; animation: draw 1.9s ease forwards 0.4s; }
            @keyframes draw { to { stroke-dashoffset: 0; } }
          `}</style>
        </defs>

        <LineBundle segments={redSegments}    color="#E3001B" animClass="grp-red"    />
        <LineBundle segments={blueSegments}   color="#0065BD" animClass="grp-blue"   />
        <LineBundle segments={orangeSegments} color="#D4861A" animClass="grp-orange" />
        <LineBundle segments={greenSegments}  color="#00A651" animClass="grp-green"  />
      </svg>
    </div>
  )
}
