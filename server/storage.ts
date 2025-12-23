import type { 
  User, InsertUser, Module, Lesson, Question, UserProgress 
} from "@shared/schema";
import { randomUUID } from "crypto";

type LearningCard = {
  id: string;
  type: "concept" | "question";
  topic: string;
  difficulty: string;
  concept?: {
    title: string;
    content: string;
    keyTakeaway: string;
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
    const cards: Omit<LearningCard, "id">[] = [
      {
        type: "concept",
        topic: "AI Agents",
        difficulty: "beginner",
        concept: {
          title: "What is an AI Agent?",
          content: `An AI Agent is a system that uses AI models and tools in a loop to achieve a goal. Think of it as a smart assistant that can reason, take action, and learn from results.

Unlike a simple chatbot that just responds to messages, an agent can actually DO things - search the web, write code, call APIs, and more. It keeps working until it accomplishes what you asked for.

The key insight: Agents = Models + Tools + Loop. The AI model (like GPT or Claude) provides the "thinking," tools provide the "doing," and the loop keeps everything moving toward the goal.`,
          keyTakeaway: "An AI Agent runs models and tools in a loop to achieve a goal - it thinks, acts, and iterates until done.",
        },
      },
      {
        type: "question",
        topic: "AI Agents",
        difficulty: "beginner",
        question: {
          id: randomUUID(),
          lessonId: "",
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
        type: "concept",
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
      },
      {
        type: "question",
        topic: "ReAct Pattern",
        difficulty: "beginner",
        question: {
          id: randomUUID(),
          lessonId: "",
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
        type: "concept",
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
      },
      {
        type: "question",
        topic: "Agent Memory",
        difficulty: "intermediate",
        question: {
          id: randomUUID(),
          lessonId: "",
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
        type: "concept",
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
      },
      {
        type: "question",
        topic: "Tools & APIs",
        difficulty: "beginner",
        question: {
          id: randomUUID(),
          lessonId: "",
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
        type: "concept",
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
      },
      {
        type: "question",
        topic: "Agent Architecture",
        difficulty: "intermediate",
        question: {
          id: randomUUID(),
          lessonId: "",
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
        type: "concept",
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
      },
      {
        type: "question",
        topic: "Agent Safety",
        difficulty: "intermediate",
        question: {
          id: randomUUID(),
          lessonId: "",
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
        type: "concept",
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
      },
      {
        type: "question",
        topic: "Code Execution",
        difficulty: "advanced",
        question: {
          id: randomUUID(),
          lessonId: "",
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
