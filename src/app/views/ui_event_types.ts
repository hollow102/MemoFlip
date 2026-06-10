export const UIEvent = {
  Initialize: 'INITIALIZE',
  ToggleTheme: 'TOGGLE_THEME',
  OpenSetting: 'OPEN_SETTING',
  CloseSetting: 'CLOSE_SETTING',
  SaveSettings: 'SAVE_SETTINGS',
  ImportDecks: 'IMPORT_DECKS',
  DeleteDeck: 'DELETE_DECK',
  SearchDecks: 'SEARCH_DECKS',
  StartStudy: 'START_STUDY',
  ResumeStudy: 'RESUME_STUDY',
  CloseStudyStart: 'CLOSE_STUDY_START',
  BeginStudy: 'BEGIN_STUDY',
  FlipCard: 'FLIP_CARD',
  AnswerCard: 'ANSWER_CARD',
  RetryWrong: 'RETRY_WRONG',
  ExitStudy: 'EXIT_STUDY',
  OpenHistory: 'OPEN_HISTORY',
  OpenHistoryDetail: 'OPEN_HISTORY_DETAIL',
  CloseHistoryDetail: 'CLOSE_HISTORY_DETAIL',
  SearchHistory: 'SEARCH_HISTORY',
  SyncHistory: 'SYNC_HISTORY',
  GoHome: 'GO_HOME',
  DismissToast: 'DISMISS_TOAST',
} as const;

export type UIEvent = (typeof UIEvent)[keyof typeof UIEvent];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UIEventHandler = (payload?: any) => void;
