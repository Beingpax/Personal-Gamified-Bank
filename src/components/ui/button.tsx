import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]',
        secondary:
          'border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-strong)]',
        ghost:
          'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)]',
        danger:
          'border border-[var(--danger-border)] bg-[var(--danger-bg)] text-[var(--danger)] hover:bg-[var(--danger-bg-strong)]',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-5 text-sm',
        icon: 'h-9 w-9 px-0',
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
