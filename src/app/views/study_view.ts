import { StudyStartState, StudyState } from '../models';
import { escapeHtml } from '../utils/dom';
import { iconCorrect, iconIncorrect } from '../utils/icons';

/** 演習中（フリップカード）画面の HTML を生成する。 */
export function renderStudy(study: StudyState): string {
  const total = study.queue.length;
  const current = study.queue[study.index];
  const progressPct = total > 0 ? Math.round((study.index / total) * 100) : 0;
  const flippedClass = study.flipped ? 'is-flipped' : '';

  // front/back は取り込み時にサニタイズ済みの HTML を描画する。
  const actions = study.flipped
    ? `<button class="btn study-answer study-answer--incorrect" type="button" data-action="answer" data-value="incorrect">${iconIncorrect(20)} まだ</button>
       <button class="btn study-answer study-answer--correct" type="button" data-action="answer" data-value="correct">${iconCorrect(20)} 覚えた</button>`
    : `<button class="btn-primary" type="button" data-action="flip">答えを見る</button>`;

  return `
    <div class="study">
      <div class="study-topbar">
        <button class="btn-secondary" type="button" data-action="exit-study">終了</button>
        <span class="study-progress-text">${study.index + 1} / ${total}・正解 ${study.session.correct}</span>
      </div>
      <div class="study-progress"><div class="study-progress-bar" style="width:${progressPct}%"></div></div>

      <div class="flip-card ${flippedClass}" data-action="flip">
        <div class="flip-card-inner">
          <div class="flip-card-face flip-card-front"><div class="card-content">${current.front}</div></div>
          <div class="flip-card-face flip-card-back"><div class="card-content">${current.back}${renderDetail(current.detail)}</div></div>
        </div>
      </div>

      <div class="study-actions">${actions}</div>
    </div>`;
}

/**
 * 裏面の「詳しい解説」を展開式（native <details>）で描画する。detail が空なら何も出さない。
 * data-action="card-detail" を付けてクリックがカードのフリップへ伝播しないようにする
 * （View のイベント委譲は closest('[data-action]') で拾い、未知の action は無視されるため no-op になる）。
 */
function renderDetail(detail: string): string {
  if (!detail) return '';
  return `
    <details class="card-detail" data-action="card-detail">
      <summary class="card-detail-summary">詳しい解説</summary>
      <div class="card-detail-body">${detail}</div>
    </details>`;
}

function tagCheckbox(tag: string): string {
  const safe = escapeHtml(tag);
  return `<label class="check-chip"><input type="checkbox" name="study-tag" value="${safe}" /> ${safe}</label>`;
}

/** 演習開始モーダルの HTML を生成する。 */
export function renderStudyStartModal(start: StudyStartState): string {
  const name = escapeHtml(start.deck.name);
  const tags =
    start.tags.length > 0
      ? `<div class="check-chip-group">${start.tags.map(tagCheckbox).join('')}</div>`
      : `<p class="text-xs text-gray-500">この問題集にタグはありません。</p>`;

  return `
    <div class="modal-overlay" data-action="close-study-start-overlay">
      <div class="modal" role="dialog" aria-modal="true" aria-label="演習開始">
        <div class="modal-header">
          <h2 class="modal-title">「${name}」を学習</h2>
          <button class="icon-button" type="button" data-action="close-study-start" aria-label="閉じる">✕</button>
        </div>

        <div class="modal-body space-y-4">
          <fieldset class="fieldset">
            <legend class="field-label">出題順</legend>
            <label class="radio-row"><input type="radio" name="study-order" value="shuffle" checked /> シャッフル</label>
            <label class="radio-row"><input type="radio" name="study-order" value="registered" /> 登録順</label>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="field-label">出題範囲</legend>
            <label class="radio-row"><input type="radio" name="study-range" value="all" checked /> 全件</label>
            <label class="radio-row"><input type="radio" name="study-range" value="wrong_only" /> 間違えたカードのみ復習</label>
            <label class="radio-row"><input type="radio" name="study-range" value="filter" /> タグ・件数で絞り込み</label>
          </fieldset>

          <div class="filter-options space-y-2">
            <span class="field-label">タグ（絞り込み時）</span>
            ${tags}
            <label class="field">
              <span class="field-label">最大件数（絞り込み時）</span>
              <input id="study-limit" class="field-input" type="number" min="1" placeholder="制限なし" />
            </label>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" type="button" data-action="close-study-start">キャンセル</button>
          <button class="btn-primary" type="button" data-action="begin-study">演習開始</button>
        </div>
      </div>
    </div>`;
}
