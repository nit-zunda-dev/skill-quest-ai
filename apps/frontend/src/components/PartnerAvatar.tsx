/**
 * パートナー立ち絵・表情画像の表示コンポーネント（Task 3.1, 3.2, Requirements 2.1–2.3, 4.x, 6.1–6.2）
 * バリアントと表情に応じた画像を表示し、読み込み失敗時は責めないトーンのフォールバックに切り替える。
 */
import { getPartnerImagePath } from '@/lib/partner-assets';
import type { PartnerExpression, PartnerVariant } from '@/lib/partner-assets';
import { MessageCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';

const DEFAULT_ALT = 'AIパートナー';
const DEFAULT_ASPECT_RATIO = '3/4';
/** 画像読み込み失敗時のフォールバック文言（責めない・応援するトーン、Req 6.2） */
const FALLBACK_MESSAGE = '相棒がここにいる';

export interface PartnerAvatarProps {
  variant: PartnerVariant;
  expression: PartnerExpression;
  className?: string;
  aspectRatio?: string;
  alt?: string;
}

export function PartnerAvatar({
  variant,
  expression,
  className,
  aspectRatio = DEFAULT_ASPECT_RATIO,
  alt = DEFAULT_ALT,
}: PartnerAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const src = getPartnerImagePath(variant, expression);

  if (imageError) {
    return (
      <div
        className={clsx(
          'flex flex-col items-center justify-center gap-2 text-muted-foreground',
          className
        )}
        style={{ aspectRatio }}
      >
        <MessageCircle className="size-10 shrink-0 opacity-70" aria-hidden />
        <span className="text-sm">{FALLBACK_MESSAGE}</span>
      </div>
    );
  }

  return (
    <div
      className={clsx('overflow-hidden', className)}
      style={{ aspectRatio }}
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-contain object-bottom"
        onError={() => setImageError(true)}
      />
    </div>
  );
}
