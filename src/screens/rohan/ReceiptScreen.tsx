import { useState } from 'react'
import { Check, ChevronLeft } from 'lucide-react'
import { Band, BottomSheet, Card, Hairline, IosShareSheet, PinnedFooter, PrimaryCTA, PriceRow, StatusBadge, type IosShareContact } from '@/ds'
import { useDemoStore } from '@/store'
import { selectGroupReceipt } from '@/logic/boardFlow'
import { selectSettledOutside } from '@/logic/failureFlow'

/**
 * Receipt (spec §4 step 9): who paid, what Rohan was charged, what was unblocked. Every amount from
 * `selectGroupReceipt`. 09: provisional while seats are kept ("Kept · charged at 9:15 PM unless a friend
 * pays"), final after the showtime settlement. No refund rows (refunds exist only on the pay-all-now rail).
 * The kept-seat actions (pay link / transfer, first wins) sit in the pinned footer.
 */
export interface ReceiptScreenProps {
  onBack?: () => void
}

const CONTACTS: IosShareContact[] = [
  { id: 'group', name: 'Friday movie', isGroup: true },
  { id: 'kabir', name: 'Kabir', initials: 'KA' },
  { id: 'neha', name: 'Neha', initials: 'NE' },
  { id: 'priya', name: 'Priya', initials: 'PR' },
]

export default function ReceiptScreen({ onBack }: ReceiptScreenProps) {
  const state = useDemoStore()
  const { dispatch } = state
  const r = selectGroupReceipt(state)
  const [shareOpen, setShareOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferTo, setTransferTo] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  if (!r) return null
  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }
  const k = r.kept
  const outside = selectSettledOutside(state)
  const sendLink = () => {
    if (!k) return
    dispatch({ type: 'SEND_PAY_LINK', seatId: k.seatId })
    setShareOpen(false)
    flash('Pay link sent')
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative select-none" style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }} data-testid="receipt">
      <header className="flex items-center px-4 h-[54px] shrink-0">
        <button type="button" onClick={onBack} className="w-11 h-11 -ml-2.5 flex items-center justify-center active:opacity-70" aria-label="Back">
          <ChevronLeft size={24} strokeWidth={1.75} />
        </button>
        <h1 className="text-[20px] leading-[26px] font-normal ml-0.5">Group hold</h1>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 flex flex-col gap-3 no-scrollbar [&>*]:shrink-0" style={{ overscrollBehavior: 'contain' }} data-tour="receipt">
        <Card
          testId="receipt-status"
          className="flex flex-col gap-3"
          band={r.lateNote ? <Band title={r.lateNote.title} testId="receipt-late-band">{r.lateNote.body}</Band> : undefined}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={r.badge} />
            <span className="text-[14px] leading-[20px]" style={{ color: 'var(--text-secondary)' }}>{r.statusLine}</span>
          </div>
          <div>
            <h2 className="text-[18px] leading-[24px] font-medium text-balance" data-testid="receipt-title">{r.title}</h2>
            <div className="mt-1 flex flex-col text-[14px] leading-[20px] text-pretty" style={{ color: 'var(--text-secondary)' }}>
              <span>{r.filmLine}</span>
              <span>{r.dateLine}</span>
              <span>{r.cinemaLine}</span>
            </div>
          </div>
        </Card>

        {/* Seat list: seat, who, status */}
        <Card testId="receipt-seats" className="flex flex-col">
          <h3 className="text-[16px] leading-[22px] font-medium pb-1">Seats</h3>
          {r.rows.map((row, i) => (
            <div key={row.seatId}>
              {i > 0 && <Hairline />}
              <div className="py-2.5 flex items-center gap-3" data-testid={`receipt-row-${row.seatId}`}>
                <span
                  className="w-11 h-8 rounded-[4px] flex items-center justify-center text-[13px] shrink-0"
                  style={
                    row.tone === 'released'
                      ? { backgroundColor: 'var(--seat-sold)', color: 'var(--text-secondary)' }
                      : row.tone === 'kept'
                        ? { backgroundColor: 'var(--seat-held-fill)', border: '1px solid var(--seat-held-border)', color: 'var(--text-warning)' }
                        : { backgroundColor: 'var(--seat-selected)', color: 'var(--text-on-brand)' }
                  }
                >
                  {row.seatId}
                </span>
                <span className="flex-1 min-w-0 flex flex-col">
                  <span className="text-[14px] leading-[20px]">{row.who}</span>
                  <span className="text-[12px] leading-[16px] text-pretty" style={{ color: 'var(--text-secondary)' }}>{row.status}</span>
                </span>
                <span className="text-[14px] leading-[20px] shrink-0">{row.amount}</span>
              </div>
            </div>
          ))}
        </Card>

        {/* Ledger: the ref-22 price card */}
        <Card testId="receipt-ledger" className="flex flex-col gap-3">
          {r.ledger.map((l) =>
            l.strong ? (
              <div key={l.key} className="flex flex-col gap-3">
                <Hairline dashed />
                <PriceRow label={l.label} value={l.value} strong testId={`ledger-${l.key}`} />
              </div>
            ) : (
              <PriceRow key={l.key} label={l.label} value={l.value} sub={l.sub} testId={`ledger-${l.key}`} />
            ),
          )}
        </Card>

        {k?.note && <Band standalone title={k.note.title} testId="kept-note">{k.note.body}</Band>}

        {/* 08 / spec §3: after showtime a kept seat can only be labelled (no dead pay-link button) */}
        {outside.map((o) =>
          o.marked ? (
            <Band key={o.seatId} standalone title={`${o.seatId} · Settled outside BMS`} testId="settled-outside">
              A label for your records only. It doesn't change what was charged.
            </Band>
          ) : null,
        )}

        <div className="h-3" aria-hidden />
      </div>

      {/* 09: pinned footer */}
      {(outside.some((o) => !o.marked) || (k && (k.payLinkEnabled || k.transferEnabled))) && (
        <PinnedFooter testId="receipt-footer">
          {outside
            .filter((o) => !o.marked)
            .map((o) => (
              <PrimaryCTA key={o.seatId} variant="outline" size="lg" onClick={() => dispatch({ type: 'MARK_SETTLED_OUTSIDE', seatId: o.seatId })}>
                Mark {o.seatId} as settled outside BMS
              </PrimaryCTA>
            ))}
          {k && (k.payLinkEnabled || k.transferEnabled) && (
            <>
              {k.payLinkEnabled && (
                <PrimaryCTA variant="strong" size="lg" onClick={() => setShareOpen(true)}>
                  {k.payLinkCta}
                </PrimaryCTA>
              )}
              {k.transferEnabled && (
                <button type="button" onClick={() => setTransferOpen(true)} className="self-center min-h-[44px] px-3 text-[14px] font-medium" style={{ color: 'var(--bms-red-text)' }}>
                  Transfer ticket instead
                </button>
              )}
            </>
          )}
        </PinnedFooter>
      )}

      {toast && (
        <div className="absolute top-16 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="toast-surface px-4 py-2 rounded-full text-[13px] font-medium shadow-lg" role="status">{toast}</div>
        </div>
      )}

      <IosShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        message={k?.payLinkMessage}
        contacts={CONTACTS}
        onSelectContact={sendLink}
        onSelectApp={sendLink}
        onCopy={sendLink}
      />

      <BottomSheet
        isOpen={transferOpen && !!k}
        onClose={() => setTransferOpen(false)}
        title={k ? `Transfer ${k.seatId}` : undefined}
        subtitle={k?.transferSubtitle}
        footer={
          <PrimaryCTA
            variant="strong"
            size="lg"
            disabled={!transferTo}
            onClick={() => {
              if (!k || !transferTo) return
              dispatch({ type: 'TRANSFER_TICKET', seatId: k.seatId, name: transferTo })
              setTransferOpen(false)
              flash(`${k.seatId} sent to ${transferTo}`)
            }}
          >
            {transferTo && k ? `Transfer ${k.seatId} to ${transferTo}` : 'Pick a friend'}
          </PrimaryCTA>
        }
      >
        <div className="flex flex-col" role="radiogroup">
          {k?.transferCandidates.map((name, i) => (
            <div key={name}>
              {i > 0 && <Hairline />}
              <button type="button" role="radio" aria-checked={transferTo === name} onClick={() => setTransferTo(name)} className="w-full min-h-[48px] flex items-center justify-between text-[15px]">
                {name}
                {transferTo === name && <Check size={20} strokeWidth={1.75} style={{ color: 'var(--bms-red)' }} />}
              </button>
            </div>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}
