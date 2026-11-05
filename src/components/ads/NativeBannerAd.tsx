import { useEffect } from 'react';

interface NativeBannerAdProps {
  className?: string;
}

export function NativeBannerAd({ className = '' }: NativeBannerAdProps) {
  useEffect(() => {
    // If invoke.js is not loaded yet, append it dynamically
    const scriptSrc = 'https://pl31548345.profitableratecpmnetwork.com/0b6d6ebeb5898939195179a02852419c/invoke.js';
    const existing = document.querySelector(`script[src="${scriptSrc}"]`);
    if (!existing) {
      const script = document.createElement('script');
      script.async = true;
      script.setAttribute('data-cfasync', 'false');
      script.src = scriptSrc;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div
      id="adsterra-native-banner-wrapper"
      className={`w-full my-6 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs ${className}`}
    >
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium pb-2 border-b border-slate-100 dark:border-slate-800/80 mb-3">
        <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
          <span>📢</span> Sponsored Student Resources &amp; Offers
        </span>
        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
          Ad
        </span>
      </div>

      {/* Adsterra Native Banner 4:1 Container */}
      <div className="min-h-[90px] w-full flex items-center justify-center overflow-hidden">
        <div id="container-0b6d6ebeb5898939195179a02852419c" className="w-full text-center" />
      </div>
    </div>
  );
}
