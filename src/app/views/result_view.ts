import { ResultState } from '../models';
import { iconCorrect, iconIncorrect } from '../utils/icons';

function wrongCardRow(front: string): string {
  // front はサニタイズ済み HTML。一覧では装飾を抑えてプレビュー表示する。
  return `<li class="wrong-card"><div class="card-content card-content--mini">${front}</div></li>`;
}

/** 演習結果画面の HTML を生成する。 */
export function renderResult(result: ResultState): string {
  const accuracy = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
  const retryButton =
    result.wrongCards.length > 0
      ? `<button class="btn-primary" type="button" data-action="retry-wrong">誤答 ${result.wrongCards.length} 枚を再演習</button>`
      : '';

  const wrongList =
    result.wrongCards.length > 0
      ? `<div class="space-y-2">
           <h3 class="text-sm font-medium">間違えたカード</h3>
           <ul class="wrong-card-list">${result.wrongCards.map((c) => wrongCardRow(c.front)).join('')}</ul>
         </div>`
      : `<p class="text-center text-correct">全問正解！🎉</p>`;

  return `
    <div class="result space-y-6">
      <div class="result-summary">
        <p class="result-accuracy">${accuracy}<span class="text-base">%</span></p>
        <p class="result-counts">
          <span class="text-correct">${iconCorrect()} ${result.correct}</span>
          ／
          <span class="text-incorrect">${iconIncorrect()} ${result.incorrect}</span>
          ／ 全 ${result.total} 枚
        </p>
      </div>

      ${wrongList}

      <div class="result-actions">
        ${retryButton}
        <button class="btn-secondary" type="button" data-action="exit-study">ホームへ戻る</button>
      </div>
    </div>`;
}
