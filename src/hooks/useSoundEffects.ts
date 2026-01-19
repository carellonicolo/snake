import { useCallback, useRef, useEffect } from 'react';
import { Theme } from '@/types/game';

type SoundType = 'eat' | 'powerup' | 'gameover' | 'move';

const createOscillator = (
  audioContext: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'square'
) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

const SOUND_CONFIGS: Record<Theme, Record<SoundType, { frequencies: number[]; duration: number; type: OscillatorType }>> = {
  nokia: {
    eat: { frequencies: [800, 1000], duration: 0.1, type: 'square' },
    powerup: { frequencies: [600, 800, 1000, 1200], duration: 0.15, type: 'square' },
    gameover: { frequencies: [400, 300, 200], duration: 0.3, type: 'square' },
    move: { frequencies: [200], duration: 0.02, type: 'square' },
  },
  arcade: {
    eat: { frequencies: [523, 659, 784], duration: 0.08, type: 'square' },
    powerup: { frequencies: [392, 523, 659, 784, 1047], duration: 0.1, type: 'sawtooth' },
    gameover: { frequencies: [294, 262, 220, 196], duration: 0.25, type: 'sawtooth' },
    move: { frequencies: [150], duration: 0.02, type: 'triangle' },
  },
  terminal: {
    eat: { frequencies: [440, 880], duration: 0.05, type: 'sine' },
    powerup: { frequencies: [440, 550, 660, 880], duration: 0.08, type: 'sine' },
    gameover: { frequencies: [220, 196, 175, 147], duration: 0.2, type: 'sine' },
    move: { frequencies: [100], duration: 0.01, type: 'sine' },
  },
};

export function useSoundEffects(enabled: boolean, theme: Theme) {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playSound = useCallback((soundType: SoundType) => {
    if (!enabled) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const config = SOUND_CONFIGS[theme][soundType];
    const { frequencies, duration, type } = config;

    frequencies.forEach((freq, index) => {
      setTimeout(() => {
        if (audioContextRef.current) {
          createOscillator(audioContextRef.current, freq, duration, type);
        }
      }, index * (duration * 500));
    });
  }, [enabled, theme]);

  return { playSound };
}
