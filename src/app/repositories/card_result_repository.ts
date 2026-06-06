import { CardResult } from '../models/entities';

import { BaseRepository } from './base_repository';
import { STORE } from './db';

class CardResultRepository extends BaseRepository<CardResult> {
  constructor() {
    super(STORE.CardResults);
  }

  getByDeck(deckId: string): Promise<CardResult[]> {
    return this.getAllByIndex('deckId', deckId);
  }

  getBySession(sessionId: string): Promise<CardResult[]> {
    return this.getAllByIndex('sessionId', sessionId);
  }

  deleteByDeck(deckId: string): Promise<void> {
    return this.deleteByIndex('deckId', deckId);
  }
}

export const cardResultRepository = new CardResultRepository();
