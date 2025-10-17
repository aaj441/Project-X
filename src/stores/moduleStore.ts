import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type ModuleStore = {
  activeCategory: string | null;
  moduleOrder: Record<number, number>; // projectId -> order
  soundEnabled: boolean;
  setActiveCategory: (category: string | null) => void;
  setModuleOrder: (projectId: number, order: number) => void;
  toggleSound: () => void;
};

export const useModuleStore = create<ModuleStore>()(
  persist(
    (set, get) => ({
      activeCategory: null,
      moduleOrder: {},
      soundEnabled: true,
      setActiveCategory: (category) => set({ activeCategory: category }),
      setModuleOrder: (projectId, order) =>
        set((state) => ({
          moduleOrder: { ...state.moduleOrder, [projectId]: order },
        })),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
    }),
    {
      name: "ebook-module-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
