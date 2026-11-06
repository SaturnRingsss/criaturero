import { ESPECIES } from '../data'

export default function Creature({ elemento, size = 96 }) {
  const e = ESPECIES[elemento]
  if (!e) return null
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`${e.nombre}, ${e.animal} de ${e.elemento.toLowerCase()}`}>
      <g stroke={e.borde} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        <ellipse cx="34" cy="90" rx="9" ry="5" fill={e.color} />
        <ellipse cx="66" cy="90" rx="9" ry="5" fill={e.color} />
        <ellipse cx="50" cy="60" rx="40" ry="30" fill={e.color} />
        <path d={e.adorno.d} fill={e.adorno.fill} />
        <path d="M22,48 Q28,38 40,36" fill="none" stroke="#ffffff" strokeWidth="4" opacity="0.8" />
        <circle cx="29" cy="64" r="7" fill="#ffb3c1" stroke="none" opacity="0.85" />
        <circle cx="71" cy="64" r="7" fill="#ffb3c1" stroke="none" opacity="0.85" />
        <circle cx="36" cy="58" r="3.2" fill="#3b2a22" stroke="none" />
        <circle cx="64" cy="58" r="3.2" fill="#3b2a22" stroke="none" />
        <circle cx="37" cy="56.8" r="1.1" fill="#fff" stroke="none" />
        <circle cx="65" cy="56.8" r="1.1" fill="#fff" stroke="none" />
        <path d="M46,66 Q50,70 54,66" fill="none" stroke="#3b2a22" strokeWidth="1.8" />
      </g>
    </svg>
  )
}
