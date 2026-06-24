import { RoleChooser } from "../_components/role-chooser";

/** Talent onboarding — pick how you'll use the marketplace. */
export default function TalentOnboardingPage() {
  return (
    <div className="space-y-6 py-6">
      <header className="space-y-2">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Welcome to QA Mastery <span className="text-accent">Talent</span>
        </h1>
        <p className="text-sm text-zinc-400">How do you want to start?</p>
      </header>
      <RoleChooser />
    </div>
  );
}
