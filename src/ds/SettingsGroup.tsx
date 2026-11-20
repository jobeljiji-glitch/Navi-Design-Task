import { ChevronRight } from 'lucide-react'

/**
 * SettingsGroup: 52 pt chevron rows (14 pt label, 14 pt grey value).
 * 04c: flat — no outlined card. Used inside white sheets, so rows bleed through the
 * 16 pt gutter with full-width hairlines between them (refs 05 / 19).
 */
export interface SettingsRow {
  key: string
  label: string
  value: string
  onClick: () => void
}

export interface SettingsGroupProps {
  rows: SettingsRow[]
  className?: string
}

export default function SettingsGroup({ rows, className = '' }: SettingsGroupProps) {
  return (
    <div className={`-mx-4 ${className}`} data-testid="settings-group">
      {rows.map((r, i) => (
        <button
          key={r.key}
          type="button"
          onClick={r.onClick}
          className="w-full h-[52px] px-4 flex items-center justify-between gap-3 text-left active:opacity-70"
          style={i < rows.length - 1 ? { borderBottom: '1px solid var(--divider)' } : undefined}
          data-testid={`setting-${r.key}`}
        >
          <span className="text-[14px] leading-[20px] shrink-0" style={{ color: 'var(--text-primary)' }}>{r.label}</span>
          <span className="flex items-center gap-1 min-w-0">
            <span className="text-[14px] leading-[20px] truncate" style={{ color: 'var(--text-secondary)' }}>{r.value}</span>
            <ChevronRight size={18} strokeWidth={1.75} className="shrink-0" style={{ color: 'var(--text-secondary)' }} />
          </span>
        </button>
      ))}
    </div>
  )
}
