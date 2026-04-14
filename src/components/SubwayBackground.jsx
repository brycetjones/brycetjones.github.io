import './SubwayBackground.css'

/*
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  COORDINATE SYSTEM
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  viewBox="0 0 800 1100":  (0,0) = top-left, X→ right, Y↓ down.

  Path commands:
    M x,y        — move to start point
    L x,y        — straight line to (x,y)
    Q cx,cy x,y  — quadratic bezier: bends toward (cx,cy), ends at (x,y)

  For a 90° turn going DOWN then RIGHT:
    L 100,400            arrive going down
    Q 100,450  150,450   control point at corner; end point on new axis
    L 800,450            continue right

  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  TRUE PARALLEL OFFSET — how it works
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Naively shifting all coordinates by the same (dx,dy) produces
  tracks that squish at the inside of curves and spread at the outside.
  This is because a quadratic bezier Q has a radius implicitly defined
  by how far the endpoint is from the control point. Inner tracks need
  a SMALLER radius, outer tracks need a LARGER radius.

  Our curves are always axis-aligned 90° turns where the corner point
  is well-defined. For a turn at corner (kx,ky) with radius r:
    - The control point IS the corner: Q kx,ky  ex,ey
    - "radius" = distance from the straight segment to the control point
      along the incoming axis, e.g. for a down→right turn at (100,450):
        incoming vertical segment ends at (100, 450-r) = (100,400)
        control point = (100, 450)
        outgoing endpoint = (100+r, 450)
      so r=50 here.

  For a parallel track offset by d perpendicular to travel:
    - Straight segments: shift endpoint by d (same as before — correct)
    - Curve corner: shift the corner point by d PERPENDICULAR to the
      bisector of the turn (i.e. diagonally into/away from the corner)
    - Curve radius: add d to r for outer tracks, subtract d for inner

  We encode each path as a sequence of typed segments. Each Q segment
  stores the corner coordinates and the incoming/outgoing directions so
  we can compute the correct per-track control point and endpoints.
*/

const GAP = 10  // px between track centerlines — change this to adjust spacing

// ─── Segment types ──────────────────────────────────────────
// { type:'M', x, y }
// { type:'L', x, y }
// { type:'Q', kx, ky }   — 90° turn at corner (kx,ky)
//                           directions inferred from adjacent L segments

// ─── Path builder ───────────────────────────────────────────
// Given a segment list and a lateral offset `d`, returns an SVG path string.
// Positive d = offset in the "spread direction" (right for most lines, left for green).
// We determine perpendicular offset direction per-segment from the travel direction.

function buildPath(segments, d) {
  // First pass: compute travel direction entering each segment
  // so we know which way is "perpendicular left" for offsetting.
  // We store resolved (x,y) for L/M and resolved control+end for Q.

  const pts = [] // resolved path points: {cmd, x, y, cx, cy}

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]

    if (seg.type === 'M') {
      pts.push({ cmd: 'M', x: seg.x, y: seg.y })
      continue
    }

    if (seg.type === 'L') {
      pts.push({ cmd: 'L', x: seg.x, y: seg.y })
      continue
    }

    if (seg.type === 'Q') {
      // A Q turn between two L segments.
      // Previous L = incoming endpoint (before the curve)
      // Next L = outgoing endpoint (after the curve)
      // The curve's "radius" is the distance from the L endpoint
      // to the corner along the incoming axis.
      const prev = segments[i - 1]  // L before this Q
      const next = segments[i + 1]  // L after this Q

      // Incoming direction vector (normalized)
      const inDx = Math.sign(seg.kx - prev.x)
      const inDy = Math.sign(seg.ky - prev.y)
      // Outgoing direction vector (normalized)
      const outDx = Math.sign(next.x - seg.kx)
      const outDy = Math.sign(next.y - seg.ky)

      // Curve radius = distance from prev endpoint to corner along incoming axis
      const r = Math.abs(inDx !== 0 ? seg.kx - prev.x : seg.ky - prev.y)

      // Perpendicular to incoming direction (rotate 90° CCW: (dx,dy) → (-dy,dx))
      // This gives the "left" side of travel. We use this to determine offset direction.
      // For our lines, d > 0 always means "spread outward from the bundle anchor".
      const perpInX = -inDy
      const perpInY =  inDx
      const perpOutX = -outDy
      const perpOutY =  outDx

      // Offset the corner point diagonally (bisector of the turn)
      // The bisector direction = average of perp-in and perp-out, normalized
      const bisX = perpInX + perpOutX
      const bisY = perpInY + perpOutY
      const bisLen = Math.sqrt(bisX * bisX + bisY * bisY) || 1
      const bisNX = bisX / bisLen
      const bisNY = bisY / bisLen

      // The inner corner of a curve shifts by d along the bisector.
      // The radius also changes: inner = r - d, outer = r + d
      // (depending on which side d pushes toward)
      // We detect "inner" vs "outer" by checking if the offset moves
      // toward or away from the corner.
      // dot product of (d * perp_in) with (corner - prev_point) > 0 → moving toward center of curve
      const towardCornerX = seg.kx - prev.x
      const towardCornerY = seg.ky - prev.y
      const dot = (perpInX * towardCornerX + perpInY * towardCornerY)
      // If dot > 0, perpIn points toward the corner (inner side)
      // Our offset d is applied in the perpIn direction, so:
      const radiusAdjust = dot > 0 ? -d : d

      const newR = r + radiusAdjust
      const newKx = seg.kx + bisNX * d
      const newKy = seg.ky + bisNY * d

      // Recompute the L endpoints adjacent to this Q:
      // The prev L endpoint = corner - r * inDir  →  newCorner - newR * inDir
      // The next L endpoint = corner + r * outDir →  newCorner + newR * outDir
      // We'll store the Q with its new control point, and patch the adjacent L pts later.
      pts.push({
        cmd: 'Q',
        kx: newKx, ky: newKy,
        r: newR,
        inDx, inDy, outDx, outDy,
        // lateral offset of the straight parts of this segment
        perpInX, perpInY, perpOutX, perpOutY,
        d
      })
      continue
    }
  }

  // Second pass: build the actual path string.
  // For L segments adjacent to a Q, the endpoint gets overridden by the Q's adjusted radius.
  // For standalone L segments (start/end straights), offset perpendicularly.

  let pathStr = ''

  for (let i = 0; i < pts.length; i++) {
    const pt = pts[i]

    if (pt.cmd === 'M') {
      // Find the direction of the first L to know which way to offset
      const nextL = pts.find((p, j) => j > i && p.cmd === 'L')
      if (nextL) {
        const tDx = Math.sign(nextL.x - pt.x)
        const tDy = Math.sign(nextL.y - pt.y)
        const px = -tDy * d
        const py =  tDx * d
        pathStr += `M ${pt.x + px},${pt.y + py} `
      } else {
        pathStr += `M ${pt.x},${pt.y} `
      }
      continue
    }

    if (pt.cmd === 'L') {
      // Check if the next segment is a Q (this L's endpoint will be overridden)
      const next = pts[i + 1]
      const prev = pts[i - 1]

      if (next && next.cmd === 'Q') {
        // This L leads into a curve. Its endpoint = newCorner - newR * inDir
        const x = next.kx - next.r * next.inDx
        const y = next.ky - next.r * next.inDy
        pathStr += `L ${x},${y} `
      } else if (prev && prev.cmd === 'Q') {
        // This L comes out of a curve. Its startpoint is set by the Q already.
        // Endpoint: offset perpendicularly by d using outgoing direction of prev Q
        const x = pt.x + prev.perpOutX * d
        const y = pt.y + prev.perpOutY * d
        pathStr += `L ${x},${y} `
      } else {
        // Standalone straight — determine travel direction and offset perpendicularly
        const ref = prev || pts[i + 1]
        let tDx = 0, tDy = 0
        if (ref) {
          if (prev) { tDx = Math.sign(pt.x - prev.x); tDy = Math.sign(pt.y - prev.y) }
          else      { tDx = Math.sign(pts[i+1].x - pt.x); tDy = Math.sign(pts[i+1].y - pt.y) }
        }
        const px = -tDy * d
        const py =  tDx * d
        pathStr += `L ${pt.x + px},${pt.y + py} `
      }
      continue
    }

    if (pt.cmd === 'Q') {
      // Emit the curve: Q newKx,newKy  outEndX,outEndY
      // outEnd = newCorner + newR * outDir
      const ex = pt.kx + pt.r * pt.outDx
      const ey = pt.ky + pt.r * pt.outDy
      pathStr += `Q ${pt.kx},${pt.ky} ${ex},${ey} `
      continue
    }
  }

  return pathStr.trim()
}

function buildTracks(segments, count = 4) {
  const tracks = []
  // Center the bundle: offsets go from -(count-1)/2 to +(count-1)/2
  const center = (count - 1) / 2
  for (let i = 0; i < count; i++) {
    tracks.push(buildPath(segments, (i - center) * GAP))
  }
  return tracks
}

// ─── LINE DEFINITIONS ───────────────────────────────────────
// Define only the centerline. All 4 tracks generated automatically.
// Q segments use {type:'Q', kx, ky} — the corner point of the 90° turn.

const redSegments = [
  { type: 'M', x: 310, y: 0 },
  { type: 'L', x: 310, y: 185 },
  { type: 'Q', kx: 310, ky: 230 },
  { type: 'L', x: 55,  y: 230 },
  { type: 'Q', kx: 18,  ky: 230 },
  { type: 'L', x: 18,  y: 490 },
  { type: 'Q', kx: 18,  ky: 530 },
  { type: 'L', x: 210, y: 530 },
  { type: 'Q', kx: 248, ky: 530 },
  { type: 'L', x: 248, y: 1100 },
]

const blueSegments = [
  { type: 'M', x: 0,   y: 300 },
  { type: 'L', x: 165, y: 300 },
  { type: 'Q', kx: 205, ky: 300 },
  { type: 'L', x: 205, y: 510 },
  { type: 'Q', kx: 205, ky: 548 },
  { type: 'L', x: 415, y: 548 },
  { type: 'Q', kx: 452, ky: 548 },
  { type: 'L', x: 452, y: 790 },
  { type: 'Q', kx: 452, ky: 828 },
  { type: 'L', x: 155, y: 828 },
  { type: 'Q', kx: 118, ky: 828 },
  { type: 'L', x: 118, y: 1100 },
]

const orangeSegments = [
  { type: 'M', x: 500, y: 0 },
  { type: 'L', x: 500, y: 95 },
  { type: 'Q', kx: 500, ky: 133 },
  { type: 'L', x: 695, y: 133 },
  { type: 'Q', kx: 733, ky: 133 },
  { type: 'L', x: 733, y: 510 },
  { type: 'Q', kx: 733, ky: 548 },
  { type: 'L', x: 545, y: 548 },
  { type: 'Q', kx: 507, ky: 548 },
  { type: 'L', x: 507, y: 762 },
  { type: 'Q', kx: 507, ky: 800 },
  { type: 'L', x: 695, y: 800 },
  { type: 'Q', kx: 733, ky: 800 },
  { type: 'L', x: 733, y: 1100 },
]

const greenSegments = [
  { type: 'M', x: 795, y: 0 },
  { type: 'L', x: 795, y: 615 },
  { type: 'Q', kx: 795, ky: 653 },
  { type: 'L', x: 608, y: 653 },
  { type: 'Q', kx: 570, ky: 653 },
  { type: 'L', x: 570, y: 908 },
  { type: 'Q', kx: 570, ky: 946 },
  { type: 'L', x: 795, y: 946 },
  { type: 'L', x: 795, y: 1100 },
]

// ─── RENDER ─────────────────────────────────────────────────

function LineBundle({ segments, color, animClass }) {
  const tracks = buildTracks(segments)
  return (
    <g className={animClass}>
      {tracks.map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke={color}   strokeWidth="10" strokeLinecap="butt" strokeLinejoin="round" />
          <path d={d} fill="none" stroke="#ffffff" strokeWidth="3"  strokeLinecap="butt" strokeLinejoin="round" />
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
            .grp-red    { stroke-dasharray: 3000; stroke-dashoffset: 3000; animation: draw 2.2s ease forwards 0.1s; }
            .grp-blue   { stroke-dasharray: 2800; stroke-dashoffset: 2800; animation: draw 2.0s ease forwards 0.3s; }
            .grp-orange { stroke-dasharray: 3200; stroke-dashoffset: 3200; animation: draw 2.4s ease forwards 0.2s; }
            .grp-green  { stroke-dasharray: 2600; stroke-dashoffset: 2600; animation: draw 1.9s ease forwards 0.4s; }
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
