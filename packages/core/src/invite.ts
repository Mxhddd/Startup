// Finds the invite token in whatever the parent pastes or opens: the pohnch.pk/i/<token> link,
// the same link inside a WhatsApp message, or the app's own pohnch://i/<token> link.
export function tokenFromInviteLink(text: string): string | null {
  const m = /(?:pohnch\.pk\/i\/|pohnch:\/\/i\/|^\/?i\/)([A-Za-z0-9_-]{43})(?![A-Za-z0-9_-])/.exec(text.trim());
  return m ? (m[1] as string) : null;
}
