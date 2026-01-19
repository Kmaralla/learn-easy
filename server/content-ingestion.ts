import { randomUUID } from "crypto";
import { db } from "./db";
import { contentSources } from "@shared/schema";
import type { Express } from "express";
import { getMulterConfig, uploadToS3 } from "./storage/s3-storage";

// Get multer configuration based on storage type (local or S3)
export const upload = getMulterConfig();

/**
 * Extract text from PDF file
 * Note: This is a placeholder - you'll need to install pdf-parse or similar
 */
export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    // TODO: Install pdf-parse: npm install pdf-parse @types/pdf-parse
    // const pdfParse = require("pdf-parse");
    // const fs = require("fs");
    // const dataBuffer = fs.readFileSync(filePath);
    // const data = await pdfParse(dataBuffer);
    // return data.text;
    
    // Placeholder implementation
    return "PDF text extraction not yet implemented. Please install pdf-parse package.";
  } catch (error: any) {
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Register content ingestion routes
 */
export function registerContentIngestionRoutes(app: Express) {
  // PDF upload endpoint
  app.post(
    "/api/admin/sources/upload-pdf",
    upload.single("pdf"),
    async (req: any, res: any) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No PDF file uploaded" });
        }

        const { title, description } = req.body;
        if (!title) {
          return res.status(400).json({ error: "Title is required" });
        }

        const storageType = process.env.STORAGE_TYPE || "local";
        let fileUrl: string | null = null;
        let filePath: string | null = null;

        // Upload to S3 if in production, otherwise use local storage
        if (storageType === "s3") {
          const result = await uploadToS3(req.file, "pdfs");
          fileUrl = result.url;
          filePath = result.key;
        } else {
          filePath = req.file.path;
        }

        // Extract text from PDF (works with both local and S3)
        let extractedText = "";
        try {
          if (storageType === "s3" && req.file.buffer) {
            // For S3, extract from buffer
            // TODO: Implement PDF extraction from buffer
            extractedText = "PDF text extraction from buffer not yet implemented";
          } else {
            extractedText = await extractTextFromPDF(filePath!);
          }
        } catch (extractError: any) {
          console.warn("PDF extraction failed:", extractError.message);
          extractedText = "Extraction failed - install pdf-parse package";
        }

        // Save as content source
        const id = randomUUID();
        await db.insert(contentSources).values({
          id,
          title,
          description: description || `PDF: ${req.file.originalname}`,
          url: fileUrl, // S3 URL or null for local
          isActive: true,
        });

        // Generate lessons from extracted text if OpenAI is configured
        let generatedLessons = null;
        if (process.env.OPENAI_API_KEY && extractedText.length > 100) {
          try {
            const { generateLessonFromContent } = await import("./ai-service");
            generatedLessons = await generateLessonFromContent(extractedText, title);
            res.json({
              success: true,
              id,
              title,
              message: "PDF uploaded and lessons generated successfully",
              fileUrl: fileUrl || filePath,
              extractedLength: extractedText.length,
              generatedConcepts: generatedLessons.concepts.length,
              generatedQuestions: generatedLessons.questions.length,
              lessons: generatedLessons, // Return generated content for admin to review
            });
          } catch (aiError: any) {
            console.error("AI generation error:", aiError);
            res.json({
              success: true,
              id,
              title,
              message: "PDF uploaded but AI generation failed",
              fileUrl: fileUrl || filePath,
              extractedLength: extractedText.length,
              error: aiError.message,
            });
          }
        } else {
          res.json({
            success: true,
            id,
            title,
            message: `PDF uploaded successfully to ${storageType === "s3" ? "S3" : "local storage"}`,
            fileUrl: fileUrl || filePath,
            extractedLength: extractedText.length,
            note: process.env.OPENAI_API_KEY
              ? "Text too short for generation"
              : "Set OPENAI_API_KEY in .env to enable AI lesson generation",
          });
        }
      } catch (error: any) {
        console.error("PDF upload error:", error);
        res.status(500).json({ error: error.message || "Failed to upload PDF" });
      }
    }
  );

  // Website URL ingestion
  app.post("/api/admin/sources/ingest-url", async (req, res) => {
    try {
      const { url, title, description } = req.body;

      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: "Invalid URL format" });
      }

      // TODO: Scrape website content
      // For now, save URL and optionally fetch content if OpenAI is available
      let scrapedContent = "";
      let generatedLessons = null;

      // Basic URL validation and note about scraping
      if (process.env.OPENAI_API_KEY) {
        // TODO: Implement web scraping with puppeteer or cheerio
        // For now, just save the URL
        scrapedContent = `Content from ${url} - Web scraping not yet implemented. Install puppeteer or cheerio for content extraction.`;
      }

      // Save as content source
      const id = randomUUID();
      await db.insert(contentSources).values({
        id,
        title: title || url,
        description: description || `Website: ${url}`,
        url,
        isActive: true,
      });

      res.json({
        success: true,
        id,
        title: title || url,
        url,
        message: "URL added successfully",
        note: "Web scraping not yet implemented. Install puppeteer or cheerio for content extraction.",
      });
    } catch (error: any) {
      console.error("URL ingestion error:", error);
      res.status(500).json({ error: error.message || "Failed to ingest URL" });
    }
  });
}
