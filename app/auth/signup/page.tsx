import { AuthForm } from "@/components/auth/auth-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Create Account" };

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-10">
      <Card className="w-full">
        <CardContent className="p-6">
          <h1 className="text-3xl font-black">Create account</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Build a learning profile that can sync progress across lessons, labs, and challenges.
          </p>
          <div className="mt-6">
            <AuthForm mode="signup" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
