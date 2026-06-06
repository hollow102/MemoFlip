import { Screen } from '../enums/screen';
import { Theme } from '../enums/theme';
import { HistoryDetailState, ResultState, Settings, StudyStartState, StudyState } from '../models';
import { Session } from '../models/entities';
import { Deck } from '../models/entities';

export const ActionType = {
  SetTheme: 'SET_THEME',
  NavigateTo: 'NAVIGATE_TO',
  PushToast: 'PUSH_TOAST',
  DismissToast: 'DISMISS_TOAST',
  SetDecks: 'SET_DECKS',
  SetDeckSearch: 'SET_DECK_SEARCH',
  OpenSetting: 'OPEN_SETTING',
  CloseSetting: 'CLOSE_SETTING',
  SetSettings: 'SET_SETTINGS',
  SetImporting: 'SET_IMPORTING',
  SetStudyStart: 'SET_STUDY_START',
  SetStudy: 'SET_STUDY',
  SetResult: 'SET_RESULT',
  SetHistory: 'SET_HISTORY',
  SetHistorySearch: 'SET_HISTORY_SEARCH',
  SetHistoryDetail: 'SET_HISTORY_DETAIL',
  SetSyncing: 'SET_SYNCING',
} as const;

export type Action =
  | { type: typeof ActionType.SetTheme; theme: Theme }
  | { type: typeof ActionType.NavigateTo; screen: Screen }
  | { type: typeof ActionType.PushToast; kind: 'success' | 'error'; text: string }
  | { type: typeof ActionType.DismissToast; id: string }
  | { type: typeof ActionType.SetDecks; decks: Deck[] }
  | { type: typeof ActionType.SetDeckSearch; text: string }
  | { type: typeof ActionType.OpenSetting }
  | { type: typeof ActionType.CloseSetting }
  | { type: typeof ActionType.SetSettings; settings: Settings }
  | { type: typeof ActionType.SetImporting; importing: boolean }
  | { type: typeof ActionType.SetStudyStart; studyStart: StudyStartState | null }
  | { type: typeof ActionType.SetStudy; study: StudyState | null }
  | { type: typeof ActionType.SetResult; result: ResultState | null }
  | { type: typeof ActionType.SetHistory; history: Session[] }
  | { type: typeof ActionType.SetHistorySearch; text: string }
  | { type: typeof ActionType.SetHistoryDetail; historyDetail: HistoryDetailState | null }
  | { type: typeof ActionType.SetSyncing; syncing: boolean };
