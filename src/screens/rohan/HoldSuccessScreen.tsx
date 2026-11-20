import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Band,
  BottomSheet,
  Card,
  Hairline,
  PriceRow,
  IosNotification,
  IosShareSheet,
  PrimaryCTA,
  SeatTileRow,
  StatusBadge,
  TicketCard,
  type IosShareContact,
} from '@/ds'
import { useDemoStore } from '@/store'
import { selectHoldSuccess } from '@/logic/holdFlow'

/**
 * "Group hold" success screen (04b/04c). Grey page + white 8 pt cards (ref 22),
 * badge + status line (ref 14), "who's in" as seat tiles, money card in Confirm-booking style,
 * ticket row opening the M-Ticket (ref 16 / 02b).
 */
export interface HoldSuccessScreenProps {
  onBack?: () => void
  /** "Friday movie" contact or the WhatsApp tile in the share sheet: opens the simulated chat */
  onOpenChat?: () => void
  /** Bank SMS banner on mount (off on the board stand-in so it doesn't repeat) */
  showSms?: boolean
  /** The M-Ticket's group strip ("View group ›") opens the status board (06) */
  onViewGroup?: () => void
}

const SHARE_CONTACTS: IosShareContact[] = [
  { id: 'group', name: 'Friday movie', isGroup: true },
  { id: 'amit', name: 'Amit', initials: 'AM' },
  { id: 'sana', name: 'Sana', initials: 'SA' },
  { id: 'priya', name: 'Priya', initials: 'PR' },
]

const SMS_DELAY_MS = 600
const SMS_SHOW_MS = 4000

export default function HoldSuccessScreen({ onBack, onOpenChat, showSms = true, onViewGroup }: HoldSuccessScreenProps) {
  const state = useDemoStore()
  const v = selectHoldSuccess(state)
  const sms = showSms ? state.smsToasts[0] : undefined

  const [smsVisible, setSmsVisible] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [ticketOpen, setTicketOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Bank SMS: in after 600 ms, auto-hides after 4 s (IosNotification), over the status bar
  useEffect(() => {
    if (!sms) return
    const t = setTimeout(() => setSmsVisible(true), SMS_DELAY_MS)
    return () => clearTimeout(t)
  }, [sms?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!v) return null

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const copyLink = () => {
    try {
      void navigator.clipboard?.writeText(`https://${v.link}`).catch(() => undefined)
    } catch {
      /* clipboard unavailable: the toast is the feedback */
    }
    flash('Link copied')
  }

  const pct = Math.round((v.paidCount / v.totalCount) * 100)

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden relative select-none"
      style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}
      data-testid="hold-success"
    >
      {/* Plain chevron header on the page grey (ref 22) */}
      <header className="flex items-center px-4 h-[54px] shrink-0">
        <button type="button" onClick={onBack} className="w-11 h-11 -ml-2.5 flex items-center justify-center active:opacity-70" aria-label="Back">
          <ChevronLeft size={24} strokeWidth={1.75} />
        </button>
        <h1 className="text-[20px] leading-[26px] font-normal ml-0.5">Group hold</h1>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 flex flex-col gap-3 no-scrollbar [&>*]:shrink-0" style={{ overscrollBehavior: 'contain' }}>
        {/* Card 1: status, with the rules as the ref-22 band flush on its bottom edge */}
        <Card testId="status-card" className="flex flex-col gap-3" band={<Band title={v.rulesBand.split(' · ')[0]} testId="status-band">{v.rulesBand.split(' · ')[1]}</Band>}>
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status="GROUP HOLD" />
            <span className="text-[14px] leading-[20px]" style={{ color: 'var(--text-secondary)' }}>{v.statusLine}</span>
          </div>
          <div>
            <h2 className="text-[18px] leading-[24px] font-medium text-balance">{v.title}</h2>
            <div className="mt-1 flex flex-col text-[14px] leading-[20px] text-pretty" style={{ color: 'var(--text-secondary)' }}>
              <span>{v.filmLine}</span>
              <span>{v.dateLine}</span>
              <span>{v.cinemaLine}</span>
            </div>
          </div>
        </Card>

        {/* Card 2: who's in — tiles, labels and progress all inside the 16 pt padding */}
        <Card testId="whos-in" className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[16px] leading-[22px] font-medium">Who's in</h3>
            <span className="text-[14px] leading-[20px]" style={{ color: 'var(--text-secondary)' }}>{v.paidLine}</span>
          </div>
          <SeatTileRow tiles={v.tiles} />
          <div
            className="w-full h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--bg-muted)' }}
            role="progressbar"
            aria-valuenow={v.paidCount}
            aria-valuemin={0}
            aria-valuemax={v.totalCount}
            aria-label={v.paidLine}
          >
            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: 'var(--showtime-green)' }} />
          </div>
        </Card>

        {/* Card 3: the Confirm-booking price card (ref 22), then the split */}
        <Card testId="money-card" className="flex flex-col gap-3">
          <PriceRow label={v.ticketsLabel} value={v.ticketsPrice} testId="money-tickets" />
          <PriceRow label="Convenience fees" value={v.feesPrice} testId="money-fees" />
          <Hairline dashed />
          <PriceRow label="Order total" value={v.orderTotal} strong testId="money-total" />
          <Hairline className="my-1" />
          <PriceRow label={v.splitPaidLabel} value={v.paid} testId="split-paid" />
          <PriceRow label={v.splitWaitingLabel} value={v.blocked} sub={v.splitWaitingSub} testId="split-waiting" />
        </Card>

        {/* The only ticket row */}
        <Card padded={false}>
          <button
            type="button"
            onClick={() => setTicketOpen(true)}
            className="w-full p-4 flex items-center justify-between text-left"
            data-testid="ticket-row"
          >
            <span className="text-[14px]">Your ticket</span>
            <span className="flex items-center gap-1 text-[14px]" style={{ color: 'var(--text-secondary)' }}>
              {v.ownerSeatId}
              <ChevronRight size={18} strokeWidth={1.75} />
            </span>
          </button>
        </Card>

        {/* Actions follow the cards (no empty gap): one primary + text links */}
        <div className="flex flex-col items-center gap-0.5 pt-1 cta-safe">
          <div className="w-full" data-tour="send-to-group">
            <PrimaryCTA variant="strong" size="lg" onClick={() => setShareOpen(true)}>Send to your group</PrimaryCTA>
          </div>
          <div className="flex items-center text-[14px] font-medium" style={{ color: 'var(--bms-red-text)' }}>
            <button type="button" onClick={copyLink} className="px-3 py-2.5">Copy link</button>
            <span aria-hidden style={{ color: 'var(--text-secondary)' }}>·</span>
            <button type="button" onClick={() => setQrOpen(true)} className="px-3 py-2.5">Show QR</button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="absolute top-16 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-black/85 text-white px-4 py-2 rounded-full text-[13px] font-medium shadow-lg" role="status">{toast}</div>
        </div>
      )}

      {sms && (
        <IosNotification
          inFrameOverlay
          app="sms"
          title="OKBANK"
          body={sms.text}
          visible={smsVisible}
          autoDismissMs={SMS_SHOW_MS}
          onDismiss={() => setSmsVisible(false)}
          onClick={() => setSmsVisible(false)}
        />
      )}

      <IosShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        message={v.shareMessage.split('\n')[0]}
        contacts={SHARE_CONTACTS}
        onSelectContact={(c) => {
          setShareOpen(false)
          if (c.isGroup) onOpenChat?.()
        }}
        onSelectApp={(app) => {
          setShareOpen(false)
          if (app === 'WhatsApp') onOpenChat?.()
        }}
        onCopy={() => {
          setShareOpen(false)
          copyLink()
        }}
      />

      <BottomSheet isOpen={qrOpen} onClose={() => setQrOpen(false)} title="Scan to join the group" subtitle={`Friends pay by ${v.payBy}`}>
        <div className="flex flex-col items-center gap-2 pt-1 pb-2">
          <div className="p-3 border" style={{ borderColor: 'var(--divider)', borderRadius: 'var(--card-radius)' }}>
            <QRCodeSVG value={`https://${v.link}`} size={180} />
          </div>
          <span className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>{v.link}</span>
        </div>
      </BottomSheet>

      {ticketOpen && (
        <div className="absolute inset-0 z-50 overflow-y-auto no-scrollbar" style={{ backgroundColor: 'var(--bg-tag)' }} data-testid="ticket-overlay">
          <TicketCard
            seat={v.ticketSeat}
            totalAmount={v.ticketAmount}
            ticketCount="1 Ticket(s)"
            groupBannerText={v.ticketBanner}
            className="min-h-full"
            onViewGroup={() => {
              setTicketOpen(false)
              onViewGroup?.()
            }}
            onClose={() => setTicketOpen(false)}
            onShare={() => {
              setTicketOpen(false)
              setShareOpen(true)
            }}
          />
        </div>
      )}
    </div>
  )
}
