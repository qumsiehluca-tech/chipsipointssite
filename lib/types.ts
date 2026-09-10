export type LogEntry = {
  date: string; // ISO date, e.g. "2026-08-25"
  action: string;
  points: number;
  notes?: string;
  loggedBy?: string;
};

export type Brother = {
  slug: string; // URL-safe id, e.g. "jordan-smith"
  name: string;
  total: number;
  history: LogEntry[];
};

export type Role = "admin" | "viewer";

export type PointValue = {
  type: string; // "Gain" | "Loss"
  action: string;
  points: number;
};
