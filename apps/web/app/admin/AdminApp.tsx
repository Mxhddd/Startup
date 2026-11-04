'use client';
// The admin page in the browser: team login (phone + code), then the pilot's numbers, the driver
// check queue, all vans (switch off / on) and today's trips. Refreshes every 30 seconds.
import { ageParts, createAppApi, displayPkMobile, normalisePkMobile } from '@pohnch/core';
import { dirOf, t as tr, type Lang, type MessageKey, type Vars } from '@pohnch/messages';
import { colors, shadow } from '@pohnch/ui/theme';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';

type Stats = { days: number; trips: number; tripsTracked: number; familiesActive: number; familiesWithAlerts: number; alertsSent: number; alertsFailed: number };
type VanRow = { van_id: string; van_name: string; school_name: string; plate: string | null; driver_name: string; driver_phone: string | null; verified_at: string | null; switched_off_at: string | null; riders: number; waiting: number };
type TripRow = { trip_id: string; van_name: string; driver_name: string; kind: 'morning' | 'afternoon'; status: 'running' | 'ended' | 'cancelled'; started_at: string; last_position_at: string | null; riders: number; done: number };

// v8: the apps' surfaces: white cards with a soft shadow and continuous corners, no borders.
const card: CSSProperties = { background: colors.white, borderRadius: 22, padding: 18, boxShadow: shadow.card };
const btn = (bg: string, fg: string): CSSProperties => ({ background: bg, color: fg, border: 'none', borderRadius: 14, padding: '12px 18px', fontWeight: 700, fontSize: 16, cursor: 'pointer', minHeight: 44, boxShadow: bg === colors.white ? shadow.card : 'none', fontFamily: 'inherit' });
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

export function AdminApp({ url, anonKey }: { url: string; anonKey: string }) {
  const [lang, setLang] = useState<Lang>('ur');
  const t = useCallback((k: MessageKey, v?: Vars) => tr(lang, k, v), [lang]);
  const supabase = useMemo<SupabaseClient | null>(() => (url && anonKey ? createClient(url, anonKey) : null), [url, anonKey]);
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session)).catch(() => setSession(null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  return (
    <main lang={lang} dir={dirOf(lang)} style={{ minHeight: '100vh', background: colors.ghee, color: colors.siyahi, fontFamily: lang === 'ur' ? 'var(--font-urdu), var(--font-latin), sans-serif' : 'var(--font-latin), sans-serif', lineHeight: lang === 'ur' ? 1.7 : 1.45 }}>
      {/* The same neel header as the driver app, full width. */}
      <header style={{ background: colors.neel, backgroundImage: `linear-gradient(180deg, ${colors.neelRaised}, ${colors.neel})`, color: colors.ghee, boxShadow: shadow.card }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '18px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24">
              <rect x="5" y="5" width="14" height="14" fill={colors.kesar} />
              <rect x="5" y="5" width="14" height="14" fill={colors.kesar} transform="rotate(45 12 12)" />
              <circle cx="12" cy="12" r="3.4" fill={colors.neel} />
            </svg>
            <h1 style={{ margin: 0, fontSize: 26 }}>{t('admin.title')}</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" style={{ ...btn(colors.glassDark, colors.ghee), border: '1px solid rgba(250,246,238,.18)' }} onClick={() => setLang(lang === 'ur' ? 'en' : 'ur')}>{t('lang.switch')}</button>
            {session ? <button type="button" style={{ ...btn(colors.glassDark, colors.ghee), border: '1px solid rgba(250,246,238,.18)' }} onClick={() => supabase?.auth.signOut()}>{t('admin.signOut')}</button> : null}
          </div>
        </div>
      </header>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 16px 48px', display: 'grid', gap: 20 }}>
        {!supabase ? (
          <p>{t('admin.notConfigured')}</p>
        ) : session === undefined ? (
          <p>{t('common.loading')}</p>
        ) : !session ? (
          <Login supabase={supabase} t={t} />
        ) : (
          <Gate supabase={supabase} session={session} url={url} t={t} />
        )}
      </div>
    </main>
  );
}

function Login({ supabase, t }: { supabase: SupabaseClient; t: (k: MessageKey, v?: Vars) => string }) {
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const input: CSSProperties = { fontSize: 20, padding: '12px 14px', borderRadius: 12, border: `2px solid ${colors.siyahi}`, fontFamily: 'var(--font-latin), sans-serif', direction: 'ltr' };
  const send = async () => {
    const e164 = normalisePkMobile(phone);
    if (!e164) return setError(t('error.phone'));
    const { error: err } = await supabase.auth.signInWithOtp({ phone: e164 });
    if (err) return setError(t('error.generic'));
    setError(null);
    setSent(e164);
  };
  const verify = async () => {
    const { error: err } = await supabase.auth.verifyOtp({ phone: sent as string, token: code, type: 'sms' });
    if (err) setError(t('error.code'));
  };
  return (
    <section style={{ ...card, maxWidth: 420, display: 'grid', gap: 12 }} data-testid="admin-login">
      <h2 style={{ margin: 0 }}>{t('admin.login.title')}</h2>
      {!sent ? (
        <>
          <label htmlFor="phone">{t('login.phone.label')}</label>
          <input id="phone" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03xx xxxxxxx" style={input} />
          <button type="button" style={btn(colors.neel, colors.ghee)} onClick={send}>{t('login.send')}</button>
        </>
      ) : (
        <>
          <p style={{ margin: 0 }}>{t('login.code.hint', { phone: displayPkMobile(sent) })}</p>
          <label htmlFor="code">{t('login.code.label')}</label>
          <input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} style={input} />
          <button type="button" style={btn(colors.neel, colors.ghee)} onClick={verify}>{t('login.verify')}</button>
        </>
      )}
      {error ? <p role="alert" style={{ margin: 0, color: colors.dangerText }}>{error}</p> : null}
    </section>
  );
}

function Gate(props: { supabase: SupabaseClient; session: Session; url: string; t: (k: MessageKey, v?: Vars) => string }) {
  const [isAdmin, setIsAdmin] = useState<boolean | undefined>(undefined);
  useEffect(() => {
    props.supabase.from('admins').select('user_id').eq('user_id', props.session.user.id).then(({ data }) => setIsAdmin((data ?? []).length > 0));
  }, [props.supabase, props.session.user.id]);
  if (isAdmin === undefined) return <p>{props.t('common.loading')}</p>;
  if (!isAdmin) return <p data-testid="not-allowed" style={{ ...card }}>{props.t('admin.notAllowed')}</p>;
  return <Dashboard {...props} />;
}

function Stat({ label, value, sub, testId }: { label: string; value: ReactNode; sub?: ReactNode; testId: string }) {
  return (
    <div style={{ ...card, display: 'grid', gap: 4 }} data-testid={testId}>
      <span style={{ color: colors.ink2, fontSize: 15 }}>{label}</span>
      <strong style={{ fontSize: 44, lineHeight: 1.1, fontWeight: 800, fontFamily: 'var(--font-latin), sans-serif', direction: 'ltr', textAlign: 'start', color: colors.neel, fontVariantNumeric: 'tabular-nums' }}>{value}</strong>
      {sub ? <span style={{ color: colors.ink2, fontSize: 14 }}>{sub}</span> : null}
    </div>
  );
}

function Dashboard({ supabase, session, url, t }: { supabase: SupabaseClient; session: Session; url: string; t: (k: MessageKey, v?: Vars) => string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [vans, setVans] = useState<VanRow[]>([]);
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [error, setError] = useState(false);
  const api = useMemo(() => createAppApi({ functionsUrl: `${url.replace(/\/$/, '')}/functions/v1`, getToken: async () => session.access_token }), [url, session.access_token]);

  const load = useCallback(async () => {
    const [s, v, tr] = await Promise.all([supabase.rpc('admin_stats', { p_days: 7 }), supabase.rpc('admin_vans'), supabase.rpc('admin_trips_today')]);
    if (s.error || v.error || tr.error) return setError(true);
    setError(false);
    setStats(s.data as Stats);
    setVans((v.data ?? []) as VanRow[]);
    setTrips((tr.data ?? []) as TripRow[]);
  }, [supabase]);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const act = async (action: 'admin.verify' | 'admin.switchOff' | 'admin.endTrip', body: Record<string, unknown>) => {
    try {
      await api(action, body);
      await load();
    } catch {
      setError(true);
    }
  };
  const age = (iso: string) => {
    const a = ageParts(Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000)));
    return t(`age.${a.unit}` as MessageKey, { n: a.n });
  };
  const queue = vans.filter((v) => !v.verified_at);
  const sectionTitle: CSSProperties = { margin: '8px 0 0', fontSize: 22 };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: colors.ink2 }}>{t('admin.week')}</span>
        <button type="button" style={btn(colors.white, colors.neel)} onClick={load}>{t('admin.refresh')}</button>
      </div>
      {error ? <p role="alert" style={{ margin: 0, color: colors.dangerText }}>{t('admin.error')}</p> : null}
      {stats ? (
        <section style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <Stat testId="stat-tracked" label={t('admin.stat.tracked')} value={`${pct(stats.tripsTracked, stats.trips)}%`} sub={<><bdi dir="ltr">{`${stats.tripsTracked} / ${stats.trips}`}</bdi> · {t('admin.stat.trackedHint')}</>} />
          <Stat testId="stat-families" label={t('admin.stat.families')} value={stats.familiesActive} />
          <Stat testId="stat-alerts" label={t('admin.stat.alerts')} value={stats.alertsSent} sub={t('admin.stat.alertsFailed', { n: stats.alertsFailed })} />
          <Stat testId="stat-live" label={t('admin.stat.live')} value={`${pct(stats.familiesWithAlerts, stats.familiesActive)}%`} sub={<><bdi dir="ltr">{`${stats.familiesWithAlerts} / ${stats.familiesActive}`}</bdi> · {t('admin.stat.liveHint')}</>} />
        </section>
      ) : null}

      <Stage2 supabase={supabase} vans={vans} t={t} />

      <h2 style={sectionTitle}>{t('admin.queue.title')}</h2>
      <p style={{ margin: 0, color: colors.ink2 }}>{t('admin.queue.hint')}</p>
      {queue.length === 0 ? <p style={{ margin: 0 }}>{t('admin.queue.empty')}</p> : null}
      {queue.map((v) => (
        <div key={v.van_id} data-testid="queue-row" style={{ ...card, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px' }}>
            <strong>{v.van_name}</strong> · {v.driver_name} · {v.school_name}
            {v.driver_phone ? (
              <div><a href={`tel:+${v.driver_phone.replace(/^\+/, '')}`} style={{ color: colors.neel, direction: 'ltr', display: 'inline-block', fontFamily: 'var(--font-latin), sans-serif' }}>{displayPkMobile(`+${v.driver_phone.replace(/^\+/, '')}`)}</a></div>
            ) : null}
          </div>
          <button type="button" style={btn(colors.zamurrad, colors.white)} onClick={() => act('admin.verify', { vanId: v.van_id })}>{t('admin.verify')}</button>
        </div>
      ))}

      <h2 style={sectionTitle}>{t('admin.trips.title')}</h2>
      {trips.length === 0 ? <p style={{ margin: 0 }}>{t('admin.trips.empty')}</p> : null}
      {trips.map((tr) => (
        <div key={tr.trip_id} data-testid="trip-row" style={{ ...card, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <strong style={{ flex: '1 1 200px' }}>{tr.van_name} · {tr.driver_name}</strong>
          <span>{t(tr.kind === 'morning' ? 'trip.morning' : 'trip.afternoon')} · {t(`admin.status.${tr.status}` as MessageKey)}</span>
          <span style={{ fontFamily: 'var(--font-latin), sans-serif', direction: 'ltr' }}>{t('admin.done', { done: tr.done, total: tr.riders })}</span>
          <span style={{ color: tr.status === 'running' && tr.last_position_at && Date.now() - Date.parse(tr.last_position_at) > 60_000 ? colors.dangerText : colors.ink2 }}>
            {tr.last_position_at ? t('admin.trips.lastSeen', { age: age(tr.last_position_at) }) : t('admin.trips.noPosition')}
          </span>
          {tr.status === 'running' ? (
            <button type="button" style={btn(colors.white, colors.shingarf)} onClick={() => act('admin.endTrip', { tripId: tr.trip_id })}>{t('admin.endTrip')}</button>
          ) : null}
        </div>
      ))}

      <h2 style={sectionTitle}>{t('admin.vans.title')}</h2>
      {vans.map((v) => (
        <div key={v.van_id} data-testid="van-row" style={{ ...card, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', opacity: v.switched_off_at ? 0.6 : 1 }}>
          <strong style={{ flex: '1 1 200px' }}>{v.van_name} · {v.driver_name}</strong>
          <span>{t('admin.riders', { n: v.riders, w: v.waiting })}</span>
          <button type="button" style={btn(v.switched_off_at ? colors.neel : colors.shingarf, colors.white)} onClick={() => act('admin.switchOff', { vanId: v.van_id, off: !v.switched_off_at })}>
            {v.switched_off_at ? t('admin.switchOn') : t('admin.switchOff')}
          </button>
        </div>
      ))}
    </div>
  );
}

type FlagRow = { key: string; van_id: string | null; van_name: string | null; enabled: boolean };
type HelpRow = { id: string; van_name: string; driver_name: string; lat: number | null; lng: number | null; created_at: string; resolved_at: string | null };
type RequestRow = { school_name: string; children: number; lat: number; lng: number; oldest: string };

/**
 * v10 stage 2 for the team: emergency help alerts first (with a map link to the van's last position),
 * the stage 2 switch (everyone, or one van at a time; off until gate 1), and open requests for a new
 * van grouped by school (counts only; no names, places rounded).
 */
function Stage2({ supabase, vans, t }: { supabase: SupabaseClient; vans: VanRow[]; t: (k: MessageKey, v?: Vars) => string }) {
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [help, setHelp] = useState<HelpRow[]>([]);
  const [reqs, setReqs] = useState<RequestRow[]>([]);
  const load = useCallback(async () => {
    const [f, h, r] = await Promise.all([supabase.rpc('admin_flags'), supabase.rpc('admin_help_alerts'), supabase.rpc('admin_van_requests')]);
    setFlags((f.data ?? []) as FlagRow[]);
    setHelp((h.data ?? []) as HelpRow[]);
    setReqs((r.data ?? []) as RequestRow[]);
  }, [supabase]);
  useEffect(() => {
    load();
    const id = setInterval(load, 20_000);
    return () => clearInterval(id);
  }, [load]);
  const setFlag = async (van: string | null, on: boolean) => {
    await supabase.rpc('admin_set_flag', { p_key: 'stage2', p_van: van, p_on: on });
    await load();
  };
  const isOn = (van: string | null) => flags.some((f) => f.van_id === van && f.enabled);
  const title: CSSProperties = { margin: '8px 0 0', fontSize: 22 };
  const open = help.filter((h) => !h.resolved_at);
  return (
    <>
      <h2 style={{ ...title, color: open.length ? colors.dangerText : undefined }}>{t('admin.help.title')}</h2>
      {help.length === 0 ? <p style={{ margin: 0 }}>{t('admin.help.empty')}</p> : null}
      {help.map((h) => (
        <div key={h.id} data-testid="help-row" style={{ ...card, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', background: h.resolved_at ? colors.white : colors.shingarfTint }}>
          <strong style={{ flex: '1 1 200px' }}>{h.van_name} · {h.driver_name}</strong>
          <span style={{ fontFamily: 'var(--font-latin), sans-serif', direction: 'ltr' }}>{new Date(h.created_at).toLocaleTimeString('en-GB', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit' })}</span>
          {h.lat !== null && h.lng !== null ? (
            <a href={`https://www.openstreetmap.org/?mlat=${h.lat}&mlon=${h.lng}#map=17/${h.lat}/${h.lng}`} target="_blank" rel="noreferrer" style={{ color: colors.neel }}>{t('admin.help.map')}</a>
          ) : null}
          {h.resolved_at ? (
            <span style={{ color: colors.ink2 }}>{t('admin.help.resolved')}</span>
          ) : (
            <button type="button" style={btn(colors.zamurrad, colors.white)} onClick={async () => { await supabase.rpc('admin_resolve_help', { p_id: h.id }); await load(); }}>{t('admin.help.resolve')}</button>
          )}
        </div>
      ))}

      <h2 style={title}>{t('admin.s2.title')}</h2>
      <p style={{ margin: 0, color: colors.ink2 }}>{t('admin.s2.hint')}</p>
      <div data-testid="stage2-switch" style={{ ...card, display: 'grid', gap: 10 }}>
        {[{ id: null as string | null, name: t('admin.s2.everyone') }, ...vans.filter((v) => v.verified_at).map((v) => ({ id: v.van_id as string | null, name: v.van_name }))].map((row) => (
          <div key={row.id ?? 'all'} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <strong style={{ flex: 1 }}>{row.name}</strong>
            <span style={{ color: isOn(row.id) ? colors.zamurradOnTint : colors.ink2 }}>{isOn(row.id) ? t('admin.s2.on') : t('admin.s2.off')}</span>
            <button type="button" style={btn(isOn(row.id) ? colors.white : colors.neel, isOn(row.id) ? colors.shingarf : colors.white)} onClick={() => setFlag(row.id, !isOn(row.id))}>
              {isOn(row.id) ? t('admin.s2.turnOff') : t('admin.s2.turnOn')}
            </button>
          </div>
        ))}
      </div>

      <h2 style={title}>{t('admin.req.title')}</h2>
      {reqs.length === 0 ? <p style={{ margin: 0 }}>{t('admin.req.empty')}</p> : null}
      {reqs.map((r) => (
        <div key={`${r.school_name}-${r.lat}`} data-testid="request-row" style={{ ...card, display: 'flex', gap: 12, alignItems: 'center' }}>
          <strong style={{ flex: 1 }}>{r.school_name}</strong>
          <span>{t('admin.req.row', { n: r.children })}</span>
        </div>
      ))}
    </>
  );
}
