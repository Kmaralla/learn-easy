import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Flame, Target, ArrowRight, Check, X, Lightbulb, ChevronRight, RotateCcw, BookOpen, Sparkles, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { CreditReward } from "@/components/credit-reward";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User as UserType, Question } from "@shared/schema";

type LearningData = {
  user: UserType;
  currentCard: {
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
  } | null;
  streak: number;
  todayProgress: number;
  totalCards: number;
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [userName, setUserName] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("learnai-username");
    if (stored) {
      setUserName(stored);
    }
  }, []);

  const { data, isLoading, refetch } = useQuery<LearningData>({
    queryKey: ["/api/learn"],
    enabled: !!userName,
  });

  const setUserNameMutation = useMutation({
    mutationFn: async (name: string) => {
      return apiRequest("POST", "/api/user/set-name", { username: name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learn"] });
    },
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async (payload: { questionId: string; isCorrect: boolean; creditsEarned: number }) => {
      return apiRequest("POST", "/api/answer", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learn"] });
    },
  });

  const nextCardMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/next-card", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/learn"] });
      setSelectedAnswer(null);
      setHasAnswered(false);
    },
  });

  const handleSetName = useCallback(() => {
    if (nameInput.trim()) {
      localStorage.setItem("learnai-username", nameInput.trim());
      setUserName(nameInput.trim());
      setUserNameMutation.mutate(nameInput.trim());
    }
  }, [nameInput, setUserNameMutation]);

  const handleSelectAnswer = useCallback((index: number) => {
    if (hasAnswered || !data?.currentCard?.question) return;
    
    setSelectedAnswer(index);
    setHasAnswered(true);
    
    const question = data.currentCard.question;
    const isCorrect = index === question.correctIndex;
    const earned = isCorrect ? question.creditsReward : 0;
    
    if (earned > 0) {
      setRewardAmount(earned);
      setShowReward(true);
      setTimeout(() => setShowReward(false), 2000);
    }
    
    submitAnswerMutation.mutate({
      questionId: question.id,
      isCorrect,
      creditsEarned: earned,
    });
  }, [hasAnswered, data, submitAnswerMutation]);

  const handleNext = useCallback(() => {
    nextCardMutation.mutate();
  }, [nextCardMutation]);

  const handleStartQuestions = useCallback(() => {
    nextCardMutation.mutate();
  }, [nextCardMutation]);

  if (!userName) {
    return (
      <div className="min-h-full flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md relative z-10"
          >
            <Card className="overflow-hidden shadow-lg border-primary/10">
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-0.5">
                <CardContent className="p-8 bg-card rounded-md text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold mb-2">Welcome to Learn-AI</h1>
                  <p className="text-muted-foreground mb-6">
                    Enter your name to start learning and track your progress
                  </p>
                  <div className="space-y-4">
                    <Input
                      placeholder="Your name"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSetName()}
                      className="text-center text-lg"
                      data-testid="input-username"
                    />
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleSetName}
                      disabled={!nameInput.trim()}
                      data-testid="button-start-learning"
                    >
                      Start Learning
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return null;
  }

  const { user, currentCard, streak, todayProgress, totalCards } = data;
  const accuracy = user.totalAnswered > 0 
    ? Math.round((user.totalCorrect / user.totalAnswered) * 100) 
    : 0;

  const getLevelProgress = () => {
    if (user.currentLevel === 'advanced') {
      return { progress: 100, nextLevel: null, needed: 0 };
    }
    if (user.currentLevel === 'intermediate') {
      const target = 90;
      const minQuestions = 6;
      const questionsNeeded = Math.max(0, minQuestions - user.totalAnswered);
      const accuracyNeeded = Math.max(0, target - accuracy);
      return { 
        progress: Math.min(accuracy / target * 100, 100), 
        nextLevel: 'Advanced',
        needed: questionsNeeded > 0 ? `${questionsNeeded} more questions` : 
                accuracyNeeded > 0 ? `${accuracyNeeded}% more accuracy` : 'Almost there!'
      };
    }
    const target = 80;
    const minQuestions = 3;
    const questionsNeeded = Math.max(0, minQuestions - user.totalAnswered);
    const accuracyNeeded = Math.max(0, target - accuracy);
    return { 
      progress: Math.min(accuracy / target * 100, 100), 
      nextLevel: 'Intermediate',
      needed: questionsNeeded > 0 ? `${questionsNeeded} more questions` : 
              accuracyNeeded > 0 ? `${accuracyNeeded}% more accuracy` : 'Almost there!'
    };
  };

  const levelProgress = getLevelProgress();
  const lessonStep = currentCard?.stepInLesson || 1;
  const lessonNumber = (currentCard?.lessonIndex || 0) + 1;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'advanced': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'intermediate': return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
      default: return 'bg-primary/10 text-primary border-primary/30';
    }
  };

  return (
    <div className="min-h-full flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <CreditReward amount={rewardAmount} isVisible={showReward} />
      
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="h-4 w-px bg-border" />
              <span className="font-medium text-sm hidden sm:inline" data-testid="text-username">{userName}</span>
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="font-semibold text-sm" data-testid="text-credits">{user.credits}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="font-semibold text-sm" data-testid="text-streak">{streak} day{streak !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Target className="h-4 w-4 text-emerald-500" />
                <span className="font-semibold text-sm" data-testid="text-accuracy">{accuracy}%</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${getDifficultyColor(user.currentLevel)}`}>
                <div className={`w-2 h-2 rounded-full ${
                  user.currentLevel === 'advanced' ? 'bg-emerald-500' : 
                  user.currentLevel === 'intermediate' ? 'bg-amber-500' : 'bg-primary'
                }`} />
                <span className="text-sm font-semibold capitalize">{user.currentLevel}</span>
              </div>
              <ThemeToggle />
            </div>
          </div>
          
          {levelProgress.nextLevel && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Next: <span className="font-medium text-foreground">{levelProgress.nextLevel}</span></span>
                <span className="text-muted-foreground">{levelProgress.needed}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full rounded-full ${
                    user.currentLevel === 'intermediate' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress.progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        </div>
        <div className="w-full max-w-2xl relative z-10">
          <AnimatePresence mode="wait">
            {!currentCard ? (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-12"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 mb-6">
                  <Check className="h-10 w-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Great job, {userName}!</h2>
                <p className="text-muted-foreground mb-6">
                  You've completed today's learning session.
                </p>
                <Button onClick={() => refetch()} data-testid="button-learn-more">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Learn More
                </Button>
              </motion.div>
            ) : currentCard.type === "concept" && currentCard.concept ? (
              <motion.div
                key={`concept-${currentCard.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden shadow-lg border-primary/10">
                  <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-0.5">
                    <CardContent className="p-6 sm:p-8 bg-card rounded-md">
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Lesson {lessonNumber}
                          </Badge>
                          <Badge className={`text-xs capitalize border ${getDifficultyColor(currentCard.difficulty)}`}>
                            {currentCard.difficulty}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>Step {lessonStep} of 3</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 mb-6">
                        {[1, 2, 3].map((step) => (
                          <div 
                            key={step} 
                            className={`h-1 flex-1 rounded-full ${
                              step <= lessonStep ? 'bg-primary' : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-md bg-primary/10">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">{currentCard.topic}</span>
                      </div>
                      
                      <h2 className="text-2xl font-bold mb-4" data-testid="text-concept-title">
                        {currentCard.concept.title}
                      </h2>
                      
                      <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
                        {currentCard.concept.content.split('\n\n').map((paragraph, i) => (
                          <p key={i} className="text-muted-foreground leading-relaxed">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                      
                      <div className="bg-primary/5 border border-primary/20 rounded-md p-4 mb-6">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm mb-1">Key Takeaway</p>
                            <p className="text-sm text-muted-foreground">
                              {currentCard.concept.keyTakeaway}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handleStartQuestions}
                        disabled={nextCardMutation.isPending}
                        data-testid="button-next-step"
                      >
                        {nextCardMutation.isPending ? "Loading..." : "Continue to Example"}
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            ) : currentCard.type === "example" && currentCard.example ? (
              <motion.div
                key={`example-${currentCard.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden shadow-lg border-amber-500/20">
                  <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-0.5">
                    <CardContent className="p-6 sm:p-8 bg-card rounded-md">
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Lesson {lessonNumber}
                          </Badge>
                          <Badge className={`text-xs capitalize border ${getDifficultyColor(currentCard.difficulty)}`}>
                            {currentCard.difficulty}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Step {lessonStep} of 3</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 mb-6">
                        {[1, 2, 3].map((step) => (
                          <div 
                            key={step} 
                            className={`h-1 flex-1 rounded-full ${
                              step <= lessonStep ? 'bg-amber-500' : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 rounded-md bg-amber-500/10">
                          <Sparkles className="h-5 w-5 text-amber-500" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">Real-World Example</span>
                      </div>
                      
                      <h2 className="text-2xl font-bold mb-4" data-testid="text-example-title">
                        {currentCard.example.title}
                      </h2>
                      
                      <div className="bg-muted/50 rounded-md p-4 mb-6">
                        <p className="text-sm italic text-muted-foreground">
                          {currentCard.example.scenario}
                        </p>
                      </div>
                      
                      <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
                        {currentCard.example.explanation.split('\n\n').map((paragraph, i) => (
                          <p key={i} className="text-muted-foreground leading-relaxed whitespace-pre-line">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                      
                      <div className="bg-amber-500/5 border border-amber-500/20 rounded-md p-4 mb-6">
                        <div className="flex items-start gap-3">
                          <Sparkles className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm mb-1">Real-World Application</p>
                            <p className="text-sm text-muted-foreground">
                              {currentCard.example.realWorldApplication}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handleStartQuestions}
                        disabled={nextCardMutation.isPending}
                        data-testid="button-start-quiz"
                      >
                        {nextCardMutation.isPending ? "Loading..." : "Ready for Quiz"}
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            ) : currentCard.question ? (
              <motion.div
                key={`question-${currentCard.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden shadow-lg border-emerald-500/20">
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Lesson {lessonNumber}
                        </Badge>
                        <Badge className={`text-xs capitalize border ${getDifficultyColor(currentCard.difficulty)}`}>
                          {currentCard.difficulty}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Target className="h-3.5 w-3.5" />
                          <span>Step {lessonStep} of 3</span>
                        </div>
                        <Badge className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                          +{currentCard.question.creditsReward} credits
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 mb-6">
                      {[1, 2, 3].map((step) => (
                        <div 
                          key={step} 
                          className={`h-1 flex-1 rounded-full ${
                            step <= lessonStep ? 'bg-emerald-500' : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    
                    {currentCard.question.scenario && (
                      <div className="bg-muted/50 rounded-md p-4 mb-4">
                        <p className="text-sm italic text-muted-foreground">
                          {currentCard.question.scenario}
                        </p>
                      </div>
                    )}
                    
                    <h3 className="text-xl font-semibold mb-6" data-testid="text-question">
                      {currentCard.question.question}
                    </h3>
                    
                    <div className="space-y-3 mb-6">
                      {currentCard.question.options.map((option, index) => {
                        const isSelected = selectedAnswer === index;
                        const isCorrect = index === currentCard.question!.correctIndex;
                        const showResult = hasAnswered;
                        
                        let className = "w-full text-left p-4 rounded-md border transition-all ";
                        if (showResult) {
                          if (isCorrect) {
                            className += "bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300";
                          } else if (isSelected && !isCorrect) {
                            className += "bg-destructive/10 border-destructive text-destructive";
                          } else {
                            className += "opacity-50";
                          }
                        } else if (isSelected) {
                          className += "bg-primary/10 border-primary";
                        } else {
                          className += "hover-elevate active-elevate-2";
                        }
                        
                        return (
                          <button
                            key={index}
                            className={className}
                            onClick={() => handleSelectAnswer(index)}
                            disabled={hasAnswered}
                            data-testid={`button-option-${index}`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-sm font-medium shrink-0">
                                {String.fromCharCode(65 + index)}
                              </span>
                              <span className="text-sm">{option}</span>
                              {showResult && isCorrect && (
                                <Check className="h-5 w-5 text-emerald-500 ml-auto shrink-0" />
                              )}
                              {showResult && isSelected && !isCorrect && (
                                <X className="h-5 w-5 text-destructive ml-auto shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    
                    <AnimatePresence>
                      {hasAnswered && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <div className={`p-4 rounded-md mb-6 ${
                            selectedAnswer === currentCard.question.correctIndex
                              ? "bg-emerald-500/10 border border-emerald-500/30"
                              : "bg-destructive/10 border border-destructive/30"
                          }`}>
                            <p className="font-medium text-sm mb-2">
                              {selectedAnswer === currentCard.question.correctIndex 
                                ? "Excellent!" 
                                : "Not quite right"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {currentCard.question.explanation}
                            </p>
                          </div>
                          
                          <Button 
                            className="w-full" 
                            size="lg"
                            onClick={handleNext}
                            disabled={nextCardMutation.isPending}
                            data-testid="button-next-card"
                          >
                            Next Lesson
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-full flex flex-col">
      <div className="sticky top-0 z-50 bg-background border-b">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-14" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-1.5 w-full mt-3" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
