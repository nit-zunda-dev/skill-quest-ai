/**
 * better-auth @better-auth/core/utils のシャイム
 * 1.4.18 の core に dist/utils が含まれないため Vitest 用に用意。
 * better-auth の React クライアントが capitalizeFirstLetter のみ参照している。
 */
export function capitalizeFirstLetter(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
