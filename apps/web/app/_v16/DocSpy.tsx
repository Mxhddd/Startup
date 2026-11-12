'use client';
// The contents column of the long text pages (privacy, terms) follows your reading (v20): the section you
// are reading is marked in the list, like the hub's open topic. All the text stays on the page, so it
// can be searched, printed and read without JavaScript; this only adds the marker.
import { useEffect } from 'react';

export function DocSpy({ ids }: { ids: string[] }) {
  useEffect(() => {
    const links = new Map(ids.map((id) => [id, document.querySelector<HTMLAnchorElement>(`.toc a[href="#${id}"]`)]));
    const mark = (id: string) => links.forEach((a, k) => { if (!a) return; if (k === id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    const io = new IntersectionObserver((es) => {
      const seen = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (seen) mark(seen.target.id);
    }, { rootMargin: '-20% 0px -65% 0px' });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [ids]);
  return null;
}
