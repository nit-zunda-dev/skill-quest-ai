/**
 * パートナー画像のパス組み立て・型・定数（Task 1.1, Requirements 1.1–1.4, 6.3）
 * public/images/partner/<variant>/ 配下の静的アセット参照用。
 */

export type PartnerVariant = 'default' | 'male';

export type PartnerExpression =
  | 'standing'
  | 'default'
  | 'smile'
  | 'cheer'
  | 'happy'
  | 'worried';

export const PARTNER_BASE_PATH = '/images/partner' as const;

export const PARTNER_STANDING_FILE = 'standing.png' as const;

const EXPRESSION_FILES: Record<Exclude<PartnerExpression, 'standing'>, string> = {
  default: 'expression-default.png',
  smile: 'expression-smile.png',
  cheer: 'expression-cheer.png',
  happy: 'expression-happy.png',
  worried: 'expression-worried.png',
};

const VALID_VARIANTS: PartnerVariant[] = ['default', 'male'];

function normalizeVariant(variant: PartnerVariant): PartnerVariant {
  return VALID_VARIANTS.includes(variant) ? variant : 'default';
}

/**
 * バリアントと表情から画像の参照パスを組み立てる。
 * 不正な variant の場合は default にフォールバックする（Req 6.3）。
 */
export function getPartnerImagePath(
  variant: PartnerVariant,
  expression: PartnerExpression
): string {
  const v = normalizeVariant(variant);
  const filename =
    expression === 'standing' ? PARTNER_STANDING_FILE : EXPRESSION_FILES[expression];
  return `${PARTNER_BASE_PATH}/${v}/${filename}`;
}
