/**
 * インライン SVG アイコン。fill/stroke は currentColor を使うため、
 * 親要素の text-correct / text-incorrect などの文字色をそのまま継承する。
 */

/** SVG 要素を組み立てる共通ヘルパー。size はピクセル、className は追加クラス。 */
function svg(body: string, size: number, className: string): string {
  const cls = `icon${className ? ` ${className}` : ''}`;
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

/** 正解（チェック付きの丸）アイコン。 */
export function iconCorrect(size = 18, className = ''): string {
  return svg(
    '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    size,
    className,
  );
}

/** 不正解（×付きの丸）アイコン。 */
export function iconIncorrect(size = 18, className = ''): string {
  return svg(
    '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
    size,
    className,
  );
}
