'use client';
// The drivers band's keys: press them and the progress rail moves on, the way the driver's day goes.
import { useState } from 'react';

export function DriverKeys({ k1, k2, k3, rail }: { k1: string; k2: string; k3: string; rail: string }) {
  const [n, setN] = useState(4);
  const next = () => setN((v) => (v >= 9 ? 4 : v + 1));
  return (
    <div>
      <div className="rail" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} className={i < n - 1 ? 'done' : i === n - 1 ? 'now' : ''} />)}</div>
      <p style={{ margin: '0 0 14px', fontWeight: 800, color: 'var(--ghee)' }} aria-live="polite">{rail.replace('{n}', String(n))}</p>
      <div className="keys">
        <button type="button" className="key key-green big" onClick={next}>{k1}</button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <button type="button" className="key key-ghost" onClick={next}>{k2}</button>
          <button type="button" className="key key-kesar" onClick={next}>{k3}</button>
        </div>
      </div>
    </div>
  );
}
