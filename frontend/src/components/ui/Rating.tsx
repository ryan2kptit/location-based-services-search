import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/utils/cn';

interface RatingProps {
  value: number;
  max?: number;
  showCount?: boolean;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Rating: React.FC<RatingProps> = ({
  value,
  max = 5,
  showCount = false,
  count,
  size = 'md',
  className,
}) => {
  // Convert value to number in case it comes as string from backend
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  const sizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(numericValue);
        const partial = i === Math.floor(numericValue) && numericValue % 1 !== 0;

        return (
          <div key={i} className="relative">
            <Star
              className={cn(
                sizes[size],
                filled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-200 text-gray-200'
              )}
            />
            {partial && (
              <div
                className="absolute top-0 left-0 overflow-hidden"
                style={{ width: `${(numericValue % 1) * 100}%` }}
              >
                <Star className={cn(sizes[size], 'fill-yellow-400 text-yellow-400')} />
              </div>
            )}
          </div>
        );
      })}
      {numericValue > 0 && (
        <span className={cn('ml-1 font-medium text-gray-700', textSizes[size])}>
          {numericValue.toFixed(1)}
        </span>
      )}
      {showCount && count !== undefined && (
        <span className={cn('text-gray-500', textSizes[size])}>({count})</span>
      )}
    </div>
  );
};
