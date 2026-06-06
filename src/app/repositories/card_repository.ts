import { Card } from '../models/entities';

import { BaseRepository } from './base_repository';
import { STORE } from './db';

class CardRepository extends BaseRepository<Card> {
  constructor() {
    super(STORE.Cards);
  }

  getByDeck(deckId: string): Promise<Card[]> {
    return this.getAllByIndex('deckId', deckId);
  }

  deleteByDeck(deckId: string): Promise<void> {
    return this.deleteByIndex('deckId', deckId);
  }
}

export const cardRepository = new CardRepository();
