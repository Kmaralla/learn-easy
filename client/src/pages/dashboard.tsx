import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Play, Sparkles, Brain, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsBar } from "@/components/stats-bar";
import { ModuleCard } from "@/components/module-card";
import { StreakCalendar } from "@/components/streak-calendar";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { ProgressRing } from "@/components/progress-ring";
import type { Module, User } from "@shared/schema";

type DashboardData = {
  user: User;
  modules: (Module & { progress: { completed: number; total: number } })[];
  currentModule: Module | null;
  currentLesson: { id: string; title: string; moduleId: string } | null;
  activeDays: number[];
};

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return null;
  }

  const { user, modules, currentModule, currentLesson, activeDays } = data;
  const accuracy = user.totalAnswered > 0 
    ? Math.round((user.totalCorrect / user.totalAnswered) * 100) 
    : 0;

  const totalProgress = modules.reduce((acc, m) => acc + m.progress.completed, 0);
  const totalLessons = modules.reduce((acc, m) => acc + m.progress.total, 0);
  const overallProgress = totalLessons > 0 ? Math.round((totalProgress / totalLessons) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-welcome">
            Welcome back
          </h1>
          <p className="text-muted-foreground mt-1">
            Continue your AI learning journey
          </p>
        </div>
        <StatsBar credits={user.credits} streak={user.streak} accuracy={accuracy} />
      </div>

      {currentLesson && currentModule && (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 rounded-md bg-primary/20">
                    <Brain className="h-8 w-8 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm text-muted-foreground">Continue Learning</span>
                      <DifficultyBadge difficulty={user.currentLevel} />
                    </div>
                    <h2 className="text-xl font-semibold mb-1" data-testid="text-current-lesson">
                      {currentLesson.title}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {currentModule.title}
                    </p>
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={() => setLocation(`/lesson/${currentLesson.id}`)}
                  data-testid="button-continue-learning"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Resume
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Learning Modules</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation("/lessons")}
              data-testid="button-view-all-modules"
            >
              View All
            </Button>
          </div>
          
          <div className="space-y-4">
            {modules.slice(0, 4).map((module) => (
              <ModuleCard
                key={module.id}
                module={module}
                progress={module.progress}
                onClick={() => {
                  const firstLessonId = module.id;
                  setLocation(`/module/${module.id}`);
                }}
                isCurrent={currentModule?.id === module.id}
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-center">
                <ProgressRing progress={overallProgress} size={100} strokeWidth={8} />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold" data-testid="text-lessons-completed">
                  {totalProgress}/{totalLessons}
                </p>
                <p className="text-sm text-muted-foreground">Lessons Completed</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Weekly Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StreakCalendar activeDays={activeDays} currentStreak={user.streak} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>

      <Skeleton className="h-32 w-full" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
