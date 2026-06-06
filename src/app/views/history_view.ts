import { HistoryDetailCard, HistoryDetailState, Model } from '../models';
import { Session, StudyOrder, StudyRangeKind } from '../models/entities';
import { escapeHtml } from '../utils/dom';
import { iconCorrect, iconIncorrect } from '../utils/icons';

function orderLabel(order: StudyOrder): string {
  return order === StudyOrder.Registered ? '登録順' : 'シャッフル';
}

function rangeLabel(kind: StudyRangeKind): string {
  switch (kind) {
    case StudyRangeKind.WrongOnly:
      return '誤答のみ';
    case StudyRangeKind.Filter:
      return '絞り込み';
    case StudyRangeKind.All:
    default:
      return '全件';
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('ja-JP');
}

function sessionRow(session: Session): string {
  const accuracy = session.total > 0 ? Math.round((session.correct / session.total) * 100) : 0;
  const status = session.finishedAt ? '' : '<span class="history-incomplete">（中断）</span>';
  return `
    <li class="history-row history-row--clickable" data-action="history-detail" data-session-id="${escapeHtml(
      session.id,
    )}" role="button" tabindex="0">
      <div class="min-w-0">
        <p class="truncate font-medium">${escapeHtml(session.deckName)} ${status}</p>
        <p class="history-meta">${formatDate(session.startedAt)} ・ ${orderLabel(session.order)} ・ ${rangeLabel(
          session.range.kind,
        )}</p>
      </div>
      <div class="history-score">
        <p class="font-semibold">${accuracy}%</p>
        <p class="history-meta">
          <span class="text-correct">${iconCorrect(15)} ${session.correct}</span>
          /
          <span class="text-incorrect">${iconIncorrect(15)} ${session.incorrect}</span>
          / ${session.total}
        </p>
      </div>
    </li>`;
}

function filterHistory(history: Session[], search: string): Session[] {
  const q = search.trim().toLocaleLowerCase();
  if (!q) return history;
  return history.filter((s) => s.deckName.toLocaleLowerCase().includes(q));
}

/** 履歴画面の HTML を生成する。 */
export function renderHistory(model: Model): string {
  const visible = filterHistory(model.history, model.historySearch);
  const body =
    model.history.length === 0
      ? `<p class="py-8 text-center text-sm text-gray-500">まだ演習履歴がありません。</p>`
      : visible.length === 0
        ? `<p class="py-8 text-center text-sm text-gray-500">「${escapeHtml(model.historySearch)}」に一致する履歴はありません。</p>`
        : `<ul class="history-list">${visible.map(sessionRow).join('')}</ul>`;

  return `
    <div class="space-y-4">
      <div class="screen-topbar">
        <button class="btn-secondary" type="button" data-action="go-home">← 戻る</button>
        <h2 class="screen-title">演習履歴</h2>
      </div>
      <input
        id="history-search"
        type="search"
        class="deck-search"
        placeholder="問題集名で検索…"
        value="${escapeHtml(model.historySearch)}"
      />
      ${body}
    </div>`;
}

function detailCardRow(card: HistoryDetailCard, index: number): string {
  const correct = card.result === 'correct';
  const badge = correct
    ? `<span class="history-detail-badge text-correct">${iconCorrect(15)} 正解</span>`
    : `<span class="history-detail-badge text-incorrect">${iconIncorrect(15)} 不正解</span>`;

  // front/back は取り込み時にサニタイズ済みの HTML。見つからない場合のみエスケープ表示。
  const body =
    card.front === null
      ? `<p class="history-detail-missing">${escapeHtml(
          'カードが見つかりません（問題集が未取り込み）',
        )}</p>`
      : `<div class="history-detail-face">
           <span class="history-detail-face-label">問題</span>
           <div class="card-content card-content--mini">${card.front}</div>
         </div>
         <div class="history-detail-face">
           <span class="history-detail-face-label">回答</span>
           <div class="card-content card-content--mini">${card.back ?? ''}</div>
         </div>`;

  return `
    <li class="history-detail-card">
      <div class="history-detail-card-head">
        <span class="history-detail-index">${index + 1}</span>
        ${badge}
      </div>
      ${body}
    </li>`;
}

/** 履歴詳細ダイアログの HTML を生成する。 */
export function renderHistoryDetailModal(detail: HistoryDetailState): string {
  const { session, cards } = detail;
  const name = escapeHtml(session.deckName);
  const accuracy = session.total > 0 ? Math.round((session.correct / session.total) * 100) : 0;
  const status = session.finishedAt ? '' : '<span class="history-incomplete">（中断）</span>';

  const list =
    cards.length > 0
      ? `<ul class="history-detail-list">${cards.map(detailCardRow).join('')}</ul>`
      : `<p class="py-4 text-center text-sm text-gray-500">出題されたカードがありません。</p>`;

  return `
    <div class="modal-overlay" data-action="close-history-detail-overlay">
      <div class="modal modal--wide" role="dialog" aria-modal="true" aria-label="演習結果の詳細">
        <div class="modal-header">
          <h2 class="modal-title">「${name}」の演習結果 ${status}</h2>
          <button class="icon-button" type="button" data-action="close-history-detail" aria-label="閉じる">✕</button>
        </div>

        <div class="modal-body space-y-4">
          <div class="history-detail-summary">
            <p class="history-meta">${formatDate(session.startedAt)} ・ ${orderLabel(
              session.order,
            )} ・ ${rangeLabel(session.range.kind)}</p>
            <p class="mt-1">
              <span class="font-semibold">${accuracy}%</span>
              ・
              <span class="text-correct">${iconCorrect(15)} ${session.correct}</span>
              /
              <span class="text-incorrect">${iconIncorrect(15)} ${session.incorrect}</span>
              / ${session.total}
            </p>
          </div>

          <div class="space-y-2">
            <h3 class="text-sm font-medium">出題されたカード</h3>
            ${list}
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" type="button" data-action="close-history-detail">閉じる</button>
        </div>
      </div>
    </div>`;
}
