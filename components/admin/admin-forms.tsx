"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  addLessonAction,
  deleteCourseAction,
  deleteLessonAction,
  deleteModuleAction,
  togglePublishFormAction,
  upsertCourseAction,
  upsertModuleAction
} from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Course, Lesson, Module } from "@/lib/types";

type EditableModule = Module & { sortOrder?: number };
type EditableLesson = Lesson & { sortOrder?: number };

function SubmitButton({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "outline" | "destructive" }) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} variant={variant}>
      {pending ? "Saving..." : children}
    </Button>
  );
}

function FormMessage({ state }: { state: { ok: boolean; message: string } | null }) {
  if (!state?.message) return null;
  return <p className={state.ok ? "text-sm text-primary" : "text-sm text-destructive"}>{state.message}</p>;
}

export function CourseForm({ course }: { course?: Course }) {
  const [state, action] = useFormState(upsertCourseAction, null);
  return (
    <form action={action} className="space-y-3">
      {course?.id && <input type="hidden" name="id" value={course.id} />}
      <Input name="title" placeholder="Course title" defaultValue={course?.title} required />
      <Input name="slug" placeholder="course-slug" defaultValue={course?.slug} />
      <Textarea name="description" placeholder="Course description" defaultValue={course?.description} required />
      <div className="grid gap-3 md:grid-cols-3">
        <Input name="category" placeholder="Category" defaultValue={course?.category} required />
        <Select name="difficulty" defaultValue={course?.difficulty ?? "Beginner"}>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </Select>
        <Input name="durationMinutes" type="number" placeholder="Duration minutes" defaultValue={course?.durationMinutes ?? 240} />
      </div>
      <Input name="thumbnail" placeholder="/course-art/my-course.jpg" defaultValue={course?.thumbnail} />
      <Input name="tags" placeholder="React, Next.js, Testing" defaultValue={course?.tags.join(", ")} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" value="true" defaultChecked={course?.published ?? false} className="h-4 w-4" />
        Published
      </label>
      <SubmitButton>{course ? "Update course" : "Create course"}</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function ModuleForm({ courseId, module }: { courseId: string; module?: EditableModule }) {
  const [state, action] = useFormState(upsertModuleAction, null);
  return (
    <form action={action} className="space-y-3 rounded-md border bg-background p-4">
      <input type="hidden" name="courseId" value={courseId} />
      {module?.id && <input type="hidden" name="id" value={module.id} />}
      <div className="grid gap-3 md:grid-cols-[1fr_160px]">
        <Input name="title" placeholder="Module title" defaultValue={module?.title} required />
        <Input name="sortOrder" type="number" defaultValue={module?.sortOrder ?? 0} />
      </div>
      <Input name="slug" placeholder="module-slug" defaultValue={module?.slug} />
      <Textarea name="summary" placeholder="Module summary" defaultValue={module?.summary} />
      <SubmitButton>{module ? "Update module" : "Create module"}</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function LessonForm({
  courseSlugs,
  modules,
  lesson
}: {
  courseSlugs?: string[];
  modules?: EditableModule[];
  lesson?: EditableLesson;
}) {
  const [state, action] = useFormState(addLessonAction, null);
  const selectedLab = lesson?.lab?.lab ?? "";

  return (
    <form action={action} className="space-y-3 rounded-md border bg-background p-4">
      {lesson?.id && <input type="hidden" name="id" value={lesson.id} />}
      {modules?.length ? (
        <Select name="moduleId" defaultValue={lesson?.moduleId ?? modules[0]?.id}>
          {modules.map((module) => (
            <option key={module.id} value={module.id}>
              {module.title}
            </option>
          ))}
        </Select>
      ) : (
        <>
          <Select name="courseSlug">
            {(courseSlugs ?? []).map((slug) => (
              <option key={slug}>{slug}</option>
            ))}
          </Select>
          <Input name="moduleTitle" placeholder="Module title" required />
        </>
      )}
      <div className="grid gap-3 md:grid-cols-[1fr_160px_160px]">
        <Input name="lessonTitle" placeholder="Lesson title" defaultValue={lesson?.title} required />
        <Input name="estimatedMinutes" type="number" defaultValue={lesson?.estimatedMinutes ?? 18} />
        <Input name="sortOrder" type="number" defaultValue={lesson?.sortOrder ?? 0} />
      </div>
      <Input name="slug" placeholder="lesson-slug" defaultValue={lesson?.slug} />
      <Select name="lab" defaultValue={selectedLab}>
        <option value="">No lab</option>
        <option value="docker">Docker</option>
        <option value="testing">Automation Testing</option>
        <option value="network">Network & CCNA</option>
        <option value="linux">Linux Terminal</option>
        <option value="sql">SQL Database</option>
        <option value="playground">General Playground</option>
      </Select>
      <Textarea
        name="markdown"
        className="min-h-[260px] font-mono"
        placeholder="# Lesson title&#10;&#10;Write rich markdown here..."
        defaultValue={lesson?.markdown}
        required
      />
      <SubmitButton>{lesson ? "Update lesson" : "Create lesson"}</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

export function PublishToggle({ slug, published }: { slug: string; published: boolean }) {
  return (
    <form action={togglePublishFormAction}>
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="published" value={published ? "false" : "true"} />
      <SubmitButton variant="outline">{published ? "Unpublish" : "Publish"}</SubmitButton>
    </form>
  );
}

export function DeleteCourseButton({ id }: { id: string }) {
  return (
    <form action={deleteCourseAction}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="destructive">Delete course</SubmitButton>
    </form>
  );
}

export function DeleteModuleButton({ id }: { id: string }) {
  return (
    <form action={deleteModuleAction}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="destructive">Delete module</SubmitButton>
    </form>
  );
}

export function DeleteLessonButton({ id }: { id: string }) {
  return (
    <form action={deleteLessonAction}>
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="destructive">Delete lesson</SubmitButton>
    </form>
  );
}
