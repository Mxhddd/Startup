// Browser preview stand-in (MapLibre's native map has no web build here). It draws a brand-styled
// sketch of streets, like the v5 designs, and places the pins and the van by their real coordinates,
// so previews look like the phone. Clicking places a point where you click.
import { useEffect, useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { colorScheme, colors, karachiRegion, mapMoods } from '../theme';

// The sketch follows the same palette as the real map: night when the app is dark.
const palette = () => mapMoods[colorScheme() === 'dark' ? 'night' : 'day'];
import { AppText } from './AppText';
import { StopPin } from './StopPin';
import { VanMarker } from './VanMarker';
import type { PohnchMapProps } from './PohnchMap';

export type { MapPin, PohnchMapProps } from './PohnchMap';

function Streets() {
  const mapColors = palette();
  return (
    <Svg width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute' }}>
      <Rect width="390" height="844" fill={mapColors.land} />
      <Path d="M0 700 C80 660 160 690 230 760 L300 844 L0 844 Z" fill={mapColors.water} />
      <Rect x="236" y="176" width="120" height="84" rx="16" fill={mapColors.parks} />
      <Rect x="22" y="430" width="92" height="72" rx="16" fill={mapColors.parks} />
      <Path d="M0 120 H390 M0 380 H390 M60 0 V680 M210 0 V844 M0 640 H390 M0 560 H390 M340 0 V844" stroke={mapColors.road} strokeWidth={7} strokeLinecap="round" fill="none" />
      {['M-10 260 C120 250 220 300 400 280', 'M120 -10 C130 200 110 420 160 620 C180 700 220 760 230 860', 'M300 -10 C280 160 300 360 270 860'].map((d) => (
        <Path key={d} d={d} stroke={mapColors.roadCasing} strokeWidth={20} strokeLinecap="round" fill="none" />
      ))}
      {['M-10 260 C120 250 220 300 400 280', 'M120 -10 C130 200 110 420 160 620 C180 700 220 760 230 860', 'M300 -10 C280 160 300 360 270 860'].map((d) => (
        <Path key={`w${d}`} d={d} stroke={mapColors.road} strokeWidth={14} strokeLinecap="round" fill="none" />
      ))}
    </Svg>
  );
}

export function PohnchMap({ accessibilityLabel, pins = [], van, onPress, style, testID, bottomInset = 0, trail, ahead }: PohnchMapProps) {
  const [dash, setDash] = useState(0);
  useEffect(() => {
    if (!ahead || ahead.length < 2) return;
    const id = setInterval(() => setDash((d) => (d + 1) % 14), 80);
    return () => clearInterval(id);
  }, [ahead]);
  const [box, setBox] = useState({ w: 360, h: 780 });
  const pts = [...pins.map((p) => ({ lat: p.lat, lng: p.lng })), ...(van ? [{ lat: van.lat, lng: van.lng }] : []), ...(trail ?? [])];
  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);
  const span = 0.01;
  const minLat = pts.length ? Math.min(...lats) : karachiRegion.latitude - span;
  const maxLat = pts.length ? Math.max(...lats) : karachiRegion.latitude + span;
  const minLng = pts.length ? Math.min(...lngs) : karachiRegion.longitude - span;
  const maxLng = pts.length ? Math.max(...lngs) : karachiRegion.longitude + span;
  const pad = { top: 150, bottom: 90 + bottomInset, side: 70 };
  const usableW = Math.max(40, box.w - pad.side * 2);
  const usableH = Math.max(40, box.h - pad.top - pad.bottom);
  const place = (lat: number, lng: number) => ({
    x: pad.side + (maxLng === minLng ? usableW / 2 : ((lng - minLng) / (maxLng - minLng)) * usableW),
    y: pad.top + (maxLat === minLat ? usableH / 2 : (1 - (lat - minLat) / (maxLat - minLat)) * usableH),
  });
  const onLayout = (e: LayoutChangeEvent) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  // The road ahead (given, or through the van and the pins) dashed and flowing; the trail fading behind.
  const toPath = (list: { x: number; y: number }[]) => (list.length > 1 ? list.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ') : null);
  const route = toPath(ahead ? ahead.map((p) => place(p.lat, p.lng)) : [...(van ? [place(van.lat, van.lng)] : []), ...pins.map((p) => place(p.lat, p.lng))]);
  const trailPts = (trail ?? []).map((p) => place(p.lat, p.lng));
  const trailPath = toPath(trailPts);

  return (
    <Pressable
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      onLayout={onLayout}
      onPress={
        onPress
          ? (e) => {
              const { locationX: x, locationY: y } = e.nativeEvent;
              const lng = minLng + ((x - pad.side) / usableW) * (maxLng - minLng || span * 2);
              const lat = maxLat - ((y - pad.top) / usableH) * (maxLat - minLat || span * 2);
              onPress({ lat, lng });
            }
          : undefined
      }
      style={[style ?? { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, { backgroundColor: palette().land, overflow: 'hidden' }]}
    >
      <Streets />
      <Svg width={box.w} height={box.h} style={{ position: 'absolute' }} pointerEvents="none">
        {trailPath && trailPts.length > 1 ? (
          <>
            <Defs>
              <LinearGradient id="trail" x1={trailPts[0]!.x} y1={trailPts[0]!.y} x2={trailPts[trailPts.length - 1]!.x} y2={trailPts[trailPts.length - 1]!.y} gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor={colors.neel} stopOpacity={0} />
                <Stop offset="1" stopColor={colors.neel} stopOpacity={0.85} />
              </LinearGradient>
            </Defs>
            <Path d={trailPath} stroke="url(#trail)" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </>
        ) : null}
        {route ? <Path d={route} stroke={colors.neel} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={van ? '2 12' : undefined} strokeDashoffset={-dash} fill="none" opacity={van ? 0.75 : 0.9} /> : null}
      </Svg>
      {pins.map((p) => {
        const at = place(p.lat, p.lng);
        const size = p.kind === 'number' ? 34 : p.kind === 'stop' ? 24 : p.kind === 'home' ? 52 : 44;
        return (
          <View key={p.id} pointerEvents="none" style={{ position: 'absolute', left: at.x - size / 2, top: at.y - size / 2 }}>
            {p.kind === 'number' ? (
              <View style={{ width: 34, height: 34, borderRadius: 17, borderCurve: 'continuous', backgroundColor: colors.neel, borderWidth: 3, borderColor: colors.white, alignItems: 'center', justifyContent: 'center', boxShadow: '0px 2px 6px rgba(20,26,51,0.25)' }}>
                <AppText variant="small" bold color={colors.onFill}>{String(p.n)}</AppText>
              </View>
            ) : (
              <StopPin kind={p.kind} />
            )}
          </View>
        );
      })}
      {van ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: place(van.lat, van.lng).x - 32, top: place(van.lat, van.lng).y - 32 }}>
          <VanMarker heading={van.heading ?? 90} stale={van.stale} speed={van.speed} waiting={van.waiting} lights={colorScheme() === "dark"} />
        </View>
      ) : null}
    </Pressable>
  );
}
