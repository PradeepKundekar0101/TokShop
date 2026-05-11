import { cn } from '@/lib/utils';

export type BadgeTier = 'rising' | 'verified' | 'icona';

interface BadgeDescriptionProps {
  badgeTier?: BadgeTier | string | null;
  size?: number;
  showText?: boolean;
  className?: string;
}

const badgeUrls: Record<string, string> = {
  rising: "https://lh3.googleusercontent.com/d/1hlCe9xAY5hsjuNPGlBOM0eQlkFg2WHJf=w50",
  verified: "https://lh3.googleusercontent.com/d/19SheP1admSa7P4kikO5Y6jikx2iR1fsb=w50",
  icona: "https://lh3.googleusercontent.com/d/1GScLM8Db7jYvQnu09jPF5Q8ffom6g79M=w50",
};

const badgeText: Record<string, string> = {
  rising: "Rising",
  verified: "Verified",
  icona: "Partner",
};

const borderColors: Record<string, string> = {
  rising: "border-blue-200 dark:border-blue-400",
  verified: "border-green-200 dark:border-green-400",
  icona: "border-purple-400 dark:border-purple-300",
};

const textColors: Record<string, string> = {
  rising: "text-blue-300 dark:text-blue-400",
  verified: "text-green-300 dark:text-green-400",
  icona: "text-purple-400 dark:text-purple-300",
};

export function BadgeDescription({ 
  badgeTier, 
  size = 18, 
  showText = true,
  className 
}: BadgeDescriptionProps) {
  if (!badgeTier || badgeTier === '') {
    return null;
  }

  const tier = badgeTier.toLowerCase();
  
  if (!badgeUrls[tier]) {
    return null;
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-1.5 py-0.5",
        borderColors[tier] || "border-gray-200 dark:border-gray-600",
        className
      )}
      data-testid={`badge-description-${tier}`}
    >
      <img 
        src={badgeUrls[tier]} 
        alt={`${badgeText[tier]} badge`}
        style={{ width: size, height: size }}
        className="object-contain"
      />
      {showText && (
        <>
          <span className="w-1" />
          <span 
            className={cn(
              "text-xs font-semibold",
              textColors[tier] || "text-gray-400 dark:text-gray-500"
            )}
          >
            {badgeText[tier]}
          </span>
        </>
      )}
    </div>
  );
}
