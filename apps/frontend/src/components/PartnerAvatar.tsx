/**
 * パートナー立ち絵・表情画像の表示コンポーネント（Task 3.1, Requirements 2.1–2.3, 4.x）
 * バリアントと表情に応じた画像を表示し、縦長アスペクト比とレイアウト用クラスを指定可能にする。
 */
import { getPartnerImagePath } from '@/lib/partner-assets';
import type { PartnerExpression, PartnerVariant } from '@/lib/partner-assets';
import { clsx } from 'clsx';

const DEFAULT_ALT = 'AIパートナー';
const DEFAULT_ASPECT_RATIO = '3/4';

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
  const src = getPartnerImagePath(variant, expression);

  return (
    <div
      className={clsx('overflow-hidden', className)}
      style={{ aspectRatio }}
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-contain object-bottom"
      />
    </div>
  );
}
