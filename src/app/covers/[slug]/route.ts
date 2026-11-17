import { readCover } from "@/lib/portal/covers";

export const dynamic = "force-dynamic";

/** Course title pictures uploaded by an administrator (public, cached; the URL changes when the picture does). */
export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cover = readCover(slug);
  if (!cover) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(cover.bytes), {
    headers: { "Content-Type": cover.type, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
