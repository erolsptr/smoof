import { create } from 'zustand';

/**
 * A screen to open once the main tabs are ready (e.g. after tapping a
 * notification while the app was closed: the loading screen redirects first,
 * then the tab layout opens this route).
 */
interface PendingRouteState {
  route: string | null;
  setRoute: (route: string | null) => void;
}

export const usePendingRouteStore = create<PendingRouteState>((set) => ({
  route: null,
  setRoute: (route) => set({ route }),
}));
