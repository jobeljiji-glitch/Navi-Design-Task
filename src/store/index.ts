import { create } from 'zustand';
import { holdFlowReducer, type FlowAction } from '../logic/holdFlow';
import { createInitialDemoState } from '../logic/seed';
import type { DemoState } from '../logic/types';

export interface DemoStore extends DemoState {
  dispatch: (action: FlowAction) => void;
  advanceClockMinutes: (minutes: number) => void;
  setClockTime: (timeMs: number) => void;
  setLiveClock: (isLive: boolean) => void;
}

export const useDemoStore = create<DemoStore>((set, get) => {
  let liveInterval: ReturnType<typeof setInterval> | null = null;

  return {
    ...createInitialDemoState(),

    dispatch: (action: FlowAction) => {
      set((state) => holdFlowReducer(state, action));
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
