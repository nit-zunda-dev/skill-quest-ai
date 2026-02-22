/**
 * ルート描画時に document.title と meta を設定するコンポーネント（Task 7.1, Requirements 3.1, 3.2, 3.4）
 */
import React from 'react';
import { usePageMeta, type RouteMetaEntry } from '@/hooks/usePageMeta';

export type PageMetaProps = RouteMetaEntry & {
  children?: React.ReactNode;
};

export function PageMeta({ title, description, noindex, children }: PageMetaProps): React.ReactNode {
  usePageMeta({ title, description, noindex });
  return children ?? null;
}
