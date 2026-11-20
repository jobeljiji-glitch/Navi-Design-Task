export interface ScreenShapeProps {
  label?: string
  className?: string
}

export default function ScreenShape({
  label = 'All eyes this way please!',
  className = '',
}: ScreenShapeProps) {
  return (
    <div className={`w-full flex flex-col items-center py-4 ${className}`}>
      {/* Perspective screen trapezoid */}
      <div className="w-[300px] h-[32px] relative flex items-center justify-center">
        <svg
          viewBox="0 0 300 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
          aria-hidden="true"
        >
          <path
            d="M10 24L38 4H262L290 24H10Z"
            fill="var(--screen-tint)"
            stroke="var(--screen-tint)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <span
        className="text-[14px] leading-[20px] font-bold text-text-primary mt-2"
        style={{ color: 'var(--text-primary)' }}
      >
        {label}
      </span>
    </div>
  )
}
