export const Screen = {
  Home: 'home',
  Study: 'study',
  Result: 'result',
  History: 'history',
} as const;

export type Screen = (typeof Screen)[keyof typeof Screen];
