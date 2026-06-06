import { Screen } from '../enums/screen';
import { Theme } from '../enums/theme';
import {
  createInitialModel,
  HistoryDetailCard,
  Model,
  ResultState,
  Settings,
  StudyState,
} from '../models';
import { CardResultValue, StudyConfig, StudyOrder, StudyRangeKind } from '../models/entities';
import { cardRepository } from '../repositories/card_repository';
import { cardResultRepository } from '../repositories/card_result_repository';
import { deleteDeckCompletely, loadDecks } from '../services/deck_service';
import { importDecksFromDrive } from '../services/drive_import_service';
import { syncHistory } from '../services/history_sync_service';
import { initDatabase } from '../services/indexeddb_service';
import {
  createSession,
  loadHistory,
  persistSession,
  recordCardResult,
} from '../services/session_service';
import { buildStudyQueue, getDeckTags } from '../services/study_service';
import * as storage from '../storages';
import { Action, ActionType } from '../updates/action_types';
import { update } from '../updates/update';
import { SettingsPayload, View } from '../views';
import { UIEvent } from '../views/ui_event_types';

/**
 * View からの UI イベントを受け取り、サービス呼び出し（副作用）と Action の dispatch を
 * 仲介し、Model 更新後に View を再描画する司令塔。
 */
export class Controller {
  private model: Model;

  constructor(private readonly view: View) {
    const settings: Settings = {
      googleClientId: storage.getGoogleClientId() ?? '',
      googleFolderId: storage.getGoogleFolderId() ?? '',
      autoSync: storage.getAutoSync(),
    };
    this.model = createInitialModel(storage.getTheme(), settings);
    this.registerHandlers();
  }

  async start(): Promise<void> {
    this.view.render(this.model);
    try {
      await initDatabase();
      await this.reloadDecks();
    } catch (error) {
      this.toastError('初期化に失敗しました', error);
    }
  }

  private dispatch(action: Action): void {
    this.model = update(this.model, action);
    this.runEffects(action);
    this.view.render(this.model);
  }

  private runEffects(action: Action): void {
    if (action.type === ActionType.SetTheme) {
      storage.setTheme(action.theme);
    }
    if (action.type === ActionType.PushToast) {
      // 追加したトーストを一定時間後に自動で消す。
      const toast = this.model.toastMessages[this.model.toastMessages.length - 1];
      if (toast) {
        setTimeout(() => this.dispatch({ type: ActionType.DismissToast, id: toast.id }), 5000);
      }
    }
  }

  private async reloadDecks(): Promise<void> {
    const decks = await loadDecks();
    this.dispatch({ type: ActionType.SetDecks, decks });
  }

  private persistSettings(settings: SettingsPayload): void {
    storage.setGoogleClientId(settings.googleClientId);
    storage.setGoogleFolderId(settings.googleFolderId);
    storage.setAutoSync(settings.autoSync);
    this.dispatch({ type: ActionType.SetSettings, settings });
  }

  private registerHandlers(): void {
    this.view.on(UIEvent.ToggleTheme, () => {
      const next = this.model.theme === Theme.Dark ? Theme.Light : Theme.Dark;
      this.dispatch({ type: ActionType.SetTheme, theme: next });
    });

    this.view.on(UIEvent.OpenSetting, () => this.dispatch({ type: ActionType.OpenSetting }));
    this.view.on(UIEvent.CloseSetting, () => this.dispatch({ type: ActionType.CloseSetting }));

    this.view.on(UIEvent.SaveSettings, (settings: SettingsPayload) => {
      this.persistSettings(settings);
      this.dispatch({ type: ActionType.PushToast, kind: 'success', text: '設定を保存しました' });
    });

    this.view.on(UIEvent.ImportDecks, (settings: SettingsPayload) => this.handleImport(settings));
    this.view.on(UIEvent.DeleteDeck, (deckId: string) => this.handleDelete(deckId));

    this.view.on(UIEvent.SearchDecks, (text: string) =>
      this.dispatch({ type: ActionType.SetDeckSearch, text }),
    );

    this.view.on(UIEvent.StartStudy, (deckId: string) => this.openStudyStart(deckId));
    this.view.on(UIEvent.CloseStudyStart, () =>
      this.dispatch({ type: ActionType.SetStudyStart, studyStart: null }),
    );
    this.view.on(UIEvent.BeginStudy, (config: StudyConfig) => this.beginStudy(config));
    this.view.on(UIEvent.FlipCard, () => this.flipCard());
    this.view.on(UIEvent.AnswerCard, (value: string) => this.answerCard(value));
    this.view.on(UIEvent.RetryWrong, () => this.retryWrong());
    this.view.on(UIEvent.ExitStudy, () => this.exitStudy());

    this.view.on(UIEvent.OpenHistory, () => this.openHistory());
    this.view.on(UIEvent.OpenHistoryDetail, (sessionId: string) =>
      this.openHistoryDetail(sessionId),
    );
    this.view.on(UIEvent.CloseHistoryDetail, () =>
      this.dispatch({ type: ActionType.SetHistoryDetail, historyDetail: null }),
    );
    this.view.on(UIEvent.SearchHistory, (text: string) =>
      this.dispatch({ type: ActionType.SetHistorySearch, text }),
    );
    this.view.on(UIEvent.SyncHistory, (settings: SettingsPayload) => this.handleSync(settings));
    this.view.on(UIEvent.GoHome, () => this.exitStudy());

    this.view.on(UIEvent.DismissToast, (id?: string) => {
      if (id) this.dispatch({ type: ActionType.DismissToast, id });
    });
  }

  private async handleImport(settings: SettingsPayload): Promise<void> {
    this.persistSettings(settings);

    if (!settings.googleClientId || !settings.googleFolderId) {
      this.dispatch({
        type: ActionType.PushToast,
        kind: 'error',
        text: 'Client ID とフォルダ ID を入力してください',
      });
      return;
    }

    this.dispatch({ type: ActionType.SetImporting, importing: true });
    try {
      const summary = await importDecksFromDrive(settings.googleClientId, settings.googleFolderId);
      await this.reloadDecks();

      const failedText = summary.failed.length > 0 ? `（失敗 ${summary.failed.length} 件）` : '';
      this.dispatch({
        type: ActionType.PushToast,
        kind: summary.failed.length > 0 ? 'error' : 'success',
        text: `${summary.imported} 件の問題集を取り込みました${failedText}`,
      });
      if (summary.imported > 0) {
        this.dispatch({ type: ActionType.CloseSetting });
      }
    } catch (error) {
      this.toastError('取り込みに失敗しました', error);
    } finally {
      this.dispatch({ type: ActionType.SetImporting, importing: false });
    }
  }

  private async handleDelete(deckId: string): Promise<void> {
    const deck = this.model.decks.find((d) => d.id === deckId);
    const name = deck?.name ?? deckId;
    if (!window.confirm(`「${name}」を削除しますか？（履歴も削除されます）`)) return;

    try {
      await deleteDeckCompletely(deckId);
      await this.reloadDecks();
      this.dispatch({
        type: ActionType.PushToast,
        kind: 'success',
        text: `「${name}」を削除しました`,
      });
    } catch (error) {
      this.toastError('削除に失敗しました', error);
    }
  }

  private async openStudyStart(deckId: string): Promise<void> {
    const deck = this.model.decks.find((d) => d.id === deckId);
    if (!deck) return;
    try {
      const tags = await getDeckTags(deckId);
      this.dispatch({ type: ActionType.SetStudyStart, studyStart: { deck, tags } });
    } catch (error) {
      this.toastError('問題集の読み込みに失敗しました', error);
    }
  }

  private async beginStudy(config: StudyConfig): Promise<void> {
    const start = this.model.studyStart;
    if (!start) return;
    const deck = start.deck;

    try {
      const queue = await buildStudyQueue(deck.id, config);
      if (queue.length === 0) {
        this.dispatch({
          type: ActionType.PushToast,
          kind: 'error',
          text: '対象のカードがありません',
        });
        return;
      }

      const session = createSession(deck, config, queue.length);
      await persistSession(session);
      storage.setLastDeckId(deck.id);

      const study: StudyState = {
        session,
        deckName: deck.name,
        queue,
        index: 0,
        flipped: false,
      };
      this.dispatch({ type: ActionType.SetStudyStart, studyStart: null });
      this.dispatch({ type: ActionType.SetStudy, study });
      this.dispatch({ type: ActionType.NavigateTo, screen: Screen.Study });
    } catch (error) {
      this.toastError('演習の開始に失敗しました', error);
    }
  }

  private flipCard(): void {
    const study = this.model.study;
    if (!study) return;
    this.dispatch({ type: ActionType.SetStudy, study: { ...study, flipped: !study.flipped } });
  }

  private async answerCard(value: string): Promise<void> {
    const study = this.model.study;
    if (!study || !study.flipped) return;

    const card = study.queue[study.index];
    const result: CardResultValue = value === 'incorrect' ? 'incorrect' : 'correct';

    const session = {
      ...study.session,
      correct: study.session.correct + (result === 'correct' ? 1 : 0),
      incorrect: study.session.incorrect + (result === 'incorrect' ? 1 : 0),
    };

    try {
      await recordCardResult(study.session, card, result);

      const nextIndex = study.index + 1;
      if (nextIndex >= study.queue.length) {
        session.finishedAt = new Date().toISOString();
        await persistSession(session);
        await this.showResult(study, session);
      } else {
        await persistSession(session);
        this.dispatch({
          type: ActionType.SetStudy,
          study: { ...study, session, index: nextIndex, flipped: false },
        });
      }
    } catch (error) {
      this.toastError('解答の記録に失敗しました', error);
    }
  }

  private async showResult(study: StudyState, session: StudyState['session']): Promise<void> {
    const results = await cardResultRepository.getBySession(session.id);
    const wrongIds = new Set(results.filter((r) => r.result === 'incorrect').map((r) => r.cardId));
    const wrongCards = study.queue.filter((c) => wrongIds.has(c.cardId));

    const result: ResultState = {
      deckId: session.deckId,
      deckName: session.deckName,
      total: session.total,
      correct: session.correct,
      incorrect: session.incorrect,
      wrongCards,
      config: { order: session.order, range: session.range },
    };

    this.dispatch({ type: ActionType.SetStudy, study: null });
    this.dispatch({ type: ActionType.SetResult, result });
    this.dispatch({ type: ActionType.NavigateTo, screen: Screen.Result });

    void this.autoSyncQuiet();
  }

  /** 自動同期が有効なら、UI を出さずに履歴を同期する（失敗は通知しない）。 */
  private async autoSyncQuiet(): Promise<void> {
    const { autoSync, googleClientId, googleFolderId } = this.model.settings;
    if (!autoSync || !googleClientId || !googleFolderId) return;
    try {
      await syncHistory(googleClientId, googleFolderId, { interactive: false });
    } catch {
      // サイレント同期の失敗はユーザーに通知しない。
    }
  }

  private async openHistory(): Promise<void> {
    this.dispatch({ type: ActionType.NavigateTo, screen: Screen.History });
    try {
      const history = await loadHistory();
      this.dispatch({ type: ActionType.SetHistory, history });
    } catch (error) {
      this.toastError('履歴の読み込みに失敗しました', error);
    }
  }

  private async openHistoryDetail(sessionId: string): Promise<void> {
    const session = this.model.history.find((s) => s.id === sessionId);
    if (!session) return;

    try {
      const results = await cardResultRepository.getBySession(sessionId);
      results.sort((a, b) => a.answeredAt.localeCompare(b.answeredAt));

      const cards = await cardRepository.getByDeck(session.deckId);
      const cardById = new Map(cards.map((c) => [c.cardId, c]));

      const detailCards: HistoryDetailCard[] = results.map((r) => {
        const card = cardById.get(r.cardId);
        return {
          cardId: r.cardId,
          result: r.result,
          front: card?.front ?? null,
          back: card?.back ?? null,
        };
      });

      this.dispatch({
        type: ActionType.SetHistoryDetail,
        historyDetail: { session, cards: detailCards },
      });
    } catch (error) {
      this.toastError('履歴の詳細を読み込めませんでした', error);
    }
  }

  private async handleSync(settings: SettingsPayload): Promise<void> {
    this.persistSettings(settings);
    if (!settings.googleClientId || !settings.googleFolderId) {
      this.dispatch({
        type: ActionType.PushToast,
        kind: 'error',
        text: 'Client ID とフォルダ ID を入力してください',
      });
      return;
    }

    this.dispatch({ type: ActionType.SetSyncing, syncing: true });
    try {
      const { sessions } = await syncHistory(settings.googleClientId, settings.googleFolderId, {
        interactive: true,
      });
      const history = await loadHistory();
      this.dispatch({ type: ActionType.SetHistory, history });
      this.dispatch({
        type: ActionType.PushToast,
        kind: 'success',
        text: `履歴を同期しました（${sessions} 件）`,
      });
    } catch (error) {
      this.toastError('同期に失敗しました', error);
    } finally {
      this.dispatch({ type: ActionType.SetSyncing, syncing: false });
    }
  }

  private async retryWrong(): Promise<void> {
    const result = this.model.result;
    if (!result || result.wrongCards.length === 0) return;
    const deck = this.model.decks.find((d) => d.id === result.deckId);
    if (!deck) return;

    const config: StudyConfig = {
      order: StudyOrder.Shuffle,
      range: { kind: StudyRangeKind.All, tags: [], limit: null },
    };
    const queue = result.wrongCards;

    try {
      const session = createSession(deck, config, queue.length);
      await persistSession(session);

      const study: StudyState = {
        session,
        deckName: deck.name,
        queue,
        index: 0,
        flipped: false,
      };
      this.dispatch({ type: ActionType.SetResult, result: null });
      this.dispatch({ type: ActionType.SetStudy, study });
      this.dispatch({ type: ActionType.NavigateTo, screen: Screen.Study });
    } catch (error) {
      this.toastError('再演習の開始に失敗しました', error);
    }
  }

  private exitStudy(): void {
    this.dispatch({ type: ActionType.SetStudy, study: null });
    this.dispatch({ type: ActionType.SetResult, result: null });
    this.dispatch({ type: ActionType.SetStudyStart, studyStart: null });
    this.dispatch({ type: ActionType.SetHistoryDetail, historyDetail: null });
    this.dispatch({ type: ActionType.NavigateTo, screen: Screen.Home });
  }

  private toastError(prefix: string, error: unknown): void {
    const detail = error instanceof Error ? error.message : String(error);
    this.dispatch({ type: ActionType.PushToast, kind: 'error', text: `${prefix}: ${detail}` });
  }
}
