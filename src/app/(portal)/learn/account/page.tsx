import type { Metadata } from "next";
import { AccountForms } from "./forms";

export const metadata: Metadata = { title: "Profile & settings" };

export default function AccountPage() {
  return <AccountForms />;
}
