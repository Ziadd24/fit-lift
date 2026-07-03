import React from 'react';
import Image from 'next/image';

interface PremiumLoaderProps {
  /** If true, the loader will overlay the entire screen */
  fullScreen?: boolean;
  /** Custom minimum height for non-fullscreen mode */
  minHeight?: string;
}

export function PremiumLoader({ fullScreen = false, minHeight = "50vh" }: PremiumLoaderProps) {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
        {/* Pulsing glow effect behind the logo */}
        <div 
          className="absolute inset-4 bg-[#7CFC00] rounded-full blur-[30px] opacity-20 animate-pulse" 
          style={{ animationDuration: '1.5s' }}
        />
        {/* The actual logo image pulsing */}
        <Image
          src="/images/logo.png"
          alt="Loading..."
          fill
          className="object-contain animate-pulse z-10"
          style={{ animationDuration: '1.5s' }}
          priority
        />
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center" style={{ minHeight }}>
      {content}
    </div>
  );
}
