"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function LessonQuiz({
  question,
  options,
  answer
}: {
  question: string;
  options: string[];
  answer: string;
}) {
  const [selected, setSelected] = useState("");
  const [checked, setChecked] = useState(false);
  const isCorrect = selected === answer;

  function checkAnswer() {
    setChecked(true);
    if (isCorrect) toast.success("Correct checkpoint answer.");
    else toast.error("Not quite. Review the lesson and try again.");
  }

  return (
    <Card className="mt-10">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold">Checkpoint quiz</h2>
        <p className="mt-3 text-muted-foreground">{question}</p>
        <div className="mt-4 grid gap-2">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setSelected(option);
                setChecked(false);
              }}
              className={cn(
                "rounded-md border p-3 text-left text-sm transition hover:bg-muted",
                selected === option && "border-primary bg-primary/10",
                checked && option === answer && "border-primary bg-primary/15",
                checked && selected === option && selected !== answer && "border-destructive bg-destructive/10"
              )}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={checkAnswer} disabled={!selected}>
            Check answer
          </Button>
          {checked && (
            <p className={isCorrect ? "text-sm text-primary" : "text-sm text-destructive"}>
              {isCorrect ? "Good. Complete the lesson when your lab and notes are done." : "Try once more after reviewing the key idea."}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
