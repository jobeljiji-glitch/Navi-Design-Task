import { ChevronLeft } from 'lucide-react'

/** Plain chevron + 20/400 title on the page colour (same header as Rohan's "Group hold", ref 22). */
export default function FriendHeader({ title, onBack, white = false }: { title: string; onBack?: () => void; white?: boolean }) {
  return (
    <header className="flex items-center px-4 h-[54px] shrink-0" style={{ backgroundColor: white ? 'var(--bg-surface)' : undefined }}>
      {onBack && (
        <button type="button" onClick={onBack} className="w-11 h-11 -ml-2.5 flex items-center justify-center active:opacity-70" aria-label="Back">
          <ChevronLeft size={24} strokeWidth={1.75} />
        </button>
      )}
      <h1 className="text-[20px] leading-[26px] font-normal ml-0.5 truncate">{title}</h1>
    </header>
  )
}
