export interface PromptVersion {
  version: number;
  timestamp: string; // ISO 8601
  note: string | null;
  content: string;
  hash: string; // first 8 chars of SHA-256
}

export interface PromptFile {
  name: string;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  versions: PromptVersion[];
}

export interface Config {
  preview_length: number;
  auto_confirm: boolean;
  backup_enabled: boolean;
}

export interface PromptSummary {
  name: string;
  versionCount: number;
  updatedAt: string; // ISO 8601
}
