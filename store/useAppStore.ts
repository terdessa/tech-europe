import { create } from "zustand";
import type { Child } from "@/types/domain";

interface AppState {
  uid: string | null;
  email: string | null;
  displayName: string | null;
  children: Child[];
  activeChildId: string | null;
  isAuthLoading: boolean;
  isSidebarOpen: boolean;

  setAuth: (uid: string | null, email: string | null, displayName: string | null) => void;
  setChildren: (children: Child[]) => void;
  setActiveChild: (childId: string | null) => void;
  setAuthLoading: (loading: boolean) => void;
  toggleSidebar: () => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  uid: null,
  email: null,
  displayName: null,
  children: [],
  activeChildId: null,
  isAuthLoading: true,
  isSidebarOpen: true,

  setAuth: (uid, email, displayName) =>
    set({ uid, email, displayName, isAuthLoading: false }),

  setChildren: (children) =>
    set((state) => ({
      children,
      activeChildId:
        state.activeChildId ??
        (children.length > 0 ? children[0].id ?? null : null),
    })),

  setActiveChild: (childId) => set({ activeChildId: childId }),

  setAuthLoading: (loading) => set({ isAuthLoading: loading }),

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  reset: () =>
    set({
      uid: null,
      email: null,
      displayName: null,
      children: [],
      activeChildId: null,
      isAuthLoading: true,
      isSidebarOpen: true,
    }),
}));
