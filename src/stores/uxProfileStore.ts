import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type UXProfileType = "novice" | "expert" | "minimalist" | "fast-publish" | "adhd-friendly";

export interface ProfileColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
}

export interface ProfileSettings {
  animationIntensity: "none" | "low" | "medium" | "high";
  uiDensity: "compact" | "comfortable" | "spacious";
  hintFrequency: "minimal" | "moderate" | "frequent";
  buttonSize: "small" | "medium" | "large";
  encouragementMessages: boolean;
  focusMode: boolean;
  zenModeEnabled: boolean;
}

const PROFILE_COLOR_SCHEMES: Record<UXProfileType, ProfileColorScheme> = {
  novice: {
    primary: "from-blue-500 to-cyan-500",
    secondary: "from-blue-400 to-cyan-400",
    accent: "bg-blue-600",
    background: "bg-blue-50",
    surface: "bg-white",
    text: "text-blue-900",
  },
  expert: {
    primary: "from-purple-500 to-pink-500",
    secondary: "from-purple-400 to-pink-400",
    accent: "bg-purple-600",
    background: "bg-purple-50",
    surface: "bg-white",
    text: "text-purple-900",
  },
  minimalist: {
    primary: "from-gray-500 to-slate-500",
    secondary: "from-gray-400 to-slate-400",
    accent: "bg-gray-600",
    background: "bg-gray-50",
    surface: "bg-white",
    text: "text-gray-900",
  },
  "fast-publish": {
    primary: "from-orange-500 to-red-500",
    secondary: "from-orange-400 to-red-400",
    accent: "bg-orange-600",
    background: "bg-orange-50",
    surface: "bg-white",
    text: "text-orange-900",
  },
  "adhd-friendly": {
    primary: "from-green-500 to-emerald-500",
    secondary: "from-green-400 to-emerald-400",
    accent: "bg-green-600",
    background: "bg-green-50",
    surface: "bg-white",
    text: "text-green-900",
  },
};

const DEFAULT_PROFILE_SETTINGS: Record<UXProfileType, ProfileSettings> = {
  novice: {
    animationIntensity: "medium",
    uiDensity: "spacious",
    hintFrequency: "frequent",
    buttonSize: "large",
    encouragementMessages: true,
    focusMode: false,
    zenModeEnabled: false,
  },
  expert: {
    animationIntensity: "high",
    uiDensity: "compact",
    hintFrequency: "minimal",
    buttonSize: "small",
    encouragementMessages: false,
    focusMode: false,
    zenModeEnabled: false,
  },
  minimalist: {
    animationIntensity: "low",
    uiDensity: "comfortable",
    hintFrequency: "minimal",
    buttonSize: "medium",
    encouragementMessages: false,
    focusMode: true,
    zenModeEnabled: false,
  },
  "fast-publish": {
    animationIntensity: "high",
    uiDensity: "compact",
    hintFrequency: "moderate",
    buttonSize: "medium",
    encouragementMessages: true,
    focusMode: false,
    zenModeEnabled: false,
  },
  "adhd-friendly": {
    animationIntensity: "low",
    uiDensity: "spacious",
    hintFrequency: "moderate",
    buttonSize: "large",
    encouragementMessages: true,
    focusMode: true,
    zenModeEnabled: false,
  },
};

interface UXProfileStore {
  activeProfile: UXProfileType;
  customSettings: Partial<ProfileSettings>;
  zenModeActive: boolean;
  setActiveProfile: (profile: UXProfileType) => void;
  updateCustomSettings: (settings: Partial<ProfileSettings>) => void;
  toggleZenMode: () => void;
  getProfileSettings: () => ProfileSettings;
  getColorScheme: () => ProfileColorScheme;
}

export const useUXProfileStore = create<UXProfileStore>()(
  persist(
    (set, get) => ({
      activeProfile: "novice",
      customSettings: {},
      zenModeActive: false,
      
      setActiveProfile: (profile) => set({ activeProfile: profile }),
      
      updateCustomSettings: (settings) =>
        set((state) => ({
          customSettings: { ...state.customSettings, ...settings },
        })),
      
      toggleZenMode: () =>
        set((state) => ({ zenModeActive: !state.zenModeActive })),
      
      getProfileSettings: () => {
        const state = get();
        return {
          ...DEFAULT_PROFILE_SETTINGS[state.activeProfile],
          ...state.customSettings,
        };
      },
      
      getColorScheme: () => {
        const state = get();
        return PROFILE_COLOR_SCHEMES[state.activeProfile];
      },
    }),
    {
      name: "ux-profile-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Custom hooks for computed values
export const useProfileColorScheme = () =>
  useUXProfileStore((state) => PROFILE_COLOR_SCHEMES[state.activeProfile]);

export const useProfileSettings = () => {
  const activeProfile = useUXProfileStore((state) => state.activeProfile);
  const customSettings = useUXProfileStore((state) => state.customSettings);
  return {
    ...DEFAULT_PROFILE_SETTINGS[activeProfile],
    ...customSettings,
  };
};

export const useAnimationClass = () => {
  const settings = useProfileSettings();
  const animationClasses = {
    none: "",
    low: "transition-all duration-150",
    medium: "transition-all duration-300",
    high: "transition-all duration-500 transform hover:scale-105",
  };
  return animationClasses[settings.animationIntensity];
};

export const useButtonSizeClass = () => {
  const settings = useProfileSettings();
  const sizeClasses = {
    small: "px-3 py-1.5 text-sm",
    medium: "px-4 py-2 text-base",
    large: "px-6 py-3 text-lg",
  };
  return sizeClasses[settings.buttonSize];
};
