/**
 * バー・パートナー関連のデータ取得フック（好感度・ペットに渡したレアリティ）
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPartnerFavorability, getLastPetRarity } from '@/lib/api-client';

export const PARTNER_FAVORABILITY_QUERY_KEY = ['partner', 'favorability'] as const;
export const LAST_PET_RARITY_QUERY_KEY = ['partner', 'last-pet-rarity'] as const;

export function usePartnerFavorability(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: PARTNER_FAVORABILITY_QUERY_KEY,
    queryFn: getPartnerFavorability,
    enabled: options?.enabled,
  });
}

export function useLastPetRarity(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: LAST_PET_RARITY_QUERY_KEY,
    queryFn: getLastPetRarity,
    enabled: options?.enabled,
  });
}

/** アイテムを渡した後に両方のクエリを無効化する */
export function useInvalidatePartnerBar() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: PARTNER_FAVORABILITY_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: LAST_PET_RARITY_QUERY_KEY });
  };
}
