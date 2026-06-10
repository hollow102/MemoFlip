import { Card, CardResult, CardResultValue, Deck, Session, StudyConfig } from '../models/entities';
import { cardResultRepository } from '../repositories/card_result_repository';
import { sessionRepository } from '../repositories/session_repository';

/** 新しい演習セッションを生成する（未保存）。 */
export function createSession(
  deck: Deck,
  config: StudyConfig,
  total: number,
  queueCardIds: string[],
): Session {
  return {
    id: crypto.randomUUID(),
    deckId: deck.id,
    deckName: deck.name,
    order: config.order,
    range: config.range,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    total,
    correct: 0,
    incorrect: 0,
    queueCardIds,
  };
}

/** セッションを保存（upsert）する。 */
export async function persistSession(session: Session): Promise<void> {
  await sessionRepository.put(session);
}

/** 全セッションを開始日時の降順で取得する。 */
export async function loadHistory(): Promise<Session[]> {
  const sessions = await sessionRepository.getAll();
  return sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

/** 1 枚のカードの解答を記録する。 */
export async function recordCardResult(
  session: Session,
  card: Card,
  value: CardResultValue,
): Promise<void> {
  const result: CardResult = {
    id: crypto.randomUUID(),
    sessionId: session.id,
    deckId: session.deckId,
    cardId: card.cardId,
    result: value,
    answeredAt: new Date().toISOString(),
  };
  await cardResultRepository.put(result);
}
