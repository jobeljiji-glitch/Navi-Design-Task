import BottomSheet from './BottomSheet'
import SeatCountPicker from './SeatCountPicker'
import PriceTierList, { type PriceTier } from './PriceTierList'
import PrimaryCTA from './PrimaryCTA'
import GroupHint from './GroupHint'

/**
 * "How many seats?" (ref 05 / 19), built on the shared BottomSheet:
 * fixed 22 pt / 400 title, scrollable middle, pinned "Select seats" CTA.
 */
export interface SeatCountSheetProps {
  isOpen: boolean
  onClose: () => void
  count: number
  onChangeCount: (count: number) => void
  onSelectSeats?: () => void
  tiers?: PriceTier[]
  className?: string
}

const DEFAULT_TIERS: PriceTier[] = [
  { name: 'RECLINER ROWS', price: 500, status: 'AVAILABLE' },
  { name: 'PRIME PLUS ROWS', price: 250, status: 'AVAILABLE' },
  { name: 'PRIME ROWS', price: 230, status: 'AVAILABLE' },
  { name: 'CLASSIC ROWS', price: 210, status: 'AVAILABLE' },
]

export default function SeatCountSheet({
  isOpen,
  onClose,
  count,
  onChangeCount,
  onSelectSeats,
  tiers = DEFAULT_TIERS,
  className = '',
}: SeatCountSheetProps) {
  const header = (
    <div className="px-4 pt-2 pb-1 text-left">
      <h2 className="text-[22px] leading-[28px] font-normal" style={{ color: 'var(--text-primary)' }}>
        How many seats?
      </h2>
    </div>
  )

  const footer = (
    <PrimaryCTA
      onClick={() => {
        onSelectSeats?.()
        onClose()
      }}
    >
      Select seats
    </PrimaryCTA>
  )

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} header={header} footer={footer} className={className} bodyClassName="!px-0" footerDivider={false} testId="seat-count-sheet">
      {/* Vehicle & Number Picker */}
      <div className="px-3 pt-2">
        <SeatCountPicker count={count} onChange={onChangeCount} />
      </div>

      {/* Hairline under the number row */}
      <div className="w-full h-[1px] my-3" style={{ backgroundColor: 'var(--divider)' }} />

      {/* Tiers */}
      <div className="px-4">
        <PriceTierList tiers={tiers} />
      </div>

      {/* Step 1a: group hint above the CTA when 3 or more seats */}
      {count >= 3 && (
        <div className="px-4 pt-3" data-testid="group-hint">
          <GroupHint />
        </div>
      )}
    </BottomSheet>
  )
}
