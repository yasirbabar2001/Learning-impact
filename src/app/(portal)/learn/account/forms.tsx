import { PasswordForm, ProfileForm } from "@/components/portal/AccountForms";
import { requireUser } from "@/lib/portal/auth";

export async function AccountForms() {
  const u = await requireUser("/learn/account");
  return (
    <div className="container dash">
      <h1 className="h2">Profile & settings</h1>
      <div className="dash__cols">
        <div className="glass dash__panel">
          <h2 className="h3">Profile</h2>
          <ProfileForm p={{ name: u.name, email: u.email, phone: u.phone, organisation: u.organisation, designation: u.designation, leaderboard: Boolean(u.show_on_leaderboard), reminders: Boolean(u.reminders), gender: u.gender }} />
        </div>
        <div className="glass dash__panel">
          <h2 className="h3">Password</h2>
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}
