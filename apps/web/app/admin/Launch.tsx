'use client';
// v24 launch: the team's view of one system instead of three. The pipeline (every person from the website
// sign-up to paying, per school), the school pilots (BCP: families out of 50), the drivers' papers to check
// (2-minute links from the server; the files are deleted when the van is verified), and schools people added.
import type { MessageKey, Vars } from '@pohnch/messages';
import { colors, shadow } from '@pohnch/ui/theme';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';

type T = (k: MessageKey, v?: Vars) => string;
const card: CSSProperties = { background: colors.white, borderRadius: 22, padding: 18, boxShadow: shadow.card, display: 'grid', gap: 12 };
const btn = (bg: string, fg: string): CSSProperties => ({ background: bg, color: fg, border: 'none', borderRadius: 14, padding: '10px 16px', fontWeight: 700, fontSize: 15, cursor: 'pointer', minHeight: 44, boxShadow: bg === colors.white ? shadow.card : 'none', fontFamily: 'inherit' });

const STAGES = ['signed_up', 'app_account', 'child_added', 'asked_van', 'approved', 'first_trip', 'paying', 'van_set_up', 'papers_sent', 'verified'] as const;
type PipeRow = { source: string; created_at: string; role: string; name: string | null; school: string | null; area: string | null; whatsapp: string | null; stage: (typeof STAGES)[number]; user_id: string | null };
type Pilot = { short: string; name: string; goal: number; families: number };

export function SchoolPilots({ supabase, t }: { supabase: SupabaseClient; t: T }) {
  const [rows, setRows] = useState<Pilot[]>([]);
  useEffect(() => { void supabase.rpc('admin_school_pilots').then(({ data }) => setRows((data as Pilot[] | null) ?? [])); }, [supabase]);
  if (!rows.length) return null;
  return (
    <section style={card} data-testid="admin-pilots">
      <h2 style={{ margin: 0, fontSize: 22 }}>{t('admin.pilots.title')}</h2>
      {rows.map((p) => (
        <div key={p.short} style={{ display: 'grid', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <b>{p.name}</b>
            <span><bdi dir="ltr" style={{ fontWeight: 800, color: colors.neel }}>{`${p.families} / ${p.goal}`}</bdi> · <bdi dir="ltr">pohnch.pk/s/{p.short}</bdi></span>
          </div>
          <div style={{ height: 10, borderRadius: 5, background: colors.inset, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100, Math.round((p.families / p.goal) * 100))}%`, height: '100%', background: p.families >= p.goal ? colors.zamurrad : colors.kesar }} />
          </div>
        </div>
      ))}
    </section>
  );
}

export function Pipeline({ supabase, t }: { supabase: SupabaseClient; t: T }) {
  const [rows, setRows] = useState<PipeRow[]>([]);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  useEffect(() => {
    void supabase.rpc('admin_pipeline').then(({ data, error: e }) => {
      setError(!!e);
      setRows((data as PipeRow[] | null) ?? []);
    });
  }, [supabase]);
  const counts = STAGES.map((s) => [s, rows.filter((r) => r.stage === s).length] as const).filter(([, n]) => n > 0);
  const shown = filter === 'all' ? rows : rows.filter((r) => r.stage === filter);
  return (
    <section style={card} data-testid="admin-pipeline">
      <h2 style={{ margin: 0, fontSize: 22 }}>{t('admin.pipe.title', { n: rows.length })}</h2>
      <p style={{ margin: 0, color: colors.ink2 }}>{t('admin.pipe.hint')}</p>
      {error ? <p role="alert" style={{ margin: 0, color: colors.dangerText }}>{t('admin.error')}</p> : null}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button type="button" style={btn(filter === 'all' ? colors.neel : colors.white, filter === 'all' ? colors.white : colors.neel)} onClick={() => setFilter('all')}>{t('admin.pipe.all')} · {rows.length}</button>
        {counts.map(([s, n]) => (
          <button key={s} type="button" style={btn(filter === s ? colors.neel : colors.white, filter === s ? colors.white : colors.neel)} onClick={() => setFilter(s)}>{t(`admin.pipe.${s}` as MessageKey)} · {n}</button>
        ))}
      </div>
      {shown.slice(0, 200).map((r, i) => (
        <div key={`${r.user_id ?? ''}${r.created_at}${i}`} style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', alignItems: 'center', paddingBlock: 8, borderTop: `1px solid ${colors.line}` }}>
          <b>{t(`admin.pipe.${r.stage}` as MessageKey)}</b>
          <span>{r.role === 'driver' ? t('admin.interest.driver') : t('admin.interest.parent')}{r.name ? ` · ${r.name}` : ''}</span>
          {r.school ? <span>{r.school}</span> : null}
          {r.area ? <span>{t(`area.${r.area}` as MessageKey)}</span> : null}
          <span style={{ color: colors.ink2 }}>{r.source === 'site' ? 'pohnch.pk' : t('admin.pipe.app')} · <bdi dir="ltr">{new Date(r.created_at).toLocaleDateString('en-GB', { timeZone: 'Asia/Karachi', day: 'numeric', month: 'short' })}</bdi></span>
          {r.whatsapp ? <a href={`https://wa.me/${r.whatsapp.replace(/^\+/, '')}`} target="_blank" rel="noreferrer" style={{ color: colors.neel, fontWeight: 700 }}><bdi dir="ltr">{r.whatsapp}</bdi> ↗</a> : null}
        </div>
      ))}
    </section>
  );
}

type Doc = { id: string; van_id: string; van_name: string; plate: string | null; driver_name: string; phone: string | null; contact: string | null; kind: string; path: string | null; status: string; note: string | null; uploaded_at: string; verified: boolean };

export function DriverPapers({ supabase, api, t, onVerified }: { supabase: SupabaseClient; api: (action: string, body: Record<string, unknown>) => Promise<unknown>; t: T; onVerified: () => void }) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState(false);
  const load = useCallback(async () => {
    const { data, error: e } = await supabase.rpc('admin_driver_documents');
    setError(!!e);
    const list = ((data as Doc[] | null) ?? []).filter((d) => !d.verified);
    setDocs(list);
    // Short-lived links to each file (only while this page is open).
    const out: Record<string, string> = {};
    await Promise.all(list.filter((d) => d.path).map(async (d) => {
      try { out[d.id] = ((await api('admin.docUrl', { path: d.path })) as { url: string }).url; } catch { /* shown as "no preview" */ }
    }));
    setUrls(out);
  }, [supabase, api]);
  useEffect(() => { void load(); }, [load]);
  const decide = async (id: string, approve: boolean) => {
    const note = approve ? null : window.prompt(t('admin.papers.why')) ?? '';
    if (!approve && !note) return;
    await supabase.rpc('admin_decide_document', { p_doc: id, p_approve: approve, p_note: note });
    void load();
  };
  const verify = async (vanId: string) => {
    try { await api('admin.verify', { vanId }); onVerified(); void load(); } catch { setError(true); }
  };
  const vans = [...new Set(docs.map((d) => d.van_id))];
  return (
    <section style={card} data-testid="admin-papers">
      <h2 style={{ margin: 0, fontSize: 22 }}>{t('admin.papers.title', { n: vans.length })}</h2>
      <p style={{ margin: 0, color: colors.ink2 }}>{t('admin.papers.hint')}</p>
      {error ? <p role="alert" style={{ margin: 0, color: colors.dangerText }}>{t('admin.error')}</p> : null}
      {vans.length === 0 ? <p style={{ margin: 0 }}>{t('admin.papers.empty')}</p> : null}
      {vans.map((v) => {
        const mine = docs.filter((d) => d.van_id === v);
        const first = mine[0]!;
        const all = ['cnic_front', 'cnic_back', 'licence', 'van_registration'].every((k) => mine.some((d) => d.kind === k && d.status === 'approved'));
        const phone = first.contact ?? (first.phone ? `+${first.phone.replace(/^\+/, '')}` : null);
        return (
          <div key={v} style={{ borderTop: `1px solid ${colors.line}`, paddingTop: 12, display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', alignItems: 'center' }}>
              <b>{first.van_name}</b><span>{first.driver_name}</span>
              {first.plate ? <bdi dir="ltr" style={{ fontWeight: 800 }}>{first.plate}</bdi> : null}
              {phone ? <a href={`https://wa.me/${phone.replace(/^\+/, '')}`} target="_blank" rel="noreferrer" style={{ color: colors.neel, fontWeight: 700 }}><bdi dir="ltr">{phone}</bdi> ↗</a> : null}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {mine.map((d) => (
                <div key={d.id} style={{ display: 'grid', gap: 6, background: colors.ghee, borderRadius: 14, padding: 10 }}>
                  <b>{t(`driver.verify.${d.kind}` as MessageKey)}</b>
                  {urls[d.id] ? (
                    <a href={urls[d.id]} target="_blank" rel="noreferrer"><img src={urls[d.id]} alt={t(`driver.verify.${d.kind}` as MessageKey)} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 10 }} /></a>
                  ) : <span style={{ color: colors.ink2 }}>{t('admin.papers.noPreview')}</span>}
                  <span style={{ color: d.status === 'rejected' ? colors.dangerText : d.status === 'approved' ? colors.zamurrad : colors.ink2, fontWeight: 700 }}>{t(`driver.verify.${d.status}` as MessageKey)}</span>
                  {d.status !== 'approved' ? <button type="button" style={btn(colors.zamurrad, colors.white)} onClick={() => decide(d.id, true)}>{t('admin.papers.ok')}</button> : null}
                  {d.status !== 'rejected' ? <button type="button" style={btn(colors.white, colors.dangerText)} onClick={() => decide(d.id, false)}>{t('admin.papers.again')}</button> : null}
                </div>
              ))}
            </div>
            <button type="button" disabled={!all} style={{ ...btn(all ? colors.neel : colors.inset, all ? colors.white : colors.ink2), justifySelf: 'start' }} onClick={() => verify(v)}>{t('admin.papers.verify')}</button>
          </div>
        );
      })}
    </section>
  );
}

type PendingSchool = { id: string; name: string; area: string | null; added_at: string; children: number };
export function SchoolsQueue({ supabase, t }: { supabase: SupabaseClient; t: T }) {
  const [rows, setRows] = useState<PendingSchool[]>([]);
  const [edit, setEdit] = useState<Record<string, { name: string; area: string }>>({});
  const load = useCallback(async () => {
    const { data } = await supabase.rpc('admin_schools_pending');
    setRows((data as PendingSchool[] | null) ?? []);
  }, [supabase]);
  useEffect(() => { void load(); }, [load]);
  const save = async (r: PendingSchool) => {
    const e = edit[r.id] ?? { name: r.name, area: r.area ?? '' };
    await supabase.rpc('admin_save_school', { p_id: r.id, p_name: e.name, p_area: e.area, p_verified: true });
    void load();
  };
  if (!rows.length) return null;
  return (
    <section style={card} data-testid="admin-schools">
      <h2 style={{ margin: 0, fontSize: 22 }}>{t('admin.schools.title', { n: rows.length })}</h2>
      <p style={{ margin: 0, color: colors.ink2 }}>{t('admin.schools.hint')}</p>
      {rows.map((r) => {
        const e = edit[r.id] ?? { name: r.name, area: r.area ?? '' };
        return (
          <div key={r.id} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', borderTop: `1px solid ${colors.line}`, paddingTop: 10 }}>
            <input aria-label={t('school.label')} value={e.name} onChange={(x) => setEdit((m) => ({ ...m, [r.id]: { ...e, name: x.target.value } }))} style={{ flex: '2 1 200px', minHeight: 44, borderRadius: 12, border: `1px solid ${colors.line}`, padding: '0 12px', fontSize: 16 }} />
            <input aria-label={t('place.areas')} value={e.area} onChange={(x) => setEdit((m) => ({ ...m, [r.id]: { ...e, area: x.target.value } }))} style={{ flex: '1 1 120px', minHeight: 44, borderRadius: 12, border: `1px solid ${colors.line}`, padding: '0 12px', fontSize: 16 }} />
            <span style={{ color: colors.ink2 }}>{t('admin.schools.kids', { n: r.children })}</span>
            <button type="button" style={btn(colors.zamurrad, colors.white)} onClick={() => save(r)}>{t('admin.schools.ok')}</button>
          </div>
        );
      })}
    </section>
  );
}
