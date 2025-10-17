import { useModuleStore } from "~/stores/moduleStore";

// Simple sound effect player using Web Audio API
class SoundPlayer {
  private audioContext: AudioContext | null = null;
  private ambientAudio: HTMLAudioElement | null = null;
  private currentAmbientTrack: string | null = null;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Play a simple beep sound with specified frequency and duration
  playBeep(frequency: number, duration: number, volume: number = 0.1) {
    const soundEnabled = useModuleStore.getState().soundEnabled;
    if (!soundEnabled) return;

    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.warn("Sound playback failed:", error);
    }
  }

  // Play ambient sound loop
  playAmbientSound(soundType: string, volume: number = 0.3) {
    const soundEnabled = useModuleStore.getState().soundEnabled;
    if (!soundEnabled) return;

    // Stop current ambient if playing
    this.stopAmbientSound();

    // In a real implementation, you would load actual audio files
    // For now, we'll use Web Audio API to create simple ambient tones
    this.currentAmbientTrack = soundType;
    
    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Different ambient sound profiles
      switch (soundType) {
        case "rain":
          oscillator.type = "sawtooth";
          oscillator.frequency.value = 100;
          filter.type = "lowpass";
          filter.frequency.value = 500;
          break;
        case "ocean":
          oscillator.type = "sine";
          oscillator.frequency.value = 80;
          filter.type = "bandpass";
          filter.frequency.value = 300;
          break;
        case "forest":
          oscillator.type = "triangle";
          oscillator.frequency.value = 120;
          filter.type = "lowpass";
          filter.frequency.value = 800;
          break;
        case "cafe":
          oscillator.type = "brown";
          oscillator.frequency.value = 150;
          filter.type = "lowpass";
          filter.frequency.value = 1000;
          break;
        default:
          oscillator.type = "sine";
          oscillator.frequency.value = 100;
      }

      gainNode.gain.value = volume * 0.5; // Keep ambient sounds quieter
      oscillator.start();

      // Store reference to stop later
      (this as any).currentOscillator = oscillator;
      (this as any).currentGain = gainNode;
    } catch (error) {
      console.warn("Ambient sound playback failed:", error);
    }
  }

  stopAmbientSound() {
    if ((this as any).currentOscillator) {
      try {
        (this as any).currentOscillator.stop();
        (this as any).currentOscillator = null;
        (this as any).currentGain = null;
        this.currentAmbientTrack = null;
      } catch (error) {
        console.warn("Failed to stop ambient sound:", error);
      }
    }
  }

  getCurrentAmbientTrack() {
    return this.currentAmbientTrack;
  }
}

const soundPlayer = new SoundPlayer();

export const soundEffects = {
  launch: () => {
    // Rocket launch sound - ascending tone
    soundPlayer.playBeep(220, 0.15, 0.08);
    setTimeout(() => soundPlayer.playBeep(330, 0.15, 0.08), 80);
    setTimeout(() => soundPlayer.playBeep(440, 0.2, 0.08), 160);
  },

  shuffle: () => {
    // Quick shuffle sound
    soundPlayer.playBeep(440, 0.05, 0.06);
    setTimeout(() => soundPlayer.playBeep(550, 0.05, 0.06), 40);
    setTimeout(() => soundPlayer.playBeep(660, 0.05, 0.06), 80);
  },

  success: () => {
    // Success chime
    soundPlayer.playBeep(523, 0.1, 0.08);
    setTimeout(() => soundPlayer.playBeep(659, 0.15, 0.08), 100);
  },

  click: () => {
    // Subtle click
    soundPlayer.playBeep(800, 0.03, 0.05);
  },

  assign: () => {
    // Agent assignment confirmation
    soundPlayer.playBeep(440, 0.1, 0.07);
    setTimeout(() => soundPlayer.playBeep(523, 0.15, 0.07), 80);
  },

  export: () => {
    // Export completion sound
    soundPlayer.playBeep(330, 0.1, 0.08);
    setTimeout(() => soundPlayer.playBeep(440, 0.1, 0.08), 100);
    setTimeout(() => soundPlayer.playBeep(523, 0.2, 0.08), 200);
  },

  achievementUnlock: () => {
    // Epic achievement sound - triumphant fanfare
    soundPlayer.playBeep(523, 0.15, 0.1);
    setTimeout(() => soundPlayer.playBeep(659, 0.15, 0.1), 100);
    setTimeout(() => soundPlayer.playBeep(784, 0.15, 0.1), 200);
    setTimeout(() => soundPlayer.playBeep(1047, 0.3, 0.1), 300);
  },

  milestone: () => {
    // Milestone reached - celebration
    soundPlayer.playBeep(659, 0.1, 0.08);
    setTimeout(() => soundPlayer.playBeep(784, 0.1, 0.08), 80);
    setTimeout(() => soundPlayer.playBeep(880, 0.1, 0.08), 160);
    setTimeout(() => soundPlayer.playBeep(1047, 0.2, 0.08), 240);
  },

  zenModeEnter: () => {
    // Calming descending tone
    soundPlayer.playBeep(880, 0.3, 0.06);
    setTimeout(() => soundPlayer.playBeep(660, 0.3, 0.06), 200);
    setTimeout(() => soundPlayer.playBeep(440, 0.4, 0.06), 400);
  },

  zenModeExit: () => {
    // Gentle ascending tone
    soundPlayer.playBeep(440, 0.2, 0.06);
    setTimeout(() => soundPlayer.playBeep(523, 0.2, 0.06), 150);
  },

  coverSelect: () => {
    // Cover selection - bright chime
    soundPlayer.playBeep(1047, 0.1, 0.08);
    setTimeout(() => soundPlayer.playBeep(1319, 0.15, 0.08), 100);
  },

  favorite: () => {
    // Favorite toggle - quick chirp
    soundPlayer.playBeep(880, 0.08, 0.06);
    setTimeout(() => soundPlayer.playBeep(1047, 0.08, 0.06), 60);
  },

  copilotAppear: () => {
    // Friendly chime for copilot appearing
    soundPlayer.playBeep(523, 0.15, 0.07);
    setTimeout(() => soundPlayer.playBeep(659, 0.15, 0.07), 100);
    setTimeout(() => soundPlayer.playBeep(784, 0.15, 0.07), 200);
  },

  copilotMessage: () => {
    // Gentle notification sound
    soundPlayer.playBeep(659, 0.1, 0.06);
    setTimeout(() => soundPlayer.playBeep(784, 0.1, 0.06), 80);
  },

  encouragement: () => {
    // Uplifting sound for encouragement messages
    soundPlayer.playBeep(523, 0.1, 0.08);
    setTimeout(() => soundPlayer.playBeep(659, 0.1, 0.08), 80);
    setTimeout(() => soundPlayer.playBeep(784, 0.15, 0.08), 160);
  },

  potDrop: () => {
    // Sound for dropping ingredient into pot
    soundPlayer.playBeep(330, 0.1, 0.07);
    setTimeout(() => soundPlayer.playBeep(440, 0.15, 0.07), 50);
  },

  potStir: () => {
    // Magical stirring sound
    soundPlayer.playBeep(440, 0.1, 0.08);
    setTimeout(() => soundPlayer.playBeep(523, 0.1, 0.08), 60);
    setTimeout(() => soundPlayer.playBeep(659, 0.1, 0.08), 120);
    setTimeout(() => soundPlayer.playBeep(784, 0.15, 0.08), 180);
  },

  sparkFly: () => {
    // Sound for flying sparks
    soundPlayer.playBeep(1047, 0.08, 0.06);
    setTimeout(() => soundPlayer.playBeep(1319, 0.08, 0.06), 40);
  },

  ideaGenerated: () => {
    // Triumphant sound for idea generation
    soundPlayer.playBeep(523, 0.1, 0.09);
    setTimeout(() => soundPlayer.playBeep(659, 0.1, 0.09), 80);
    setTimeout(() => soundPlayer.playBeep(784, 0.1, 0.09), 160);
    setTimeout(() => soundPlayer.playBeep(1047, 0.2, 0.09), 240);
  },
};

// Ambient sound controls
export const ambientSounds = {
  play: (soundType: string, volume?: number) => {
    soundPlayer.playAmbientSound(soundType, volume);
  },
  stop: () => {
    soundPlayer.stopAmbientSound();
  },
  getCurrentTrack: () => {
    return soundPlayer.getCurrentAmbientTrack();
  },
};
