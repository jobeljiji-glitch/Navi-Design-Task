import { useState } from 'react'
import DeviceFrame from '@/demo/DeviceFrame'
import {
  NavBar,
  PrimaryCTA,
  BottomCtaBar,
  DualCtaBar,
  BottomSheet,
  Seat,
  SeatGrid,
  SeatLegend,
  SeatCountPicker,
  SeatCountSheet,
  PriceTierList,
  DateStrip,
  ShowtimePill,
  ScreenShape,
  SummaryCard,
  PriceBreakdown,
  InfoBanner,
  PaymentRow,
  AmountHeader,
  LoaderSheet,
  BookingCard,
  StatusBadge,
  IosShareSheet,
  IosNotification,
  GroupHint,
  DemandBanner,
  MoneyLedger,
  BlockMeter,
  GroupStatusList,
  AvatarStack,
  KeepReleaseStepper,
  UpiMandateScreen,
  LinkPreviewCard,
  ChatThread,
  OtpInput,
  TicketCard,
  CoachMark,
  type SeatState,
} from '@/ds'
import { CreditCard, Smartphone, Wallet, Search, Share2, Ticket } from 'lucide-react'

export default function KitPage() {
  // Interactive state demos
  const [selectedSeatCount, setSelectedSeatCount] = useState(6)
  const [selectedDateIdx, setSelectedDateIdx] = useState(0)
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)
  const [seatCountSheetOpen, setSeatCountSheetOpen] = useState(false)
  const [loaderOpen, setLoaderOpen] = useState(false)
  const [shareSheetOpen, setShareSheetOpen] = useState(false)
  const [upiScreenOpen, setUpiScreenOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [notifVisible, setNotifVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'cta' | 'seats' | 'sheets' | 'cards' | 'group'>('all')
  const [otpVal, setOtpVal] = useState('12')
  const [keepCount, setKeepCount] = useState(1)

  const seatStates: Array<{ state: SeatState; label: string; num?: number; payer?: string }> = [
    { state: 'available', label: 'Available', num: 1 },
    { state: 'selected', label: 'Selected', num: 2 },
    { state: 'sold', label: 'Sold', num: 3 },
    { state: 'held', label: 'Held', num: 4 },
    { state: 'locked', label: 'Locked', num: 5 },
    { state: 'paying', label: 'Paying', num: 6 },
    { state: 'paid_owner', label: 'Paid (Owner)', num: 7 },
    { state: 'paid_friend', label: 'Paid (Friend)', num: 8, payer: 'Amit' },
    { state: 'covered', label: 'Covered', num: 9 },
    { state: 'kept', label: 'Kept', num: 10 },
    { state: 'released', label: 'Released', num: 11 },
  ]

  const sampleDates = [
    { day: 'FRI', date: 20, month: 'NOV' },
    { day: 'SAT', date: 21, month: 'NOV' },
    { day: 'SUN', date: 22, month: 'NOV' },
    { day: 'MON', date: 23, month: 'NOV' },
    { day: 'TUE', date: 24, month: 'NOV' },
  ]

  const sampleTiers = [
    { name: 'NORMAL', price: 240, status: 'AVAILABLE' },
    { name: 'EXECUTIVE', price: 260, status: 'AVAILABLE' },
    { name: 'PREMIUM', price: 280, status: 'AVAILABLE' },
    { name: 'RECLINER', price: 520, status: 'AVAILABLE' },
  ]

  const sampleGridRows = [
    {
      row: 'A',
      tier: 'Recliner',
      seats: [
        { id: 'A1', num: 1, state: 'available' as SeatState },
        { id: 'A2', num: 2, state: 'sold' as SeatState },
        { id: 'A3', num: 3, state: 'sold' as SeatState },
        { id: 'A4', num: 4, state: 'available' as SeatState },
      ],
    },
    {
      row: 'D',
      tier: 'Prime Plus',
      seats: [
        { id: 'D5', num: 5, state: 'sold' as SeatState },
        { id: 'D6', num: 6, state: 'held' as SeatState },
        { id: 'D7', num: 7, state: 'paid_owner' as SeatState },
        { id: 'D8', num: 8, state: 'paid_friend' as SeatState, payerName: 'Amit' },
        { id: 'D9', num: 9, state: 'paying' as SeatState },
        { id: 'D10', num: 10, state: 'selected' as SeatState },
      ],
    },
  ]

  return (
    <DeviceFrame time="9:41">
      <div
        className="w-full h-full flex flex-col overflow-y-auto no-scrollbar relative"
        style={{
          backgroundColor: 'var(--bg-page)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Navigation Bar */}
        <NavBar
          title="Design Kit (/kit)"
          subtitle="402 × 874 pt · BookMyShow"
          actions={
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setNotifVisible(v => !v)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-bg-muted"
                aria-label="Toggle notification"
              >
                <Share2 size={18} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
              </button>
              <button
                type="button"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-bg-muted"
                aria-label="Search"
              >
                <Search size={18} strokeWidth={1.75} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
          }
        />

        {/* Floating Notification Demo */}
        <IosNotification
          title="Amit's in! 🎉"
          body="₹277.14 less for you to cover"
          visible={notifVisible}
          onDismiss={() => setNotifVisible(false)}
        />

        {/* Filter Tabs */}
        <div
          className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto border-b border-divider shrink-0 no-scrollbar"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderBottomColor: 'var(--divider)',
          }}
        >
          {[
            { id: 'all', label: 'All Components' },
            { id: 'cta', label: 'CTAs & Nav' },
            { id: 'seats', label: 'Seats & Grid' },
            { id: 'sheets', label: 'Sheets & Count' },
            { id: 'cards', label: 'Cards & Payment' },
            { id: 'group', label: 'Group Hold' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className="px-3 py-1 rounded-full text-[12px] font-medium whitespace-nowrap transition-colors"
              style={{
                backgroundColor:
                  activeTab === tab.id ? 'var(--bms-red)' : 'var(--bg-muted)',
                color:
                  activeTab === tab.id
                    ? 'var(--text-on-brand)'
                    : 'var(--text-secondary)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Component Gallery Body */}
        <div className="flex flex-col gap-8 p-4 pb-16">
          {/* SECTION 1: CTAs & NAVIGATION */}
          {(activeTab === 'all' || activeTab === 'cta') && (
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-0.5 border-b border-divider pb-1">
                <h2 className="text-[15px] font-medium uppercase tracking-wider text-text-secondary" style={{ color: 'var(--text-secondary)' }}>
                  1. Buttons &amp; CTAs
                </h2>
                <span className="text-[12px] text-text-secondary" style={{ color: 'var(--text-secondary)' }}>
                  PrimaryCTA (40pt, radius 6pt), BottomCtaBar, DualCtaBar
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-[12px] font-normal text-text-secondary">PrimaryCTA Default (`--bms-red`)</span>
                <PrimaryCTA onClick={() => alert('Clicked Select seats')}>
                  Select seats
                </PrimaryCTA>

                <span className="text-[12px] font-normal text-text-secondary">PrimaryCTA Strong (`--bms-red-strong`)</span>
                <PrimaryCTA variant="strong" onClick={() => alert('Clicked Book tickets')}>
                  Book tickets
                </PrimaryCTA>

                <span className="text-[12px] font-normal text-text-secondary">PrimaryCTA with SubLabel</span>
                <PrimaryCTA subLabel="All 6 seats">
                  Pay ₹1,662.84
                </PrimaryCTA>

                <span className="text-[12px] font-normal text-text-secondary">PrimaryCTA Outline</span>
                <PrimaryCTA variant="outline" subLabel="Friends pay their own">
                  Hold for group
                </PrimaryCTA>

                <span className="text-[12px] font-normal text-text-secondary">PrimaryCTA Disabled (40% opacity)</span>
                <PrimaryCTA disabled>
                  Pay ₹460
                </PrimaryCTA>

                <span className="text-[12px] font-normal text-text-secondary">BottomCtaBar (Price left, CTA right)</span>
                <div className="rounded-[8px] overflow-hidden border border-divider">
                  <BottomCtaBar
                    totalLabel="Total"
                    totalAmount="₹514.28"
                    ctaText="Continue"
                    variant="strong"
                    onCtaClick={() => alert('Continue tapped')}
                  />
                </div>

                <span className="text-[12px] font-normal text-text-secondary">DualCtaBar (Step 1b 3–10 seats)</span>
                <div className="rounded-[8px] overflow-hidden border border-divider">
                  <DualCtaBar
                    leftText="Hold for group"
                    leftSub="Friends pay their own"
                    onLeftClick={() => alert('Hold for group')}
                    rightText="Pay ₹1,662.84"
                    rightSub="All 6 seats"
                    onRightClick={() => alert('Pay all')}
                  />
                </div>
              </div>
            </section>
          )}

          {/* SECTION 2: SEATS & LAYOUT */}
          {(activeTab === 'all' || activeTab === 'seats') && (
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-0.5 border-b border-divider pb-1">
                <h2 className="text-[15px] font-medium uppercase tracking-wider text-text-secondary" style={{ color: 'var(--text-secondary)' }}>
                  2. Seats &amp; Layout
                </h2>
                <span className="text-[12px] text-text-secondary" style={{ color: 'var(--text-secondary)' }}>
                  All 11 seat states (20×20 pt, radius 3pt), Grid, Legend, ScreenShape, ShowtimePill
                </span>
              </div>

              {/* 11 Seat States Grid */}
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-normal text-text-secondary">Seat States (All 11 variants)</span>
                <div
                  className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-4 rounded-[8px] border"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--divider)',
                  }}
                >
                  {seatStates.map(item => (
                    <div key={item.state} className="flex flex-col items-center gap-1.5 p-2 rounded bg-bg-page text-center">
                      <Seat
                        state={item.state}
                        num={item.num}
                        payerName={item.payer}
                        onClick={() => alert(`Seat clicked: ${item.label}`)}
                      />
                      <span className="text-[10px] leading-tight font-medium text-text-secondary">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seat Legend */}
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-normal text-text-secondary">SeatLegend</span>
                <div className="p-2 rounded-[8px] border bg-bg-surface" style={{ borderColor: 'var(--divider)' }}>
                  <SeatLegend
                    items={[
                      { label: 'Available', state: 'available' },
                      { label: 'Selected', state: 'selected' },
                      { label: 'Sold', state: 'sold' },
                      { label: 'Held', state: 'held' },
                      { label: 'Paying', state: 'paying' },
                    ]}
                  />
                </div>
              </div>

              {/* Showtime Pills */}
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-normal text-text-secondary">ShowtimePill (110×39 pt, 4pt green bar)</span>
                <div className="flex items-center gap-3">
                  <ShowtimePill time="12:45 PM" badge="ENG" />
                  <ShowtimePill time="09:15 PM" selected />
                </div>
              </div>

              {/* DateStrip */}
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-normal text-text-secondary">DateStrip (65×78 pt tiles)</span>
                <div className="rounded-[8px] border bg-bg-surface overflow-hidden" style={{ borderColor: 'var(--divider)' }}>
                  <DateStrip
                    dates={sampleDates}
                    selectedIndex={selectedDateIdx}
                    onSelectDate={setSelectedDateIdx}
                  />
                </div>
              </div>

              {/* ScreenShape */}
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-normal text-text-secondary">ScreenShape (`--screen-tint`)</span>
                <div className="rounded-[8px] border bg-bg-surface" style={{ borderColor: 'var(--divider)' }}>
                  <ScreenShape />
                </div>
              </div>

              {/* SeatGrid Sample */}
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-normal text-text-secondary">SeatGrid (26pt pitch with tier headers)</span>
                <div className="rounded-[8px] border bg-bg-surface overflow-hidden" style={{ borderColor: 'var(--divider)' }}>
                  <SeatGrid
                    rows={sampleGridRows}
                    tierPrices={{ Recliner: 500, 'Prime Plus': 250 }}
                    onSeatClick={id => alert(`Clicked seat ${id}`)}
                  />
                </div>
              </div>
            </section>
          )}

          {/* SECTION 3: SHEETS & PICKERS */}
          {(activeTab === 'all' || activeTab === 'sheets') && (
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-0.5 border-b border-divider pb-1">
                <h2 className="text-[15px] font-medium uppercase tracking-wider text-text-secondary" style={{ color: 'var(--text-secondary)' }}>
                  3. Sheets &amp; Seat Count
                </h2>
                <span className="text-[12px] text-text-secondary" style={{ color: 'var(--text-secondary)' }}>
                  SeatCountPicker, SeatCountSheet, PriceTierList, BottomSheet, LoaderSheet
                </span>
              </div>

              {/* SeatCountPicker & PriceTierList inline preview */}
              <div
                className="rounded-[16px] p-4 border bg-bg-surface shadow-sm flex flex-col gap-3"
                style={{ borderColor: 'var(--divider)' }}
              >
                <div className="text-[22px] font-normal text-text-primary" style={{ color: 'var(--text-primary)' }}>
                  How many seats?
                </div>
                <SeatCountPicker
                  count={selectedSeatCount}
                  onChange={setSelectedSeatCount}
                />
                {selectedSeatCount >= 3 && (
                  <GroupHint onClick={() => alert('Group hint tapped')} />
                )}
                <div className="w-full h-[1px] bg-divider my-1" />
                <PriceTierList tiers={sampleTiers} />
                <PrimaryCTA onClick={() => setSeatCountSheetOpen(true)}>
                  Select seats
                </PrimaryCTA>
              </div>

              {/* Sheet triggers */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSeatCountSheetOpen(true)}
                  className="py-2.5 px-3 rounded-[6px] border font-medium text-[13px] bg-bg-surface hover:bg-bg-muted flex items-center justify-center gap-1.5"
                  style={{ borderColor: 'var(--divider)' }}
                >
                  Open SeatCountSheet (6)
                </button>
                <button
                  type="button"
                  onClick={() => setBottomSheetOpen(true)}
                  className="py-2.5 px-3 rounded-[6px] border font-medium text-[13px] bg-bg-surface hover:bg-bg-muted"
                  style={{ borderColor: 'var(--divider)' }}
                >
                  Open BottomSheet
                </button>
                <button
                  type="button"
                  onClick={() => setLoaderOpen(true)}
                  className="py-2.5 px-3 rounded-[6px] border font-medium text-[13px] bg-bg-surface hover:bg-bg-muted"
                  style={{ borderColor: 'var(--divider)' }}
                >
                  Open LoaderSheet
                </button>
                <button
                  type="button"
                  onClick={() => setShareSheetOpen(true)}
                  className="py-2.5 px-3 rounded-[6px] border font-medium text-[13px] bg-bg-surface hover:bg-bg-muted"
                  style={{ borderColor: 'var(--divider)' }}
                >
                  Open Share Sheet
                </button>
              </div>
            </section>
          )}

          {/* SECTION 4: CARDS & PAYMENTS */}
          {(activeTab === 'all' || activeTab === 'cards') && (
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-0.5 border-b border-divider pb-1">
                <h2 className="text-[15px] font-medium uppercase tracking-wider text-text-secondary" style={{ color: 'var(--text-secondary)' }}>
                  4. Cards &amp; Payment Rows
                </h2>
                <span className="text-[12px] text-text-secondary" style={{ color: 'var(--text-secondary)' }}>
                  SummaryCard, PriceBreakdown, InfoBanner, PaymentRow, AmountHeader, BookingCard, StatusBadge
                </span>
              </div>

              <SummaryCard
                title="Bachelor Party D'eux"
                ticketCount={2}
                dateTime="Fri, 20 Nov, 2026 | 12:45 PM"
                languageFormat="Malayalam (2D)"
                seatDescription="QR-G9, G10"
                cinema="INOX: R-City, Ghatkopar"
                screen="SCREEN 7"
              />

              <InfoBanner
                title="Cancellation Available"
                body="This venue supports booking cancellation. To know more"
                linkText="view cancellation policy"
              />

              <PriceBreakdown
                items={[
                  { label: 'Ticket(s) price', amount: '₹460.00' },
                  { label: 'Convenience fees', amount: '₹54.28' },
                  {
                    label: 'Give to Underprivileged Musicians',
                    amount: '₹0.00',
                    subtitle: '(₹1 per ticket)',
                    actionLabel: 'Add ₹2.00',
                    onAction: () => alert('Added donation'),
                  },
                ]}
                totalAmount="₹514.28"
              />

              {/* AmountHeader with zigzag edge */}
              <div className="rounded-[8px] overflow-hidden border border-divider">
                <AmountHeader amount="₹514.28" />
                <div className="bg-bg-surface">
                  <PaymentRow
                    icon={<CreditCard size={20} strokeWidth={1.75} style={{ color: 'var(--bms-red)' }} />}
                    title="ICICI Bank Credit Card | ****5004"
                    subtitle="Enter CVV to complete payment"
                    lastUsed
                    onClick={() => alert('Card selected')}
                  />
                  <PaymentRow
                    icon={<Smartphone size={20} strokeWidth={1.75} style={{ color: 'var(--text-link)' }} />}
                    title="Pay by any UPI App"
                    subtitle="Google Pay, PhonePe, Paytm, BHIM"
                    onClick={() => setUpiScreenOpen(true)}
                  />
                  <PaymentRow
                    icon={<Wallet size={20} strokeWidth={1.75} style={{ color: 'var(--text-success)' }} />}
                    title="Mobile Wallets"
                    subtitle="Amazon Pay, Mobikwik"
                    onClick={() => alert('Wallets selected')}
                  />
                </div>
              </div>

              {/* StatusBadges */}
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-normal text-text-secondary">StatusBadges</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status="GROUP HOLD" />
                  <StatusBadge status="CONFIRMED" />
                  <StatusBadge status="FINISHED" />
                  <StatusBadge status="FAILED" />
                </div>
              </div>

              {/* BookingCards matching references 14 and 18 */}
              <div className="flex flex-col gap-4">
                <span className="text-[12px] font-normal text-text-secondary">Booking Cards (Reference 14 &amp; 18)</span>
                <BookingCard
                  movieTitle="Monsoon Heist"
                  language="Hindi"
                  showtime="Fri, 20 Nov, 2026 | 09:15 PM"
                  cinema="Cineplex: Phoenix Marketcity, Kurla"
                  screen="SCREEN 4"
                  seats="6 tickets: PP - D05…D10"
                  status="GROUP HOLD"
                  statusMessage="3 of 6 paid · ends 7:15 PM"
                  orderedDate="20 Nov, 2026 at 11:04:56 AM"
                  onClick={() => setTicketModalOpen(true)}
                />

                <BookingCard
                  movieTitle="Ramayana (3D)(Hindi)"
                  language="Hindi"
                  showtime="Wed, 11 Nov, 2026 | 05:55 PM"
                  cinema="INOX: R-City, Ghatkopar"
                  screen="SCREEN 4"
                  seats="2 tickets: PI - F15, F16"
                  status="FINISHED"
                  statusMessage="Hope you enjoyed the Show!"
                  orderedDate="10 Nov, 2026 at 09:47:07 PM"
                />
              </div>
            </section>
          )}

          {/* SECTION 5: GROUP HOLD COMPONENTS */}
          {(activeTab === 'all' || activeTab === 'group') && (
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-0.5 border-b border-divider pb-1">
                <h2 className="text-[15px] font-medium uppercase tracking-wider text-text-secondary" style={{ color: 'var(--text-secondary)' }}>
                  5. Group Hold Components
                </h2>
                <span className="text-[12px] text-text-secondary" style={{ color: 'var(--text-secondary)' }}>
                  DemandBanner, MoneyLedger, BlockMeter, GroupStatusList, AvatarStack, KeepReleaseStepper, OtpInput, TicketCard, CoachMark
                </span>
              </div>

              {/* DemandBanners */}
              <div className="flex flex-col gap-1.5 rounded-[8px] overflow-hidden border border-divider">
                <DemandBanner tier="medium" pctLeft={41} holdHours={6} />
                <DemandBanner tier="high" pctLeft={18} holdHours={2} />
                <DemandBanner tier="low" holdHours={24} />
              </div>

              {/* MoneyLedger */}
              <MoneyLedger
                debitedNow="₹277.14"
                blockedAmount="₹1,385.70"
                mostPayable="₹1,662.84"
              />

              {/* BlockMeter */}
              <BlockMeter
                youPaidPaise={27714}
                friendsPaidPaise={55428}
                stillBlockedPaise={83142}
              />

              {/* AvatarStack */}
              <div className="flex items-center justify-between p-3 rounded-[8px] bg-bg-surface border border-divider">
                <span className="text-[13px] font-medium text-text-primary">Rohan and friends:</span>
                <AvatarStack
                  avatars={[
                    { name: 'Rohan', initials: 'RO' },
                    { name: 'Amit', initials: 'AM' },
                    { name: 'Sana', initials: 'SA' },
                    { name: 'Priya', initials: 'PR' },
                    { name: 'Neha', initials: 'NE' },
                    { name: 'Kabir', initials: 'KA' },
                  ]}
                />
              </div>

              {/* GroupStatusList */}
              <GroupStatusList
                rows={[
                  { key: 'D05', seatId: 'D05', name: null, status: 'Not opened yet', kind: 'not_opened' },
                  { key: 'D06', seatId: 'D06', name: 'Kabir', status: 'Opened, not paid', kind: 'opened' },
                  { key: 'D07', seatId: 'D07', name: 'You', status: 'Paid', kind: 'you' },
                  { key: 'D08', seatId: 'D08', name: 'Amit', status: 'Paid', kind: 'paid' },
                  { key: 'D09', seatId: 'D09', name: 'Sana', status: 'Paid', kind: 'paid' },
                  { key: 'D10', seatId: 'D10', name: 'Priya', status: 'Paying now', kind: 'paying' },
                ]}
                declinedNames={['Neha']}
                waitingCount={2}
                notOpenedCount={1}
                onReleaseSeat={() => alert('Release seat')}
                onKeepSeat={() => alert('Keep seat')}
                onCoverSeats={() => alert('Cover seats')}
                onShareReminder={() => alert('Share a reminder')}
              />

              {/* KeepReleaseStepper */}
              <KeepReleaseStepper
                totalSeats={2}
                keepCount={keepCount}
                onChange={setKeepCount}
              />

              {/* OTP Input */}
              <div className="flex flex-col items-center gap-2 p-4 bg-bg-surface rounded-[8px] border border-divider">
                <span className="text-[13px] font-medium text-text-secondary">4-digit OTP Input</span>
                <OtpInput
                  value={otpVal}
                  onChange={setOtpVal}
                  onComplete={code => alert(`OTP entered: ${code}`)}
                />
              </div>

              {/* LinkPreviewCard */}
              <LinkPreviewCard onClick={() => setChatOpen(true)} />

              {/* TicketCard (inline preview) */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-normal text-text-secondary">BMS M-Ticket (Reference 16)</span>
                  <button
                    type="button"
                    onClick={() => setTicketModalOpen(true)}
                    className="text-[12px] font-medium text-[var(--bms-red-text)] flex items-center gap-1"
                  >
                    <Ticket size={13} />
                    <span>Open full view</span>
                  </button>
                </div>
                <div className="rounded-[12px] overflow-hidden border border-divider">
                  <TicketCard />
                </div>
              </div>

              {/* CoachMark Tutorial Spotlight */}
              <div className="flex justify-center">
                <CoachMark
                  stepNumber={3}
                  totalSteps={17}
                  title="Group Hold Signal"
                  text="An honest signal: seats are selling, and the hold would last 6 hours."
                  onNext={() => alert('Next coachmark')}
                  onBack={() => alert('Back coachmark')}
                  onSkip={() => alert('Tour skipped')}
                />
              </div>

              {/* Share Sheet & UPI Screen Triggers */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShareSheetOpen(true)}
                  className="flex-1 py-2.5 rounded-[6px] border font-medium text-[13px] bg-bg-surface hover:bg-bg-muted"
                  style={{ borderColor: 'var(--divider)' }}
                >
                  Open Share Sheet
                </button>
                <button
                  type="button"
                  onClick={() => setUpiScreenOpen(true)}
                  className="flex-1 py-2.5 rounded-[6px] border font-medium text-[13px] bg-bg-surface hover:bg-bg-muted"
                  style={{ borderColor: 'var(--divider)' }}
                >
                  Open UPI Mandate
                </button>
              </div>
            </section>
          )}
        </div>

        {/* FULL SEAT COUNT SHEET (MATCHING REFERENCE 19) */}
        <SeatCountSheet
          isOpen={seatCountSheetOpen}
          onClose={() => setSeatCountSheetOpen(false)}
          count={selectedSeatCount}
          onChangeCount={setSelectedSeatCount}
          onSelectSeats={() => {
            setSeatCountSheetOpen(false)
          }}
          tiers={sampleTiers}
        />

        {/* BOTTOM SHEET MODAL */}
        <BottomSheet
          isOpen={bottomSheetOpen}
          onClose={() => setBottomSheetOpen(false)}
          title="Hold 6 seats for your group"
        >
          <div className="flex flex-col gap-4">
            <span className="text-[13px] text-text-secondary" style={{ color: 'var(--text-secondary)' }}>
              Monsoon Heist · Fri 9:15 PM · D05–D10
            </span>
            <MoneyLedger
              debitedNow="₹277.14"
              blockedAmount="₹1,385.70"
              mostPayable="₹1,662.84"
            />
            <PrimaryCTA onClick={() => {
              setBottomSheetOpen(false)
              setUpiScreenOpen(true)
            }}>
              Pay ₹277.14 and block ₹1,385.70
            </PrimaryCTA>
          </div>
        </BottomSheet>

        {/* LOADER SHEET MODAL */}
        <LoaderSheet
          isOpen={loaderOpen}
          onClose={() => setLoaderOpen(false)}
          message="Confirming your Seats!"
          subMessage="Please wait while we lock your seats."
        />

        {/* IOS SHARE SHEET MODAL (MATCHING REFERENCE 17) */}
        <IosShareSheet
          isOpen={shareSheetOpen}
          onClose={() => setShareSheetOpen(false)}
          message="Rohan is holding 6 seats for Monsoon Heist, Fri 9:15 PM. Pay by 7:15 PM · bms.link/g/k7Qx2"
          onSelectContact={c => {
            setShareSheetOpen(false)
            alert(`Selected contact: ${c.name}`)
          }}
          onSelectApp={appName => {
            if (appName === 'WhatsApp') {
              setShareSheetOpen(false)
              setChatOpen(true)
            } else {
              alert(`Selected app: ${appName}`)
            }
          }}
          onCopy={() => {
            setShareSheetOpen(false)
            alert('Link copied to clipboard')
          }}
        />

        {/* FULL SCREEN M-TICKET MODAL (MATCHING REFERENCE 16) */}
        {ticketModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#E5E5E5] flex flex-col overflow-y-auto no-scrollbar">
            <TicketCard
              onClose={() => setTicketModalOpen(false)}
              onShare={() => setShareSheetOpen(true)}
              onViewGroup={() => alert('View group clicked')}
            />
          </div>
        )}

        {/* UPI MANDATE FULL SCREEN MODAL */}
        {upiScreenOpen && (
          <div className="absolute inset-0 z-50 bg-bg-surface">
            <UpiMandateScreen
              amount="₹1,662.84"
              debitedNow="₹277.14"
              furtherDebits="Only kept seats, at 9:15 PM"
              blockEnds="Today, 9:15 PM"
              onApprove={pin => {
                setUpiScreenOpen(false)
                alert(`Approved with PIN: ${pin}`)
              }}
              onDecline={() => setUpiScreenOpen(false)}
            />
          </div>
        )}

        {/* SIMULATED CHAT SCREEN MODAL */}
        {chatOpen && (
          <div className="absolute inset-0 z-50 bg-bg-page flex flex-col">
            <NavBar
              title="Chat (simulated)"
              onBack={() => setChatOpen(false)}
            />
            <ChatThread
              onCardClick={() => {
                setChatOpen(false)
                setTicketModalOpen(true)
              }}
            />
          </div>
        )}
      </div>
    </DeviceFrame>
  )
}
