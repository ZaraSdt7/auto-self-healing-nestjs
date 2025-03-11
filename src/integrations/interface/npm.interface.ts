export interface NpmVulnerability {
  name: string;
  severity: 'info' | 'low' | 'moderate' | 'high' | 'critical';
  via: string[] | Record<string, unknown>[];
  effects: string[];
  range?: string;
  nodes: string[];
  fixAvailable?:
    | boolean
    | { name: string; version: string; isSemVerMajor: boolean };
}

export interface NpmAuditResult {
  vulnerabilities: Record<string, NpmVulnerability>;
  metadata: {
    vulnerabilities: {
      info: number;
      low: number;
      moderate: number;
      high: number;
      critical: number;
      total: number;
    };
    dependencies: {
      prod: number;
      dev: number;
      optional: number;
      peer: number;
      peerOptional: number;
      total: number;
    };
  };
}

export interface VulnerabilityInfo {
  name: string;
  severity: string;
  fixAvailable: boolean;
}
