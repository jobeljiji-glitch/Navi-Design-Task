import { useEffect, useRef, useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { Check, ChevronLeft, ChevronRight, Clock, MoreHorizontal, Plus, Minus, Scissors, XCircle } from 'lucide-react'
import {
  Band,
  BlockMeter,
  BottomSheet,
  Card,
  GroupStatusList,
  Hairline,
  IosShareSheet,
  KeepReleaseStepper,
  PinnedFooter,
  PrimaryCTA,
  PriceRow,
  SeatTileRow,
  SoftGroup,
  StatusBadge,
  TicketCard,
  type IosShareContact,
} from '@/ds'
import { useDemoStore } from '@/store'
import { selectHoldSuccess, selectShortenOptions } from '@/logic/holdFlow'
import {
  selectAddSeatSheet,
  selectBoard,
  selectCancelSheet,
  selectCoverSheet,
  selectReleaseSheet,
  selectSettlementSteps,
  selectT30Sheet,
} from '@/logic/boardFlow'

/**
 * Group status board (spec §4 step 7) + T−30 sheet (step 8) + showtime settlement animation (step 9).
 * Same surfaces as the 04d Group hold screen: grey page, white 8 pt cards, flush ref-22 bands,
 * ref-22 price rows, the seat tiles. 09: one row per seat (names only when BMS knows them),
 * "Share a reminder" through Rohan's own apps, and the CTA in a pinned footer.
 */
export type BoardSheet = 'release' | 't30' | 'cover' | 'more' | 'shorten' | 'add' | 'cancel' | null

export interface BoardScreenProps {
  onBack?: () => void
  onOpenChat?: () => void
  /** Hold settled (or was already): go to the receipt */
  onSettled?: () => void
  initialSheet?: BoardSheet
}

const SHARE_CONTACTS: IosShareContact[] = [
  { id: 'group', name: 'Friday movie', isGroup: true },
  { id: 'amit', name: 'Amit', initials: 'AM' },
  { id: 'sana', name: 'Sana', initials: 'SA' },
  { id: 'priya', name: 'Priya', initials: 'PR' },
]

const STEP_MS = 1100

function Dots() {
  return (
    <span className="flex gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: 'var(--text-warning)' }}
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  )
}

function SheetRow({ icon, title, sub, onClick, danger = false, disabled = false, testId }: { icon: ReactNode; title: string; sub?: string; onClick: () => void; danger?: boolean; disabled?: boolean; testId?: string }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="w-full min-h-[56px] py-2.5 flex items-center gap-3 text-left disabled:opacity-40 active:opacity-70" data-testid={testId}>
      <span className="shrink-0" style={{ color: danger ? 'var(--bms-red-text)' : 'var(--text-primary)' }}>{icon}</span>
      <span className="flex-1 min-w-0 flex flex-col">
        <span className="text-[15px] leading-[20px]" style={{ color: danger ? 'var(--bms-red-text)' : 'var(--text-primary)' }}>{title}</span>
        {sub && <span className="text-[12px] leading-[16px] text-pretty" style={{ color: 'var(--text-secondary)' }}>{sub}</span>}
      </span>
      <ChevronRight size={18} strokeWidth={1.75} className="shrink-0" style={{ color: 'var(--text-tertiary)' }} />
    </button>
  )
}

export default function BoardScreen({ onBack, onOpenChat, onSettled, initialSheet = null }: BoardScreenProps) {
  const state = useDemoStore()
  const { dispatch } = state
  const v = selectBoard(state)
  const success = selectHoldSuccess(state)
  const status = state.hold?.status

  const [sheet, setSheet] = useState<BoardSheet>(initialSheet)
  const [releaseSeat, setReleaseSeat] = useState<string | null>(null)
  const [keep, setKeep] = useState<number | undefined>(undefined)
  const [cover, setCover] = useState(1)
  const [shortenTo, setShortenTo] = useState<number | null>(null)
  const [shareOpen, setShareOpen] = useState<false | 'link' | 'reminder'>(false)
  const [ticketOpen, setTicketOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Settlement: if it happens while the board is open, play the steps, then go to the receipt.
  const startStatus = useRef(status)
  if (startStatus.current === undefined) startStatus.current = status // deep links seed after the first render
  const [settling, setSettling] = useState(0) // steps shown done
  const steps = selectSettlementSteps(state)
  useEffect(() => {
    const ended = status === 'settled' || status === 'cancelled'
    if (!ended) return
    if (startStatus.current === status || status === 'cancelled') {
      onSettled?.()
      return
    }
    setSheet(null)
    setSettling(1)
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (settling === 0) return
    const t = setTimeout(() => (settling > steps.length ? onSettled?.() : setSettling(settling + 1)), STEP_MS)
    return () => clearTimeout(t)
  }, [settling]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sheet sub-state resets when a sheet opens
  useEffect(() => {
    if (sheet === 't30') setKeep(undefined)
    if (sheet === 'release') setReleaseSeat(null)
    if (sheet === 'cover') setCover(1)
    if (sheet === 'shorten') setShortenTo(null)
  }, [sheet])

  if (!v || !success) return null

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }
  const close = () => setSheet(null)

  const release = selectReleaseSheet(state, releaseSeat)
  const t30 = selectT30Sheet(state, keep)
  const coverV = selectCoverSheet(state, cover)
  const addV = selectAddSeatSheet(state)
  const cancelV = selectCancelSheet(state)
  const shortenOpts = selectShortenOptions(state)
  const pct = Math.round((v.paidCount / v.totalCount) * 100)
  const active = v.status === 'active'
  const closed = v.status === 'closed'

  return (
    <div className="w-full h-full flex flex-col overflow-hidden relative select-none" style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }} data-testid="board">
      <header className="flex items-center px-4 h-[54px] shrink-0 gap-0.5">
        <button type="button" onClick={onBack} className="w-11 h-11 -ml-2.5 flex items-center justify-center active:opacity-70 shrink-0" aria-label="Back">
          <ChevronLeft size={24} strokeWidth={1.75} />
        </button>
        <div className="flex-1 min-w-0 flex flex-col">
          <h1 className="text-[20px] leading-[24px] font-normal truncate">{v.title}</h1>
          <p className="text-[13px] leading-[17px] truncate" style={{ color: 'var(--text-secondary)' }}>{v.subtitle}</p>
        </div>
        {active && (
          <button type="button" onClick={() => setSheet('more')} className="w-11 h-11 -mr-2.5 flex items-center justify-center active:opacity-70 shrink-0" aria-label="More">
            <MoreHorizontal size={24} strokeWidth={1.75} />
          </button>
        )}
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 flex flex-col gap-3 no-scrollbar [&>*]:shrink-0" style={{ overscrollBehavior: 'contain' }}>
        {v.t30 && (
          <Band
            standalone
            tone="warning"
            testId="t30-band"
            title={v.t30.title}
            action={
              <button type="button" onClick={() => setSheet('t30')} className="-my-3 -mr-2 h-11 px-2 text-[14px] font-medium shrink-0" style={{ color: 'var(--bms-red-text)' }}>
                Decide
              </button>
            }
          >
            {v.t30.body}
          </Band>
        )}
        {v.closedBand && (
          <Band standalone tone="warning" testId="closed-band" title={<span className="inline-flex items-center gap-2">{v.closedBand.title} {v.closedBand.title.includes('progress') && <Dots />}</span>}>
            {v.closedBand.body}
          </Band>
        )}

        {/* Card 1: what's left to cover, the meter, the rules band */}
        <Card testId="board-money" className="flex flex-col gap-3" band={active ? <Band title={v.rulesTitle} testId="board-rules-band">{v.rulesBody}</Band> : undefined}>
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status="GROUP HOLD" />
            <span className="text-[14px] leading-[20px] inline-flex items-center gap-1" style={{ color: v.pillTone === 'warning' ? 'var(--text-warning)' : 'var(--text-secondary)' }} data-testid="pay-by">
              <Clock size={14} strokeWidth={1.75} aria-hidden />
              {v.pill}
            </span>
          </div>
          <div data-tour="board-headline">
            <p className="text-[24px] leading-[30px] font-medium text-balance" data-testid="set-aside">
              {v.headline}
            </p>
            <p className="text-[14px] leading-[20px] mt-0.5" style={{ color: 'var(--text-secondary)' }} data-testid="headline-sub">{v.headlineSub}</p>
          </div>
          <Hairline />
          <div data-tour="block-meter">
            <BlockMeter
              youPaidPaise={v.meter.charged}
              friendsPaidPaise={v.meter.friendsPaid}
              stillBlockedPaise={v.meter.toCover}
              youPaidLabel={v.meter.chargedLabel}
              friendsPaidLabel={v.meter.friendsLabel}
              stillBlockedLabel={v.meter.toCoverLabel}
            />
          </div>
        </Card>

        {/* Card 2: the seats */}
        <Card testId="board-seats" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[16px] leading-[22px] font-medium">Who's in</h3>
            <span className="text-[14px] leading-[20px]" style={{ color: 'var(--text-secondary)' }}>{v.paidLine}</span>
          </div>
          <SeatTileRow tiles={v.tiles} />
          <div className="w-full h-1 rounded-full" style={{ backgroundColor: 'var(--bg-muted)' }} role="progressbar" aria-valuenow={v.paidCount} aria-valuemin={0} aria-valuemax={v.totalCount} aria-label={v.paidLine}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: 'var(--showtime-green)' }} />
          </div>
        </Card>

        {/* Card 3: status list with inline actions */}
        <Card testId="board-status" className="flex flex-col">
          <GroupStatusList
            rows={v.rows}
            declinedNames={v.declined.map((d) => d.name)}
            waitingCount={active ? v.waitingCount : 0}
            notOpenedCount={v.notOpenedCount}
            canRelease={v.canRelease}
            onReleaseSeat={() => setSheet('release')}
            onKeepSeat={(name) => {
              dispatch({ type: 'DECLINE_KEEP', name })
              flash('The seat stays in the group')
            }}
            onCoverSeats={v.canCover ? () => setSheet('cover') : undefined}
            onShareReminder={v.canShareReminder ? () => setShareOpen('reminder') : undefined}
          />
          {active && v.canRelease && (
            <>
              <Hairline className="mt-1" />
              <button type="button" onClick={() => setSheet('release')} className="min-h-[44px] pt-2 flex items-center justify-between text-left" data-testid="free-release-line">
                <span className="text-[14px] leading-[20px]" style={{ color: 'var(--text-secondary)' }}>Release a seat from the end of the row</span>
                <span className="text-[14px] font-medium" style={{ color: 'var(--bms-red-text)' }}>Release</span>
              </button>
            </>
          )}
        </Card>

        <Card padded={false}>
          <button type="button" onClick={() => setTicketOpen(true)} className="w-full p-4 flex items-center justify-between text-left" data-testid="ticket-row">
            <span className="text-[14px]">Your ticket</span>
            <span className="flex items-center gap-1 text-[14px]" style={{ color: 'var(--text-secondary)' }}>
              {v.ownerSeatId}
              <ChevronRight size={18} strokeWidth={1.75} />
            </span>
          </button>
        </Card>

        <div className="h-3" aria-hidden />
      </div>

      {/* 09: pinned footer, the CTA never scrolls away */}
      {active && (
        <PinnedFooter layout="row" testId="board-footer">
          <div className="w-[104px] shrink-0">
            <PrimaryCTA variant="outline" size="lg" onClick={() => setSheet('more')}>More</PrimaryCTA>
          </div>
          <div className="flex-1 min-w-0">
            <PrimaryCTA variant="strong" size="lg" onClick={() => setShareOpen('link')}>Share link again</PrimaryCTA>
          </div>
        </PinnedFooter>
      )}
      {closed && (
        <PinnedFooter testId="board-footer" caption={v.closedFooterCaption}>
          <PrimaryCTA variant="strong" size="lg" onClick={() => onSettled?.()}>View receipt</PrimaryCTA>
        </PinnedFooter>
      )}

      {toast && (
        <div className="absolute top-16 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-black/85 text-white px-4 py-2 rounded-full text-[13px] font-medium shadow-lg text-center" role="status">{toast}</div>
        </div>
      )}

      {/* Release a seat (edges only; fee line before confirming) */}
      <BottomSheet
        isOpen={sheet === 'release' && !!release}
        onClose={close}
        title={release?.title}
        subtitle={release?.subtitle}
        testId="release-sheet"
        footer={
          release && (
            <div className="flex flex-col items-center gap-1">
              <PrimaryCTA
                variant="strong"
                size="lg"
                onClick={() => {
                  dispatch({ type: 'RELEASE_SEATS', seatIds: [release.seatId] })
                  close()
                  flash(`${release.seatId} is back on sale`)
                }}
              >
                {release.cta}
              </PrimaryCTA>
              <span className="text-[12px] leading-[16px]" style={{ color: 'var(--text-secondary)' }}>{release.caption}</span>
            </div>
          )
        }
      >
        {release && (
          <div className="flex flex-col gap-4 pb-1">
            <SeatTileRow
              tiles={release.tiles}
              onTileClick={(id) => setReleaseSeat(id)}
              isTappable={(t) => release.tiles.find((x) => x.id === t.id)?.tappable ?? false}
            />
            <SoftGroup className="flex flex-col gap-3">
              <PriceRow label={release.blockedRow.label} value={release.blockedRow.value} />
              <PriceRow label={release.feeRow.label} value={release.feeRow.value} />
              <Hairline dashed />
              <PriceRow label={release.backRow.label} value={release.backRow.value} strong testId="release-back" />
            </SoftGroup>
            <Band standalone tone={release.feeKept ? 'warning' : 'success'} title={release.feeLine} testId="release-fee-band" />
          </div>
        )}
      </BottomSheet>

      {/* T−30: keep or release, live summary */}
      <BottomSheet
        isOpen={sheet === 't30' && !!t30 && t30.unpaid > 0}
        onClose={close}
        title={t30?.title}
        subtitle={t30?.subtitle}
        testId="t30-sheet"
        footer={
          t30 && (
            <div className="flex flex-col items-center gap-1" data-tour="t30-confirm">
              <PrimaryCTA
                variant="strong"
                size="lg"
                onClick={() => {
                  if (t30.releaseIds.length) dispatch({ type: 'RELEASE_SEATS', seatIds: t30.releaseIds })
                  dispatch({ type: 'T30_DECIDED' })
                  close()
                  flash(t30.release ? `${t30.releaseIds.join(', ')} back on sale` : `Keeping ${t30.keep} ${t30.keep === 1 ? 'seat' : 'seats'}`)
                }}
              >
                {t30.cta}
              </PrimaryCTA>
              <span className="text-[12px] leading-[16px]" style={{ color: 'var(--text-secondary)' }}>{t30.caption}</span>
            </div>
          )
        }
      >
        {t30 && (
          <div className="flex flex-col gap-4 pb-1">
            <KeepReleaseStepper
              totalSeats={t30.unpaid}
              keepCount={t30.keep}
              minKeep={t30.minKeep}
              onChange={setKeep}
              keepCaption={t30.keepCaption}
              releaseCaption={t30.releaseCaption}
            />
            <SoftGroup className="flex flex-col gap-3">
              <PriceRow label={t30.chargeRow.label} value={t30.chargeRow.value} testId="t30-charge" />
              <PriceRow label={t30.feeRow.label} value={t30.feeRow.value} sub={t30.feeRow.sub} testId="t30-fee" />
            </SoftGroup>
          </div>
        )}
      </BottomSheet>

      {/* Cover seats */}
      <BottomSheet
        isOpen={sheet === 'cover' && !!coverV && coverV.max > 0}
        onClose={close}
        title={coverV?.title}
        subtitle={coverV?.subtitle}
        footer={
          coverV && (
            <PrimaryCTA
              variant="strong"
              size="lg"
              onClick={() => {
                dispatch({ type: 'COVER_SEATS', count: coverV.count })
                close()
                flash(`You covered ${coverV.ids.join(', ')}`)
              }}
            >
              {coverV.cta}
            </PrimaryCTA>
          )
        }
      >
        {coverV && (
          <SoftGroup className="flex items-center justify-between gap-3">
            <div className="flex flex-col min-w-0">
              <span className="text-[14px] leading-[20px]">{coverV.row.label}</span>
              <span className="text-[12px] leading-[16px]" style={{ color: 'var(--text-secondary)' }}>{coverV.row.sub} · {coverV.row.value}</span>
            </div>
            <div className="flex items-center rounded-full border shrink-0" style={{ borderColor: 'var(--divider)', backgroundColor: 'var(--bg-surface)' }}>
              <button type="button" className="w-11 h-11 flex items-center justify-center disabled:opacity-40" disabled={coverV.count <= 1} onClick={() => setCover(coverV.count - 1)} aria-label="Cover one seat fewer">
                <Minus size={18} strokeWidth={1.75} style={{ color: 'var(--bms-red)' }} />
              </button>
              <span className="w-6 text-center text-[16px] font-medium" aria-live="polite">{coverV.count}</span>
              <button type="button" className="w-11 h-11 flex items-center justify-center disabled:opacity-40" disabled={coverV.count >= coverV.max} onClick={() => setCover(coverV.count + 1)} aria-label="Cover one more seat">
                <Plus size={18} strokeWidth={1.75} style={{ color: 'var(--bms-red)' }} />
              </button>
            </div>
          </SoftGroup>
        )}
      </BottomSheet>

      {/* More */}
      <BottomSheet isOpen={sheet === 'more'} onClose={close} title="More" testId="more-sheet">
        <div className="flex flex-col">
          <SheetRow icon={<Scissors size={22} strokeWidth={1.75} />} title="Shorten deadline" sub={`Friends pay by ${success.payBy}. You can shorten it, never extend it.`} onClick={() => setSheet('shorten')} disabled={shortenOpts.length === 0} />
          <Hairline />
          <SheetRow icon={<Plus size={22} strokeWidth={1.75} />} title="Add a seat" sub={v.addSeatId ? `${v.addSeatId}, next to your group` : 'No seat free next to your group'} onClick={() => setSheet('add')} disabled={!v.canAddSeat} />
          <Hairline />
          <SheetRow icon={<XCircle size={22} strokeWidth={1.75} />} title="Cancel hold" sub={v.cancelNote || 'Unpaid seats go back on sale'} onClick={() => setSheet('cancel')} danger disabled={!v.canCancel} testId="more-cancel" />
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={sheet === 'shorten'}
        onClose={close}
        title="Shorten the deadline"
        subtitle="Friends see the new time on the link page. You can't extend it later."
        footer={
          <PrimaryCTA
            variant="strong"
            size="lg"
            disabled={shortenTo === null}
            onClick={() => {
              if (shortenTo !== null) dispatch({ type: 'SHORTEN_DEADLINE', newDeadline: shortenTo })
              close()
              flash('Deadline shortened')
            }}
          >
            {shortenTo === null ? 'Pick a time' : `Friends pay by ${shortenOpts.find((o) => o.deadline === shortenTo)?.label}`}
          </PrimaryCTA>
        }
      >
        <div className="flex flex-col" role="radiogroup">
          {shortenOpts.map((o, i) => (
            <div key={o.deadline}>
              {i > 0 && <Hairline />}
              <button type="button" role="radio" aria-checked={shortenTo === o.deadline} onClick={() => setShortenTo(o.deadline)} className="w-full min-h-[48px] flex items-center justify-between text-[15px]">
                {o.label}
                {shortenTo === o.deadline && <Check size={20} strokeWidth={1.75} style={{ color: 'var(--bms-red)' }} />}
              </button>
            </div>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={sheet === 'add' && !!addV}
        onClose={close}
        title={addV?.title}
        subtitle={addV?.subtitle}
        footer={
          addV && (
            <PrimaryCTA
              variant="strong"
              size="lg"
              onClick={() => {
                dispatch({ type: 'ADD_SEAT' })
                close()
                flash(`${addV.seatId} added to the group`)
              }}
            >
              {addV.cta}
            </PrimaryCTA>
          )
        }
      >
        {addV && (
          <SoftGroup>
            <PriceRow label={addV.row.label} value={addV.row.value} sub={addV.row.sub} />
          </SoftGroup>
        )}
      </BottomSheet>

      <BottomSheet
        isOpen={sheet === 'cancel' && !!cancelV}
        onClose={close}
        title={cancelV?.title}
        subtitle={cancelV?.subtitle}
        footer={
          cancelV && (
            <div className="flex flex-col items-center gap-1">
              <PrimaryCTA
                variant="strong"
                size="lg"
                onClick={() => {
                  dispatch({ type: 'CANCEL_HOLD' })
                  close()
                }}
              >
                {cancelV.cta}
              </PrimaryCTA>
              <span className="text-[12px] leading-[16px]" style={{ color: 'var(--text-secondary)' }}>{cancelV.caption}</span>
            </div>
          )
        }
      >
        {cancelV && (
          <SoftGroup className="flex flex-col gap-3">
            {cancelV.rows.map((r) => (
              <PriceRow key={r.label} label={r.label} value={r.value} />
            ))}
          </SoftGroup>
        )}
      </BottomSheet>

      {/* Settlement at showtime (9:15 PM): steps tick off, then the final receipt */}
      <BottomSheet isOpen={settling > 0} onClose={() => undefined} locked scrimClose={false} title="Settling your group hold" testId="settling-sheet">
        <ol className="flex flex-col gap-3 pb-2">
          {steps.map((s, i) => {
            const done = i < settling
            return (
              <li key={s} className="flex items-center gap-3 text-[15px] leading-[20px]" style={{ color: done ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: done ? 'var(--seat-selected)' : 'var(--bg-muted)', color: 'var(--text-on-brand)' }}
                >
                  {done && <Check size={14} strokeWidth={2.25} />}
                </span>
                {s}
              </li>
            )
          })}
        </ol>
      </BottomSheet>

      {/* Share link again, or (09) "Share a reminder": a BMS-written progress card, no names, via Rohan's own apps */}
      <IosShareSheet
        isOpen={!!shareOpen}
        onClose={() => setShareOpen(false)}
        message={shareOpen === 'reminder' ? v.reminderShare.message : success.shareMessage.split('\n')[0]}
        card={shareOpen === 'reminder' ? { title: v.reminderShare.cardTitle, body: v.reminderShare.cardBody, link: v.reminderShare.link } : undefined}
        contacts={SHARE_CONTACTS}
        onSelectContact={(c) => {
          const reminder = shareOpen === 'reminder'
          setShareOpen(false)
          if (reminder) {
            dispatch({ type: 'SEND_ORGANISER_REMINDER' })
            flash(`Reminder shared with ${c.name}`)
          } else if (c.isGroup) onOpenChat?.()
        }}
        onSelectApp={(app) => {
          const reminder = shareOpen === 'reminder'
          setShareOpen(false)
          if (reminder) {
            dispatch({ type: 'SEND_ORGANISER_REMINDER' })
            flash('Reminder shared')
          } else if (app === 'WhatsApp') onOpenChat?.()
        }}
        onCopy={() => {
          setShareOpen(false)
          flash('Link copied')
        }}
      />

      {ticketOpen && (
        <div className="absolute inset-0 z-50 overflow-y-auto no-scrollbar" style={{ backgroundColor: 'var(--bg-tag)' }} data-testid="ticket-overlay">
          <TicketCard
            seat={success.ticketSeat}
            totalAmount={success.ticketAmount}
            ticketCount="1 Ticket(s)"
            groupBannerText={success.ticketBanner}
            className="min-h-full"
            onViewGroup={() => setTicketOpen(false)}
            onClose={() => setTicketOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
