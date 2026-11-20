import { create } from 'zustand';
import { friendFlowReducer, withFriendFlow, type AppAction, type AppState } from '../logic/friendFlow';
import { createInitialDemoState } from '../logic/seed';

export interface DemoStore extends AppState {
  dispatch: (action: AppAction) => void;
  advanceClockMinutes: (minutes: number) => void;
  setClockTime: (timeMs: number) => void;
  setLiveClock: (isLive: boolean) => void;
}

export const useDemoStore = create<DemoStore>((set, get) => {
  let liveInterval: ReturnType<typeof setInterval> | null = null;

  return {
    ...withFriendFlow(createInitialDemoState()),

    dispatch: (action: AppAction) => {
      set((state) => friendFlowReducer(state, action));
    },

    advanceClockMinutes: (minutes: number) => {
      get().dispatch({ type: 'ADVANCE_CLOCK', ms: minutes * 60 * 1000 });
    },

    setClockTime: (timeMs: number) => {
      get().dispatch({ type: 'SET_CLOCK', now: timeMs });
    },

    setLiveClock: (isLive: boolean) => {
      get().dispatch({ type: 'SET_LIVE_CLOCK', isLive });

      if (isLive) {
        if (!liveInterval) {
          liveInterval = setInterval(() => {
            get().dispatch({ type: 'ADVANCE_CLOCK', ms: 1000 });
          }, 1000);
        }
      } else {
        if (liveInterval) {
          clearInterval(liveInterval);
          liveInterval = null;
        }
      }
    },
  };
});
