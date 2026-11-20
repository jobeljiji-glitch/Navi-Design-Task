import type { ReactNode } from 'react'

export interface PrimaryCTAProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'default' | 'strong' | 'outline'
  /** md = 40 pt (ref 05), lg = 48 pt (seat-layout pay bar, D-027), xl = 56 pt two-line (16/500 + 12) */
  size?: 'md' | 'lg' | 'xl'
  subLabel?: string
  fullWidth?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export default function PrimaryCTA({
  children,
  onClick,
  disabled = false,
  variant = 'default',
  size = 'md',
  subLabel,
  fullWidth = true,
  className = '',
  type = 'button',
}: PrimaryCTAProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'strong':
        return {
          backgroundColor: 'var(--bms-red-strong)',
          color: 'var(--text-on-brand)',
          border: 'none',
        }
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--bms-red-text)', // 08: text needs 4.5:1; the brand red stays on the border
          border: '1.5px solid var(--bms-red)',
        }
      case 'default':
      default:
        return {
          backgroundColor: 'var(--bms-red)',
          color: 'var(--text-on-brand)',
          border: 'none',
        }
    }
  }

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`${size === 'xl' ? 'h-[56px]' : size === 'lg' ? 'h-[48px]' : 'h-[40px]'} px-4 rounded-[6px] font-medium flex flex-col items-center justify-center transition-opacity active:opacity-80 select-none ${
        fullWidth ? 'w-full' : 'w-auto'
      } ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer'} ${className}`}
      style={getVariantStyles()}
    >
      <span className={`${subLabel && size !== 'xl' ? 'text-[15px] leading-[19px]' : 'text-[16px] leading-[20px]'} font-medium truncate`}>
        {children}
      </span>
      {subLabel && (
        <span
          className={`text-[12px] ${size === 'xl' ? 'leading-[16px] mt-0.5' : 'leading-[15px]'} font-normal opacity-90 truncate`}
        >
          {subLabel}
        </span>
      )}
    </button>
  )
}
