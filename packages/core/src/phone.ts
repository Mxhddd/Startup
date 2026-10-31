// Pakistani mobile numbers, however they're typed: 0300 1234567, 0300-1234567, +92 300 1234567, 923001234567.
// Returns the international form Supabase uses (+923001234567), or null if it isn't a mobile number.
export function normalisePkMobile(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, '');
  const m = /^(?:\+92|0092|92|0)?(3\d{9})$/.exec(digits);
  return m ? `+92${m[1]}` : null;
}

/** For showing back to the person: 0300 1234567. */
export function displayPkMobile(e164: string): string {
  const m = /^\+92(3\d{2})(\d{7})$/.exec(e164);
  return m ? `0${m[1]} ${m[2]}` : e164;
}
