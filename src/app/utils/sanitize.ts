import DOMPurify from 'dompurify';

/**
 * カードの front/back に格納する HTML をサニタイズする。
 * Drive 由来の任意 HTML をそのまま DOM へ描画するため、許可タグ以外を除去して XSS を防ぐ。
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'],
  });
}
