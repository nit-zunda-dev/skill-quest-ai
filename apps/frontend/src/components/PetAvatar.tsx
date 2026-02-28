/**
 * バーにいるペット（サイバーパンク風アンドロイド）の立ち絵。
 * 最後に渡したアイテムのレアリティに応じて画像を切替える。
 */
import React from 'react';
import { getPetImagePath } from '@/lib/pet-assets';

export interface PetAvatarProps {
  /** ペットに最後に渡したアイテムのレアリティ。null ならデフォルト画像 */
  lastGrantedRarity: string | null;
  className?: string;
  alt?: string;
  aspectRatio?: string;
}

const DEFAULT_PET_SRC = getPetImagePath(null);

export function PetAvatar({
  lastGrantedRarity,
  className,
  alt = 'ペット',
  aspectRatio,
}: PetAvatarProps) {
  const src = getPetImagePath(lastGrantedRarity);
  const [currentSrc, setCurrentSrc] = React.useState(src);

  React.useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  const handleError = () => {
    setCurrentSrc(DEFAULT_PET_SRC);
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={{
        ...(aspectRatio ? { aspectRatio } : {}),
        background: 'transparent',
      }}
      loading="lazy"
      onError={handleError}
    />
  );
}
