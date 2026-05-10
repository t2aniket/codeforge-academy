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
  sortOrder?: number;
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
  slug?: string;
  title: string;
  summary: string;
  sortOrder?: number;
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
  language?: string;
  track?: string;
  kind?: "practice" | "interview";
  prompt: string;
  starterCode: string;
  tests: string;
  functionName?: string;
  testCases?: Array<{
    input: unknown[];
    expected: unknown;
  }>;
};

export type UserProgress = {
  completedLessons: string[];
  practicedLabs: LabKind[];
  xp: number;
  streak: number;
  badges: string[];
};
