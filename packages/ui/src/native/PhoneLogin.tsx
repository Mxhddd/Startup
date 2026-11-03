// Login for both apps: mobile number -> 6-digit code -> (first time only) the name others will see.
// The screen only collects and shows; the app passes in what actually talks to Supabase.
import { displayPkMobile, normalisePkMobile } from '@pohnch/core';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated, { Easing, FadeInDown, FadeOut, SlideInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import type { MessageKey } from '@pohnch/messages';
import { useLang, uiFont } from '../lang';
import { springs } from '../motion';
import { colors, fonts, radius, shadow, space } from '../theme';
import { AppText } from './AppText';
import { LangSwitch } from './LangSwitch';
import { haptic } from './haptics';
import { Logo } from './Logo';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';
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

const STAR_D =
  'M32 4 L40.2 12.2 L51.8 12.2 L51.8 23.8 L60 32 L51.8 40.2 L51.8 51.8 L40.2 51.8 L32 60 L23.8 51.8 L12.2 51.8 L12.2 40.2 L4 32 L12.2 23.8 L12.2 12.2 L23.8 12.2 Z M41.5 32 A9.5 9.5 0 1 0 22.5 32 A9.5 9.5 0 1 0 41.5 32 Z';

/** The brand's star pattern, very faint, drifting slowly behind the logo (a brand moment, so it may move). */
function StarField() {
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [drift]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -24 * drift.value }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: -10, left: 0, right: 0, height: 520, opacity: 0.08 }, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="stars" width="78" height="78" patternUnits="userSpaceOnUse">
            <Path d={STAR_D} fill={colors.kesar} fillRule="evenodd" transform="translate(23 23) scale(0.5)" />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#stars)" />
      </Svg>
    </Animated.View>
  );
}

function Field({ label, value, onChange, kind, testID }: { label: string; value: string; onChange: (v: string) => void; kind: 'phone' | 'name'; testID: string }) {
  const { lang, dir } = useLang();
  const digits = kind === 'phone';
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <AppText variant="small" bold color={colors.ink2}>
        {label}
      </AppText>
      <TextInput
        testID={testID}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoFocus
        keyboardType={kind === 'phone' ? 'phone-pad' : 'default'}
        textContentType={kind === 'phone' ? 'telephoneNumber' : 'name'}
        autoComplete={kind === 'phone' ? 'tel' : 'name'}
        maxLength={kind === 'phone' ? 16 : 40}
        placeholder={kind === 'phone' ? '03xx xxxxxxx' : undefined}
        placeholderTextColor={colors.ink2}
        selectionColor={colors.neel}
        style={{
          minHeight: 64,
          borderRadius: 20, borderCurve: 'continuous',
          borderWidth: 2,
          borderColor: focused ? colors.neel : colors.line,
          backgroundColor: colors.white,
          boxShadow: focused ? `0px 0px 0px 4px ${colors.neelTint}` : shadow.card,
          paddingHorizontal: space.lg,
          fontSize: 22,
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

/** One box per digit of the code. Each box pops as its digit arrives; the box waiting for the next digit glows. */
function CodeCell({ digit, active }: { digit: string | undefined; active: boolean }) {
  const pop = useSharedValue(1);
  useEffect(() => {
    if (digit) {
      pop.value = 0.86;
      pop.value = withSpring(1, springs.pop);
    }
  }, [digit, pop]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  return (
    <Animated.View
      style={[
        {
          flex: 1,
          maxWidth: 52,
          height: 64,
          borderRadius: radius.button, borderCurve: 'continuous',
          backgroundColor: colors.white,
          borderWidth: 2,
          borderColor: active ? colors.neel : digit ? colors.siyahi : colors.line,
          boxShadow: active ? `0px 0px 0px 4px ${colors.neelTint}` : undefined,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <AppText variant="number" style={{ fontSize: 26, lineHeight: 32 }}>
        {digit ?? ''}
      </AppText>
    </Animated.View>
  );
}

function CodeField({ label, value, onChange, testID }: { label: string; value: string; onChange: (v: string) => void; testID: string }) {
  const [focused, setFocused] = useState(true);
  const cells = Array.from({ length: 6 }, (_, i) => value[i]);
  return (
    <View style={{ gap: 8 }}>
      <AppText variant="small" bold color={colors.ink2}>
        {label}
      </AppText>
      {/* Digits always run left to right, even in Urdu. */}
      <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }}>
        {cells.map((d, i) => (
          <CodeCell key={i} digit={d} active={focused && i === Math.min(value.length, 5)} />
        ))}
        <TextInput
          testID={testID}
          accessibilityLabel={label}
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoFocus
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={6}
          caretHidden
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.02, color: 'transparent', fontSize: 1 }}
        />
      </View>
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

  // A wrong number or code gives the message a short sideways shake, like a refused passcode on iOS.
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(toError(e));
      haptic.warn();
      shake.value = withSequence(withTiming(-10, { duration: 50 }), withRepeat(withTiming(10, { duration: 80 }), 3, true), withSpring(0, springs.release));
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
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.neel }}>
      <StarField />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingTop: 52 }}>
        <View style={{ flexDirection: dir === 'rtl' ? 'row' : 'row-reverse', paddingHorizontal: space.xl }}>
          <LangSwitch tone="dark" />
        </View>
        <View style={{ alignItems: 'center', paddingTop: space.lg, paddingBottom: space.xxl + 8, gap: space.md }}>
          <Logo width={140} tone="white" animated />
          <AppText bold color={colors.neelTint} align="center" style={{ fontSize: 17 }}>
            {role === 'driver' ? t('app.driver.name') : t('brand.tagline')}
          </AppText>
        </View>
        {/* The cream sheet rises in under the logo, on the heavy sheet spring. */}
        <Animated.View
          entering={SlideInDown.delay(250).springify().damping(springs.sheet.damping).stiffness(springs.sheet.stiffness)}
          style={{ flexGrow: 1, backgroundColor: colors.ghee, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: space.xl, paddingTop: space.xxl, paddingBottom: space.xxl, boxShadow: '0px -24px 60px rgba(8,12,32,0.35)' }}
        >
        <Animated.View key={step} entering={FadeInDown.springify().damping(springs.layout.damping).stiffness(springs.layout.stiffness)} exiting={FadeOut.duration(120)} style={{ gap: space.xl }}>
        <View style={{ gap: space.sm }}>
          <AppText variant="title" testID="login-title" style={{ fontSize: 28 }}>{t(titleKey)}</AppText>
          <AppText variant="secondary">
            {step === 'phone' ? t('login.phone.hint') : step === 'code' ? t('login.code.hint', { phone: displayPkMobile(phone) }) : t(role === 'driver' ? 'login.name.hint.driver' : 'login.name.hint.parent')}
          </AppText>
        </View>

        {step === 'phone' ? <Field kind="phone" label={t('login.phone.label')} value={phoneInput} onChange={setPhoneInput} testID="phone-input" /> : null}
        {step === 'code' ? <CodeField label={t('login.code.label')} value={code} onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} testID="code-input" /> : null}
        {step === 'name' ? <Field kind="name" label={t('login.name.label')} value={name} onChange={setName} testID="name-input" /> : null}

        {error ? (
          <Animated.View accessibilityRole="alert" testID="login-error" entering={FadeInDown.springify().damping(springs.pop.damping)} style={[{ backgroundColor: colors.dangerBg, borderRadius: radius.card, borderCurve: 'continuous', padding: space.md }, shakeStyle]}>
            <AppText bold color={colors.dangerText}>{t(`error.${error}`)}</AppText>
          </Animated.View>
        ) : null}

        <TapButton
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
        </Animated.View>
        </Animated.View>
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
