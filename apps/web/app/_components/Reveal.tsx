'use client';
// Rises gently into place the first time it scrolls into view (instantly with "reduce motion").
import { useRef, type CSSProperties, type ReactNode } from 'react';
import { useInView } from '../_lib/hooks';

export function Reveal({ children, className = '', style, as: Tag = 'div', seenClass = 'in' }: { children: ReactNode; className?: string; style?: CSSProperties; as?: 'div' | 'section'; seenClass?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref);
  return <Tag ref={ref} className={`${className} ${seen ? seenClass : ''}`} style={style}>{children}</Tag>;
}
