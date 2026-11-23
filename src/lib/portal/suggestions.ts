import "server-only";
import { all, now, one, run } from "../db";
import { newId } from "./auth";

/** A training someone asked us to add (from the "Suggest a training" button). Seen in Admin › Suggestions. */
export type Suggestion = {
  id: string;
  title: string;
  details: string;
  name: string;
  email: string;
  phone: string;
  organisation: string;
  user_id: string | null;
  page: string;
  status: "new" | "read" | "planned" | "declined";
  created_at: string;
};

export const SUGGESTION_STATUS: Record<Suggestion["status"], string> = { new: "New", read: "Read", planned: "Planned", declined: "Declined" };

export function addSuggestion(s: Omit<Suggestion, "id" | "status" | "created_at">): Suggestion {
  const row: Suggestion = { ...s, id: newId(), status: "new", created_at: now() };
  run(
    `INSERT INTO training_suggestions (id, title, details, name, email, phone, organisation, user_id, page, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    row.id,
    row.title,
    row.details,
    row.name,
    row.email,
    row.phone,
    row.organisation,
    row.user_id,
    row.page,
    row.status,
    row.created_at,
  );
  return row;
}

export function listSuggestions(status?: Suggestion["status"]): Suggestion[] {
  return status
    ? all<Suggestion>("SELECT * FROM training_suggestions WHERE status = ? ORDER BY created_at DESC", status)
    : all<Suggestion>("SELECT * FROM training_suggestions ORDER BY created_at DESC");
}

export const newSuggestionCount = () => one<{ n: number }>("SELECT COUNT(*) AS n FROM training_suggestions WHERE status = 'new'")?.n ?? 0;

export function setSuggestionStatus(id: string, status: Suggestion["status"]) {
  run("UPDATE training_suggestions SET status = ? WHERE id = ?", status, id);
}

export function deleteSuggestion(id: string) {
  run("DELETE FROM training_suggestions WHERE id = ?", id);
}
