import { Card, CardResultValue, StudyConfig, StudyOrder, StudyRangeKind } from '../models/entities';
import { cardRepository } from '../repositories/card_repository';
import { cardResultRepository } from '../repositories/card_result_repository';

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** カードごとの「最後の解答結果」を返す（誤答のみ復習の判定に使う）。 */
export async function latestResultByCard(deckId: string): Promise<Map<string, CardResultValue>> {
  const results = await cardResultRepository.getByDeck(deckId);
  const latest = new Map<string, { value: CardResultValue; at: string }>();
  for (const r of results) {
    const prev = latest.get(r.cardId);
    if (!prev || r.answeredAt > prev.at)
      latest.set(r.cardId, { value: r.result, at: r.answeredAt });
  }
  const map = new Map<string, CardResultValue>();
  latest.forEach((v, k) => map.set(k, v.value));
  return map;
}

/** 問題集に含まれる全タグを重複なく取得する。 */
export async function getDeckTags(deckId: string): Promise<string[]> {
  const cards = await cardRepository.getByDeck(deckId);
  const set = new Set<string>();
  cards.forEach((c) => c.tags.forEach((t) => set.add(t)));
  return [...set].sort((a, b) => a.localeCompare(b, 'ja'));
}

/** 出題設定に従って学習対象カードのキューを組み立てる。 */
export async function buildStudyQueue(deckId: string, config: StudyConfig): Promise<Card[]> {
  const cards = await cardRepository.getByDeck(deckId);
  let pool = cards;

  if (config.range.kind === StudyRangeKind.WrongOnly) {
    const last = await latestResultByCard(deckId);
    pool = cards.filter((c) => last.get(c.cardId) === 'incorrect');
  } else if (config.range.kind === StudyRangeKind.Filter && config.range.tags.length > 0) {
    pool = cards.filter((c) => c.tags.some((t) => config.range.tags.includes(t)));
  }

  pool =
    config.order === StudyOrder.Shuffle
      ? shuffle(pool)
      : [...pool].sort((a, b) => a.order - b.order);

  if (config.range.kind === StudyRangeKind.Filter && config.range.limit && config.range.limit > 0) {
    pool = pool.slice(0, config.range.limit);
  }

  return pool;
}
