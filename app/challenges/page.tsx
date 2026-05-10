import { ChallengeRunner } from "@/components/challenge-runner";
import { Badge } from "@/components/ui/badge";
import { getChallenges } from "@/lib/data";

export const metadata = { title: "Challenges" };

export default async function ChallengesPage() {
  const challenges = await getChallenges();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Badge className="border-primary/30 bg-primary/10 text-primary">Practice problems</Badge>
      <h1 className="mt-4 text-4xl font-black">Practice Arena</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Language tracks, interview drills, visible tests, browser execution, and XP-saving submissions in one workspace.
      </p>
      <div className="mt-8">
        <ChallengeRunner challenges={challenges} />
      </div>
    </div>
  );
}
