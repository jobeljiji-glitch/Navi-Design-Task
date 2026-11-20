import { useRef, type ChangeEvent, type KeyboardEvent } from 'react'

export interface OtpInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  className?: string
}

export default function OtpInput({
  length = 4,
  value,
  onChange,
  onComplete,
  className = '',
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (e: ChangeEvent<HTMLInputElement>, idx: number) => {
    const char = e.target.value.slice(-1)
    if (!/^\d*$/.test(char)) return

    const chars = value.split('')
    chars[idx] = char
    const nextVal = chars.join('').slice(0, length)
    onChange(nextVal)

    if (char && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus()
    }

    if (nextVal.length === length) {
      onComplete?.(nextVal)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus()
    }
  }

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={el => {
            inputsRef.current[idx] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] ?? ''}
          onChange={e => handleChange(e, idx)}
          onKeyDown={e => handleKeyDown(e, idx)}
          className="w-11 h-12 rounded-[8px] text-[20px] font-medium text-center border focus:outline-none transition-all"
          style={{
            borderColor: value[idx] ? 'var(--bms-red)' : 'var(--divider)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
          }}
          aria-label={`Digit ${idx + 1}`}
        />
      ))}
    </div>
  )
}
