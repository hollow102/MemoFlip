import {
  createFile,
  fetchFileJson,
  findFileByName,
  getValidAccessToken,
  updateFileContent,
} from '../api/google_auth';
import { CardResult, Session } from '../models/entities';
import { cardResultRepository } from '../repositories/card_result_repository';
import { sessionRepository } from '../repositories/session_repository';
import { getGoogleUserId } from '../storages';

const HISTORY_FILE = 'memoflip-history.json';

interface HistoryPayload {
  version: number;
  userId: string;
  sessions: Session[];
  cardResults: CardResult[];
  exportedAt: string;
}

async function readRemote(token: string, folderId: string): Promise<HistoryPayload | null> {
  const file = await findFileByName(token, folderId, HISTORY_FILE);
  if (!file) return null;
  const content = (await fetchFileJson(token, file.id)) as Partial<HistoryPayload>;
  return {
    version: content.version ?? 1,
    userId: content.userId ?? '',
    sessions: Array.isArray(content.sessions) ? content.sessions : [],
    cardResults: Array.isArray(content.cardResults) ? content.cardResults : [],
    exportedAt: content.exportedAt ?? '',
  };
}

/**
 * 履歴（sessions / card_results）を Drive と双方向マージする。
 * id（UUID）単位の upsert によるユニオンマージで、リモートを取り込んでからローカル全体を書き戻す。
 */
export async function syncHistory(
  clientId: string,
  folderId: string,
  opts: { interactive: boolean },
): Promise<{ sessions: number }> {
  const token = await getValidAccessToken(clientId, { interactive: opts.interactive });

  // 1. リモートを取り込み（ローカルへマージ）
  const remote = await readRemote(token, folderId);
  if (remote) {
    if (remote.sessions.length > 0) await sessionRepository.bulkPut(remote.sessions);
    if (remote.cardResults.length > 0) await cardResultRepository.bulkPut(remote.cardResults);
  }

  // 2. マージ後のローカル全体を書き戻し
  const sessions = await sessionRepository.getAll();
  const cardResults = await cardResultRepository.getAll();
  const payload: HistoryPayload = {
    version: 1,
    userId: getGoogleUserId(),
    sessions,
    cardResults,
    exportedAt: new Date().toISOString(),
  };

  const file = await findFileByName(token, folderId, HISTORY_FILE);
  if (file) {
    await updateFileContent(token, file.id, payload);
  } else {
    await createFile(token, folderId, HISTORY_FILE, payload);
  }

  return { sessions: sessions.length };
}
