import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  // Signed in with Google as an admin: nothing to type.
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-3xl">Admin login</h1>
      <p className="mt-1 text-sm text-muted">
        Enter the admin password to edit the site, or sign in with your admin Google account.
      </p>
      <LoginForm />
    </div>
  );
}
