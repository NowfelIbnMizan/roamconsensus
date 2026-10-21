"use client";

import { useActionState } from "react";
import { logInAction } from "@/lib/admin/actions";
import { inputClass, SaveButton } from "../ui";

export function LoginForm() {
  const [error, action] = useActionState(logInAction, null);
  return (
    <form action={action} className="mt-6 space-y-3">
      <input name="password" type="password" required autoFocus placeholder="Password" className={inputClass} />
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <SaveButton>Log in</SaveButton>
    </form>
  );
}
