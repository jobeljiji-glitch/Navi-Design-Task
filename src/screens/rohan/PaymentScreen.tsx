import { ChevronLeft, CreditCard, Smartphone, Wallet, Gift, Landmark, Clock, Award, ShieldCheck } from 'lucide-react'
import { formatINR } from '@/logic/money'
import { AmountHeader, PaymentRow } from '@/ds'

export interface PaymentScreenProps {
  onBack?: () => void
  onSelectPayment?: (method: string) => void
  amountPaise?: number
}

export default function PaymentScreen({
  onBack,
  onSelectPayment,
  amountPaise = 51428, // Default ₹514.28 matching reference 12
}: PaymentScreenProps) {
  const formattedAmount = formatINR(amountPaise)

  return (
    <div
      className="w-full h-full flex flex-col justify-between overflow-hidden relative select-none"
      style={{
        backgroundColor: 'var(--bg-page)',
        color: 'var(--text-primary)',
        width: 402,
        height: 874,
      }}
    >
      {/* Top Header */}
      <header
        className="flex items-center px-4 h-[54px] shrink-0 border-b border-divider bg-bg-surface"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottomColor: 'var(--divider)',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-bg-muted active:opacity-70 transition-opacity"
          aria-label="Back"
        >
          <ChevronLeft size={24} strokeWidth={1.75} style={{ color: 'var(--text-primary)' }} />
        </button>
        <h1
          className="text-[17px] leading-[22px] font-medium ml-1"
          style={{ color: 'var(--text-primary)' }}
        >
          Payment
        </h1>
      </header>

      {/* Amount Header with zigzag serrated bottom edge */}
      <div className="shrink-0">
        <AmountHeader amount={formattedAmount} />
      </div>

      {/* Payment Options Scrollable Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Preferred Payments Section */}
        <div className="pt-3 pb-1.5 px-4">
          <span
            className="text-[11px] leading-[14px] uppercase tracking-[0.5px] font-normal"
            style={{ color: 'var(--text-secondary)' }}
          >
            PREFERRED PAYMENTS
          </span>
        </div>

        <div className="flex flex-col bg-bg-surface border-y border-divider">
          <PaymentRow
            icon={<span className="font-bold text-[12px] text-blue-900 tracking-tighter">VISA</span>}
            title="ICICI Bank Credit Card | ****5004"
            subtitle="Enter CVV to complete payment"
            lastUsed
            onClick={() => onSelectPayment?.('icici-card')}
          />
          <PaymentRow
            icon={
              <div className="w-6 h-6 rounded-full bg-cyan-500 text-white flex items-center justify-center text-[9px] font-bold">
                pay
              </div>
            }
            title="Paytm"
            subtitle="Get upto ₹200* cashback using Paytm UPI. *T&C Apply"
            onClick={() => onSelectPayment?.('paytm')}
          />
          <PaymentRow
            icon={
              <div className="flex -space-x-1">
                <div className="w-3.5 h-3.5 rounded-full bg-red-500 opacity-90" />
                <div className="w-3.5 h-3.5 rounded-full bg-amber-500 opacity-90" />
              </div>
            }
            title="Axis Bank Debit Card | ****5563"
            subtitle="Enter CVV to complete payment"
            onClick={() => onSelectPayment?.('axis-card')}
          />
        </div>

        {/* Other Payment Options Section */}
        <div className="pt-4 pb-1.5 px-4">
          <span
            className="text-[11px] leading-[14px] uppercase tracking-[0.5px] font-normal"
            style={{ color: 'var(--text-secondary)' }}
          >
            OTHER PAYMENT OPTIONS
          </span>
        </div>

        <div className="flex flex-col bg-bg-surface border-y border-divider">
          <PaymentRow
            icon={<Smartphone size={18} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />}
            title="Pay by any UPI App"
            onClick={() => onSelectPayment?.('upi')}
          />
          <PaymentRow
            icon={<CreditCard size={18} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />}
            title="Debit/Credit Card"
            onClick={() => onSelectPayment?.('cards')}
          />
          <PaymentRow
            icon={<Wallet size={18} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />}
            title="Mobile Wallets"
            onClick={() => onSelectPayment?.('wallets')}
          />
          <PaymentRow
            icon={<Gift size={18} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />}
            title="Gift Voucher"
            onClick={() => onSelectPayment?.('gift-voucher')}
          />
          <PaymentRow
            icon={<Landmark size={18} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />}
            title="Net Banking"
            onClick={() => onSelectPayment?.('net-banking')}
          />
          <PaymentRow
            icon={<Clock size={18} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />}
            title="Pay Later"
            onClick={() => onSelectPayment?.('pay-later')}
          />
          <PaymentRow
            icon={<Award size={18} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />}
            title="Redeem Points"
            onClick={() => onSelectPayment?.('points')}
          />
        </div>

        {/* Security Trust Watermark Footer */}
        <div className="py-6 flex flex-col items-center justify-center gap-1 opacity-60">
          <ShieldCheck size={20} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
          <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            100% Secure Payments
          </span>
        </div>
      </div>
    </div>
  )
}
