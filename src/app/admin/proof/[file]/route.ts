import { isAdmin } from "@/lib/auth";
import { readProof } from "@/lib/portal/commerce";

export const dynamic = "force-dynamic";

/** Payment receipts, for admins only. */
export async function GET(_: Request, { params }: { params: Promise<{ file: string }> }) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const { file } = await params;
  const proof = readProof(file);
  if (!proof) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(proof.bytes), {
    headers: { "Content-Type": proof.type, "Content-Disposition": `inline; filename="${file}"`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}
