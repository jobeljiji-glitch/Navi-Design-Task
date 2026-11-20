import { createContext, useContext, useEffect, type ReactNode } from 'react'
import {
  MemoryRouter,
  UNSAFE_LocationContext,
  UNSAFE_RouteContext,
  useLocation,
  useNavigate,
  type NavigateFunction,
} from 'react-router-dom'

/**
 * The stage lives at `#/` under the app's HashRouter, but the phone needs its own history so
 * the existing screens' `navigate()` calls work unchanged. React Router v6 refuses a Router
 * inside a Router, so the outer location/route contexts are reset first (D-095).
 */
const EMPTY_ROUTE = { outlet: null, matches: [], isDataRoute: false }

let phoneNavigate: NavigateFunction | null = null
/** Navigate the phone from outside it (tour, controller). */
export function navPhone(to: string, replace = false) {
  phoneNavigate?.(to, { replace })
}

function Bridge({ onPath, isCurrent }: { onPath: (path: string) => void; isCurrent: () => boolean }) {
  const navigate = useNavigate()
  const location = useLocation()
  // A router that is being replaced (jump/restart remount, StrictMode effect re-runs) stays quiet.
  useEffect(() => {
    if (isCurrent()) phoneNavigate = navigate
  }, [navigate]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (isCurrent()) onPath(location.pathname + location.search)
  }, [location.pathname, location.search]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export default function PhoneRouter({
  initialPath,
  onPath,
  isCurrent,
  children,
}: {
  initialPath: string
  onPath: (path: string) => void
  isCurrent: () => boolean
  children: ReactNode
}) {
  return (
    <UNSAFE_LocationContext.Provider value={null as never}>
      <UNSAFE_RouteContext.Provider value={EMPTY_ROUTE as never}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Bridge onPath={onPath} isCurrent={isCurrent} />
          <StageFlag.Provider value={true}>{children}</StageFlag.Provider>
        </MemoryRouter>
      </UNSAFE_RouteContext.Provider>
    </UNSAFE_LocationContext.Provider>
  )
}

/** True inside the demo stage's phone: flows skip deep-link seeding and share banner state. */
const StageFlag = createContext(false)
export function useInStage() {
  return useContext(StageFlag)
}
