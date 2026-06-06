import { Deck } from '../models/entities';
import { cardRepository } from '../repositories/card_repository';
import { cardResultRepository } from '../repositories/card_result_repository';
import { deckRepository } from '../repositories/deck_repository';
import { sessionRepository } from '../repositories/session_repository';

/** 取り込み済みの全問題集を名前順で取得する。 */
export async function loadDecks(): Promise<Deck[]> {
  const decks = await deckRepository.getAll();
  return decks.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
}

/** 問題集をカード・履歴ごとローカルから完全に削除する。 */
export async function deleteDeckCompletely(deckId: string): Promise<void> {
  await cardRepository.deleteByDeck(deckId);
  await cardResultRepository.deleteByDeck(deckId);
  await sessionRepository.deleteByDeck(deckId);
  await deckRepository.delete(deckId);
}
