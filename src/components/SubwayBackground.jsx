import './SubwayBackground.css'

/*
  PARALLEL LINE TECHNIQUE — "casing" method:
  For each bundle of N parallel lines, we draw them as SEPARATE paths
  that are laterally offset from each other by a fixed amount.
  The key insight: offset must be applied PERPENDICULAR to the line direction,
  so horizontal segments shift in Y, vertical segments shift in X,
  and curves share the same center point with different radii.

  For a cleaner look we use 3 strokes per line:
    1. Thick colored stroke  (the line body)
    2. Slightly thinner white stroke on same path (the center divider/highlight)
  Then the second track is a parallel path offset by ~18px (adjustable).

  GAP between parallel tracks = offset value below. Reduce to tighten spacing.
*/

const GAP = 2  // px between centerlines of parallel tracks — reduce to tighten

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
            .sl { fill: none; stroke-linecap: butt; stroke-linejoin: round; }
            .r  { stroke: #E3001B; }
            .b  { stroke: #0065BD; }
            .o  { stroke: #D4861A; }
            .g  { stroke: #00A651; }
            .w  { stroke: #ffffff; }

            .grp-red    { stroke-dasharray: 3000; stroke-dashoffset: 3000; animation: draw 2.2s ease forwards 0.1s; }
            .grp-blue   { stroke-dasharray: 2800; stroke-dashoffset: 2800; animation: draw 2.0s ease forwards 0.3s; }
            .grp-orange { stroke-dasharray: 3200; stroke-dashoffset: 3200; animation: draw 2.4s ease forwards 0.2s; }
            .grp-green  { stroke-dasharray: 2600; stroke-dashoffset: 2600; animation: draw 1.9s ease forwards 0.4s; }

            @keyframes draw { to { stroke-dashoffset: 0; } }
          `}</style>
        </defs>

        {/*
          ══════════════════════════════════════════════
          RED  —  enters top ~x=300, splits:
            Track A: curves left → exits bottom ~x=220
            Track B (split): curves right → exits bottom ~x=340
          Parallel track offset: +GAP in X for vertical segments,
          +GAP in Y for horizontal segments (moves track "inward")
          ══════════════════════════════════════════════

          Track A centerline:  x=300 top → left turn at y=200 → x=50 → down → right turn at y=520 → x=220 → bottom
          Track A + GAP:       x=300+GAP → same corners offset consistently
        */}
        <g className="grp-red">
          {/* ── RED TRACK A (left branch) ── */}
          {/* Outer casing */}
          <path className="sl r" strokeWidth="13"
            d="M 300,0 L 300,180 Q 300,210 270,210 L 55,210 Q 25,210 25,240 L 25,500 Q 25,530 55,530 L 205,530 Q 235,530 235,560 L 235,1100" />
          {/* White center stripe */}
          <path className="sl w" strokeWidth="4"
            d="M 300,0 L 300,180 Q 300,210 270,210 L 55,210 Q 25,210 25,240 L 25,500 Q 25,530 55,530 L 205,530 Q 235,530 235,560 L 235,1100" />

          {/* ── RED TRACK A — parallel track (+GAP to the right/inside) ── */}
          <path className="sl r" strokeWidth="13"
            d="M 318,0 L 318,183 Q 318,228 288,228 L 55,228 Q 8,228 8,258 L 8,500 Q 8,548 55,548 L 205,548 Q 253,548 253,578 L 253,1100" />
          <path className="sl w" strokeWidth="4"
            d="M 318,0 L 318,183 Q 318,228 288,228 L 55,228 Q 8,228 8,258 L 8,500 Q 8,548 55,548 L 205,548 Q 253,548 253,578 L 253,1100" />

          {/* ── RED TRACK B (right split branch) ── */}
          <path className="sl r" strokeWidth="13"
            d="M 300,210 Q 300,250 330,250 L 490,250 Q 520,250 520,280 L 520,410 Q 520,440 490,440 L 350,440 Q 320,440 320,470 L 320,1100" />
          <path className="sl w" strokeWidth="4"
            d="M 300,210 Q 300,250 330,250 L 490,250 Q 520,250 520,280 L 520,410 Q 520,440 490,440 L 350,440 Q 320,440 320,470 L 320,1100" />

          {/* ── RED TRACK B — parallel track (+GAP) ── */}
          <path className="sl r" strokeWidth="13"
            d="M 318,228 Q 318,268 348,268 L 490,268 Q 538,268 538,298 L 538,410 Q 538,458 490,458 L 350,458 Q 302,458 302,488 L 302,1100" />
          <path className="sl w" strokeWidth="4"
            d="M 318,228 Q 318,268 348,268 L 490,268 Q 538,268 538,298 L 538,410 Q 538,458 490,458 L 350,458 Q 302,458 302,488 L 302,1100" />
        </g>

        {/*
          ══════════════════════════════════════════════
          BLUE  —  enters left ~y=290, curves down, exits bottom ~x=130
          Parallel offset: +GAP downward for horizontal, +GAP rightward for vertical
          ══════════════════════════════════════════════
        */}
        <g className="grp-blue">
          {/* ── BLUE TRACK A ── */}
          <path className="sl b" strokeWidth="13"
            d="M 0,290 L 170,290 Q 200,290 200,320 L 200,510 Q 200,540 230,540 L 410,540 Q 440,540 440,570 L 440,790 Q 440,820 410,820 L 160,820 Q 130,820 130,850 L 130,1100" />
          <path className="sl w" strokeWidth="4"
            d="M 0,290 L 170,290 Q 200,290 200,320 L 200,510 Q 200,540 230,540 L 410,540 Q 440,540 440,570 L 440,790 Q 440,820 410,820 L 160,820 Q 130,820 130,850 L 130,1100" />

          {/* ── BLUE TRACK A — parallel (+GAP down/right) ── */}
          <path className="sl b" strokeWidth="13"
            d="M 0,308 L 170,308 Q 218,308 218,338 L 218,510 Q 218,558 248,558 L 410,558 Q 458,558 458,588 L 458,790 Q 458,838 410,838 L 160,838 Q 112,838 112,868 L 112,1100" />
          <path className="sl w" strokeWidth="4"
            d="M 0,308 L 170,308 Q 218,308 218,338 L 218,510 Q 218,558 248,558 L 410,558 Q 458,558 458,588 L 458,790 Q 458,838 410,838 L 160,838 Q 112,838 112,868 L 112,1100" />
        </g>

        {/*
          ══════════════════════════════════════════════
          ORANGE  —  enters top ~x=490, curves right, long snake, exits bottom ~x=730
          Parallel offset: +GAP rightward for vertical, +GAP downward for horizontal
          ══════════════════════════════════════════════
        */}
        <g className="grp-orange">
          {/* ── ORANGE TRACK A ── */}
          <path className="sl o" strokeWidth="13"
            d="M 490,0 L 490,90 Q 490,120 520,120 L 690,120 Q 720,120 720,150 L 720,510 Q 720,540 690,540 L 550,540 Q 520,540 520,570 L 520,760 Q 520,790 550,790 L 690,790 Q 720,790 720,820 L 720,1100" />
          <path className="sl w" strokeWidth="4"
            d="M 490,0 L 490,90 Q 490,120 520,120 L 690,120 Q 720,120 720,150 L 720,510 Q 720,540 690,540 L 550,540 Q 520,540 520,570 L 520,760 Q 520,790 550,790 L 690,790 Q 720,790 720,820 L 720,1100" />

          {/* ── ORANGE TRACK A — parallel (+GAP) ── */}
          <path className="sl o" strokeWidth="13"
            d="M 508,0 L 508,90 Q 508,138 538,138 L 690,138 Q 738,138 738,168 L 738,510 Q 738,558 690,558 L 550,558 Q 502,558 502,588 L 502,760 Q 502,808 550,808 L 690,808 Q 738,808 738,838 L 738,1100" />
          <path className="sl w" strokeWidth="4"
            d="M 508,0 L 508,90 Q 508,138 538,138 L 690,138 Q 738,138 738,168 L 738,510 Q 738,558 690,558 L 550,558 Q 502,558 502,588 L 502,760 Q 502,808 550,808 L 690,808 Q 738,808 738,838 L 738,1100" />
        </g>

        {/*
          ══════════════════════════════════════════════
          GREEN  —  enters top-right ~x=790, down the right edge,
          branches left, loops back right, exits bottom right
          Parallel offset: -GAP leftward (moving inward from right edge)
          ══════════════════════════════════════════════
        */}
        <g className="grp-green">
          {/* ── GREEN TRACK A ── */}
          <path className="sl g" strokeWidth="13"
            d="M 793,0 L 793,610 Q 793,640 763,640 L 610,640 Q 580,640 580,670 L 580,910 Q 580,940 610,940 L 793,940 L 793,1100" />
          <path className="sl w" strokeWidth="4"
            d="M 793,0 L 793,610 Q 793,640 763,640 L 610,640 Q 580,640 580,670 L 580,910 Q 580,940 610,940 L 793,940 L 793,1100" />

          {/* ── GREEN TRACK A — parallel (-GAP leftward) ── */}
          <path className="sl g" strokeWidth="13"
            d="M 775,0 L 775,610 Q 775,622 763,622 L 610,622 Q 562,622 562,658 L 562,910 Q 562,958 610,958 L 775,958 L 775,1100" />
          <path className="sl w" strokeWidth="4"
            d="M 775,0 L 775,610 Q 775,622 763,622 L 610,622 Q 562,622 562,658 L 562,910 Q 562,958 610,958 L 775,958 L 775,1100" />
        </g>
      </svg>
    </div>
  )
}