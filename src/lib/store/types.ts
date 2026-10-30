import type { NewRequest, Program, SiteSettings, TrainingRequest } from "../types";

export type ProgramInput = Omit<Program, "id"> & { id?: string };
export type RequestPatch = Partial<Pick<TrainingRequest, "status" | "notes">>;

export interface Store {
  listPrograms(opts?: { publishedOnly?: boolean }): Promise<Program[]>;
  getProgram(slug: string): Promise<Program | null>;
  saveProgram(input: ProgramInput): Promise<Program>;
  deleteProgram(id: string): Promise<void>;

  createRequest(input: NewRequest): Promise<TrainingRequest>;
  listRequests(): Promise<TrainingRequest[]>;
  getRequest(id: string): Promise<TrainingRequest | null>;
  updateRequest(id: string, patch: RequestPatch): Promise<void>;
  deleteRequest(id: string): Promise<void>;

  getSettings(): Promise<SiteSettings>;
  saveSettings(settings: SiteSettings): Promise<void>;
}
