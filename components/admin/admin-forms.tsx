"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addLessonAction, upsertCourseAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <Button disabled={pending}>{pending ? "Saving..." : children}</Button>;
}

export function CourseForm() {
  const [state, action] = useFormState(upsertCourseAction, null);
  return (
    <form action={action} className="space-y-3">
      <Input name="title" placeholder="Course title" required />
      <Input name="slug" placeholder="optional-custom-slug" />
      <Textarea name="description" placeholder="Course description" required />
      <div className="grid gap-3 md:grid-cols-3">
        <Input name="category" placeholder="Category" required />
        <Select name="difficulty" defaultValue="Beginner">
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </Select>
        <Input name="durationMinutes" type="number" placeholder="Duration minutes" defaultValue={240} />
      </div>
      <Input name="thumbnail" placeholder="/course-art/my-course.jpg" />
      <Input name="tags" placeholder="React, Next.js, Testing" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" value="true" className="h-4 w-4" />
        Publish immediately
      </label>
      <SubmitButton>Save course</SubmitButton>
      {state?.message && <p className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}>{state.message}</p>}
    </form>
  );
}

export function LessonForm({ courseSlugs }: { courseSlugs: string[] }) {
  const [state, action] = useFormState(addLessonAction, null);
  return (
    <form action={action} className="space-y-3">
      <Select name="courseSlug">
        {courseSlugs.map((slug) => (
          <option key={slug}>{slug}</option>
        ))}
      </Select>
      <Input name="moduleTitle" placeholder="Module title" required />
      <Input name="lessonTitle" placeholder="Lesson title" required />
      <div className="grid gap-3 md:grid-cols-2">
        <Input name="estimatedMinutes" type="number" defaultValue={18} />
        <Select name="lab" defaultValue="">
          <option value="">No lab</option>
          <option value="docker">Docker</option>
          <option value="testing">Automation Testing</option>
          <option value="network">Network & CCNA</option>
          <option value="linux">Linux Terminal</option>
          <option value="sql">SQL Database</option>
          <option value="playground">General Playground</option>
        </Select>
      </div>
      <Textarea name="markdown" className="min-h-[320px] font-mono" placeholder="# Lesson title&#10;&#10;Write rich markdown here..." required />
      <SubmitButton>Save lesson</SubmitButton>
      {state?.message && <p className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}>{state.message}</p>}
    </form>
  );
}
