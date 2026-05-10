"use client";

import confetti from "canvas-confetti";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function LessonActions({ lessonId }: { lessonId: string }) {
  const [note, setNote] = useState("");

  useEffect(() => {
    setNote(localStorage.getItem(`note:${lessonId}`) ?? "");
  }, [lessonId]);

  function saveNote() {
    localStorage.setItem(`note:${lessonId}`, note);
    toast.success("Lesson note saved");
  }

  function complete() {
    const raw = localStorage.getItem("completedLessons");
    const completed = new Set(raw ? JSON.parse(raw) : []);
    completed.add(lessonId);
    localStorage.setItem("completedLessons", JSON.stringify(Array.from(completed)));
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.72 } });
    toast.success("+120 XP earned");
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <h2 className="text-xl font-semibold">Your notes</h2>
        <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Capture key commands, gotchas, and insights..." />
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={saveNote}>Save note</Button>
          <Button onClick={complete}>Complete</Button>
        </div>
      </CardContent>
    </Card>
  );
}
