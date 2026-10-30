import { ProgramsManager } from "@/components/admin/ProgramsManager";
import { store } from "@/lib/store";

export default async function AdminProgramsPage() {
  const programs = await store.listPrograms();
  return <ProgramsManager programs={programs} />;
}
