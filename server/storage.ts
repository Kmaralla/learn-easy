import type { 
  User, InsertUser, Module, Lesson, Question, UserProgress 
} from "@shared/schema";
import { randomUUID } from "crypto";

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

  constructor() {
    this.users = new Map();
    this.modules = new Map();
    this.lessons = new Map();
    this.questions = new Map();
    this.userProgress = new Map();
    
    this.defaultUserId = randomUUID();
    this.initializeData();
  }

  private initializeData() {
    const defaultUser: User = {
      id: this.defaultUserId,
      username: "Learner",
      credits: 150,
      streak: 3,
      totalCorrect: 12,
      totalAnswered: 15,
      currentLevel: "beginner",
    };
    this.users.set(defaultUser.id, defaultUser);

    const modulesData: Omit<Module, "id">[] = [
      {
        title: "Introduction to AI",
        description: "Learn the fundamentals of Artificial Intelligence, including key concepts and real-world applications.",
        icon: "brain",
        order: 1,
        isLocked: false,
      },
      {
        title: "Machine Learning Basics",
        description: "Understand how machines learn from data through supervised and unsupervised learning techniques.",
        icon: "sparkles",
        order: 2,
        isLocked: false,
      },
      {
        title: "AI Agents & Workflows",
        description: "Discover how AI agents work autonomously and orchestrate complex workflows.",
        icon: "bot",
        order: 3,
        isLocked: true,
      },
      {
        title: "Prompt Engineering",
        description: "Master the art of crafting effective prompts to get the best results from AI models.",
        icon: "message",
        order: 4,
        isLocked: true,
      },
    ];

    modulesData.forEach((mod) => {
      const id = randomUUID();
      this.modules.set(id, { ...mod, id });
    });

    const moduleIds = Array.from(this.modules.keys());

    const lessonsData: { moduleId: string; lessons: Omit<Lesson, "id" | "moduleId">[] }[] = [
      {
        moduleId: moduleIds[0],
        lessons: [
          {
            title: "What is Artificial Intelligence?",
            theory: `Artificial Intelligence (AI) is the simulation of human intelligence processes by machines, especially computer systems. These processes include learning, reasoning, and self-correction.

AI systems can perform tasks that typically require human intelligence, such as visual perception, speech recognition, decision-making, and language translation.

The field of AI was founded in 1956 at a conference at Dartmouth College. Since then, AI has evolved from simple rule-based systems to complex neural networks that can learn from vast amounts of data.

Today, AI is everywhere - from the recommendations you see on streaming platforms to the virtual assistants on your phone. Understanding AI is becoming essential in our increasingly digital world.`,
            order: 1,
            difficulty: "beginner",
          },
          {
            title: "Types of AI Systems",
            theory: `AI systems can be categorized into different types based on their capabilities and how they function.

Narrow AI (Weak AI) is designed for specific tasks. Examples include voice assistants, recommendation systems, and image recognition. This is the most common type of AI today.

General AI (Strong AI) would have human-level intelligence across all domains. This remains theoretical and is a major goal of AI research.

Reactive machines respond to current situations without memory of past events. Deep Blue, the chess-playing computer, is an example.

Limited memory AI can use past experiences to inform future decisions. Self-driving cars use this type of AI.

Theory of mind AI would understand emotions and beliefs - still largely in research phase.`,
            order: 2,
            difficulty: "beginner",
          },
          {
            title: "Real-World AI Applications",
            theory: `AI has transformed numerous industries and continues to create new possibilities every day.

Healthcare: AI assists in diagnosing diseases, discovering drugs, and personalizing treatment plans. Medical imaging AI can detect conditions that might be missed by human eyes.

Finance: Banks use AI for fraud detection, credit scoring, and algorithmic trading. AI chatbots handle customer service inquiries.

Transportation: Self-driving vehicles, route optimization, and traffic prediction all rely on AI systems.

Entertainment: Streaming services use AI to recommend content. Video games use AI for realistic NPC behavior.

Education: Adaptive learning platforms personalize education. AI tutors provide one-on-one assistance.

The key to understanding AI applications is recognizing that AI excels at pattern recognition and can process vast amounts of data much faster than humans.`,
            order: 3,
            difficulty: "intermediate",
          },
        ],
      },
      {
        moduleId: moduleIds[1],
        lessons: [
          {
            title: "Understanding Machine Learning",
            theory: `Machine Learning (ML) is a subset of AI that enables systems to learn and improve from experience without being explicitly programmed.

Instead of following pre-written rules, ML algorithms build models based on sample data (training data) to make predictions or decisions.

The key insight is that we teach machines through examples rather than instructions. Show a model thousands of pictures of cats and dogs, and it learns to distinguish between them.

There are three main types of machine learning:
1. Supervised Learning - Learning from labeled examples
2. Unsupervised Learning - Finding patterns in unlabeled data  
3. Reinforcement Learning - Learning through trial and error with rewards

Machine learning powers many AI applications you use daily, from spam filters to product recommendations.`,
            order: 1,
            difficulty: "beginner",
          },
          {
            title: "Supervised vs Unsupervised Learning",
            theory: `Supervised Learning is like learning with a teacher. The algorithm is trained on labeled data, meaning each example comes with the correct answer.

Example: Predicting house prices. You show the model many houses with their features (size, location, bedrooms) and their actual prices. The model learns the relationship between features and price.

Common supervised learning tasks:
- Classification (Is this email spam or not?)
- Regression (What will be the temperature tomorrow?)

Unsupervised Learning works without labels. The algorithm finds hidden patterns or structures in data on its own.

Example: Customer segmentation. Given purchase data, the algorithm groups similar customers together without being told what groups to look for.

Common unsupervised learning tasks:
- Clustering (Group similar items)
- Dimensionality reduction (Simplify complex data)

Both approaches are powerful tools in the ML toolkit, chosen based on the problem and available data.`,
            order: 2,
            difficulty: "intermediate",
          },
        ],
      },
    ];

    lessonsData.forEach(({ moduleId, lessons }) => {
      lessons.forEach((lesson) => {
        const id = randomUUID();
        this.lessons.set(id, { ...lesson, id, moduleId });
      });
    });

    const lessonIds = Array.from(this.lessons.keys());

    const questionsData: { lessonId: string; questions: Omit<Question, "id" | "lessonId">[] }[] = [
      {
        lessonId: lessonIds[0],
        questions: [
          {
            scenario: "You're explaining AI to a friend who has never heard of it before. They ask what AI actually does.",
            question: "Which statement best describes what Artificial Intelligence is?",
            options: [
              "A robot that looks and acts exactly like a human",
              "The simulation of human intelligence processes by computer systems",
              "A super-fast calculator that only does math",
              "A programming language used to build websites"
            ],
            correctIndex: 1,
            explanation: "AI refers to the simulation of human intelligence by machines. This includes learning from data, reasoning through problems, and self-correction. It's not just robots or calculators - it's about machines that can perform cognitive tasks.",
            difficulty: "beginner",
            creditsReward: 10,
          },
          {
            scenario: "A company wants to implement AI but isn't sure what tasks AI can help with.",
            question: "Which of these is NOT typically considered an AI capability?",
            options: [
              "Recognizing faces in photos",
              "Translating text between languages",
              "Generating creative electricity",
              "Making recommendations based on preferences"
            ],
            correctIndex: 2,
            explanation: "AI can recognize faces, translate languages, and make personalized recommendations. However, 'generating creative electricity' isn't an AI task - it's a physical process that requires actual power generation equipment, not intelligence.",
            difficulty: "beginner",
            creditsReward: 10,
          },
          {
            scenario: "You're at a job interview and the interviewer asks about the history of AI.",
            question: "When was the field of Artificial Intelligence officially founded?",
            options: [
              "1920 during the industrial revolution",
              "1956 at the Dartmouth Conference",
              "1995 when the internet became popular",
              "2010 when smartphones became common"
            ],
            correctIndex: 1,
            explanation: "The field of AI was officially founded in 1956 at a conference at Dartmouth College. This historic event brought together researchers who coined the term 'Artificial Intelligence' and laid the groundwork for the field.",
            difficulty: "beginner",
            creditsReward: 10,
          },
        ],
      },
      {
        lessonId: lessonIds[1],
        questions: [
          {
            scenario: "A startup is building an AI that can master any task a human can do, from cooking to coding.",
            question: "What type of AI is this startup trying to create?",
            options: [
              "Narrow AI - designed for specific tasks",
              "General AI - human-level intelligence across all domains",
              "Reactive machines - responds without memory",
              "Limited memory AI - uses past experiences"
            ],
            correctIndex: 1,
            explanation: "General AI (also called Strong AI) would have human-level intelligence across all domains. This is what the startup is attempting - an AI that can do anything a human can. This remains theoretical and is a major goal of AI research.",
            difficulty: "intermediate",
            creditsReward: 15,
          },
          {
            scenario: "Your smart speaker understands your voice commands and plays music, but it can't help you with unrelated tasks like cooking.",
            question: "What type of AI does your smart speaker represent?",
            options: [
              "General AI",
              "Narrow AI",
              "Super AI",
              "Conscious AI"
            ],
            correctIndex: 1,
            explanation: "Smart speakers use Narrow AI (also called Weak AI), which is designed for specific tasks like understanding voice commands and playing music. They excel at their designated functions but cannot perform tasks outside their programming.",
            difficulty: "beginner",
            creditsReward: 10,
          },
        ],
      },
      {
        lessonId: lessonIds[2],
        questions: [
          {
            scenario: "A hospital wants to use AI to help doctors detect early signs of cancer in medical scans.",
            question: "Which AI application category does this fall under?",
            options: [
              "Entertainment",
              "Healthcare",
              "Finance",
              "Transportation"
            ],
            correctIndex: 1,
            explanation: "This is a Healthcare AI application. AI in healthcare helps diagnose diseases, analyze medical images, and assist doctors in making better decisions. Cancer detection from medical scans is one of the most impactful uses of AI in medicine.",
            difficulty: "beginner",
            creditsReward: 10,
          },
          {
            scenario: "Netflix shows you movie recommendations based on what you've watched before.",
            question: "What makes AI particularly good at providing these recommendations?",
            options: [
              "AI can read your mind",
              "AI excels at pattern recognition and processing large amounts of data",
              "AI randomly guesses what you might like",
              "AI asks other users what you should watch"
            ],
            correctIndex: 1,
            explanation: "AI excels at pattern recognition - it can analyze your viewing history, compare it with millions of other users, and find patterns that predict what you'll enjoy. This ability to process vast amounts of data is a key strength of AI systems.",
            difficulty: "intermediate",
            creditsReward: 15,
          },
        ],
      },
      {
        lessonId: lessonIds[3],
        questions: [
          {
            scenario: "You're building an app that predicts house prices based on historical sales data where each house has a known price.",
            question: "What type of machine learning approach should you use?",
            options: [
              "Unsupervised learning - the data has no labels",
              "Supervised learning - you have labeled examples",
              "Reinforcement learning - the AI learns through rewards",
              "No machine learning is needed"
            ],
            correctIndex: 1,
            explanation: "Supervised learning is the right choice here because you have labeled data - each house comes with its actual selling price. The model learns from these examples to predict prices for new houses.",
            difficulty: "beginner",
            creditsReward: 10,
          },
          {
            scenario: "An e-commerce company has millions of customers but doesn't know how to group them.",
            question: "If they want AI to find natural customer segments without pre-defined categories, which approach should they use?",
            options: [
              "Supervised learning with labeled customer types",
              "Unsupervised learning to discover patterns",
              "Asking each customer which group they belong to",
              "Randomly assigning customers to groups"
            ],
            correctIndex: 1,
            explanation: "Unsupervised learning is perfect for this! Without pre-defined labels, unsupervised algorithms can analyze customer behavior and automatically discover natural groupings (clusters) based on similarities in the data.",
            difficulty: "intermediate",
            creditsReward: 15,
          },
        ],
      },
      {
        lessonId: lessonIds[4],
        questions: [
          {
            scenario: "A spam filter needs to learn from emails that are already marked as 'spam' or 'not spam'.",
            question: "This is an example of which type of machine learning task?",
            options: [
              "Regression - predicting a continuous value",
              "Classification - categorizing into discrete groups",
              "Clustering - finding natural groupings",
              "Dimensionality reduction - simplifying data"
            ],
            correctIndex: 1,
            explanation: "This is a Classification task. The model learns to categorize emails into discrete groups (spam vs. not spam). Classification is a supervised learning approach where the output is a category or label.",
            difficulty: "intermediate",
            creditsReward: 15,
          },
          {
            scenario: "A weather service wants to predict tomorrow's exact temperature based on historical data.",
            question: "What type of supervised learning task is this?",
            options: [
              "Classification - assigning categories",
              "Regression - predicting continuous values",
              "Clustering - grouping similar items",
              "Dimensionality reduction"
            ],
            correctIndex: 1,
            explanation: "This is a Regression task. Unlike classification which predicts categories, regression predicts continuous numerical values - in this case, the exact temperature. The model learns the relationship between weather features and temperature values.",
            difficulty: "intermediate",
            creditsReward: 15,
          },
        ],
      },
    ];

    questionsData.forEach(({ lessonId, questions }) => {
      questions.forEach((question) => {
        const id = randomUUID();
        this.questions.set(id, { ...question, id, lessonId });
      });
    });
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
