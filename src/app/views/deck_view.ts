import { Model } from '../models';
import { Deck } from '../models/entities';
import { escapeHtml } from '../utils/dom';

function filterDecks(decks: Deck[], search: string): Deck[] {
  const q = search.trim().toLocaleLowerCase();
  if (!q) return decks;
  return decks.filter((d) => d.name.toLocaleLowerCase().includes(q));
}

function deckRow(deck: Deck): string {
  return `
    <li class="deck-row" data-deck-id="${escapeHtml(deck.id)}">
      <div class="deck-row-main">
        <p class="deck-row-name">${escapeHtml(deck.name)}</p>
        <p class="deck-row-meta">${deck.cardCount} 枚${
          deck.description ? ` ・ ${escapeHtml(deck.description)}` : ''
        }</p>
      </div>
      <div class="deck-row-actions">
        <button class="btn-primary" type="button" data-action="study" data-deck-id="${escapeHtml(deck.id)}">
          学習
        </button>
        <button class="icon-button" type="button" data-action="delete" data-deck-id="${escapeHtml(deck.id)}" aria-label="削除">
          🗑️
        </button>
      </div>
    </li>`;
}

/** 問題集一覧（ホーム）の HTML を生成する。 */
export function renderHome(model: Model): string {
  if (model.decks.length === 0) {
    return `
      <div class="empty-state">
        <p class="text-lg font-medium">まだ問題集がありません</p>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
          ⚙️ 設定から Google Drive の Client ID とフォルダ ID を登録し、問題集を取り込んでください。
        </p>
        <button class="btn-primary mt-4" type="button" data-action="open-setting">設定を開く</button>
      </div>`;
  }

  const visible = filterDecks(model.decks, model.deckSearch);
  const rows =
    visible.length > 0
      ? `<ul class="deck-list">${visible.map(deckRow).join('')}</ul>`
      : `<p class="py-8 text-center text-sm text-gray-500">「${escapeHtml(model.deckSearch)}」に一致する問題集はありません。</p>`;

  return `
    <div class="space-y-4">
      <input
        id="deck-search"
        type="search"
        class="deck-search"
        placeholder="問題集を検索…"
        value="${escapeHtml(model.deckSearch)}"
      />
      ${rows}
    </div>`;
}
