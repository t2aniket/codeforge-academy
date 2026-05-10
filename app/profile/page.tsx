import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Badge className="border-primary/30 bg-primary/10 text-primary">Account</Badge>
      <h1 className="mt-4 text-4xl font-black">Profile and settings</h1>
      <Card className="mt-8">
        <CardContent className="space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Input defaultValue="CodeForge Learner" aria-label="Display name" />
            <Input defaultValue="learner@codeforge.local" aria-label="Email" />
          </div>
          <div className="grid gap-3 text-sm">
            <label className="flex items-center justify-between rounded-md border p-3">
              Weekly progress digest
              <input type="checkbox" defaultChecked />
            </label>
            <label className="flex items-center justify-between rounded-md border p-3">
              Lab completion celebrations
              <input type="checkbox" defaultChecked />
            </label>
            <label className="flex items-center justify-between rounded-md border p-3">
              Public profile
              <input type="checkbox" />
            </label>
          </div>
          <Button>Save settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
