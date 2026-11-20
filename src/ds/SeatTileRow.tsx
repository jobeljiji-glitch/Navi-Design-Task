/**
 * SeatTileRow (04b): the group's seats as a row of seat-map tiles with a caption under each.
 * Colours are the seat-map states (Seat.tsx / design-system §1), scaled up to 44 pt tiles.
 */
export type SeatTileKind =
  | 'owner'
  | 'paid'
  | 'covered'
  | 'held'
  | 'paying'
  | 'kept'
  | 'released'
  // Friend's picker (05): the real BMS seat-map language
  | 'available'
  | 'selected'
  | 'taken'

export interface SeatTile {
  id: string
  kind: SeatTileKind
  caption?: string
}

export interface SeatTileRowProps {
  tiles: SeatTile[]
  onTileClick?: (id: string) => void
  /** Tiles that can be tapped (default: all when onTileClick is set) */
  isTappable?: (tile: SeatTile) => boolean
  className?: string
}

function tileStyle(kind: SeatTileKind) {
  switch (kind) {
    case 'owner':
    case 'paid':
    case 'covered':
    case 'kept':
      return { backgroundColor: 'var(--seat-selected)', border: '1px solid var(--seat-selected)', color: 'var(--text-on-brand)' }
    case 'paying':
      return { backgroundColor: 'var(--seat-paying-fill)', border: '1px solid var(--seat-held-border)', color: 'var(--text-warning)' }
    case 'released':
      return { backgroundColor: 'var(--seat-sold)', border: '1px solid var(--seat-sold)', color: 'var(--seat-sold-text)' }
    case 'taken':
      return { backgroundColor: 'var(--seat-sold)', border: '1px solid var(--seat-sold)', color: 'var(--text-secondary)' }
    case 'available':
      return { backgroundColor: 'var(--bg-surface)', border: '1px solid var(--seat-available-border)', color: 'var(--seat-number)' }
    case 'selected':
      return { backgroundColor: 'var(--seat-selected)', border: '1px solid var(--seat-selected)', color: 'var(--text-on-brand)' }
    case 'held':
    default:
      return { backgroundColor: 'var(--seat-held-fill)', border: '1px dashed var(--seat-held-border)', color: 'var(--text-warning)' }
  }
}

function captionColor(kind: SeatTileKind) {
  if (kind === 'owner' || kind === 'paid' || kind === 'covered' || kind === 'selected') return 'var(--text-success)'
  if (kind === 'paying') return 'var(--text-warning)'
  return 'var(--text-secondary)'
}

export default function SeatTileRow({ tiles, onTileClick, isTappable, className = '' }: SeatTileRowProps) {
  return (
    <div className={`flex gap-2 ${className}`} role={onTileClick ? 'radiogroup' : 'list'} data-testid="seat-tiles">
      {tiles.map((t) => {
        const tappable = !!onTileClick && (isTappable ? isTappable(t) : true)
        const content = (
          <span
            className="w-full h-11 rounded-[4px] flex items-center justify-center text-[13px] leading-none font-normal"
            style={tileStyle(t.kind)}
          >
            {t.id}
          </span>
        )
        return (
          <div key={t.id} className="flex-1 min-w-0 flex flex-col items-center gap-1" role={onTileClick ? undefined : 'listitem'}>
            {tappable ? (
              <button
                type="button"
                role="radio"
                aria-checked={t.kind === 'owner' || t.kind === 'selected'}
                aria-label={`Seat ${t.id}${t.caption ? `, ${t.caption}` : ''}`}
                onClick={() => onTileClick!(t.id)}
                className="w-full active:scale-95 transition-transform"
              >
                {content}
              </button>
            ) : (
              content
            )}
            <span className="text-[12px] leading-[16px] h-4 truncate max-w-full" style={{ color: captionColor(t.kind) }}>
              {t.caption}
            </span>
          </div>
        )
      })}
    </div>
  )
}
