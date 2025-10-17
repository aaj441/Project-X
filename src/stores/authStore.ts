import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type User = {
  id: number;
  email: string;
  name: string;
  subscriptionTier: string;
  aiCredits: number;
  subscriptionExpiresAt: string | null;
  uxProfile: string; // novice, expert, minimalist, fast-publish, adhd-friendly
  preferences: any | null; // JSON preferences object
};

type AuthStore = {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token: string, user: User) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "ebook-auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useIsAuthenticated = () => {
  const token = useAuthStore((state) => state.token);
  return !!token;
};
