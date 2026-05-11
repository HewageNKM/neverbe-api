import { BaseRepository } from "./BaseRepository";

export interface PredictionData {
  id: string;
  data: any;
  month: string; // YYYY-MM
  createdAt: any;
  updatedAt: any;
}

export class PredictionRepository extends BaseRepository<PredictionData> {
  constructor() {
    super("predictions");
  }

  async findByMonth(month: string): Promise<PredictionData | null> {
    const snapshot = await this.collection.where("month", "==", month).limit(1).get();
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as PredictionData;
  }

  async savePrediction(month: string, data: any): Promise<void> {
    const existing = await this.findByMonth(month);
    const docData: any = {
      month,
      data,
    };

    if (existing) {
      await this.update(existing.id, docData);
    } else {
      // Use the month as the ID or generate a new one
      const newId = this.collection.doc().id;
      await this.create(newId, docData as PredictionData);
    }
  }
}

export const predictionRepository = new PredictionRepository();
