import { Session } from '../models/entities';

import { BaseRepository } from './base_repository';
import { STORE } from './db';

class SessionRepository extends BaseRepository<Session> {
  constructor() {
    super(STORE.Sessions);
  }

  getByDeck(deckId: string): Promise<Session[]> {
    return this.getAllByIndex('deckId', deckId);
  }

  deleteByDeck(deckId: string): Promise<void> {
    return this.deleteByIndex('deckId', deckId);
  }
}

export const sessionRepository = new SessionRepository();
