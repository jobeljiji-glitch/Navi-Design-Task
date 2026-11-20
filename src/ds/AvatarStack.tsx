export interface AvatarItem {
  name: string
  initials?: string
}

export interface AvatarStackProps {
  avatars: AvatarItem[]
  max?: number
  size?: number
  className?: string
}

export default function AvatarStack({
  avatars,
  max = 4,
  size = 32,
  className = '',
}: AvatarStackProps) {
  const visible = avatars.slice(0, max)
  const remaining = avatars.length - max

  const getInitials = (item: AvatarItem) => {
    if (item.initials) return item.initials
    return item.name.slice(0, 2).toUpperCase()
  }

  return (
    <div className={`flex items-center ${className}`}>
      {visible.map((item, index) => (
        <div
          key={item.name}
          className="rounded-full flex items-center justify-center font-semibold text-[11px] text-text-primary shadow-sm relative select-none"
          style={{
            width: size,
            height: size,
            marginLeft: index === 0 ? 0 : -6,
            backgroundColor: 'var(--bg-muted)',
            border: '2px solid var(--bg-surface)',
            color: 'var(--text-primary)',
            zIndex: 10 - index,
          }}
          title={item.name}
        >
          {getInitials(item)}
        </div>
      ))}

      {remaining > 0 && (
        <div
          className="rounded-full flex items-center justify-center font-semibold text-[10px] text-text-secondary relative shadow-sm"
          style={{
            width: size,
            height: size,
            marginLeft: -6,
            backgroundColor: 'var(--bg-muted)',
            border: '2px solid var(--bg-surface)',
            color: 'var(--text-secondary)',
            zIndex: 0,
          }}
        >
          +{remaining}
        </div>
      )}
    </div>
  )
}
