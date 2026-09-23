import React from 'react';

interface ArdhnarishwarLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'icon' | 'horizontal' | 'vertical' | 'badge';
  showSubtext?: boolean;
  className?: string;
  animated?: boolean;
}

export const ArdhnarishwarLogo: React.FC<ArdhnarishwarLogoProps> = ({
  size = 'md',
  variant = 'horizontal',
  showSubtext = true,
  className = '',
  animated = true,
}) => {
  const iconDimensions = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  }[size];

  const titleSizes = {
    xs: 'text-xs',
    sm: 'text-sm font-extrabold',
    md: 'text-base font-black',
    lg: 'text-2xl font-black',
    xl: 'text-4xl font-black',
  }[size];

  const subtextSizes = {
    xs: 'text-[8px]',
    sm: 'text-[9px]',
    md: 'text-[10px]',
    lg: 'text-xs',
    xl: 'text-sm',
  }[size];

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${
        variant === 'vertical' ? 'flex-col text-center' : 'flex-row'
      } ${className}`}
    >
      {/* High-Tech Shiva-Shakti Dual-Energy SVG Icon */}
      <div className={`relative ${iconDimensions} shrink-0 group`}>
        {/* Ambient Glow Aura */}
        <div
          className={`absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 opacity-60 blur-md ${
            animated ? 'animate-pulse' : ''
          }`}
        />

        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative w-full h-full rounded-xl drop-shadow-xl"
        >
          <defs>
            {/* Dual Energy Gradients */}
            <linearGradient id="ardh_cyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f5ff" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
            <linearGradient id="ardh_magenta" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="ardh_core" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
            <filter id="ardh_glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feComposite in="SourceGraphic" in2="glow" operator="over" />
            </filter>
          </defs>

          {/* Dark Metallic Inner Base */}
          <rect width="100" height="100" rx="24" fill="#070913" stroke="#1e293b" strokeWidth="3" />

          {/* Left Energy Helix (Shiva / Cognitive Logic - Cyan) */}
          <path
            d="M 50 16 C 30 16, 16 30, 16 50 C 16 70, 30 84, 50 84 C 40 72, 32 58, 38 42 C 42 32, 46 22, 50 16 Z"
            fill="url(#ardh_cyan)"
            opacity="0.95"
            filter="url(#ardh_glow)"
          />

          {/* Right Energy Helix (Shakti / Intuitive Empathy - Magenta/Violet) */}
          <path
            d="M 50 16 C 70 16, 84 30, 84 50 C 84 70, 70 84, 50 84 C 60 72, 68 58, 62 42 C 58 32, 54 22, 50 16 Z"
            fill="url(#ardh_magenta)"
            opacity="0.95"
            filter="url(#ardh_glow)"
          />

          {/* Neural Interlock Circuit Lines */}
          <circle cx="50" cy="50" r="16" stroke="url(#ardh_core)" strokeWidth="3" strokeDasharray="6 3" />
          <circle cx="50" cy="50" r="7" fill="url(#ardh_core)" />

          {/* Quantum Satellites */}
          <circle cx="28" cy="40" r="3.5" fill="#00f5ff" />
          <circle cx="72" cy="60" r="3.5" fill="#f43f5e" />
          <circle cx="50" cy="24" r="3" fill="#ffffff" />
          <circle cx="50" cy="76" r="3" fill="#ffffff" />
        </svg>
      </div>

      {/* Typography Lockup */}
      {variant !== 'icon' && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-tight">
            <span
              className={`${titleSizes} tracking-tight bg-gradient-to-r from-white via-cyan-200 to-indigo-300 bg-clip-text text-transparent`}
            >
              ARDHNARISHWAR
            </span>
            <span className="px-1.5 py-0.5 rounded font-mono text-[9px] font-extrabold bg-cyan-950 text-cyan-300 border border-cyan-700/60 uppercase tracking-wider">
              AI ROBOTICS
            </span>
          </div>

          {showSubtext && (
            <span
              className={`${subtextSizes} font-mono tracking-widest text-cyan-400/90 uppercase font-semibold leading-none mt-0.5`}
            >
              Enterprise AI Robotics SaaS
            </span>
          )}
        </div>
      )}
    </div>
  );
};
