/**
 * ペット（バーのアンドロイド）画像パス。
 * レアリティ別に複数画像を用意し、渡したアイテムのレアリティで切替える。
 */
export const PET_BASE_PATH = '/images/partner/pet' as const;

const RARITY_TO_FILENAME: Record<string, string> = {
  common: 'standing-glow-common.png',
  rare: 'standing-glow-rare.png',
  'super-rare': 'standing-glow-super-rare.png',
  'ultra-rare': 'standing-glow-ultra-rare.png',
  legend: 'standing-glow-legend.png',
};

/**
 * レアリティに応じたペット立ち絵のパスを返す。
 * null の場合はデフォルトの standing.png。
 * common 以上は対応するグロー画像。未配置時は PetAvatar の onError で standing.png にフォールバックする。
 */
export function getPetImagePath(rarity: string | null): string {
  if (!rarity) return `${PET_BASE_PATH}/standing.png`;
  const filename = RARITY_TO_FILENAME[rarity] ?? 'standing.png';
  return `${PET_BASE_PATH}/${filename}`;
}
