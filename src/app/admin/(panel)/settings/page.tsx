import { SettingsForm } from "@/components/admin/SettingsForm";
import { store } from "@/lib/store";

export default async function AdminSettingsPage() {
  const settings = await store.getSettings();
  return <SettingsForm settings={settings} />;
}
