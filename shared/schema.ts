import { pgTable, text, varchar, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  username: text("username").notNull().unique(),
  credits: integer("credits").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  totalCorrect: integer("total_correct").notNull().default(0),
  totalAnswered: integer("total_answered").notNull().default(0),
  currentLevel: text("current_level").notNull().default("beginner"),
});

export const modules = pgTable("modules", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  order: integer("order").notNull(),
  isLocked: boolean("is_locked").notNull().default(true),
});

export const lessons = pgTable("lessons", {
  id: varchar("id", { length: 36 }).primaryKey(),
  moduleId: varchar("module_id", { length: 36 }).notNull(),
  title: text("title").notNull(),
  theory: text("theory").notNull(),
  order: integer("order").notNull(),
  difficulty: text("difficulty").notNull().default("beginner"),
});

export const questions = pgTable("questions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  lessonId: varchar("lesson_id", { length: 36 }).notNull(),
  scenario: text("scenario").notNull(),
  question: text("question").notNull(),
  options: jsonb("options").notNull().$type<string[]>(),
  correctIndex: integer("correct_index").notNull(),
  explanation: text("explanation").notNull(),
  difficulty: text("difficulty").notNull().default("beginner"),
  creditsReward: integer("credits_reward").notNull().default(10),
});

export const userProgress = pgTable("user_progress", {
  id: varchar("id", { length: 36 }).primaryKey(),
  moduleId: varchar("module_id", { length: 36 }).notNull(),
  lessonId: varchar("lesson_id", { length: 36 }).notNull(),
  completed: boolean("completed").notNull().default(false),
  correctAnswers: integer("correct_answers").notNull().default(0),
  totalQuestions: integer("total_questions").notNull().default(0),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertModuleSchema = createInsertSchema(modules).omit({ id: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });
export const insertUserProgressSchema = createInsertSchema(userProgress).omit({ id: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;

export type QuestionOption = {
  text: string;
  isCorrect: boolean;
};

export type LessonWithQuestions = Lesson & {
  questions: Question[];
};

export type ModuleWithLessons = Module & {
  lessons: Lesson[];
  progress?: {
    completed: number;
    total: number;
  };
};
