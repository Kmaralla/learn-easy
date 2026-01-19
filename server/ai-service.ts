/**
 * AI Service for content extraction and lesson generation
 * Uses OpenAI API to process content and generate structured lessons
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn("⚠️  OPENAI_API_KEY not set. AI features will be disabled.");
}

/**
 * Extract and clean text from content
 */
export async function extractContent(text: string): Promise<string> {
  // Basic cleaning - remove extra whitespace, normalize
  return text
    .replace(/\s+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Generate lesson content from extracted text using OpenAI
 */
export async function generateLessonFromContent(
  content: string,
  topicTitle: string
): Promise<{
  concepts: Array<{
    title: string;
    content: string;
    keyTakeaway: string;
    difficulty: "beginner" | "intermediate" | "advanced";
  }>;
  questions: Array<{
    scenario: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    difficulty: "beginner" | "intermediate" | "advanced";
  }>;
}> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured. Please set it in .env file.");
  }

  try {
    // Dynamic import to avoid loading OpenAI if not needed
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const prompt = `You are an expert educational content creator. Generate structured learning content from the following text about "${topicTitle}".

Extract and create:
1. 3-5 key concepts (theory sections) with:
   - Title
   - Detailed content explanation
   - Key takeaway (one sentence)
   - Difficulty level (beginner/intermediate/advanced)

2. For each concept, create 2 quiz questions with:
   - Scenario (optional context)
   - Question text
   - 4 multiple choice options
   - Correct answer index (0-3)
   - Explanation
   - Difficulty level

Content to process:
${content.substring(0, 8000)} ${content.length > 8000 ? "...(truncated)" : ""}

Return JSON in this exact format:
{
  "concepts": [
    {
      "title": "Concept Title",
      "content": "Detailed explanation...",
      "keyTakeaway": "One sentence takeaway",
      "difficulty": "beginner"
    }
  ],
  "questions": [
    {
      "scenario": "Optional context",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this is correct",
      "difficulty": "beginner"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cost-effective model
      messages: [
        {
          role: "system",
          content:
            "You are an expert at creating educational content. Always return valid JSON only, no markdown formatting.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(content);
    return parsed;
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    throw new Error(`Failed to generate lesson: ${error.message}`);
  }
}

/**
 * Generate analogy/example from concept
 */
export async function generateAnalogy(
  conceptTitle: string,
  conceptContent: string
): Promise<{
  title: string;
  scenario: string;
  explanation: string;
  realWorldApplication: string;
}> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  try {
    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const prompt = `Create a real-world analogy/example for this concept:

Title: ${conceptTitle}
Content: ${conceptContent}

Generate:
1. Title for the example
2. Scenario (real-world situation)
3. Explanation (how the concept applies)
4. Real-world application (where this is used in practice)

Return JSON:
{
  "title": "Example Title",
  "scenario": "Real-world scenario",
  "explanation": "How concept applies...",
  "realWorldApplication": "Where this is used..."
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating educational analogies. Return valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    return JSON.parse(content);
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    throw new Error(`Failed to generate analogy: ${error.message}`);
  }
}
