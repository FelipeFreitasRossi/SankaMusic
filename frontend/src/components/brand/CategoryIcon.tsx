import {
  AudioWaveform,
  Cable,
  Drum,
  Guitar,
  Headphones,
  Mic,
  Music2,
  Piano,
  SlidersVertical,
  Speaker,
  Volume2,
  Music,
  type LucideProps,
} from 'lucide-react';
import type { ComponentType } from 'react';

const MAP: Record<string, ComponentType<LucideProps>> = {
  Guitar,
  Music2,
  AudioWaveform,
  Drum,
  Piano,
  Mic,
  SlidersVertical,
  Speaker,
  Volume2,
  Cable,
  Headphones,
};

export const ICON_NAMES = Object.keys(MAP);

export function CategoryIcon({ name, ...props }: { name?: string | null } & LucideProps) {
  const Icon = (name && MAP[name]) || Music;
  return <Icon {...props} />;
}
