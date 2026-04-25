"use client";

import { Card } from "@/components/ui/PremiumComponents";
import { cn } from "@/lib/utils";

const HOME_LIFT = "transition-all duration-300 hover:scale-[1.03] active:scale-95";
const HOME_GLOW = "hover:shadow-[0_0_30px_rgba(124,252,0,0.24)]";
const HOME_CARD = `${HOME_LIFT} ${HOME_GLOW}`;

export interface CoachListItem {
  id?: number;
  name: string;
  display_order?: number | null;
}

export function CoachCard({
  coach,
  caption,
  imageUrl,
  ctaLabel,
  ctaHref,
  onCtaClick,
  className,
}: {
  coach: CoachListItem;
  caption?: string;
  imageUrl?: string;
  ctaLabel: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  className?: string;
}) {
  return (
    <Card className={cn("group border border-white/10 bg-card overflow-hidden h-full", HOME_CARD, className)}>
      <div className="aspect-[3/4] overflow-hidden bg-black/40 relative">
        <img
          src={imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(coach.name)}`}
          alt={coach.name}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(coach.name)}`;
          }}
        />
      </div>
      <div className="p-3 md:p-4 flex flex-col flex-grow">
        <h4 className="text-white font-bold text-sm md:text-lg">{coach.name}</h4>
        <div className="h-6 mt-1">
          {caption ? <p className="text-white/60 text-xs line-clamp-1">{caption}</p> : <span className="invisible text-xs">&nbsp;</span>}
        </div>
        {onCtaClick ? (
          <button
            type="button"
            onClick={onCtaClick}
            className="mt-auto block w-full min-h-11 py-2.5 rounded-full bg-[#7CFC00] text-black font-bold text-xs text-center transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(124,252,0,0.4)] active:scale-95"
          >
            <span className="inline-flex min-h-6 items-center justify-center">{ctaLabel}</span>
          </button>
        ) : (
          <a
            href={ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto block w-full min-h-11 py-2.5 rounded-full bg-[#7CFC00] text-black font-bold text-xs text-center transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(124,252,0,0.4)] active:scale-95"
          >
            <span className="inline-flex min-h-6 items-center justify-center">{ctaLabel}</span>
          </a>
        )}
      </div>
    </Card>
  );
}
