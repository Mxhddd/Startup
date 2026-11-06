// The whiteboard roadmap (landing section 6): a hand-drawn path that draws itself when it comes into
// view, three stops on it, and a scribbled "we're here".
import { Reveal } from './Reveal';

export function Roadmap({ kicker, title, here, years, hand }: { kicker: string; title: string; here: string; years: { y: string; t: string }[]; hand: boolean }) {
  const tints = ['var(--zamurrad-tint)', 'var(--kesar-tint)', 'var(--neel-tint)'];
  return (
    <Reveal className="board reveal" seenClass="in seen">
      <span className="kicker">{kicker}</span>
      <h2 className="h2" style={{ margin: '8px 0 0' }}>{title}</h2>
      <svg className="board-path" viewBox="0 0 1000 150" aria-hidden="true">
        <path className="draw" d="M20 110 C 140 30, 260 140, 380 80 S 600 20, 720 90 S 900 120, 980 50" fill="none" stroke="#1F2A5C" strokeWidth="5" strokeLinecap="round" strokeDasharray="1600" />
        <path className="draw" d="M20 118 C 140 38, 262 148, 382 88 S 602 28, 722 98" fill="none" stroke="#E8A33D" strokeWidth="2" strokeLinecap="round" opacity=".7" />
        {[[60, 98], [500, 50], [930, 70]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === 0 ? 14 : 10} fill={i === 0 ? '#17705A' : '#fff'} stroke="#1F2A5C" strokeWidth="4" />)}
        <path d="M90 30 q 18 20 -2 52 m 2 -52 l -12 6 m 12 -6 l 6 12" fill="none" stroke="#A8321F" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className={`here${hand ? ' hand' : ''}`} style={{ insetInlineStart: 'clamp(60px, 14%, 160px)', top: 'clamp(110px, 18vw, 150px)' }}>{here}</span>
      <div className="mile">
        {years.map((y, i) => (
          <div key={y.y} style={{ background: tints[i] }}>
            <b>{y.y}</b>
            <span style={{ fontSize: 17, fontWeight: 700 }}>{y.t}</span>
          </div>
        ))}
      </div>
    </Reveal>
  );
}
