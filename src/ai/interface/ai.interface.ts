export interface ErrorPrediction {
  message: string;
  confidence: number;
}

export interface CodeIssue {
  issue: string;
  line: number;
}
