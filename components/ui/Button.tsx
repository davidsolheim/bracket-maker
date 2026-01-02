'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    const baseStyles = cn(
      'relative cursor-pointer rounded-lg font-semibold uppercase tracking-wide',
      'transition-all duration-200 ease-out',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-dark)]',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'overflow-hidden',
      'heading',
      'active:scale-[0.98] hover:scale-[1.02]',
      disabled && 'hover:scale-100 active:scale-100'
    );
    
    const variantStyles = {
      primary: cn(
        'bg-gradient-to-b from-[var(--neon-cyan-dim)] to-[#007a80]',
        'text-white border border-[var(--neon-cyan)]/50',
        'hover:from-[var(--neon-cyan)] hover:to-[var(--neon-cyan-dim)]',
        'hover:border-[var(--neon-cyan)] hover:shadow-[0_0_20px_rgba(0,245,255,0.4)]',
        'focus:ring-[var(--neon-cyan)]'
      ),
      secondary: cn(
        'bg-gradient-to-b from-[var(--bg-elevated)] to-[var(--bg-card)]',
        'text-[var(--text-primary)] border border-[var(--border-dim)]',
        'hover:border-[var(--neon-cyan)]/50 hover:shadow-[0_0_15px_rgba(0,245,255,0.2)]',
        'focus:ring-[var(--neon-cyan)]'
      ),
      danger: cn(
        'bg-gradient-to-b from-[#8b0000] to-[#5c0000]',
        'text-white border border-[#ff4444]/50',
        'hover:from-[#aa0000] hover:to-[#8b0000]',
        'hover:border-[#ff6666] hover:shadow-[0_0_15px_rgba(255,68,68,0.3)]',
        'focus:ring-red-500'
      ),
      ghost: cn(
        'bg-transparent text-[var(--text-secondary)]',
        'hover:bg-white/5 hover:text-[var(--neon-cyan)]',
        'focus:ring-[var(--neon-cyan)]',
        'border border-transparent hover:border-[var(--border-dim)]'
      ),
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-7 py-3.5 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled}
        {...props}
      >
        {/* Shimmer effect container */}
        <span className="absolute inset-0 overflow-hidden pointer-events-none">
          <span className="shimmer-effect absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full" />
        </span>
        
        {/* Button content */}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';
