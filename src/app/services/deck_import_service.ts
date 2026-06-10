import { Card, cardKey, Deck } from '../models/entities';
import { cardRepository } from '../repositories/card_repository';
import { deckRepository } from '../repositories/deck_repository';
import { sanitizeHtml } from '../utils/sanitize';

import { DriveDeck } from './drive_schema';

/**
 * 検証済みの DriveDeck を IndexedDB に取り込む（読み取り専用の取り込み）。
 * 既存の同 ID 問題集は再取り込みでカードごと置き換える。front/back は保存前にサニタイズする。
 */
export async function importDeck(driveDeck: DriveDeck, sourceFileId: string | null): Promise<Deck> {
  const now = new Date().toISOString();

  const cards: Card[] = driveDeck.cards.map((card, index) => ({
    key: cardKey(driveDeck.id, card.id),
    deckId: driveDeck.id,
    cardId: card.id,
    front: sanitizeHtml(card.front),
    back: sanitizeHtml(card.back),
    detail: card.detail ? sanitizeHtml(card.detail) : '',
    tags: card.tags ?? [],
    order: index,
  }));

  const deck: Deck = {
    id: driveDeck.id,
    name: driveDeck.name,
    description: driveDeck.description ?? '',
    version: driveDeck.version ?? 1,
    updatedAt: driveDeck.updatedAt || now,
    sourceFileId,
    cardCount: cards.length,
    importedAt: now,
  };

  // 再取り込み時に削除されたカードが残らないよう、一旦削除してから入れ直す。
  await cardRepository.deleteByDeck(deck.id);
  await cardRepository.bulkPut(cards);
  await deckRepository.put(deck);

  return deck;
}

/**
 * 問題集とそれに紐づくカードをローカル（IndexedDB）から削除する。
 * 履歴（sessions / card_results）の削除は呼び出し側の責務とする。
 */
export async function removeDeckCards(deckId: string): Promise<void> {
  await cardRepository.deleteByDeck(deckId);
  await deckRepository.delete(deckId);
}
