'use client';

import { CSSProperties, useEffect, useState } from 'react';

interface LoadingSpinnerProps {
  progress?: number; // 0-1
}

export function LoadingSpinner({ progress}: LoadingSpinnerProps) {
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    // Check initial theme
    setIsDark(document.documentElement.classList.contains('dark'));
    
    // Watch for theme changes
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  const spinStyle: CSSProperties = {
    animation: 'spin-triple 2s linear infinite',
  };

  const logoPath = isDark 
    ? '/habeas-logo-dark-transparent.png'
    : '/habeas-logo-light-transparent.png';

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 w-full h-full max-w-full max-h-full">
      <div className="relative w-20 h-20 max-w-[20vw] max-h-[20vh] shrink-0" style={spinStyle}>
        <img 
          src={logoPath} 
          alt="Loading" 
          className="w-full h-full object-contain"
        />
      </div>
      
      {progress !== undefined && (
        <>
          <div className="w-full max-w-64 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {Math.round(progress * 100)}%
          </p>
        </>
      )}
    </div>
  );
}
