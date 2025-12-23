import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/user/credits", async (req, res) => {
    const user = await (storage as any).getDefaultUser();
    res.json({ credits: user.credits });
  });

  app.get("/api/learn", async (req, res) => {
    const user = await (storage as any).getDefaultUser();
    const currentCard = await (storage as any).getCurrentLearningCard();
    const todayProgress = await (storage as any).getTodayProgress();
    const totalCards = await (storage as any).getTotalCards();
    
    res.json({
      user,
      currentCard,
      streak: user.streak,
      todayProgress,
      totalCards,
    });
  });

  app.post("/api/next-card", async (req, res) => {
    await (storage as any).advanceToNextCard();
    res.json({ success: true });
  });

  app.get("/api/dashboard", async (req, res) => {
    const user = await (storage as any).getDefaultUser();
    const modules = await storage.getModules();
    const completedLessonIds = await storage.getCompletedLessonIds();
    
    const modulesWithProgress = await Promise.all(
      modules.map(async (module) => {
        const lessons = await storage.getLessons(module.id);
        const completed = lessons.filter(l => completedLessonIds.includes(l.id)).length;
        return {
          ...module,
          progress: { completed, total: lessons.length }
        };
      })
    );

    const current = await (storage as any).getFirstUncompletedLesson();
    
    const today = new Date().getDay();
    const activeDays = [today];
    if (user.streak > 1) {
      for (let i = 1; i < Math.min(user.streak, 7); i++) {
        activeDays.push((today - i + 7) % 7);
      }
    }

    res.json({
      user,
      modules: modulesWithProgress,
      currentModule: current?.module || null,
      currentLesson: current?.lesson ? { 
        id: current.lesson.id, 
        title: current.lesson.title,
        moduleId: current.lesson.moduleId 
      } : null,
      activeDays,
    });
  });

  app.get("/api/modules", async (req, res) => {
    const modules = await storage.getModules();
    const completedLessonIds = await storage.getCompletedLessonIds();
    
    const modulesWithProgress = await Promise.all(
      modules.map(async (module) => {
        const lessons = await storage.getLessons(module.id);
        const completed = lessons.filter(l => completedLessonIds.includes(l.id)).length;
        return {
          ...module,
          progress: { completed, total: lessons.length }
        };
      })
    );

    res.json({ modules: modulesWithProgress });
  });

  app.get("/api/modules/:id", async (req, res) => {
    const module = await storage.getModule(req.params.id);
    if (!module) {
      return res.status(404).json({ error: "Module not found" });
    }

    const lessons = await storage.getLessons(module.id);
    const completedLessonIds = await storage.getCompletedLessonIds();
    
    const lessonsWithCompletion = lessons.map(lesson => ({
      ...lesson,
      completed: completedLessonIds.includes(lesson.id)
    }));

    const completed = lessonsWithCompletion.filter(l => l.completed).length;

    res.json({
      module,
      lessons: lessonsWithCompletion,
      progress: { completed, total: lessons.length }
    });
  });

  app.get("/api/lessons/:id", async (req, res) => {
    const lesson = await storage.getLesson(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    const questions = await storage.getQuestions(lesson.id);
    const nextLesson = await (storage as any).getNextLesson(lesson.id);
    const moduleLessons = await storage.getLessons(lesson.moduleId);

    res.json({
      lesson,
      questions,
      nextLesson: nextLesson ? { id: nextLesson.id, title: nextLesson.title } : null,
      moduleLessons: moduleLessons.map(l => ({ id: l.id, title: l.title }))
    });
  });

  app.post("/api/answer", async (req, res) => {
    const { questionId, isCorrect, creditsEarned } = req.body;
    
    const user = await (storage as any).getDefaultUser();
    await storage.updateUserStats(user.id, isCorrect);
    
    if (creditsEarned > 0) {
      await storage.updateUserCredits(user.id, creditsEarned);
    }

    const accuracy = user.totalAnswered > 0 
      ? (user.totalCorrect / user.totalAnswered) * 100 
      : 0;

    if (accuracy >= 80 && user.currentLevel === "beginner") {
      await storage.updateUserLevel(user.id, "intermediate");
    } else if (accuracy >= 90 && user.currentLevel === "intermediate") {
      await storage.updateUserLevel(user.id, "advanced");
    }

    res.json({ success: true });
  });

  app.post("/api/complete-lesson", async (req, res) => {
    const { lessonId, correctAnswers, totalQuestions } = req.body;
    
    const lesson = await storage.getLesson(lessonId);
    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    await storage.completeLesson(lessonId, lesson.moduleId, correctAnswers, totalQuestions);

    const user = await (storage as any).getDefaultUser();
    await storage.updateUserStreak(user.id, user.streak + 1);

    res.json({ success: true });
  });

  app.get("/api/progress", async (req, res) => {
    const user = await (storage as any).getDefaultUser();
    const modules = await storage.getModules();
    const completedLessonIds = await storage.getCompletedLessonIds();
    
    let totalLessons = 0;
    for (const module of modules) {
      const lessons = await storage.getLessons(module.id);
      totalLessons += lessons.length;
    }

    const today = new Date().getDay();
    const activeDays = [today];
    if (user.streak > 1) {
      for (let i = 1; i < Math.min(user.streak, 7); i++) {
        activeDays.push((today - i + 7) % 7);
      }
    }

    const recentActivity = [
      { date: "Today", lessonsCompleted: 2, creditsEarned: 35 },
      { date: "Yesterday", lessonsCompleted: 1, creditsEarned: 25 },
      { date: "2 days ago", lessonsCompleted: 3, creditsEarned: 50 },
    ];

    res.json({
      user,
      totalLessons,
      completedLessons: completedLessonIds.length,
      activeDays,
      recentActivity,
    });
  });

  app.get("/api/profile", async (req, res) => {
    const user = await (storage as any).getDefaultUser();
    const modules = await storage.getModules();
    const completedLessonIds = await storage.getCompletedLessonIds();
    
    let totalLessons = 0;
    for (const module of modules) {
      const lessons = await storage.getLessons(module.id);
      totalLessons += lessons.length;
    }

    const achievements = [
      {
        id: "first-lesson",
        title: "First Steps",
        description: "Complete your first lesson",
        earned: completedLessonIds.length >= 1,
      },
      {
        id: "five-streak",
        title: "On Fire",
        description: "Maintain a 5-day learning streak",
        earned: user.streak >= 5,
      },
      {
        id: "perfect-score",
        title: "Perfect Score",
        description: "Get 100% on a lesson",
        earned: user.totalCorrect > 0 && user.totalCorrect === user.totalAnswered,
      },
      {
        id: "module-master",
        title: "Module Master",
        description: "Complete an entire module",
        earned: false,
      },
      {
        id: "credit-collector",
        title: "Credit Collector",
        description: "Earn 500 credits",
        earned: user.credits >= 500,
      },
      {
        id: "ai-enthusiast",
        title: "AI Enthusiast",
        description: "Complete 10 lessons",
        earned: completedLessonIds.length >= 10,
      },
    ];

    res.json({
      user,
      achievements,
      stats: {
        totalLessons,
        completedLessons: completedLessonIds.length,
        totalQuestions: user.totalAnswered,
        correctAnswers: user.totalCorrect,
      },
    });
  });

  return httpServer;
}
