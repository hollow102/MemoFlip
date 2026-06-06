import { fetchAllJsonFromFolder, getValidAccessToken } from '../api/google_auth';

import { importDeck } from './deck_import_service';
import { parseDriveDeck } from './drive_schema';

export interface ImportSummary {
  imported: number;
  failed: { name: string; error: string }[];
  deckIds: string[];
}

/**
 * 設定済みの Client ID とフォルダ ID を使い、フォルダ内の全 JSON 問題集を取り込む。
 * 不正な JSON はスキップして失敗として集計する。
 */
export async function importDecksFromDrive(
  clientId: string,
  folderId: string,
): Promise<ImportSummary> {
  const token = await getValidAccessToken(clientId, { interactive: true });
  const files = await fetchAllJsonFromFolder(token, folderId);

  const summary: ImportSummary = { imported: 0, failed: [], deckIds: [] };

  for (const file of files) {
    try {
      const driveDeck = parseDriveDeck(file.content);
      const deck = await importDeck(driveDeck, file.id);
      summary.imported++;
      summary.deckIds.push(deck.id);
    } catch (error) {
      summary.failed.push({
        name: file.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return summary;
}
