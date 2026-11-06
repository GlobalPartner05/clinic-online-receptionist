import React from 'react';
import { Player } from '@remotion/player';
import type { Clip } from './RemotionPlayer';
import { HeroReel, HERO_DURATION } from '../remotion/HeroReel';
import { ServicesShowcase, SERVICES_DURATION } from '../remotion/ServicesShowcase';
import { BookingSteps, BOOKING_DURATION } from '../remotion/BookingSteps';
import { ReceptionistWave, WAVE_DURATION } from '../remotion/ReceptionistWave';

const MAP = {
  HeroReel: { component: HeroReel, frames: HERO_DURATION },
  ServicesShowcase: { component: ServicesShowcase, frames: SERVICES_DURATION },
  BookingSteps: { component: BookingSteps, frames: BOOKING_DURATION },
  ReceptionistWave: { component: ReceptionistWave, frames: WAVE_DURATION },
} as const;

export default function PlayerImpl({ clip }: { clip: Clip }) {
  const m = MAP[clip.id];
  return (
    <Player
      component={m.component as React.ComponentType<Record<string, unknown>>}
      inputProps={clip.inputProps ?? {}}
      durationInFrames={m.frames}
      fps={30}
      compositionWidth={clip.width}
      compositionHeight={clip.height}
      style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}
      loop
      autoPlay
      controls={false}
      clickToPlay={false}
      acknowledgeRemotionLicense
    />
  );
}
