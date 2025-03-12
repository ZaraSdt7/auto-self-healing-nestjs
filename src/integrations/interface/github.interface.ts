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
export interface RepoData {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    id: number;
  };
  [key: string]: any;
}

export type ApiOperation<T> = () => Promise<T>;
