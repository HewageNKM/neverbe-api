import { BaseRepository } from "./BaseRepository";

/**
 * Neural Repository - handles neural network data and feed cache
 */
export class NeuralRepository extends BaseRepository<any> {
  constructor() {
    super("neural_cache");
  }

  /**
   * Get cached feed by key
   */
  async getFeedByKey(key: string): Promise<any | null> {
    return await this.findById(key);
  }
}

export const neuralRepository = new NeuralRepository();
