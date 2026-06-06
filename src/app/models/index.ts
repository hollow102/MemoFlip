import { Screen } from '../enums/screen';
import { Theme } from '../enums/theme';

import { Card, CardResultValue, Deck, Session, StudyConfig } from './entities';

export interface ToastMessage {
  id: string;
  kind: 'success' | 'error';
  text: string;
}

export interface Settings {
  googleClientId: string;
  googleFolderId: string;
  autoSync: boolean;
}

/** 演習開始モーダルの状態（対象問題集と選択可能タグ）。 */
export interface StudyStartState {
  deck: Deck;
  tags: string[];
}

/** 演習中の状態。 */
export interface StudyState {
  session: Session;
  deckName: string;
  queue: Card[];
  index: number;
  flipped: boolean;
}

/** 演習結果画面の状態。 */
export interface ResultState {
  deckId: string;
  deckName: string;
  total: number;
  correct: number;
  incorrect: number;
  wrongCards: Card[];
  config: StudyConfig;
}

/** 履歴詳細ダイアログの 1 カード分（出題カードと正誤）。 */
export interface HistoryDetailCard {
  cardId: string;
  result: CardResultValue;
  front: string | null; // デッキ未取り込み等でカードが見つからない場合は null
  back: string | null;
}

/** 履歴詳細ダイアログの状態。 */
export interface HistoryDetailState {
  session: Session;
  cards: HistoryDetailCard[];
}

/**
 * アプリ全体の状態ツリー。
 * 画面・テーマ・トースト・問題集一覧・設定に加え、演習と結果の状態を保持する。
 */
export interface Model {
  screen: Screen;
  theme: Theme;
  toastMessages: ToastMessage[];
  decks: Deck[];
  deckSearch: string;
  settings: Settings;
  settingOpen: boolean;
  importing: boolean;
  studyStart: StudyStartState | null;
  study: StudyState | null;
  result: ResultState | null;
  history: Session[];
  historySearch: string;
  historyDetail: HistoryDetailState | null;
  syncing: boolean;
}

export function createInitialModel(theme: Theme, settings: Settings): Model {
  return {
    screen: Screen.Home,
    theme,
    toastMessages: [],
    decks: [],
    deckSearch: '',
    settings,
    settingOpen: false,
    importing: false,
    studyStart: null,
    study: null,
    result: null,
    history: [],
    historySearch: '',
    historyDetail: null,
    syncing: false,
  };
}
