import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand and actions
        'bms-red':        'var(--bms-red)',
        'bms-red-strong': 'var(--bms-red-strong)',
        'bms-red-text':   'var(--bms-red-text)',
        'bms-star':       'var(--bms-star)',

        // Seats
        'seat-available-border': 'var(--seat-available-border)',
        'seat-number':           'var(--seat-number)',
        'seat-selected':         'var(--seat-selected)',
        'seat-sold':             'var(--seat-sold)',
        'seat-sold-text':        'var(--seat-sold-text)',
        'showtime-green':        'var(--showtime-green)',
        'screen-tint':           'var(--screen-tint)',

        // New seat states
        'seat-held-fill':    'var(--seat-held-fill)',
        'seat-held-border':  'var(--seat-held-border)',
        'seat-paying-fill':  'var(--seat-paying-fill)',
        'seat-paid-friend':  'var(--seat-paid-friend)',

        // Text
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary':  'var(--text-tertiary)',
        'text-success':   'var(--text-success)',
        'text-link':      'var(--text-link)',
        'text-on-brand':  'var(--text-on-brand)',
        'text-warning':   'var(--text-warning)',

        // Surfaces
        'bg-page':          'var(--bg-page)',
        'bg-header-strip':  'var(--bg-header-strip)',
        'bg-surface':       'var(--bg-surface)',
        'bg-muted':         'var(--bg-muted)',
        'bg-tag':           'var(--bg-tag)',
        'bg-success':       'var(--bg-success)',
        'bg-amount':        'var(--bg-amount)',
        'bg-club':          'var(--bg-club)',
        'bg-info':          'var(--bg-info)',
        'bg-warning':       'var(--bg-warning)',
        'trending-blue':    'var(--trending-blue)',

        // Status badges
        'badge-failed':    'var(--badge-failed)',
        'badge-finished':  'var(--badge-finished)',
        'badge-hold':      'var(--badge-hold)',
        'badge-confirmed': 'var(--badge-confirmed)',
        'badge-text':      'var(--badge-text)',

        // iOS system
        'ios-sheet-bg':  'var(--ios-sheet-bg)',
        'ios-group-bg':  'var(--ios-group-bg)',
        'ios-notif-bg':  'var(--ios-notif-bg)',
        'scrim':         'var(--scrim)',
        'sheet-handle':  'var(--sheet-handle)',
        'divider':       'var(--divider)',
      },
      fontFamily: {
        app:    'var(--font-app)',
        system: 'var(--font-system)',
      },
      spacing: {
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        'screen-margin': 'var(--margin-screen)',
        'safe-top':      'var(--safe-top)',
        'safe-bottom':   'var(--safe-bottom)',
        'cta-height':    'var(--cta-height)',
        'seat-size':     'var(--seat-size)',
        'seat-pitch':    'var(--seat-pitch)',
      },
      borderRadius: {
        'cta':   'var(--cta-radius)',
        'seat':  'var(--seat-radius)',
        'sheet': 'var(--sheet-radius)',
        'card':  'var(--card-radius)',
      },
      width: {
        'device': 'var(--device-width)',
      },
      height: {
        'device':     'var(--device-height)',
        'status-bar': 'var(--status-bar-height)',
        'cta':        'var(--cta-height)',
      },
    },
  },
  plugins: [],
}

export default config
