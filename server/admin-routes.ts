import type { Express } from "express";
import { db } from "./db";
import { contentSources, topics, concepts, conceptQuestions, adminUsers } from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import * as bcrypt from "bcryptjs";
import { registerContentIngestionRoutes } from "./content-ingestion";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export function registerAdminRoutes(app: Express) {
  // Register content ingestion routes
  registerContentIngestionRoutes(app);

  app.post("/api/admin/login", async (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      res.json({ success: true, token: "admin-session" });
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  });

  app.get("/api/admin/sources", async (req, res) => {
    const sources = await db.select().from(contentSources).orderBy(contentSources.createdAt);
    res.json(sources);
  });

  app.post("/api/admin/sources", async (req, res) => {
    const { title, url, description } = req.body;
    const id = randomUUID();
    await db.insert(contentSources).values({
      id,
      title,
      url,
      description,
      isActive: true,
    });
    res.json({ id, title, url, description });
  });

  app.delete("/api/admin/sources/:id", async (req, res) => {
    await db.delete(contentSources).where(eq(contentSources.id, req.params.id));
    res.json({ success: true });
  });

  app.get("/api/admin/topics", async (req, res) => {
    const allTopics = await db.select().from(topics).orderBy(topics.order);
    res.json(allTopics);
  });

  app.post("/api/admin/topics", async (req, res) => {
    const { title, description, sourceId, unlockDay } = req.body;
    const id = randomUUID();
    const maxOrder = await db.select().from(topics);
    await db.insert(topics).values({
      id,
      title,
      description,
      sourceId,
      order: maxOrder.length,
      isActive: true,
      unlockDay: unlockDay || 1, // Default to Day 1 if not specified
    });
    res.json({ id, title, description, sourceId, unlockDay: unlockDay || 1 });
  });

  app.put("/api/admin/topics/:id", async (req, res) => {
    const { title, description, isActive, unlockDay } = req.body;
    const updateData: any = { title, description, isActive };
    if (unlockDay !== undefined) {
      updateData.unlockDay = unlockDay;
    }
    await db.update(topics)
      .set(updateData)
      .where(eq(topics.id, req.params.id));
    res.json({ success: true });
  });

  app.delete("/api/admin/topics/:id", async (req, res) => {
    await db.delete(topics).where(eq(topics.id, req.params.id));
    res.json({ success: true });
  });

  app.get("/api/admin/topics/:topicId/concepts", async (req, res) => {
    const topicConcepts = await db.select()
      .from(concepts)
      .where(eq(concepts.topicId, req.params.topicId))
      .orderBy(concepts.order);
    res.json(topicConcepts);
  });

  app.get("/api/admin/concepts", async (req, res) => {
    const allConcepts = await db.select().from(concepts).orderBy(concepts.order);
    res.json(allConcepts);
  });

  app.post("/api/admin/concepts", async (req, res) => {
    const { topicId, title, content, keyTakeaway, difficulty } = req.body;
    const id = randomUUID();
    const existing = await db.select().from(concepts).where(eq(concepts.topicId, topicId));
    await db.insert(concepts).values({
      id,
      topicId,
      title,
      content,
      keyTakeaway,
      difficulty: difficulty || "beginner",
      order: existing.length,
      isActive: true,
    });
    res.json({ id, topicId, title, content, keyTakeaway, difficulty });
  });

  app.put("/api/admin/concepts/:id", async (req, res) => {
    const { title, content, keyTakeaway, difficulty, isActive } = req.body;
    await db.update(concepts)
      .set({ title, content, keyTakeaway, difficulty, isActive })
      .where(eq(concepts.id, req.params.id));
    res.json({ success: true });
  });

  app.delete("/api/admin/concepts/:id", async (req, res) => {
    await db.delete(conceptQuestions).where(eq(conceptQuestions.conceptId, req.params.id));
    await db.delete(concepts).where(eq(concepts.id, req.params.id));
    res.json({ success: true });
  });

  app.get("/api/admin/concepts/:conceptId/questions", async (req, res) => {
    const questions = await db.select()
      .from(conceptQuestions)
      .where(eq(conceptQuestions.conceptId, req.params.conceptId));
    res.json(questions);
  });

  app.get("/api/admin/questions", async (req, res) => {
    const allQuestions = await db.select().from(conceptQuestions);
    res.json(allQuestions);
  });

  app.post("/api/admin/questions", async (req, res) => {
    const { conceptId, scenario, question, options, correctIndex, explanation, difficulty, creditsReward } = req.body;
    const id = randomUUID();
    await db.insert(conceptQuestions).values({
      id,
      conceptId,
      scenario,
      question,
      options,
      correctIndex,
      explanation,
      difficulty: difficulty || "beginner",
      creditsReward: creditsReward || 10,
      isActive: true,
    });
    res.json({ id, conceptId, question });
  });

  app.put("/api/admin/questions/:id", async (req, res) => {
    const { scenario, question, options, correctIndex, explanation, difficulty, creditsReward, isActive } = req.body;
    await db.update(conceptQuestions)
      .set({ scenario, question, options, correctIndex, explanation, difficulty, creditsReward, isActive })
      .where(eq(conceptQuestions.id, req.params.id));
    res.json({ success: true });
  });

  app.delete("/api/admin/questions/:id", async (req, res) => {
    await db.delete(conceptQuestions).where(eq(conceptQuestions.id, req.params.id));
    res.json({ success: true });
  });

  app.get("/api/admin/stats", async (req, res) => {
    const sourceCount = await db.select().from(contentSources);
    const topicCount = await db.select().from(topics);
    const conceptCount = await db.select().from(concepts);
    const questionCount = await db.select().from(conceptQuestions);
    res.json({
      sources: sourceCount.length,
      topics: topicCount.length,
      concepts: conceptCount.length,
      questions: questionCount.length,
    });
  });
}
