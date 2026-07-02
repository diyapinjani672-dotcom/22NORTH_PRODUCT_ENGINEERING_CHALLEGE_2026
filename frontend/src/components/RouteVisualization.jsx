/**
 * Signature visual element: a flight-path arc between origin and destination.
 * - Solid, glowing teal line = on schedule / recovered
 * - Dashed amber line = delayed
 * - Broken line with a gap = cancelled / disrupted
 * This motif repeats across the Dashboard and Recovery pages so the passenger
 * always sees their journey, not just a status word.
 */
export default function RouteVisualization({ originCode, destCode, status, size = 'md' }) {
  const isCancelled = status === 'CANCELLED' || status === 'DIVERTED'
  const isDelayed = status === 'DELAYED'
  const lineColor = isCancelled ? '#FB7185' : isDelayed ? '#E8A94C' : '#2DD4BF'
  const height = size === 'lg' ? 120 : 80
  const width = size === 'lg' ? 560 : 400

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full text-ink"
        style={{ maxWidth: width }}
        role="img"
        aria-label={`Route from ${originCode} to ${destCode}, status ${status}`}
      >
        {/* origin node */}
        <circle cx="24" cy={height / 2} r="6" fill={lineColor} />
        <circle cx="24" cy={height / 2} r="10" fill="none" stroke={lineColor} strokeOpacity="0.35" strokeWidth="2" />

        {/* path */}
        {isCancelled ? (
          <>
            <line x1="34" y1={height / 2} x2={width * 0.42} y2={height / 2 - 18}
                  stroke={lineColor} strokeWidth="2" strokeDasharray="6 6" strokeLinecap="round" />
            <line x1={width * 0.58} y1={height / 2 - 18} x2={width - 34} y2={height / 2}
                  stroke={lineColor} strokeWidth="2" strokeDasharray="6 6" strokeLinecap="round" opacity="0.5" />
            {/* break icon */}
            <g transform={`translate(${width / 2}, ${height / 2 - 22})`}>
              <path d="M-8,-8 L8,8 M8,-8 L-8,8" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" />
            </g>
          </>
        ) : (
          <path
            d={`M 34 ${height / 2} Q ${width / 2} ${height / 2 - 34} ${width - 34} ${height / 2}`}
            fill="none"
            stroke={lineColor}
            strokeWidth="2"
            strokeDasharray={isDelayed ? '2 8' : '0'}
            strokeLinecap="round"
            className={isDelayed ? 'animate-dash' : ''}
            style={{ filter: `drop-shadow(0 0 6px ${lineColor}80)` }}
          />
        )}

        {/* plane icon along the path (only when moving normally) */}
        {!isCancelled && (
          <g transform={`translate(${width / 2}, ${height / 2 - 17}) rotate(45)`}>
            <path
              d="M0,-7 L2,-2 L7,0 L2,1 L1,6 L-1,6 L-2,1 L-7,0 L-2,-2 Z"
              fill={lineColor}
            />
          </g>
        )}

        {/* destination node */}
        <circle cx={width - 24} cy={height / 2} r="6" fill={lineColor} />
        <circle cx={width - 24} cy={height / 2} r="10" fill="none" stroke={lineColor} strokeOpacity="0.35" strokeWidth="2" />

        {/* labels */}
        <text x="24" y={height / 2 + 28} textAnchor="middle" fill="currentColor" fontSize="15" fontFamily="IBM Plex Mono, monospace" fontWeight="600">
          {originCode}
        </text>
        <text x={width - 24} y={height / 2 + 28} textAnchor="middle" fill="currentColor" fontSize="15" fontFamily="IBM Plex Mono, monospace" fontWeight="600">
          {destCode}
        </text>
      </svg>
    </div>
  )
}
