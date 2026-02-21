/**
 * ルート別の document.title と meta タグを設定するフック（Task 7.1, Requirements 3.1, 3.2, 3.4）
 */
import { useEffect } from 'react';

export type RouteMetaEntry = {
  title: string;
  description?: string;
  noindex?: boolean;
};

function ensureMetaElement(name: string, attribute: 'name' | 'property' = 'name'): HTMLMetaElement {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, name);
    document.head.appendChild(el);
  }
  return el;
}

export function usePageMeta(meta: RouteMetaEntry): void {
  useEffect(() => {
    document.title = meta.title;

    if (meta.description !== undefined) {
      const el = ensureMetaElement('description');
      el.setAttribute('content', meta.description);
    }

    if (meta.noindex) {
      const el = ensureMetaElement('robots');
      el.setAttribute('content', 'noindex, nofollow');
    } else {
      const el = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
      if (el) el.remove();
    }
  }, [meta.title, meta.description, meta.noindex]);
}
