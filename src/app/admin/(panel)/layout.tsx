import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { usingSupabase } from "@/lib/store";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="admin">
      <AdminNav />
      <main id="main" className="admin__main">
        {!usingSupabase && process.env.NODE_ENV === "production" && (
          <p className="form-alert">
            No database is configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY). Data is being kept in local files, which most hosts erase. See README.
          </p>
        )}
        {children}
      </main>
    </div>
  );
}
