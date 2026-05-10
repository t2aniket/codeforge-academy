import { AuthForm } from "@/components/auth/auth-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <CardContent className="p-6">
          <h1 className="text-3xl font-black">Sign in</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Continue your courses, notes, lab sessions, XP, and streaks.
          </p>
          <div className="mt-6">
            <AuthForm mode="login" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
