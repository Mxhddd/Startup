// Login for both apps: mobile number -> 6-digit code -> (first time only) the name others will see.
// The screen only collects and shows; the app passes in what actually talks to Supabase.
import { displayPkMobile, normalisePkMobile } from '@pohnch/core';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import type { MessageKey } from '@pohnch/messages';
import { useLang, uiFont } from '../lang';
import { colors, fonts, radius, space } from '../theme';
import { AppText } from './AppText';
import { LangSwitch } from './LangSwitch';
import { StarIcon } from './icons';
import { TapButton } from './TapButton';

export type LoginError = 'phone' | 'code' | 'name' | 'offline' | 'tooMany' | 'notConfigured' | 'generic';

export type PhoneLoginProps = {
  role: 'parent' | 'driver';
  sendCode: (phone: string) => Promise<void>;
  /** Returns whether this person still needs a name (first login). */
  verify: (phone: string, code: string) => Promise<{ needsName: boolean }>;
  saveName: (name: string) => Promise<void>;
  onDone: () => void;
  /** Turns whatever the app threw into one of the error messages. */
  toError: (e: unknown) => LoginError;
};

const RESEND_S = 30;

function Field({ label, value, onChange, kind, testID }: { label: string; value: string; onChange: (v: string) => void; kind: 'phone' | 'code' | 'name'; testID: string }) {
  const { lang, dir } = useLang();
  const digits = kind !== 'name';
  return (
    <View style={{ gap: 6 }}>
      <AppText variant="small" bold color={colors.ink2}>
        {label}
      </AppText>
      <TextInput
        testID={testID}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        keyboardType={kind === 'phone' ? 'phone-pad' : kind === 'code' ? 'number-pad' : 'default'}
        textContentType={kind === 'phone' ? 'telephoneNumber' : kind === 'code' ? 'oneTimeCode' : 'name'}
        autoComplete={kind === 'phone' ? 'tel' : kind === 'code' ? 'sms-otp' : 'name'}
        maxLength={kind === 'code' ? 6 : kind === 'phone' ? 16 : 40}
        placeholder={kind === 'phone' ? '03xx xxxxxxx' : kind === 'code' ? '······' : undefined}
        placeholderTextColor={colors.ink2}
        style={{
          minHeight: 56,
          borderRadius: radius.button,
          borderWidth: 2,
          borderColor: colors.siyahi,
          backgroundColor: colors.white,
          paddingHorizontal: space.lg,
          fontSize: kind === 'code' ? 26 : 20,
          letterSpacing: kind === 'code' ? 8 : 0,
          color: colors.siyahi,
          // Numbers are typed and read left to right, even in Urdu.
          fontFamily: digits ? fonts.latin.bold : uiFont(lang, 'regular'),
          textAlign: digits ? 'left' : dir === 'rtl' ? 'right' : 'left',
          writingDirection: digits ? 'ltr' : dir,
        }}
      />
    </View>
  );
}

export function PhoneLogin({ role, sendCode, verify, saveName, onDone, toError }: PhoneLoginProps) {
  const { t, dir } = useLang();
  const [step, setStep] = useState<'phone' | 'code' | 'name'>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(toError(e));
    } finally {
      setBusy(false);
    }
  };

  const submitPhone = () =>
    run(async () => {
      const e164 = normalisePkMobile(phoneInput);
      if (!e164) throw new LoginInputError('phone');
      await sendCode(e164);
      setPhone(e164);
      setCode('');
      setResendIn(RESEND_S);
      setStep('code');
    });

  const submitCode = () =>
    run(async () => {
      if (!/^\d{6}$/.test(code)) throw new LoginInputError('code');
      const { needsName } = await verify(phone, code);
      if (needsName) setStep('name');
      else onDone();
    });

  const submitName = () =>
    run(async () => {
      const clean = name.trim();
      if (clean.length < 1 || clean.length > 40) throw new LoginInputError('name');
      await saveName(clean);
      onDone();
    });

  const titleKey: MessageKey = step === 'phone' ? 'login.phone.title' : step === 'code' ? 'login.code.title' : 'login.name.title';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.ghee }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, padding: space.xl, paddingTop: 72, gap: space.xl }}>
        <View style={{ flexDirection: dir === 'rtl' ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <StarIcon size={44} color={colors.kesar} />
          <LangSwitch />
        </View>
        <View style={{ gap: space.sm }}>
          <AppText variant="title" testID="login-title">{t(titleKey)}</AppText>
          <AppText variant="secondary">
            {step === 'phone' ? t('login.phone.hint') : step === 'code' ? t('login.code.hint', { phone: displayPkMobile(phone) }) : t(role === 'driver' ? 'login.name.hint.driver' : 'login.name.hint.parent')}
          </AppText>
        </View>

        {step === 'phone' ? <Field kind="phone" label={t('login.phone.label')} value={phoneInput} onChange={setPhoneInput} testID="phone-input" /> : null}
        {step === 'code' ? <Field kind="code" label={t('login.code.label')} value={code} onChange={(v) => setCode(v.replace(/\D/g, ''))} testID="code-input" /> : null}
        {step === 'name' ? <Field kind="name" label={t('login.name.label')} value={name} onChange={setName} testID="name-input" /> : null}

        {error ? (
          <View accessibilityRole="alert" testID="login-error" style={{ backgroundColor: colors.dangerBg, borderRadius: radius.card, padding: space.md }}>
            <AppText color={colors.dangerText}>{t(`error.${error}`)}</AppText>
          </View>
        ) : null}

        <TapButton
          size="next"
          tone="left"
          disabled={busy}
          label={step === 'phone' ? t('login.send') : step === 'code' ? t('login.verify') : t('login.done')}
          onConfirm={step === 'phone' ? submitPhone : step === 'code' ? submitCode : submitName}
          testID="login-submit"
        />

        {step === 'code' ? (
          <View style={{ gap: space.sm, alignItems: 'center' }}>
            {resendIn > 0 ? (
              <AppText variant="secondary" align="center">{t('login.resendIn', { s: resendIn })}</AppText>
            ) : (
              <Pressable accessibilityRole="button" onPress={() => run(async () => { await sendCode(phone); setResendIn(RESEND_S); })} style={{ minHeight: 48, justifyContent: 'center' }}>
                <AppText bold color={colors.neel}>{t('login.resend')}</AppText>
              </Pressable>
            )}
            <Pressable accessibilityRole="button" onPress={() => { setStep('phone'); setError(null); }} style={{ minHeight: 48, justifyContent: 'center' }}>
              <AppText bold color={colors.neel}>{t('login.changeNumber')}</AppText>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Thrown for input the screen itself refuses; the app's toError should pass its kind through. */
export class LoginInputError extends Error {
  constructor(public kind: LoginError) {
    super(kind);
  }
}
