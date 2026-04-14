import './SubwayBackground.css'

/*
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  COORDINATE SYSTEM
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  viewBox="0 0 800 1100": (0,0)=top-left, X→right, Y↓down.
  M x,y        — move to start
  L x,y        — straight line
  Q cx,cy x,y  — quadratic bezier: bends toward (cx,cy), ends at (x,y)

  All curves are axis-aligned 90° turns. A turn is defined by a corner
  point (kx,ky). The radius r is the distance from the preceding L
  endpoint to the corner along the incoming axis.

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PARALLEL OFFSET — exact formula
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  For a track offset by d (positive = left of travel direction):

  STRAIGHTS: shift endpoint by d in the perpendicular-left direction.
    perpLeft of (dx,dy) = (-dy, dx)

  CURVES: the offset QBezier must remain tangent-continuous with
  adjacent straights. For a 90° turn the ONLY control point that
  satisfies both tangent constraints is:

    C' = (corner.x + d*perpIn.x + d*perpOut.x,
          corner.y + d*perpIn.y + d*perpOut.y)

  where perpIn = perpLeft of incoming direction
        perpOut = perpLeft of outgoing direction

  This is (perpIn + perpOut)*d added to the corner — NOT normalized.
  The new radius is simply:  r' = r + d * sign
  where sign = +1 if d is toward the outside of the curve, -1 if inside.

  We determine inside/outside by checking whether perpIn points toward
  or away from the corner: if dot(perpIn, corner - prevPoint) > 0,
  perpIn points toward the corner = d moves INWARD → r' = r - d.

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/

const N_TRACKS  = 2   // number of parallel tracks per color
const GAP       = 16  // px between track centerlines
const THICKNESS = 15  // px stroke width of each colored line
const STRIPE    = 1   // px width of white center stripe

// perpendicular-left of travel direction (rotate CCW 90°)
function perpLeft(dx, dy) { return { x: -dy, y: dx } }

function buildPath(segments, d) {
  // Resolve all Q nodes first (they need to look at adjacent L nodes)
  const resolved = []

  for (let i = 0; i < segments.length; i++) {
    const s = segments[i]

    if (s.type === 'M' || s.type === 'L') {
      resolved.push({ ...s })
      continue
    }

    if (s.type === 'Q') {
      const prev = segments[i - 1]  // L before Q
      const next = segments[i + 1]  // L after Q

      // Incoming and outgoing unit directions
      const inDx  = Math.sign(s.kx - prev.x)
      const inDy  = Math.sign(s.ky - prev.y)
      const outDx = Math.sign(next.x - s.kx)
      const outDy = Math.sign(next.y - s.ky)

      // Perpendicular-left of each direction
      const pIn  = perpLeft(inDx, inDy)
      const pOut = perpLeft(outDx, outDy)

      // Corner of offset curve:
      // C' = corner + d*(perpIn + perpOut)  — NOT normalized
      const ckx = s.kx + d * (pIn.x + pOut.x)
      const cky = s.ky + d * (pIn.y + pOut.y)

      // Radius of centerline curve
      const r = Math.abs(inDx !== 0 ? s.kx - prev.x : s.ky - prev.y)

      // Determine if d moves toward inside or outside of this curve.
      // The inside of the curve is in the inDx/inDy direction from the corner
      // (the corner is in front of the incoming travel, so the curve interior
      //  is toward the incoming direction from the corner? No — let's think:
      //  for down→right, corner=(kx,ky), incoming comes from above (ky-r).
      //  The center of curvature is AT the corner. The inside of the arc is
      //  toward the corner. perpIn for downward travel = (-1,0) = leftward.
      //  dot(perpIn, corner - prevPoint) = dot((-1,0), (0, r)) = 0.
      //  That doesn't work for this case. Use outgoing instead:
      //  dot(perpIn, outDir) > 0 means perpIn and outDir agree → inside.
      const dotInOut = pIn.x * outDx + pIn.y * outDy
      // If dotInOut > 0: perpIn points in outgoing direction = toward inside of curve
      //   → d moves inward → r' = r - d
      // If dotInOut < 0: perpIn points away from inside → r' = r + d
      const newR = r + (dotInOut > 0 ? -d : d)

      resolved.push({ type: 'Q', ckx, cky, newR, inDx, inDy, outDx, outDy, pIn, pOut })
      continue
    }
  }

  // Build path string
  let path = ''

  for (let i = 0; i < resolved.length; i++) {
    const n = resolved[i]

    if (n.type === 'M') {
      // Offset perpendicular to the direction of the first movement
      let tDx = 0, tDy = 0
      for (let j = i + 1; j < resolved.length; j++) {
        if (resolved[j].type === 'Q') {
          tDx = resolved[j].inDx; tDy = resolved[j].inDy; break
        }
        if (resolved[j].type === 'L') {
          tDx = Math.sign(resolved[j].x - n.x)
          tDy = Math.sign(resolved[j].y - n.y)
          break
        }
      }
      const p = perpLeft(tDx, tDy)
      path += `M ${n.x + p.x * d},${n.y + p.y * d} `
    }

    else if (n.type === 'L') {
      const prev = resolved[i - 1]
      const next = resolved[i + 1]

      if (next && next.type === 'Q') {
        // Endpoint overridden by curve start: corner - newR * inDir
        const ex = next.ckx - next.newR * next.inDx
        const ey = next.cky - next.newR * next.inDy
        path += `L ${ex},${ey} `
      } else if (prev && prev.type === 'Q') {
        // Start already set by previous Q's end point.
        // Endpoint: offset by d using outgoing perpendicular of that Q
        path += `L ${n.x + prev.pOut.x * d},${n.y + prev.pOut.y * d} `
      } else {
        // Plain straight: determine travel direction and offset
        let tDx, tDy
        if (prev) { tDx = Math.sign(n.x - prev.x); tDy = Math.sign(n.y - prev.y) }
        else      { tDx = Math.sign(resolved[i+1].x - n.x); tDy = Math.sign(resolved[i+1].y - n.y) }
        const p = perpLeft(tDx, tDy)
        path += `L ${n.x + p.x * d},${n.y + p.y * d} `
      }
    }

    else if (n.type === 'Q') {
      // Emit: Q corner'  end'
      // end' = corner' + newR * outDir
      const ex = n.ckx + n.newR * n.outDx
      const ey = n.cky + n.newR * n.outDy
      path += `Q ${n.ckx},${n.cky} ${ex},${ey} `
    }
  }

  return path.trim()
}

function buildTracks(segments) {
  const tracks = []
  const half = (N_TRACKS - 1) / 2
  for (let i = 0; i < N_TRACKS; i++) {
    tracks.push(buildPath(segments, (i - half) * GAP))
  }
  return tracks
}

// ─── LINE DEFINITIONS ───────────────────────────────────────
// Only define the centerline. All tracks generated automatically.
// { type:'Q', kx, ky } = corner of a 90° turn.
// Radius = distance from preceding L point to corner along incoming axis.

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
          <path d={d} fill="none" stroke={color}   strokeWidth={THICKNESS} strokeLinecap="butt" strokeLinejoin="round" />
          <path d={d} fill="none" stroke="#f1e9d4" strokeWidth={STRIPE}    strokeLinecap="butt" strokeLinejoin="round" />
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