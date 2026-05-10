export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type LabKind =
  | "docker"
  | "testing"
  | "network"
  | "linux"
  | "sql"
  | "playground";

export type LabStarter = {
  lab: LabKind;
  title: string;
  description: string;
  language?: string;
  files?: Record<string, string>;
  commands?: string[];
  challenge?: string;
};

export type Lesson = {
  id: string;
  moduleId: string;
  courseSlug: string;
  slug: string;
  title: string;
  estimatedMinutes: number;
  markdown: string;
  quiz?: {
    question: string;
    options: string[];
    answer: string;
  };
  lab?: LabStarter;
};

export type Module = {
  id: string;
  courseSlug: string;
  title: string;
  summary: string;
  lessons: Lesson[];
};

export type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  difficulty: Difficulty;
  durationMinutes: number;
  thumbnail: string;
  tags: string[];
  published: boolean;
  xp: number;
  modules: Module[];
};

export type Challenge = {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  category: string;
  prompt: string;
  starterCode: string;
  tests: string;
};

export type UserProgress = {
  completedLessons: string[];
  practicedLabs: LabKind[];
  xp: number;
  streak: number;
  badges: string[];
};
