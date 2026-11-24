// Get verified (v24): the driver sends photos of their CNIC (both sides), driving licence and van
// registration, and a WhatsApp number the team can reach them on. Files go to the private bucket
// 'driver-docs' in the driver's own folder; the team sees them through 2-minute links and the server
// deletes them once the van is verified. Plain, high-contrast, 64 px rows like every driver screen.
import { DOC_KINDS, driver, places, type DocKind, type DriverDoc } from '@pohnch/client';
import { displayPkMobile, normalisePkMobile } from '@pohnch/core';
import { colors, elevation, space, useLang } from '@pohnch/ui';
import { AppText, DrawnCheck, Icon, TapButton, TextField } from '@pohnch/ui/native';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '../components/Screen';
import { useDriver } from '../state/DriverStore';

export default function Verify() {
  const { t, dir } = useLang();
  const d = useDriver();
  const row = dir === 'rtl' ? 'row-reverse' : 'row';
  const [docs, setDocs] = useState<DriverDoc[]>([]);
  const [busy, setBusy] = useState<DocKind | null>(null);
  const [failed, setFailed] = useState<DocKind | null>(null);
  const [phone, setPhone] = useState('');
  const [phoneMsg, setPhoneMsg] = useState<string | null>(null);
  const vanId = d.van?.id;

  const load = useCallback(() => {
    if (!vanId) return;
    driver.myDocuments(vanId).then(setDocs).catch(() => undefined);
  }, [vanId]);
  useEffect(() => {
    load();
    places.myContactPhone().then((p) => p && setPhone(displayPkMobile(p))).catch(() => undefined);
  }, [load]);

  if (!d.van) return null;
  const van = d.van;

  const pick = async (kind: DocKind, camera: boolean) => {
    setFailed(null);
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, allowsEditing: false };
    if (camera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
    }
    const res = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    const asset = res.canceled ? null : res.assets[0];
    if (!asset) return;
    setBusy(kind);
    try {
      const blob = await (await fetch(asset.uri)).blob();
      const mime = asset.mimeType && /^image\/(jpeg|png|webp)$/.test(asset.mimeType) ? asset.mimeType : 'image/jpeg';
      await driver.uploadDocument(van.id, kind, blob, mime);
      load();
    } catch {
      setFailed(kind);
    } finally {
      setBusy(null);
    }
  };

  const savePhone = async () => {
    const e164 = normalisePkMobile(phone);
    if (!e164) return setPhoneMsg(t('contact.bad'));
    try {
      await places.setContactPhone(e164);
      setPhoneMsg(t('contact.saved'));
    } catch {
      setPhoneMsg(t('error.generic'));
    }
  };

  const sent = DOC_KINDS.every((k) => docs.some((x) => x.kind === k && x.status !== 'rejected'));
  return (
    <Screen title={t('driver.verify.title')}>
      {van.verified_at ? (
        <View style={{ flexDirection: row, alignItems: 'center', gap: space.md, backgroundColor: colors.zamurradTint, borderRadius: 24, borderCurve: 'continuous', padding: space.lg }}>
          <DrawnCheck fill={colors.zamurrad} color={colors.white} size={30} />
          <AppText bold color={colors.zamurradOnTint} style={{ flex: 1 }}>{t('driver.verify.verified')}</AppText>
        </View>
      ) : (
        <AppText variant="secondary">{t('driver.verify.body')}</AppText>
      )}

      <View style={{ gap: space.sm }}>
        <AppText variant="headline">{t('contact.title')}</AppText>
        <AppText variant="secondary">{t('contact.hint')}</AppText>
        <TextField label={t('contact.title')} value={phone} onChange={setPhone} ltr maxLength={16} testID="verify-phone" />
        {phoneMsg ? <AppText bold color={phoneMsg === t('contact.saved') ? colors.zamurradOnTint : colors.dangerText}>{phoneMsg}</AppText> : null}
        <TapButton icon="check" label={t('contact.save')} onConfirm={savePhone} testID="verify-phone-save" />
      </View>

      {!van.verified_at
        ? DOC_KINDS.map((kind) => {
            const doc = docs.find((x) => x.kind === kind);
            const status = busy === kind ? t('driver.verify.sending') : doc ? t(`driver.verify.${doc.status}` as 'driver.verify.pending') : null;
            const tone = doc?.status === 'rejected' || failed === kind ? colors.dangerText : doc?.status === 'approved' ? colors.zamurradOnTint : colors.ink2;
            return (
              <View key={kind} testID={`doc-${kind}`} style={{ backgroundColor: colors.white, borderRadius: 24, borderCurve: 'continuous', boxShadow: elevation.e1, padding: space.lg, gap: space.sm }}>
                <View style={{ flexDirection: row, alignItems: 'center', gap: space.md }}>
                  {doc && doc.status !== 'rejected' ? <DrawnCheck fill={doc.status === 'approved' ? colors.zamurrad : colors.neel} color={colors.white} size={28} /> : <Icon name="shield" size={26} color={colors.neel} />}
                  <View style={{ flex: 1 }}>
                    <AppText bold style={{ fontSize: 18 }}>{t(`driver.verify.${kind}` as 'driver.verify.licence')}</AppText>
                    {status ? <AppText variant="small" bold color={tone}>{status}</AppText> : null}
                    {doc?.status === 'rejected' && doc.note ? <AppText variant="small" color={colors.dangerText}>{doc.note}</AppText> : null}
                    {failed === kind ? <AppText variant="small" color={colors.dangerText}>{t('driver.verify.error')}</AppText> : null}
                  </View>
                </View>
                <View style={{ flexDirection: row, gap: space.sm }}>
                  <View style={{ flex: 1 }}>
                    <TapButton icon="plus" label={doc ? t('driver.verify.redo') : t('driver.verify.add')} disabled={busy !== null} onConfirm={() => void pick(kind, false)} testID={`doc-${kind}-pick`} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TapButton icon="share" label={t('driver.verify.camera')} disabled={busy !== null} onConfirm={() => void pick(kind, true)} testID={`doc-${kind}-camera`} />
                  </View>
                </View>
              </View>
            );
          })
        : null}
      {sent && !van.verified_at ? <AppText bold color={colors.zamurradOnTint}>{t('driver.verify.done')}</AppText> : null}
    </Screen>
  );
}
