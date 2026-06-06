import { Model } from '../models';
import { escapeHtml } from '../utils/dom';

/** 設定モーダルの HTML を生成する。 */
export function renderSettingModal(model: Model): string {
  const { googleClientId, googleFolderId } = model.settings;
  const importLabel = model.importing ? '取り込み中…' : 'Drive から取り込む';

  return `
    <div class="modal-overlay" data-action="close-setting-overlay">
      <div class="modal" role="dialog" aria-modal="true" aria-label="設定">
        <div class="modal-header">
          <h2 class="modal-title">設定</h2>
          <button class="icon-button" type="button" data-action="close-setting" aria-label="閉じる">✕</button>
        </div>

        <div class="modal-body space-y-4">
          <label class="field">
            <span class="field-label">Google Client ID</span>
            <input id="setting-client-id" class="field-input" type="text"
              placeholder="xxxxxxxx.apps.googleusercontent.com"
              value="${escapeHtml(googleClientId)}" />
          </label>

          <label class="field">
            <span class="field-label">Drive フォルダ ID</span>
            <input id="setting-folder-id" class="field-input" type="text"
              placeholder="問題集 JSON を置いたフォルダの ID"
              value="${escapeHtml(googleFolderId)}" />
          </label>

          <p class="text-xs text-gray-500 dark:text-gray-400">
            フォルダ ID は Drive の URL（…/folders/<b>ここ</b>）から取得できます。
          </p>

          <label class="radio-row">
            <input id="setting-auto-sync" type="checkbox" ${model.settings.autoSync ? 'checked' : ''} />
            演習終了時に履歴を自動同期する
          </label>

          <button class="btn-secondary w-full" type="button" data-action="sync-history" ${
            model.syncing ? 'disabled' : ''
          }>${model.syncing ? '同期中…' : '履歴を今すぐ同期'}</button>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" type="button" data-action="save-settings">保存</button>
          <button class="btn-primary" type="button" data-action="import-decks" ${
            model.importing ? 'disabled' : ''
          }>${importLabel}</button>
        </div>
      </div>
    </div>`;
}
