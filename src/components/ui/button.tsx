import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex h-11 items-center justify-center gap-2 rounded-xl border-[1.5px] px-4 text-sm font-semibold transition-[transform,box-shadow,background-color,border-color,color] duration-100 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'border-[var(--ink)] bg-[var(--primary)] text-white shadow-[3px_3px_0_var(--ink)] hover:-translate-y-px hover:bg-[var(--primary-hover)] hover:shadow-[4px_5px_0_var(--ink)] active:translate-x-[2px] active:translate-y-[3px] active:shadow-[1px_1px_0_var(--ink)]',
        secondary:
          'border-[var(--ink)] bg-[var(--surface)] text-[var(--ink)] shadow-[3px_3px_0_var(--ink)] hover:-translate-y-px hover:bg-[var(--surface-strong)] hover:shadow-[4px_5px_0_var(--ink)] active:translate-x-[2px] active:translate-y-[3px] active:shadow-[1px_1px_0_var(--ink)]',
        ghost:
          'border-transparent text-[var(--muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--ink)]',
        danger:
          'border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger)] hover:bg-[var(--danger-bg-strong)]',
      },
      size: {
        sm: 'h-9 rounded-lg px-3 text-xs',
        md: 'h-11 px-4 text-sm',
        lg: 'h-12 px-5 text-sm',
        icon: 'h-10 w-10 px-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({
  className,
  variant,
  size,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      type={type}
      {...props}
    />
  )
}
