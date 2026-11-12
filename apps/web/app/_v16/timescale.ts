// ?timescale=0.125 slows every timed animation on the page (used only to record smooth films of the site).
export const TS = typeof location === 'undefined' ? 1 : Number(new URLSearchParams(location.search).get('timescale') ?? 1) || 1;
