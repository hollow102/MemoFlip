/**
 * Google Drive 上の問題集 JSON のスキーマ定義とバリデーション。
 * 取り込み元は読み取り専用。想定外の構造は早期に例外として弾く。
 */
export interface DriveCard {
  id: string;
  front: string; // HTML 文字列
  back: string; // HTML 文字列
  tags?: string[];
}

export interface DriveDeck {
  id: string;
  name: string;
  description?: string;
  version?: number;
  updatedAt?: string;
  cards: DriveCard[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`問題集 JSON が不正です: ${field} は文字列である必要があります`);
  }
  return value;
}

/**
 * 任意の JSON を DriveDeck として検証・正規化する。不正な場合は例外を投げる。
 */
export function parseDriveDeck(raw: unknown): DriveDeck {
  if (!isRecord(raw)) {
    throw new Error('問題集 JSON が不正です: オブジェクトではありません');
  }

  const id = asString(raw.id, 'id');
  const name = asString(raw.name, 'name');

  if (!Array.isArray(raw.cards)) {
    throw new Error('問題集 JSON が不正です: cards は配列である必要があります');
  }

  const cards: DriveCard[] = raw.cards.map((card, index) => {
    if (!isRecord(card)) {
      throw new Error(`問題集 JSON が不正です: cards[${index}] がオブジェクトではありません`);
    }
    return {
      id: asString(card.id, `cards[${index}].id`),
      front: asString(card.front, `cards[${index}].front`),
      back: asString(card.back, `cards[${index}].back`),
      tags: Array.isArray(card.tags)
        ? card.tags.filter((t): t is string => typeof t === 'string')
        : [],
    };
  });

  return {
    id,
    name,
    description: typeof raw.description === 'string' ? raw.description : '',
    version: typeof raw.version === 'number' ? raw.version : 1,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
    cards,
  };
}
