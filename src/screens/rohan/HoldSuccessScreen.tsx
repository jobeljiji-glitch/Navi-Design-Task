import { useEffect, useState } from 'react'
import { ChevronLeft, Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { BottomSheet, IosNotification, IosShareSheet, PrimaryCTA, StatusBadge, type IosShareContact } from '@/ds'
import { useDemoStore } from '@/store'
import { selectHoldSuccess } from '@/logic/holdFlow'
import { selectBoardSummary } from '@/logic/selectors'
import { DEMO_SHOW } from '@/logic/seed'

/**
 * Step 3 success: BMS screen after the block is approved.
 * Header + white 8 pt cards on the page grey from ref 22; badge footer from ref 14.
 */
export interface HoldSuccessScreenProps {
  onBack?: () => void
}

const SHARE_CONTACTS: IosShareContact[] = [
  { id: 'group', name: 'Friday movie', isGroup: true },
  { id: 'amit', name: 'Amit', initials: 'AM' },
  { id: 'sana', name: 'Sana', initials: 'SA' },
  { id: 'priya', name: 'Priya', initials: 'PR' },
]

function LedgerRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 text-[14px] leading-[20px] ${strong ? 'font-medium' : ''}`}
    >
      <span style={{ color: strong ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

export default function HoldSuccessScreen({ onBack }: HoldSuccessScreenProps) {
  const state = useDemoStore()
  const v = selectHoldSuccess(state)
  const board = selectBoardSummary(state)
  const sms = state.smsToasts[0]

  const [smsVisible, setSmsVisible] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Bank SMS slides in shortly after landing here
  useEffect(() => {
    if (!sms) return
    const t = setTimeout(() => setSmsVisible(true), 500)
    return () => clearTimeout(t)
  }, [sms?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!v || !board) return null

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const copyLink = () => {
    try {
      void navigator.clipboard?.writeText(`https://${v.link}`).catch(() => undefined)
    } catch {
      /* clipboard unavailable in the sandbox: the toast is the feedback */
    }
    flash('Link copied')
  }

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden relative select-none"
      style={{ backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}
      data-testid="hold-success"
    >
      {/* Header on the page grey, like "Confirm booking" (ref 22) */}
      <header className="flex items-center px-4 h-[54px] shrink-0">
        <button type="button" onClick={onBack} className="w-11 h-11 -ml-2.5 flex items-center justify-center active:opacity-70" aria-label="Back">
          <ChevronLeft size={24} strokeWidth={1.75} />
        </button>
        <h1 className="text-[20px] leading-[26px] font-normal ml-0.5">Group hold</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-6 flex flex-col gap-3 no-scrollbar">
        {/* Summary card */}
        <div className="w-full overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--card-radius)' }}>
          <div className="p-4 flex flex-col items-start">
            <span
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--showtime-green)' }}
              aria-hidden
            >
              <Check size={26} strokeWidth={2} style={{ color: 'var(--text-on-brand)' }} />
            </span>
            <h2 className="text-[20px] leading-[26px] font-medium mt-3">{v.title}</h2>
            <p className="text-[15px] leading-[20px] mt-1" style={{ color: 'var(--text-success)' }}>{v.ticketLine}</p>
            <div className="mt-3 flex flex-col gap-0.5 text-[14px] leading-[20px]" style={{ color: 'var(--text-secondary)' }}>
              <span className="text-[16px] leading-[22px] font-medium" style={{ color: 'var(--text-primary)' }}>
                {DEMO_SHOW.filmTitle}
              </span>
              <span>Fri, 20 Nov, 2026 | 09:15 PM</span>
              <span>{DEMO_SHOW.cinemaName} ({DEMO_SHOW.screen.toUpperCase()})</span>
            </div>
          </div>
          {/* Footer row like the bookings card (ref 14) */}
          <div className="flex items-center border-t px-4 py-3 gap-3" style={{ borderColor: 'var(--divider)' }}>
            <StatusBadge status="GROUP HOLD" />
            <span className="w-px h-6" style={{ backgroundColor: 'var(--divider)' }} />
            <span className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>
              {board.paidCount} of {board.totalCount} paid · ends {v.payBy.replace(' today', '')}
            </span>
          </div>
        </div>

        {/* Mini ledger, price-card style (ref 22) */}
        <div className="w-full p-4 flex flex-col gap-3" style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--card-radius)' }} data-testid="success-ledger">
          <LedgerRow label="Paid" value={v.paid} />
          <LedgerRow label={v.blockedLabel} value={v.blocked} />
          <div className="w-full border-t border-dashed" style={{ borderColor: 'var(--bg-tag)' }} />
          <LedgerRow label="Friends pay by" value={v.payBy} strong />
        </div>
      </div>

      {/* Actions */}
      <div
        className="shrink-0 border-t px-4 pt-2.5 flex flex-col gap-2.5"
        style={{ backgroundColor: 'var(--bg-surface)', borderTopColor: 'var(--divider)', paddingBottom: 'calc(var(--safe-bottom) + 10px)' }}
      >
        <div className="flex gap-3">
          <div className="flex-1">
            <PrimaryCTA variant="outline" size="lg" onClick={copyLink}>Copy link</PrimaryCTA>
          </div>
          <div className="flex-1">
            <PrimaryCTA variant="outline" size="lg" onClick={() => setQrOpen(true)}>Show QR</PrimaryCTA>
          </div>
        </div>
        <div data-tour="send-to-group">
          <PrimaryCTA variant="strong" size="lg" onClick={() => setShareOpen(true)}>Send to your group</PrimaryCTA>
        </div>
      </div>

      {toast && (
        <div className="absolute top-20 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <div className="bg-black/85 text-white px-4 py-2 rounded-full text-[13px] font-medium shadow-lg" role="status">{toast}</div>
        </div>
      )}

      {sms && (
        <IosNotification
          app="sms"
          title="OKBANK"
          body={sms.text}
          visible={smsVisible}
          onDismiss={() => setSmsVisible(false)}
          onClick={() => setSmsVisible(false)}
        />
      )}

      <IosShareSheet
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        message={v.shareMessage.split('\n')[0]}
        previewTitle={v.link}
        contacts={SHARE_CONTACTS}
        onSelectContact={() => setShareOpen(false)}
        onSelectApp={() => setShareOpen(false)}
        onCopy={() => {
          setShareOpen(false)
          copyLink()
        }}
      />

      <BottomSheet isOpen={qrOpen} onClose={() => setQrOpen(false)} title="Scan to join the group">
        <div className="flex flex-col items-center gap-3 pt-2 pb-2">
          <div className="p-3 border" style={{ borderColor: 'var(--divider)', borderRadius: 'var(--card-radius)' }}>
            <QRCodeSVG value={`https://${v.link}`} size={180} />
          </div>
          <span className="text-[14px]" style={{ color: 'var(--text-secondary)' }}>{v.link}</span>
          <span className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Friends pay by {v.payBy}</span>
        </div>
      </BottomSheet>
    </div>
  )
}
