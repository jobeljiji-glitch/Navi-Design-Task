import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DeviceFrame from '@/demo/DeviceFrame'
import MovieDetailScreen from './MovieDetailScreen'
import ShowtimesScreen from './ShowtimesScreen'
import SeatLayoutScreen from './SeatLayoutScreen'
import ConfirmBookingScreen from './ConfirmBookingScreen'
import PaymentScreen from './PaymentScreen'
import type { Seat as LogicSeat } from '@/logic/types'
import { DEMO_SHOW } from '@/logic/seed'

export default function RohanFlow() {
  const location = useLocation()
  const navigate = useNavigate()

  // Selected seats state across the booking flow (defaulting to 6 seats: D05-D10)
  const [selectedSeats, setSelectedSeats] = useState<LogicSeat[]>([
    { id: 'D05', row: 'D', num: 5, tier: 'primePlus', price: 25000, state: 'selected' },
    { id: 'D06', row: 'D', num: 6, tier: 'primePlus', price: 25000, state: 'selected' },
    { id: 'D07', row: 'D', num: 7, tier: 'primePlus', price: 25000, state: 'selected' },
    { id: 'D08', row: 'D', num: 8, tier: 'primePlus', price: 25000, state: 'selected' },
    { id: 'D09', row: 'D', num: 9, tier: 'primePlus', price: 25000, state: 'selected' },
    { id: 'D10', row: 'D', num: 10, tier: 'primePlus', price: 25000, state: 'selected' },
  ])

  // Current route extraction
  const path = location.pathname.replace(/\/+$/, '')

  // Calculate total amount in paise from selected seats
  const ticketPaise = selectedSeats.reduce((acc, s) => acc + s.price, 0)
  const feePaise = DEMO_SHOW.fee * selectedSeats.length
  const totalPaise = ticketPaise + feePaise

  const renderActiveScreen = () => {
    switch (path) {
      case '/rohan/showtimes':
        return (
          <ShowtimesScreen
            onBack={() => navigate('/rohan/movie')}
            onSelectShowtime={() => {
              navigate('/rohan/seats', { state: { fromShowtime: true } })
            }}
          />
        )

      case '/rohan/seat-count':
        return (
          <SeatLayoutScreen
            onBack={() => navigate('/rohan/showtimes')}
            isCountSheetOpenInitially={true}
            initialSeatCount={6}
            onPay={(seats) => {
              setSelectedSeats(seats)
              navigate('/rohan/confirm')
            }}
          />
        )

      case '/rohan/seats': {
        const fromShowtime = Boolean((location.state as { fromShowtime?: boolean } | null)?.fromShowtime)
        return (
          <SeatLayoutScreen
            key={location.key}
            onBack={() => navigate('/rohan/showtimes')}
            initialSelectedSeatIds={[]}
            initialSeatCount={6}
            isCountSheetOpenInitially={fromShowtime}
            onPay={(seats) => {
              setSelectedSeats(seats)
              navigate('/rohan/confirm')
            }}
          />
        )
      }

      case '/rohan/seats-selected':
        return (
          <SeatLayoutScreen
            onBack={() => navigate('/rohan/showtimes')}
            initialSelectedSeatIds={['D05', 'D06', 'D07', 'D08', 'D09', 'D10']}
            initialSeatCount={6}
            isCountSheetOpenInitially={false}
            onPay={(seats) => {
              setSelectedSeats(seats)
              navigate('/rohan/confirm')
            }}
          />
        )

      case '/rohan/confirm':
        return (
          <ConfirmBookingScreen
            seats={selectedSeats}
            onBack={() => navigate('/rohan/seats')}
            onContinue={() => navigate('/rohan/payment')}
          />
        )

      case '/rohan/loader':
        return (
          <ConfirmBookingScreen
            seats={selectedSeats}
            showLoaderInitially={true}
            onBack={() => navigate('/rohan/seats')}
            onContinue={() => navigate('/rohan/payment')}
          />
        )

      case '/rohan/payment':
        return (
          <PaymentScreen
            amountPaise={totalPaise}
            onBack={() => navigate('/rohan/confirm')}
            onSelectPayment={(method) => {
              console.log('Selected payment method:', method)
            }}
          />
        )

      case '/rohan':
      case '/rohan/movie':
      default:
        return (
          <MovieDetailScreen
            onBack={() => navigate('/')}
            onBookTickets={() => navigate('/rohan/showtimes')}
          />
        )
    }
  }

  return (
    <DeviceFrame time="11:04">
      {renderActiveScreen()}
    </DeviceFrame>
  )
}
