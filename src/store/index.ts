import { create } from 'zustand';
import { withBoard } from '../logic/boardFlow';
import { failureFlowReducer, initialFailure, type FailureFlowAction, type FailureState } from '../logic/failureFlow';
import { createInitialDemoState } from '../logic/seed';

export interface DemoStore extends FailureState {
  dispatch: (action: FailureFlowAction) => void;
  advanceClockMinutes: (minutes: number) => void;
  setClockTime: (timeMs: number) => void;
  setLiveClock: (isLive: boolean) => void;
}

export const useDemoStore = create<DemoStore>((set, get) => {
  let liveInterval: ReturnType<typeof setInterval> | null = null;

  return {
    ...withBoard(createInitialDemoState()),
    failure: initialFailure(),

    // 08: every action goes through the failure layer (→ board → friend → hold → base reducer)
    dispatch: (action: FailureFlowAction) => {
      set((state) => failureFlowReducer(state, action));
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

/** Replace domain state wholesale (deep links, jumps). Resets the failure slice unless `next` has one. */
export function setDemoState(next: FailureState) {
  useDemoStore.setState({ failure: initialFailure(), ...next });
}
