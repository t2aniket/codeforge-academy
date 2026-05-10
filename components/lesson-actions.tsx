"use client";

import confetti from "canvas-confetti";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { completeLessonAction, saveLessonNoteAction } from "@/app/actions/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function LessonActions({
  courseId,
  lessonId,
  initialNote = ""
}: {
  courseId: string;
  lessonId: string;
  initialNote?: string;
}) {
  const [note, setNote] = useState(initialNote);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!initialNote) setNote(localStorage.getItem(`note:${lessonId}`) ?? "");
  }, [initialNote, lessonId]);

  function saveNote() {
    localStorage.setItem(`note:${lessonId}`, note);
    startTransition(async () => {
      const result = await saveLessonNoteAction({ lessonId, body: note });
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  function complete() {
    const raw = localStorage.getItem("completedLessons");
    const completed = new Set(raw ? JSON.parse(raw) : []);
    completed.add(lessonId);
    localStorage.setItem("completedLessons", JSON.stringify(Array.from(completed)));
    startTransition(async () => {
      const result = await completeLessonAction({ courseId, lessonId, xp: 120 });
      if (result.ok) {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.72 } });
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <h2 className="text-xl font-semibold">Your notes</h2>
        <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Capture key commands, gotchas, and insights..." />
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={saveNote} disabled={isPending}>Save note</Button>
          <Button onClick={complete} disabled={isPending}>Complete</Button>
        </div>
      </CardContent>
    </Card>
  );
}
