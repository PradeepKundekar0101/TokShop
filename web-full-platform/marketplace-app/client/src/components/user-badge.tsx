import { cn } from '@/lib/utils';
import { Award, CheckCircle, Star } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type BadgeTier = 'rising' | 'verified' | 'icona';

interface UserBadgeProps {
  badgeTier?: BadgeTier | string;
  badge?: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const badgeConfig: Record<BadgeTier, { 
  icon: typeof Award; 
  label: string; 
  colors: string;
  bgColor: string;
}> = {
  rising: {
    icon: Star,
    label: 'Rising Star',
    colors: 'text-amber-500',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  verified: {
    icon: CheckCircle,
    label: 'Verified Seller',
    colors: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  icona: {
    icon: Award,
    label: 'Partner',
    colors: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
};

const sizeConfig = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function UserBadge({ 
  badgeTier, 
  badge,
  size = 'md', 
  showTooltip = true,
  className 
}: UserBadgeProps) {
  const sizeClass = sizeConfig[size];
  
  // If badge URL is provided, use the image
  if (badge) {
    const badgeElement = (
      <span 
        className={cn(
          'inline-flex items-center justify-center flex-shrink-0',
          className
        )}
        data-testid="badge-image"
      >
        <img 
          src={badge} 
          alt="User badge" 
          className={cn(sizeClass, 'object-contain')} 
        />
      </span>
    );

    if (!showTooltip) {
      return badgeElement;
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeElement}
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Badge
        </TooltipContent>
      </Tooltip>
    );
  }

  // Fallback to tier-based icons if no badge URL
  if (!badgeTier || !badgeConfig[badgeTier as BadgeTier]) {
    return null;
  }

  const config = badgeConfig[badgeTier as BadgeTier];
  const Icon = config.icon;

  const badgeIcon = (
    <span 
      className={cn(
        'inline-flex items-center justify-center flex-shrink-0',
        config.colors,
        className
      )}
      data-testid={`badge-tier-${badgeTier}`}
    >
      <Icon className={cn(sizeClass, 'fill-current')} />
    </span>
  );

  if (!showTooltip) {
    return badgeIcon;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badgeIcon}
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {config.label}
      </TooltipContent>
    </Tooltip>
  );
}
