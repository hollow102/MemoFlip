import { Deck } from '../models/entities';

import { BaseRepository } from './base_repository';
import { STORE } from './db';

class DeckRepository extends BaseRepository<Deck> {
  constructor() {
    super(STORE.Decks);
  }
}

export const deckRepository = new DeckRepository();
