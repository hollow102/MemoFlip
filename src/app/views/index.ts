import { Screen } from '../enums/screen';
import { Theme } from '../enums/theme';
import { Model, ToastMessage } from '../models';
import { StudyConfig, StudyOrder, StudyRangeKind } from '../models/entities';

import { renderHome } from './deck_view';
import { renderHistory, renderHistoryDetailModal } from './history_view';
import { renderResult } from './result_view';
import { renderSettingModal } from './setting_view';
import { renderStudy, renderStudyStartModal } from './study_view';
import { UIEvent, UIEventHandler } from './ui_event_types';

export interface SettingsPayload {
  googleClientId: string;
  googleFolderId: string;
  autoSync: boolean;
}

/**
 * DOM の参照保持・イベント配線・描画を担当する View。
 * 画面（ホーム/演習/結果）を main に描画し、モーダルは modal-root に描画する。
 * 動的要素は data-action 属性 + イベント委譲で扱う。
 */
export class View {
  private listeners: Partial<Record<UIEvent, UIEventHandler[]>> = {};

  private readonly els: {
    root: HTMLElement;
    main: HTMLElement;
    themeBtn: HTMLButtonElement;
    themeIcon: HTMLElement;
    settingBtn: HTMLButtonElement;
    historyBtn: HTMLButtonElement;
    modalRoot: HTMLElement;
    toastRoot: HTMLElement;
  };

  constructor(private readonly doc: Document) {
    this.els = {
      root: doc.documentElement,
      main: this.byId<HTMLElement>('app-main'),
      themeBtn: this.byId<HTMLButtonElement>('theme-btn'),
      themeIcon: this.byId<HTMLElement>('theme-icon'),
      settingBtn: this.byId<HTMLButtonElement>('setting-btn'),
      historyBtn: this.byId<HTMLButtonElement>('history-btn'),
      modalRoot: this.byId<HTMLElement>('modal-root'),
      toastRoot: this.byId<HTMLElement>('toast-root'),
    };

    this.els.themeBtn.addEventListener('click', () => this.emit(UIEvent.ToggleTheme));
    this.els.settingBtn.addEventListener('click', () => this.emit(UIEvent.OpenSetting));
    this.els.historyBtn.addEventListener('click', () => this.emit(UIEvent.OpenHistory));

    this.els.main.addEventListener('click', (e) => this.onMainClick(e));
    this.els.main.addEventListener('input', (e) => this.onMainInput(e));
    this.els.modalRoot.addEventListener('click', (e) => this.onModalClick(e));
  }

  on(event: UIEvent, handler: UIEventHandler): void {
    (this.listeners[event] ??= []).push(handler);
  }

  private emit(event: UIEvent, payload?: unknown): void {
    this.listeners[event]?.forEach((handler) => handler(payload));
  }

  render(model: Model): void {
    this.applyTheme(model.theme);
    this.renderScreen(model);
    this.renderModal(model);
    this.renderToasts(model.toastMessages);
  }

  private applyTheme(theme: Theme): void {
    this.els.root.classList.toggle('dark', theme === Theme.Dark);
    this.els.root.setAttribute('data-theme', theme);
    this.els.themeIcon.textContent = theme === Theme.Dark ? '☀️' : '🌙';
  }

  private renderScreen(model: Model): void {
    // main 内の入力にフォーカスがある場合は、再描画後に同 id の要素へ復元する。
    const active = this.doc.activeElement as HTMLInputElement | null;
    const focusId = active && active.id && this.els.main.contains(active) ? active.id : null;
    const caret =
      focusId && typeof active!.selectionStart === 'number' ? active!.selectionStart : null;

    this.els.main.innerHTML = this.screenHtml(model);

    if (focusId) {
      const input = this.doc.getElementById(focusId) as HTMLInputElement | null;
      if (input) {
        input.focus();
        if (caret != null && typeof input.setSelectionRange === 'function') {
          const pos = Math.min(caret, input.value.length);
          input.setSelectionRange(pos, pos);
        }
      }
    }
  }

  private screenHtml(model: Model): string {
    switch (model.screen) {
      case Screen.Study:
        return model.study ? renderStudy(model.study) : '';
      case Screen.Result:
        return model.result ? renderResult(model.result) : '';
      case Screen.History:
        return renderHistory(model);
      case Screen.Home:
      default:
        return renderHome(model);
    }
  }

  private renderModal(model: Model): void {
    if (model.settingOpen) {
      this.els.modalRoot.innerHTML = renderSettingModal(model);
    } else if (model.studyStart) {
      this.els.modalRoot.innerHTML = renderStudyStartModal(model.studyStart);
    } else if (model.historyDetail) {
      this.els.modalRoot.innerHTML = renderHistoryDetailModal(model.historyDetail);
    } else {
      this.els.modalRoot.innerHTML = '';
    }
  }

  private renderToasts(messages: ToastMessage[]): void {
    this.els.toastRoot.replaceChildren(
      ...messages.map((msg) => {
        const el = this.doc.createElement('div');
        el.className = `toast toast--${msg.kind}`;
        el.textContent = msg.text;
        el.addEventListener('click', () => this.emit(UIEvent.DismissToast, msg.id));
        return el;
      }),
    );
  }

  private onMainClick(e: Event): void {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    const deckId = target.dataset.deckId;
    const sessionId = target.dataset.sessionId;

    switch (action) {
      case 'open-setting':
        this.emit(UIEvent.OpenSetting);
        break;
      case 'study':
        if (deckId) this.emit(UIEvent.StartStudy, deckId);
        break;
      case 'delete':
        if (deckId) this.emit(UIEvent.DeleteDeck, deckId);
        break;
      case 'flip':
        this.emit(UIEvent.FlipCard);
        break;
      case 'answer':
        this.emit(UIEvent.AnswerCard, target.dataset.value);
        break;
      case 'retry-wrong':
        this.emit(UIEvent.RetryWrong);
        break;
      case 'exit-study':
        this.emit(UIEvent.ExitStudy);
        break;
      case 'go-home':
        this.emit(UIEvent.GoHome);
        break;
      case 'history-detail':
        if (sessionId) this.emit(UIEvent.OpenHistoryDetail, sessionId);
        break;
    }
  }

  private onMainInput(e: Event): void {
    const target = e.target as HTMLElement;
    if (target.id === 'deck-search') {
      this.emit(UIEvent.SearchDecks, (target as HTMLInputElement).value);
    } else if (target.id === 'history-search') {
      this.emit(UIEvent.SearchHistory, (target as HTMLInputElement).value);
    }
  }

  private onModalClick(e: Event): void {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!target) return;
    const action = target.dataset.action;

    switch (action) {
      case 'resume-study':
        if (target.dataset.sessionId) this.emit(UIEvent.ResumeStudy, target.dataset.sessionId);
        break;
      case 'close-setting':
        this.emit(UIEvent.CloseSetting);
        break;
      case 'close-setting-overlay':
        if (e.target === target) this.emit(UIEvent.CloseSetting);
        break;
      case 'save-settings':
        this.emit(UIEvent.SaveSettings, this.readSettings());
        break;
      case 'import-decks':
        this.emit(UIEvent.ImportDecks, this.readSettings());
        break;
      case 'close-study-start':
        this.emit(UIEvent.CloseStudyStart);
        break;
      case 'close-study-start-overlay':
        if (e.target === target) this.emit(UIEvent.CloseStudyStart);
        break;
      case 'begin-study':
        this.emit(UIEvent.BeginStudy, this.readStudyConfig());
        break;
      case 'sync-history':
        this.emit(UIEvent.SyncHistory, this.readSettings());
        break;
      case 'close-history-detail':
        this.emit(UIEvent.CloseHistoryDetail);
        break;
      case 'close-history-detail-overlay':
        if (e.target === target) this.emit(UIEvent.CloseHistoryDetail);
        break;
    }
  }

  private readSettings(): SettingsPayload {
    const clientId =
      (this.doc.getElementById('setting-client-id') as HTMLInputElement | null)?.value ?? '';
    const folderId =
      (this.doc.getElementById('setting-folder-id') as HTMLInputElement | null)?.value ?? '';
    const autoSync =
      (this.doc.getElementById('setting-auto-sync') as HTMLInputElement | null)?.checked ?? false;
    return { googleClientId: clientId.trim(), googleFolderId: folderId.trim(), autoSync };
  }

  private readStudyConfig(): StudyConfig {
    const order =
      this.radioValue('study-order') === StudyOrder.Registered
        ? StudyOrder.Registered
        : StudyOrder.Shuffle;

    const rangeRaw = this.radioValue('study-range');
    const kind =
      rangeRaw === StudyRangeKind.WrongOnly
        ? StudyRangeKind.WrongOnly
        : rangeRaw === StudyRangeKind.Filter
          ? StudyRangeKind.Filter
          : StudyRangeKind.All;

    const tags = Array.from(
      this.els.modalRoot.querySelectorAll<HTMLInputElement>('input[name="study-tag"]:checked'),
    ).map((el) => el.value);

    const limitRaw = (this.doc.getElementById('study-limit') as HTMLInputElement | null)?.value;
    const limitNum = limitRaw ? Number.parseInt(limitRaw, 10) : NaN;
    const limit = Number.isFinite(limitNum) && limitNum > 0 ? limitNum : null;

    return { order, range: { kind, tags, limit } };
  }

  private radioValue(name: string): string | null {
    const checked = this.els.modalRoot.querySelector<HTMLInputElement>(
      `input[name="${name}"]:checked`,
    );
    return checked?.value ?? null;
  }

  private byId<T extends HTMLElement>(id: string): T {
    const el = this.doc.getElementById(id);
    if (!el) throw new Error(`要素が見つかりません: #${id}`);
    return el as T;
  }
}
