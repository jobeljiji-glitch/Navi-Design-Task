import { create } from 'zustand'

/**
 * 07 demo stage state (not app state): which mode, which tour step, where the phone is.
 * App/domain state stays in `useDemoStore`.
 */
export type StageMode = 'intro' | 'tour' | 'done' | 'explore'

export interface BannerCursor {
  notif: string | null
  sms: string | null
}

export interface StageState {
  mode: StageMode
  /** 0-based tour step */
  step: number
  /** Persona transition card text, or null */
  interstitial: string | null
  /** Bumped to remount the phone (jumps, restart) */
  phoneKey: number
  /** Current phone path incl. search (reported by the phone's router) */
  path: string
  /** Rohan's last path, restored when switching back to him */
  rohanPath: string
  /** Last banner ids Rohan has seen; survives RohanFlow remounts (persona switches) */
  cursor: BannerCursor
  /** "What just happened" */
  log: Array<{ id: number; at: number; text: string }>
}

export const useStageStore = create<StageState>(() => ({
  mode: 'intro',
  step: 0,
  interstitial: null,
  phoneKey: 0,
  path: '/rohan/movie',
  rohanPath: '/rohan/movie',
  cursor: { notif: null, sms: null },
  log: [],
}))
