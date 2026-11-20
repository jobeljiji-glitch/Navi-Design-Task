import { ChevronRight } from 'lucide-react'

/**
 * SettingsGroup (04b): one grouped card of 52 pt chevron rows
 * (14 pt label, 14 pt grey value, inset hairlines). Each row opens a small sheet.
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
    <div
      className={`w-full border overflow-hidden ${className}`}
      style={{ borderColor: 'var(--divider)', borderRadius: 'var(--card-radius)', backgroundColor: 'var(--bg-surface)' }}
      data-testid="settings-group"
    >
      {rows.map((r, i) => (
        <button
          key={r.key}
          type="button"
          onClick={r.onClick}
          className="w-full h-[52px] pl-4 flex items-center text-left active:bg-bg-muted"
          data-testid={`setting-${r.key}`}
        >
          <span
            className="flex-1 h-full flex items-center justify-between gap-3 pr-3"
            style={i < rows.length - 1 ? { borderBottom: '1px solid var(--divider)' } : undefined}
          >
            <span className="text-[14px] leading-[20px] shrink-0" style={{ color: 'var(--text-primary)' }}>{r.label}</span>
            <span className="flex items-center gap-1 min-w-0">
              <span className="text-[14px] leading-[20px] truncate" style={{ color: 'var(--text-secondary)' }}>{r.value}</span>
              <ChevronRight size={18} strokeWidth={1.75} className="shrink-0" style={{ color: 'var(--text-secondary)' }} />
            </span>
          </span>
        </button>
      ))}
    </div>
  )
}
