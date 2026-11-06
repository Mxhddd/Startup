// The top of every inner page (v14): a small drawing of the van on a gilt line, then the title,
// and an optional lead sentence. Editorial, no boxes.
export function PageHead({ title, lead }: { title: string; lead?: string; ur?: boolean; time?: string }) {
  return (
    <div className="ed-wrap ed-head">
      <svg className="ed-van" width="260" height="70" viewBox="0 0 260 70" aria-hidden="true">
        <path d="M0 64 H260" stroke="#B8862F" strokeWidth="1" />
        <g className="v"><g transform="translate(60 10)"><path d="M0 44 V14 Q0 4 10 4 H96 Q104 4 110 11 L128 32 Q131 36 131 40 V44 Z" fill="#1F2A5C" /><rect x="10" y="12" width="20" height="14" rx="2" fill="#F5EEE1" /><rect x="36" y="12" width="20" height="14" rx="2" fill="#F5EEE1" /><rect x="62" y="12" width="20" height="14" rx="2" fill="#F5EEE1" /><path d="M96 12 H104 L118 28 H96 Z" fill="#F5EEE1" /><rect x="0" y="32" width="131" height="3" fill="#E8A33D" /><circle cx="28" cy="46" r="8" fill="#10162F" /><circle cx="104" cy="46" r="8" fill="#10162F" /></g></g>
      </svg>
      <h1>{title}</h1>
      {lead ? <p className="lede">{lead}</p> : null}
    </div>
  );
}
