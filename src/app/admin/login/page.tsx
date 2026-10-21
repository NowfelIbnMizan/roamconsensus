import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold">Admin login</h1>
      <p className="mt-1 text-sm text-muted">Enter the admin password to edit the site.</p>
      <LoginForm />
    </div>
  );
}
