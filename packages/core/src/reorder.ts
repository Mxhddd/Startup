// Moving one item in an ordered list (the driver's stops, dragged into a new order).
// Marked as a worklet so the drag can call it on the UI thread; it is plain JavaScript everywhere else.

/** Moves one id to a new index; the others keep their order. Unknown ids leave the list as it is. */
export function moveId(order: string[], id: string, to: number): string[] {
  'worklet';
  const from = order.indexOf(id);
  if (from < 0 || from === to) return order;
  const next = order.slice();
  next.splice(from, 1);
  next.splice(Math.max(0, Math.min(next.length, to)), 0, id);
  return next;
}
