import { isAdmin } from "@/lib/auth";
import { store } from "@/lib/store";
import { FORMAT_LABELS, REQUEST_TYPE_LABELS, STATUS_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // keep spreadsheet apps from evaluating formulas
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET() {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const requests = await store.listRequests();
  const header = ["Reference", "Received", "Type", "Status", "Company", "Contact", "E-mail", "Phone", "City", "Program", "Participants", "Format", "Preferred date", "Details", "Message", "Notes"];
  const rows = requests.map((r) => [
    r.reference,
    r.createdAt,
    REQUEST_TYPE_LABELS[r.type],
    STATUS_LABELS[r.status],
    r.company,
    r.contactName,
    r.email,
    r.phone,
    r.city,
    r.programTitle,
    r.participants,
    r.format ? FORMAT_LABELS[r.format] : "",
    r.preferredDate,
    Object.entries(r.details)
      .map(([k, v]) => `${k}: ${v}`)
      .join("; "),
    r.message,
    r.notes,
  ]);
  const csv = "﻿" + [header, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="learning-impact-requests-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
