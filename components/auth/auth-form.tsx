"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { signInAction, signUpAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" disabled={pending}>
      {pending ? "Working..." : label}
    </Button>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? signInAction : signUpAction;
  const [state, formAction] = useFormState(action, null);
  const isLogin = mode === "login";

  return (
    <form action={formAction} className="space-y-4">
      <Input name="email" type="email" placeholder="you@example.com" autoComplete="email" required />
      <Input
        name="password"
        type="password"
        placeholder="Password"
        autoComplete={isLogin ? "current-password" : "new-password"}
        required
      />
      <SubmitButton label={isLogin ? "Sign in" : "Create account"} />
      {state?.message && (
        <p className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}>{state.message}</p>
      )}
      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? "New to CodeForge?" : "Already have an account?"}{" "}
        <Link className="font-medium text-primary hover:underline" href={isLogin ? "/auth/signup" : "/auth/login"}>
          {isLogin ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
