// The picture shown when someone shares a pohnch.pk link (WhatsApp, Facebook): the paper-cut street
// at dawn, the arch window with "6 min", and the name. Latin text only (the image renderer has no
// Urdu shaping); the Urdu name is part of the page itself.
import { ImageResponse } from 'next/og';

export const alt = 'Pohnch: your child\'s school van, on your phone';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraph() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: 'linear-gradient(180deg, #8FA9D6, #F6D7AE)', fontFamily: 'sans-serif' }}>
        <div style={{ position: 'absolute', left: 120, top: 70, width: 120, height: 120, borderRadius: 60, background: '#FFE2A8', display: 'flex' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 150, height: 120, display: 'flex', background: '#C9B7C4', clipPath: 'polygon(0 60%, 6% 60%, 6% 30%, 12% 30%, 12% 50%, 20% 50%, 20% 20%, 26% 20%, 26% 45%, 34% 45%, 34% 10%, 36% 10%, 36% 45%, 44% 45%, 44% 30%, 52% 30%, 52% 55%, 60% 55%, 60% 25%, 70% 25%, 70% 50%, 78% 50%, 78% 35%, 88% 35%, 88% 55%, 100% 55%, 100% 100%, 0 100%)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 200, display: 'flex', background: '#2B3A7E' }} />
        <div style={{ position: 'absolute', left: 80, bottom: 52, display: 'flex', flexDirection: 'column', color: '#FAF6EE' }}>
          <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -2 }}>Pohnch</div>
          <div style={{ fontSize: 34, opacity: 0.92 }}>Where&apos;s the van? You&apos;ll never have to ask again.</div>
        </div>
        <div style={{ position: 'absolute', right: 110, bottom: 150, width: 230, height: 270, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 30, background: 'radial-gradient(circle at 50% 78%, #FFF4DC, #F6C46E 45%, #E8A33D)', borderRadius: '115px 115px 16px 16px', border: '6px solid #F2D9A6', color: '#141A33' }}>
          <div style={{ fontSize: 110, fontWeight: 800, lineHeight: 1 }}>6</div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>min</div>
        </div>
      </div>
    ),
    size,
  );
}
