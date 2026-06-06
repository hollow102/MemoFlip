export type CardResultValue = 'correct' | 'incorrect';

/** 取り込んだ問題集のメタ情報。Drive 上の 1 ファイルに対応する。 */
export interface Deck {
  id: string;
  name: string;
  description: string;
  version: number;
  updatedAt: string; // ISO 8601
  sourceFileId: string | null;
  cardCount: number;
  importedAt: string; // ISO 8601
}

/** カード 1 枚。front/back はサニタイズ済み HTML 文字列。 */
export interface Card {
  key: string; // `${deckId}::${cardId}`（複合キー）
  deckId: string;
  cardId: string;
  front: string;
  back: string;
  tags: string[];
  order: number;
}

export function cardKey(deckId: string, cardId: string): string {
  return `${deckId}::${cardId}`;
}

/** 出題順。 */
export const StudyOrder = {
  Registered: 'registered',
  Shuffle: 'shuffle',
} as const;
export type StudyOrder = (typeof StudyOrder)[keyof typeof StudyOrder];

/** 出題範囲の種別。 */
export const StudyRangeKind = {
  All: 'all',
  WrongOnly: 'wrong_only',
  Filter: 'filter',
} as const;
export type StudyRangeKind = (typeof StudyRangeKind)[keyof typeof StudyRangeKind];

/** 出題範囲（全件 / 誤答のみ / タグ・件数で絞り込み）。 */
export interface StudyRange {
  kind: StudyRangeKind;
  tags: string[];
  limit: number | null;
}

/** 演習開始時の出題設定。 */
export interface StudyConfig {
  order: StudyOrder;
  range: StudyRange;
}

/** 1 回の演習セッション。 */
export interface Session {
  id: string;
  deckId: string;
  deckName: string;
  order: StudyOrder;
  range: StudyRange;
  startedAt: string;
  finishedAt: string | null;
  total: number;
  correct: number;
  incorrect: number;
}

/** カード単位の解答結果。 */
export interface CardResult {
  id: string;
  sessionId: string;
  deckId: string;
  cardId: string;
  result: CardResultValue;
  answeredAt: string;
}
