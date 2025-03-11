export interface RepairRecord {
  error: string;
  solution: string;
  timestamp: Date;
  success: boolean;
  confidence: number;
}

export interface RepairSuggestion {
  solution: string;
  confidence: number;
}

export interface LearningData {
  solution: string;
  successCount: number;
  failCount: number;
}
