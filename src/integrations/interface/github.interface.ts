export interface PullRequestOptions {
  title: string;
  body: string;
  branch: string;
  owner?: string;
  repo?: string;
  draft?: boolean;
  base?: string;
}

export interface CommitOptions {
  message: string;
  files: Array<{ path: string; content: string }>;
  branch?: string;
}

export interface IssueOptions {
  title: string;
  body: string;
  labels?: string[];
  assignees?: string[];
  owner?: string;
  repo?: string;
}

export type ApiOperation<T> = () => Promise<T>;
