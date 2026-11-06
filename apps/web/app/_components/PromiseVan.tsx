'use client';
// The van of promises (landing section 4): the brochure's school van with its stickers. Every
// Karachi van has stickers; ours are promises. Tap (or press Enter on) a sticker and it flips over to
// say what the promise means.
import { useState } from 'react';

export type Promise = { front: string; back: string };

export function PromiseVan({ promises, plate, name, tap }: { promises: Promise[]; plate: string; name: string; tap: string }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="van">
      <div className="van-body">
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '.04em', color: 'var(--kesar-hi)' }}>{name}</span>
          <span className="hand" style={{ fontSize: 18, color: 'var(--muted-dark)' }}>{tap}</span>
        </div>
        <div className="stickers">
          {promises.map((p, i) => (
            <button key={i} type="button" className="sticker" aria-pressed={open === i} onClick={() => setOpen(open === i ? null : i)} data-testid={`sticker-${i}`}>
              <span className="in">
                <span className="f">{p.front}</span>
                <span className="b">{p.back}</span>
              </span>
            </button>
          ))}
        </div>
        <span className="van-stripe" aria-hidden="true" />
        <span className="van-plate" aria-hidden="true">{plate}</span>
      </div>
      <span className="van-wheel a" aria-hidden="true" />
      <span className="van-wheel b" aria-hidden="true" />
    </div>
  );
}
