import type { 
  User, InsertUser, Module, Lesson, Question, UserProgress 
} from "@shared/schema";
import { randomUUID } from "crypto";

type LearningCard = {
  id: string;
  type: "concept" | "example" | "question";
  topic: string;
  difficulty: string;
  lessonIndex: number;
  stepInLesson: number;
  concept?: {
    title: string;
    content: string;
    keyTakeaway: string;
  };
  example?: {
    title: string;
    scenario: string;
    explanation: string;
    realWorldApplication: string;
  };
  question?: Question;
};

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCredits(id: string, credits: number): Promise<void>;
  updateUserStats(id: string, correct: boolean): Promise<void>;
  updateUserLevel(id: string, level: string): Promise<void>;
  updateUserStreak(id: string, streak: number): Promise<void>;
  
  getModules(): Promise<Module[]>;
  getModule(id: string): Promise<Module | undefined>;
  
  getLessons(moduleId: string): Promise<Lesson[]>;
  getLesson(id: string): Promise<Lesson | undefined>;
  
  getQuestions(lessonId: string): Promise<Question[]>;
  getQuestion(id: string): Promise<Question | undefined>;
  
  getUserProgress(lessonId: string): Promise<UserProgress | undefined>;
  completeLesson(lessonId: string, moduleId: string, correctAnswers: number, totalQuestions: number): Promise<void>;
  getCompletedLessonIds(): Promise<string[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private modules: Map<string, Module>;
  private lessons: Map<string, Lesson>;
  private questions: Map<string, Question>;
  private userProgress: Map<string, UserProgress>;
  private defaultUserId: string;
  
  private learningCards: LearningCard[];
  private currentCardIndex: number;
  private completedCardIds: Set<string>;

  constructor() {
    this.users = new Map();
    this.modules = new Map();
    this.lessons = new Map();
    this.questions = new Map();
    this.userProgress = new Map();
    this.learningCards = [];
    this.currentCardIndex = 0;
    this.completedCardIds = new Set();
    
    this.defaultUserId = randomUUID();
    this.initializeData();
  }

  private initializeData() {
    const defaultUser: User = {
      id: this.defaultUserId,
      username: "Learner",
      credits: 0,
      streak: 1,
      totalCorrect: 0,
      totalAnswered: 0,
      currentLevel: "beginner",
    };
    this.users.set(defaultUser.id, defaultUser);

    this.initializeLearningCards();
  }

  private initializeLearningCards() {
    const lessons: Array<{
      topic: string;
      difficulty: string;
      concept: { title: string; content: string; keyTakeaway: string };
      example: { title: string; scenario: string; explanation: string; realWorldApplication: string };
      question: Omit<Question, "id" | "lessonId">;
    }> = [
      {
        topic: "AI Agents",
        difficulty: "beginner",
        concept: {
          title: "What is an AI Agent?",
          content: `An AI Agent is a system that uses AI models and tools in a loop to achieve a goal. Think of it as a smart assistant that can reason, take action, and learn from results.

Unlike a simple chatbot that just responds to messages, an agent can actually DO things - search the web, write code, call APIs, and more. It keeps working until it accomplishes what you asked for.

The key insight: Agents = Models + Tools + Loop. The AI model (like GPT or Claude) provides the "thinking," tools provide the "doing," and the loop keeps everything moving toward the goal.`,
          keyTakeaway: "An AI Agent runs models and tools in a loop to achieve a goal - it thinks, acts, and iterates until done.",
        },
        example: {
          title: "AI Agent in Action: The Smart Research Assistant",
          scenario: "Imagine you ask an AI: 'Find me the top 3 trending AI startups this week and summarize what they do.'",
          explanation: `Here's how an AI Agent handles this differently than a chatbot:

A chatbot might say: "I don't have real-time data" or give you outdated information.

An AI Agent would:
1. THINK: "I need current data, so I'll search the web"
2. ACT: Uses a search tool to find recent AI startup news
3. OBSERVE: Gets results from TechCrunch, VentureBeat
4. THINK: "Now I need to extract the top 3 and summarize"
5. ACT: Reads the articles and synthesizes information
6. DELIVER: Gives you a fresh, accurate summary

The agent loops through think-act-observe until the job is done!`,
          realWorldApplication: "This is exactly how tools like Perplexity AI work - they don't just guess, they actively search and verify information before responding.",
        },
        question: {
          scenario: "A company wants to build a system that can automatically research competitors, analyze their products, and generate a summary report.",
          question: "What makes this an AI Agent rather than a simple chatbot?",
          options: [
            "It uses a large language model",
            "It can search the web and use tools in a loop to complete the task",
            "It responds to user messages",
            "It has a nice user interface"
          ],
          correctIndex: 1,
          explanation: "The key difference is that an agent uses tools (web search, analysis) in a loop to accomplish a multi-step goal. A chatbot just responds to messages - an agent actually takes action and iterates until the task is complete.",
          difficulty: "beginner",
          creditsReward: 10,
        },
      },
      {
        topic: "ReAct Pattern",
        difficulty: "beginner",
        concept: {
          title: "The ReAct Pattern: Think, Act, Observe",
          content: `The ReAct pattern is the foundation of how modern AI agents work. It stands for Reasoning + Acting, and it's elegantly simple:

1. THOUGHT: The agent reasons about what to do next ("I need to find nearby restaurants, so I'll use the map function")

2. ACTION: The agent executes the step (calls the maps API)

3. OBSERVATION: The agent processes the results ("There are two pizza places and one Indian restaurant")

Then it loops back to THOUGHT, deciding what to do with this new information. This "chain-of-thought" approach dramatically improves AI performance by making the model explain its reasoning before acting.`,
          keyTakeaway: "ReAct = Think, Act, Observe, Repeat. This loop lets agents break down complex tasks into manageable steps.",
        },
        example: {
          title: "ReAct in Real Life: Booking a Flight",
          scenario: "You tell an AI travel agent: 'Book me the cheapest flight to Tokyo next month.'",
          explanation: `Watch the ReAct pattern unfold:

THOUGHT 1: "I need to know the user's departure city and exact dates"
ACTION 1: Ask user for departure location and flexible dates
OBSERVATION 1: User says "From NYC, any weekend"

THOUGHT 2: "I should search multiple weekends to find the best deal"
ACTION 2: Query flight APIs for 4 different weekend combinations
OBSERVATION 2: Found prices ranging from $650 to $1,200

THOUGHT 3: "March 15-17 is cheapest. I should confirm before booking"
ACTION 3: Present option to user with flight details
OBSERVATION 3: User approves

THOUGHT 4: "Time to complete the booking"
ACTION 4: Execute booking through airline API

Each step builds on the last - that's the power of ReAct!`,
          realWorldApplication: "Google's travel search and booking assistants use this pattern to help millions of users find the best deals every day.",
        },
        question: {
          scenario: "You're building an AI travel assistant. A user asks: 'Plan me a weekend trip to Paris with good food and art museums.'",
          question: "Following the ReAct pattern, what should happen FIRST?",
          options: [
            "Immediately book the cheapest flight",
            "The agent thinks about what information it needs (flights, museums, restaurants)",
            "Show the user a form to fill out",
            "Display a list of all Paris hotels"
          ],
          correctIndex: 1,
          explanation: "In ReAct, THOUGHT comes first. The agent needs to reason about the task - what are the sub-goals? What information is needed? Only after thinking does it take action. Jumping straight to booking would miss important considerations like dates, budget, and preferences.",
          difficulty: "beginner",
          creditsReward: 10,
        },
      },
      {
        topic: "Tools & APIs",
        difficulty: "beginner",
        concept: {
          title: "Tools: Extending What AI Can Do",
          content: `AI models are great at thinking and generating text, but they can't actually DO things on their own. That's where tools come in.

Tools are functions that let agents interact with the real world:
- Search the web for current information
- Query databases for specific data
- Call APIs to send emails or create tasks
- Execute code to perform calculations
- Control browsers to navigate websites

When you give an agent access to tools, you're essentially giving it hands to act in the world. The model decides WHEN to use a tool and WHAT inputs to provide - but the tool does the actual work.

The more tools an agent has, the more capable it becomes. But with great power comes great responsibility - you need guardrails!`,
          keyTakeaway: "Tools give AI agents the ability to act in the world - from searching to sending emails to executing code.",
        },
        example: {
          title: "Tools in Action: The AI Data Analyst",
          scenario: "A marketing manager asks: 'Analyze our Q4 sales data and create a presentation for the board meeting.'",
          explanation: `The AI agent orchestrates multiple tools:

DATABASE TOOL: Queries the sales database
"SELECT product, revenue, region FROM sales WHERE quarter = 'Q4'"

CALCULATOR TOOL: Performs analysis
- Calculates growth rates, top performers, regional breakdowns
- Identifies trends and anomalies

CHART GENERATOR: Creates visualizations
- Revenue by product (bar chart)
- Regional comparison (pie chart)
- Month-over-month trend (line graph)

SLIDES TOOL: Builds the presentation
- Arranges data into executive summary
- Adds key insights and recommendations

The AI doesn't do any of this itself - it's the conductor, and the tools are the orchestra!`,
          realWorldApplication: "Microsoft Copilot uses this exact approach - connecting to Excel, PowerPoint, and databases to help knowledge workers automate complex tasks.",
        },
        question: {
          scenario: "You're building an AI agent to help with data analysis. Users want it to query databases, create charts, and send results via email.",
          question: "Which tools does this agent need?",
          options: [
            "Just a large language model is enough",
            "Database query tool, charting/visualization tool, and email sending tool",
            "Only a database tool - the AI can do the rest",
            "No tools - modern AI can do all this natively"
          ],
          correctIndex: 1,
          explanation: "AI models can reason about data but can't directly query databases, generate actual charts, or send emails. Each capability requires a specific tool. The model orchestrates WHEN and HOW to use each tool, but the tools do the actual work.",
          difficulty: "beginner",
          creditsReward: 10,
        },
      },
      {
        topic: "Agent Memory",
        difficulty: "intermediate",
        concept: {
          title: "Memory Systems: Short-term vs Long-term",
          content: `Agents need memory to work effectively. But here's the catch: you can't just dump everything into the AI's context window. Too much information can confuse the model.

Short-term Memory holds the current conversation and immediate context. It's like your working memory - what you're actively thinking about right now.

Long-term Memory persists across sessions. It includes:
- User preferences and history
- Knowledge bases and documents
- Previous conversation summaries

Smart agents use techniques like vector search to find relevant memories instead of loading everything at once. Think of it like how you don't remember every book you've read, but you can recall relevant information when you need it.`,
          keyTakeaway: "Effective agents balance short-term context with selective retrieval from long-term memory - just like humans do.",
        },
        example: {
          title: "Memory in Action: The Personal Shopping Assistant",
          scenario: "A customer returns to an e-commerce site after 2 months and says: 'I need another pair of those running shoes I bought.'",
          explanation: `How memory makes this interaction magical:

WITHOUT MEMORY:
"I'm sorry, I don't know what shoes you bought. Can you describe them or provide an order number?"
(Frustrating for the customer!)

WITH SMART MEMORY:
The agent uses vector search on the customer's history:
- Query: "running shoes purchase"
- Retrieved: Order #4521 - Nike Air Zoom, Size 10, Blue, $129

Agent response: "I found your Nike Air Zoom Pegasus in size 10! Would you like the same blue color, or try the new colorways? I also noticed you mentioned they were great for marathon training - we have a newer model optimized for long distances."

The agent pulled relevant history AND added personalized recommendations!`,
          realWorldApplication: "Amazon's recommendation engine and customer service bots use exactly this pattern - retrieving relevant purchase history and preferences to personalize every interaction.",
        },
        question: {
          scenario: "An AI customer service agent needs to help a returning customer who had issues with a product 3 months ago.",
          question: "How should the agent handle this customer's history?",
          options: [
            "Load all customer emails from the past year into the context",
            "Start fresh with no memory of past interactions",
            "Use vector search to retrieve only relevant past interactions",
            "Ask the customer to explain everything from the beginning"
          ],
          correctIndex: 2,
          explanation: "Vector search retrieves semantically relevant memories without overloading context. Loading everything would confuse the model and be slow. Starting fresh or asking the customer to repeat themselves creates a poor experience. Smart retrieval gives the agent just what it needs.",
          difficulty: "intermediate",
          creditsReward: 15,
        },
      },
      {
        topic: "Agent Architecture",
        difficulty: "intermediate",
        concept: {
          title: "Multi-Agent Systems",
          content: `Sometimes one agent isn't enough. Complex tasks benefit from multiple specialized agents working together.

Imagine building a software development agent. Instead of one agent doing everything, you might have:
- A Planner agent that breaks down requirements
- A Coder agent that writes implementation
- A Reviewer agent that checks for bugs
- A Tester agent that validates the code

This separation of concerns makes systems more reliable and easier to improve. Each agent can be optimized for its specific task.

Multi-agent architectures also enable debates and consensus - when agents disagree, they can work through differences just like a team of humans would.

Research shows multi-agent systems can improve performance by around 29% on complex benchmarks!`,
          keyTakeaway: "Multi-agent systems divide complex tasks among specialized agents, improving reliability and performance.",
        },
        example: {
          title: "Multi-Agent System: The AI Newsroom",
          scenario: "A media company wants to automatically produce high-quality news articles about breaking stories.",
          explanation: `Here's how a multi-agent newsroom works:

SCANNER AGENT (always watching)
- Monitors news wires, social media, official sources
- Flags breaking stories worth covering

RESEARCHER AGENT (digs deep)
- Gathers facts, finds primary sources
- Verifies claims against multiple sources
- Compiles background information

WRITER AGENT (crafts the story)
- Writes engaging, accurate copy
- Matches the publication's style guide
- Creates headlines and summaries

EDITOR AGENT (quality control)
- Checks for errors and bias
- Verifies facts one more time
- Ensures legal compliance

PUBLISHER AGENT (distribution)
- Formats for different platforms
- Schedules optimal posting times
- Manages social media promotion

Each agent is a specialist - together they outperform any single "do-everything" agent!`,
          realWorldApplication: "The Associated Press uses AI agents to write thousands of corporate earnings reports - specialized agents handle data extraction while others write the narrative.",
        },
        question: {
          scenario: "A company wants to automate their content creation pipeline: research topics, write articles, edit for quality, and publish.",
          question: "Why might a multi-agent approach work better than a single agent?",
          options: [
            "It's always faster to use multiple agents",
            "Each agent can specialize (researcher, writer, editor) and be optimized for its role",
            "Single agents are not capable of any of these tasks",
            "Multi-agent systems are simpler to build"
          ],
          correctIndex: 1,
          explanation: "Specialization is the key benefit. A researcher agent can be tuned for finding facts, a writer for engaging prose, an editor for catching errors. Each can use different prompts, tools, and even models. This division of labor matches how human teams work - and it produces better results.",
          difficulty: "intermediate",
          creditsReward: 15,
        },
      },
      {
        topic: "Agent Safety",
        difficulty: "intermediate",
        concept: {
          title: "Guardrails: Keeping Agents Safe",
          content: `Agents that can act in the world need guardrails. Without them, a well-intentioned agent might cause unintended harm.

Key safety principles:

1. Least Privilege: Only give agents the minimum tools and permissions they need. An agent that summarizes documents doesn't need database delete access.

2. Human-in-the-Loop: For high-stakes actions (financial transactions, sending external communications), require human approval before executing.

3. Session Isolation: Each agent session should be isolated so one compromised session can't affect others.

4. Audit Trails: Log every action so you can understand what happened and why.

5. Fail Safely: When something goes wrong, agents should stop and ask for help rather than guessing.

Building trustworthy agents isn't just about capability - it's about predictable, controlled behavior.`,
          keyTakeaway: "Safe agents use least privilege, human oversight for high-stakes actions, isolation, and comprehensive logging.",
        },
        example: {
          title: "Guardrails in Action: The Banking Assistant",
          scenario: "A bank deploys an AI agent to help customers with account management and transactions.",
          explanation: `Watch how guardrails protect everyone:

LEAST PRIVILEGE:
- Can view balance and recent transactions
- Can NOT access other customers' data
- Can NOT modify account settings without 2FA

HUMAN-IN-THE-LOOP:
- Small transfers (<$500): Agent can process automatically
- Large transfers (>$500): Requires human review
- International transfers: Always needs manager approval

SESSION ISOLATION:
- Each chat session runs in its own container
- One hacked session can't access others
- Session data wiped after 24 hours

AUDIT TRAIL:
- Every action logged with timestamp
- "Agent viewed balance for account ***4521"
- "Agent initiated transfer of $200 to saved payee"
- "Transfer approved by system (under threshold)"

When the agent encounters something suspicious:
"I notice this is a new payee in a foreign country. For your protection, I'm escalating this to a human specialist who will call you to verify."`,
          realWorldApplication: "Bank of America's Erica assistant and similar banking bots use exactly these guardrails to process millions of requests while maintaining security.",
        },
        question: {
          scenario: "An AI agent has access to a company's customer database and email system. A prompt injection attack tries to make it email customer data to an external address.",
          question: "Which guardrail would BEST prevent this attack?",
          options: [
            "Using a larger, smarter AI model",
            "Requiring human approval before sending any external emails",
            "Giving the agent more training data",
            "Making the agent work faster"
          ],
          correctIndex: 1,
          explanation: "Human-in-the-loop for high-stakes actions is the most effective guardrail here. Even if an attacker tricks the model, a human reviewer would catch the suspicious email before it's sent. Model size doesn't prevent prompt injection - proper controls do.",
          difficulty: "intermediate",
          creditsReward: 15,
        },
      },
      {
        topic: "Code Execution",
        difficulty: "advanced",
        concept: {
          title: "Code Interpreters: Agents That Code",
          content: `One of the most powerful tools an agent can have is the ability to write and execute code. This is called a Code Interpreter.

When an agent can run code, it can:
- Perform complex calculations and data transformations
- Analyze datasets and create visualizations
- Test hypotheses by running experiments
- Automate repetitive tasks with scripts

But running arbitrary code is dangerous! That's why code interpreters use sandboxed environments - isolated containers where code runs safely without access to the host system.

Modern approaches use microVMs (tiny virtual machines) that spin up in milliseconds, run the code, and are destroyed. Even if malicious code executes, it can't escape the sandbox.

This pattern powers tools like ChatGPT's Code Interpreter and many enterprise AI solutions.`,
          keyTakeaway: "Code interpreters let agents write and run code in secure sandboxes, enabling powerful data analysis and automation.",
        },
        example: {
          title: "Code Interpreter: The Data Detective",
          scenario: "A business analyst uploads a messy CSV file and asks: 'Find any unusual patterns in our sales data.'",
          explanation: `The code interpreter agent gets to work:

STEP 1: Understand the data
\`\`\`python
import pandas as pd
df = pd.read_csv('sales_data.csv')
print(df.head())
print(df.describe())
\`\`\`
"I see 50,000 rows with columns: date, product, quantity, price, region..."

STEP 2: Clean and prepare
\`\`\`python
df['date'] = pd.to_datetime(df['date'])
df['revenue'] = df['quantity'] * df['price']
df = df.dropna()
\`\`\`
"Cleaned the data, calculated revenue, removed 23 incomplete rows..."

STEP 3: Detect anomalies
\`\`\`python
from scipy import stats
z_scores = stats.zscore(df['revenue'])
anomalies = df[abs(z_scores) > 3]
\`\`\`
"Found 17 unusual transactions!"

STEP 4: Visualize
\`\`\`python
import matplotlib.pyplot as plt
# Creates a chart highlighting the anomalies
\`\`\`

RESULT: "I found 17 anomalous sales - 12 are unusually large orders from Region B on Fridays. This might indicate bulk purchasing by a large client. Here's a visualization..."

All this runs in a secure sandbox - the code can't access anything outside its container!`,
          realWorldApplication: "ChatGPT's Code Interpreter, GitHub Copilot, and Jupyter AI all use sandboxed code execution to let users safely analyze data without writing code themselves.",
        },
        question: {
          scenario: "An AI data analyst agent needs to process a large CSV file, find anomalies, and create a visualization. The agent writes Python code to do this.",
          question: "Why is sandboxed code execution critical for this use case?",
          options: [
            "It makes the code run faster",
            "The code might have bugs or be manipulated to access sensitive systems",
            "Python requires a sandbox to work",
            "It's just a best practice with no real benefit"
          ],
          correctIndex: 1,
          explanation: "Even well-intentioned code can have bugs, and prompt injection could trick the agent into writing malicious code. A sandbox ensures that whatever code runs can't access the host system, other users' data, or network resources it shouldn't have. It's a critical security boundary.",
          difficulty: "advanced",
          creditsReward: 20,
        },
      },
    ];

    const cards: Omit<LearningCard, "id">[] = [];
    lessons.forEach((lesson, lessonIndex) => {
      cards.push({
        type: "concept",
        topic: lesson.topic,
        difficulty: lesson.difficulty,
        lessonIndex,
        stepInLesson: 1,
        concept: lesson.concept,
      });
      cards.push({
        type: "example",
        topic: lesson.topic,
        difficulty: lesson.difficulty,
        lessonIndex,
        stepInLesson: 2,
        example: lesson.example,
      });
      cards.push({
        type: "question",
        topic: lesson.topic,
        difficulty: lesson.difficulty,
        lessonIndex,
        stepInLesson: 3,
        question: {
          id: randomUUID(),
          lessonId: "",
          ...lesson.question,
        },
      });
    });

    this.learningCards = cards.map(card => ({
      ...card,
      id: randomUUID(),
    }));

    const modulesData: Omit<Module, "id">[] = [
      {
        title: "AI Agents Fundamentals",
        description: "Understanding what AI agents are and how they work.",
        icon: "bot",
        order: 1,
        isLocked: false,
      },
    ];

    modulesData.forEach((mod) => {
      const id = randomUUID();
      this.modules.set(id, { ...mod, id });
    });
  }

  async getCurrentLearningCard(): Promise<LearningCard | null> {
    if (this.currentCardIndex >= this.learningCards.length) {
      return null;
    }
    
    const user = await this.getDefaultUser();
    const card = this.learningCards[this.currentCardIndex];
    
    if (card.difficulty === "advanced" && user.currentLevel === "beginner") {
      const beginnerCards = this.learningCards.filter(c => c.difficulty === "beginner");
      const nextBeginner = beginnerCards.find(c => !this.completedCardIds.has(c.id));
      return nextBeginner || card;
    }
    
    if (card.difficulty === "intermediate" && user.currentLevel === "beginner") {
      if (user.totalCorrect < 3) {
        const beginnerCards = this.learningCards.filter(c => c.difficulty === "beginner");
        const nextBeginner = beginnerCards.find(c => !this.completedCardIds.has(c.id));
        return nextBeginner || card;
      }
    }
    
    return card;
  }

  async advanceToNextCard(): Promise<void> {
    const currentCard = await this.getCurrentLearningCard();
    if (currentCard) {
      this.completedCardIds.add(currentCard.id);
    }
    
    this.currentCardIndex++;
    
    const user = await this.getDefaultUser();
    const accuracy = user.totalAnswered > 0 
      ? (user.totalCorrect / user.totalAnswered) * 100 
      : 0;
    
    if (accuracy >= 80 && user.currentLevel === "beginner" && user.totalAnswered >= 3) {
      await this.updateUserLevel(user.id, "intermediate");
    } else if (accuracy >= 90 && user.currentLevel === "intermediate" && user.totalAnswered >= 6) {
      await this.updateUserLevel(user.id, "advanced");
    }
  }

  async getTodayProgress(): Promise<number> {
    return this.completedCardIds.size;
  }

  async getTotalCards(): Promise<number> {
    return this.learningCards.length;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getDefaultUser(): Promise<User> {
    return this.users.get(this.defaultUserId)!;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      username: insertUser.username,
      credits: 0,
      streak: 0,
      totalCorrect: 0,
      totalAnswered: 0,
      currentLevel: "beginner",
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserCredits(id: string, creditsToAdd: number): Promise<void> {
    const user = this.users.get(this.defaultUserId);
    if (user) {
      user.credits += creditsToAdd;
    }
  }

  async updateUserStats(id: string, correct: boolean): Promise<void> {
    const user = this.users.get(this.defaultUserId);
    if (user) {
      user.totalAnswered += 1;
      if (correct) {
        user.totalCorrect += 1;
      }
    }
  }

  async updateUserLevel(id: string, level: string): Promise<void> {
    const user = this.users.get(this.defaultUserId);
    if (user) {
      user.currentLevel = level;
    }
  }

  async updateUserStreak(id: string, streak: number): Promise<void> {
    const user = this.users.get(this.defaultUserId);
    if (user) {
      user.streak = streak;
    }
  }

  async updateUsername(id: string, username: string): Promise<void> {
    const user = this.users.get(this.defaultUserId);
    if (user) {
      user.username = username;
    }
  }

  async getModules(): Promise<Module[]> {
    return Array.from(this.modules.values()).sort((a, b) => a.order - b.order);
  }

  async getModule(id: string): Promise<Module | undefined> {
    return this.modules.get(id);
  }

  async getLessons(moduleId: string): Promise<Lesson[]> {
    return Array.from(this.lessons.values())
      .filter((lesson) => lesson.moduleId === moduleId)
      .sort((a, b) => a.order - b.order);
  }

  async getLesson(id: string): Promise<Lesson | undefined> {
    return this.lessons.get(id);
  }

  async getQuestions(lessonId: string): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter((question) => question.lessonId === lessonId);
  }

  async getQuestion(id: string): Promise<Question | undefined> {
    return this.questions.get(id);
  }

  async getUserProgress(lessonId: string): Promise<UserProgress | undefined> {
    return this.userProgress.get(lessonId);
  }

  async completeLesson(lessonId: string, moduleId: string, correctAnswers: number, totalQuestions: number): Promise<void> {
    const id = randomUUID();
    this.userProgress.set(lessonId, {
      id,
      moduleId,
      lessonId,
      completed: true,
      correctAnswers,
      totalQuestions,
    });
  }

  async getCompletedLessonIds(): Promise<string[]> {
    return Array.from(this.userProgress.values())
      .filter(p => p.completed)
      .map(p => p.lessonId);
  }

  async getFirstUncompletedLesson(): Promise<{ lesson: Lesson; module: Module } | null> {
    const completedIds = await this.getCompletedLessonIds();
    const modules = await this.getModules();
    
    for (const module of modules) {
      if (module.isLocked) continue;
      
      const lessons = await this.getLessons(module.id);
      for (const lesson of lessons) {
        if (!completedIds.includes(lesson.id)) {
          return { lesson, module };
        }
      }
    }
    return null;
  }

  async getNextLesson(currentLessonId: string): Promise<Lesson | null> {
    const currentLesson = await this.getLesson(currentLessonId);
    if (!currentLesson) return null;

    const moduleLessons = await this.getLessons(currentLesson.moduleId);
    const currentIndex = moduleLessons.findIndex(l => l.id === currentLessonId);
    
    if (currentIndex < moduleLessons.length - 1) {
      return moduleLessons[currentIndex + 1];
    }

    const modules = await this.getModules();
    const currentModuleIndex = modules.findIndex(m => m.id === currentLesson.moduleId);
    
    if (currentModuleIndex < modules.length - 1) {
      const nextModule = modules[currentModuleIndex + 1];
      if (!nextModule.isLocked) {
        const nextModuleLessons = await this.getLessons(nextModule.id);
        return nextModuleLessons[0] || null;
      }
    }

    return null;
  }
}

export const storage = new MemStorage();
