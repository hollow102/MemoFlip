import { Model } from '../models';

import { Action, ActionType } from './action_types';

/**
 * Redux 風の純粋な状態更新関数。
 * 現在の Model と Action を受け取り、新しい Model を返す。副作用は持たない。
 */
export function update(model: Model, action: Action): Model {
  switch (action.type) {
    case ActionType.SetTheme:
      return { ...model, theme: action.theme };

    case ActionType.NavigateTo:
      return { ...model, screen: action.screen };

    case ActionType.PushToast:
      return {
        ...model,
        toastMessages: [
          ...model.toastMessages,
          { id: crypto.randomUUID(), kind: action.kind, text: action.text },
        ],
      };

    case ActionType.DismissToast:
      return {
        ...model,
        toastMessages: model.toastMessages.filter((t) => t.id !== action.id),
      };

    case ActionType.SetDecks:
      return { ...model, decks: action.decks };

    case ActionType.SetDeckSearch:
      return { ...model, deckSearch: action.text };

    case ActionType.OpenSetting:
      return { ...model, settingOpen: true };

    case ActionType.CloseSetting:
      return { ...model, settingOpen: false };

    case ActionType.SetSettings:
      return { ...model, settings: action.settings };

    case ActionType.SetImporting:
      return { ...model, importing: action.importing };

    case ActionType.SetStudyStart:
      return { ...model, studyStart: action.studyStart };

    case ActionType.SetStudy:
      return { ...model, study: action.study };

    case ActionType.SetResult:
      return { ...model, result: action.result };

    case ActionType.SetHistory:
      return { ...model, history: action.history };

    case ActionType.SetHistorySearch:
      return { ...model, historySearch: action.text };

    case ActionType.SetHistoryDetail:
      return { ...model, historyDetail: action.historyDetail };

    case ActionType.SetSyncing:
      return { ...model, syncing: action.syncing };

    default:
      return model;
  }
}
