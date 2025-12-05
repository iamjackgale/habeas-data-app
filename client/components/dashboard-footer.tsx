'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export function DashboardFooter() {
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

  return (
    <footer className="w-full flex flex-col items-center justify-center pt-4 pb-[15px] mt-4">
      {/* Powered by text */}
      <p className="text-center text-sm text-foreground mb-3">powered by</p>
      
      {/* Logo table */}
      <div className="w-full max-w-[30.576rem]">
        <table className="w-full border-collapse" style={{ backgroundColor: 'transparent' }}>
          <tbody>
            <tr>
              {/* Left cell: Octav sideview */}
              <td className="w-1/2 text-center align-middle">
                <div className="flex items-center justify-center h-[3.136rem]">
                  <Image
                    src={isDark ? '/octav-logos/dark/octav-sideview-dark.png' : '/octav-logos/light/octav-sideview-light.png'}
                    alt="Octav"
                    width={180}
                    height={72}
                    className="object-contain"
                  />
                </div>
              </td>
              
              {/* Right cell: Habeas logo */}
              <td className="w-1/2 text-center align-middle">
                <div className="flex items-center justify-center h-[3.136rem]">
                  <Image
                    src={isDark ? '/habeas-logos/dark/habeas-logo-dark-transparent.png' : '/habeas-logos/light/habeas-logo-light-transparent.png'}
                    alt="Habeas"
                    width={205}
                    height={81}
                    className="object-contain"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </footer>
  );
}

