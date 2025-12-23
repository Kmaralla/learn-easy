import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Trash2, Edit, Save, X, Link, BookOpen, HelpCircle, FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ContentSource, Topic, Concept, ConceptQuestion } from "@shared/schema";

type AdminStats = {
  sources: number;
  topics: number;
  concepts: number;
  questions: number;
};

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleLogin = async () => {
    try {
      const res = await apiRequest("POST", "/api/admin/login", { password });
      if (res.ok) {
        setIsLoggedIn(true);
        toast({ title: "Logged in successfully" });
      }
    } catch {
      toast({ title: "Invalid password", variant: "destructive" });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              data-testid="input-admin-password"
            />
            <Button onClick={handleLogin} className="w-full" data-testid="button-admin-login">
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Content Management</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Link className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats?.sources || 0}</p>
                  <p className="text-sm text-muted-foreground">Sources</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats?.topics || 0}</p>
                  <p className="text-sm text-muted-foreground">Topics</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats?.concepts || 0}</p>
                  <p className="text-sm text-muted-foreground">Concepts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <HelpCircle className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats?.questions || 0}</p>
                  <p className="text-sm text-muted-foreground">Questions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="sources" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sources">Sources</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="concepts">Concepts</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
          </TabsList>

          <TabsContent value="sources">
            <SourcesManager />
          </TabsContent>
          <TabsContent value="topics">
            <TopicsManager />
          </TabsContent>
          <TabsContent value="concepts">
            <ConceptsManager />
          </TabsContent>
          <TabsContent value="questions">
            <QuestionsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SourcesManager() {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const { data: sources = [], refetch } = useQuery<ContentSource[]>({
    queryKey: ["/api/admin/sources"],
  });

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/sources", { title, url, description }),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setIsAdding(false);
      setTitle("");
      setUrl("");
      setDescription("");
      toast({ title: "Source added" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/sources/${id}`, {}),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Source deleted" });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Content Sources</CardTitle>
        <Button onClick={() => setIsAdding(true)} size="sm" data-testid="button-add-source">
          <Plus className="h-4 w-4 mr-2" />
          Add Source
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4 space-y-3">
              <Input
                placeholder="Source title (e.g., Amazon Science Blog)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="input-source-title"
              />
              <Input
                placeholder="URL (optional)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                data-testid="input-source-url"
              />
              <Textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="input-source-description"
              />
              <div className="flex gap-2">
                <Button onClick={() => addMutation.mutate()} disabled={!title} data-testid="button-save-source">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" onClick={() => setIsAdding(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {sources.length === 0 && !isAdding ? (
          <p className="text-muted-foreground text-center py-8">No sources yet. Add your first content source!</p>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <div key={source.id} className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="font-medium">{source.title}</p>
                  {source.url && (
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      {source.url}
                    </a>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(source.id)}
                  data-testid={`button-delete-source-${source.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TopicsManager() {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const { data: topics = [], refetch } = useQuery<Topic[]>({
    queryKey: ["/api/admin/topics"],
  });

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/topics", { title, description }),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setIsAdding(false);
      setTitle("");
      setDescription("");
      toast({ title: "Topic added" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/topics/${id}`, {}),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Topic deleted" });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Topics</CardTitle>
        <Button onClick={() => setIsAdding(true)} size="sm" data-testid="button-add-topic">
          <Plus className="h-4 w-4 mr-2" />
          Add Topic
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdding && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4 space-y-3">
              <Input
                placeholder="Topic title (e.g., AI Agents)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="input-topic-title"
              />
              <Textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                data-testid="input-topic-description"
              />
              <div className="flex gap-2">
                <Button onClick={() => addMutation.mutate()} disabled={!title} data-testid="button-save-topic">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" onClick={() => setIsAdding(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {topics.length === 0 && !isAdding ? (
          <p className="text-muted-foreground text-center py-8">No topics yet. Add your first topic!</p>
        ) : (
          <div className="space-y-2">
            {topics.map((topic) => (
              <div key={topic.id} className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="font-medium">{topic.title}</p>
                  {topic.description && <p className="text-sm text-muted-foreground">{topic.description}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(topic.id)}
                  data-testid={`button-delete-topic-${topic.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConceptsManager() {
  const [isAdding, setIsAdding] = useState(false);
  const [topicId, setTopicId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [keyTakeaway, setKeyTakeaway] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const { toast } = useToast();

  const { data: topics = [] } = useQuery<Topic[]>({
    queryKey: ["/api/admin/topics"],
  });

  const { data: concepts = [], refetch } = useQuery<Concept[]>({
    queryKey: ["/api/admin/concepts"],
  });

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/concepts", { topicId, title, content, keyTakeaway, difficulty }),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setIsAdding(false);
      setTopicId("");
      setTitle("");
      setContent("");
      setKeyTakeaway("");
      setDifficulty("beginner");
      toast({ title: "Concept added" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/concepts/${id}`, {}),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Concept deleted" });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Concepts</CardTitle>
        <Button onClick={() => setIsAdding(true)} size="sm" disabled={topics.length === 0} data-testid="button-add-concept">
          <Plus className="h-4 w-4 mr-2" />
          Add Concept
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {topics.length === 0 && (
          <p className="text-muted-foreground text-center py-4">Create a topic first before adding concepts.</p>
        )}

        {isAdding && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4 space-y-3">
              <Select value={topicId} onValueChange={setTopicId}>
                <SelectTrigger data-testid="select-concept-topic">
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Concept title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="input-concept-title"
              />
              <Textarea
                placeholder="Content (the main learning material)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-32"
                data-testid="input-concept-content"
              />
              <Input
                placeholder="Key takeaway"
                value={keyTakeaway}
                onChange={(e) => setKeyTakeaway(e.target.value)}
                data-testid="input-concept-takeaway"
              />
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger data-testid="select-concept-difficulty">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button onClick={() => addMutation.mutate()} disabled={!topicId || !title || !content || !keyTakeaway} data-testid="button-save-concept">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" onClick={() => setIsAdding(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {concepts.length === 0 && !isAdding ? (
          <p className="text-muted-foreground text-center py-8">No concepts yet.</p>
        ) : (
          <div className="space-y-2">
            {concepts.map((concept) => (
              <div key={concept.id} className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{concept.title}</p>
                    <Badge variant="secondary" className="capitalize text-xs">{concept.difficulty}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{concept.keyTakeaway}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(concept.id)}
                  data-testid={`button-delete-concept-${concept.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuestionsManager() {
  const [isAdding, setIsAdding] = useState(false);
  const [conceptId, setConceptId] = useState("");
  const [scenario, setScenario] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [creditsReward, setCreditsReward] = useState(10);
  const { toast } = useToast();

  const { data: concepts = [] } = useQuery<Concept[]>({
    queryKey: ["/api/admin/concepts"],
  });

  const { data: questions = [], refetch } = useQuery<ConceptQuestion[]>({
    queryKey: ["/api/admin/questions"],
  });

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/questions", {
      conceptId,
      scenario,
      question,
      options: options.filter(o => o.trim()),
      correctIndex,
      explanation,
      difficulty,
      creditsReward,
    }),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setIsAdding(false);
      setConceptId("");
      setScenario("");
      setQuestion("");
      setOptions(["", "", "", ""]);
      setCorrectIndex(0);
      setExplanation("");
      setDifficulty("beginner");
      setCreditsReward(10);
      toast({ title: "Question added" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/questions/${id}`, {}),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Question deleted" });
    },
  });

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Questions</CardTitle>
        <Button onClick={() => setIsAdding(true)} size="sm" disabled={concepts.length === 0} data-testid="button-add-question">
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {concepts.length === 0 && (
          <p className="text-muted-foreground text-center py-4">Create a concept first before adding questions.</p>
        )}

        {isAdding && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4 space-y-3">
              <Select value={conceptId} onValueChange={setConceptId}>
                <SelectTrigger data-testid="select-question-concept">
                  <SelectValue placeholder="Select concept" />
                </SelectTrigger>
                <SelectContent>
                  {concepts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Scenario (optional context for the question)"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                data-testid="input-question-scenario"
              />
              <Textarea
                placeholder="Question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                data-testid="input-question-text"
              />
              <div className="space-y-2">
                <p className="text-sm font-medium">Options (mark correct answer)</p>
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="correct"
                      checked={correctIndex === i}
                      onChange={() => setCorrectIndex(i)}
                      className="w-4 h-4"
                    />
                    <Input
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      data-testid={`input-question-option-${i}`}
                    />
                  </div>
                ))}
              </div>
              <Textarea
                placeholder="Explanation (shown after answering)"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                data-testid="input-question-explanation"
              />
              <div className="flex gap-2">
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="w-40" data-testid="select-question-difficulty">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Credits"
                  value={creditsReward}
                  onChange={(e) => setCreditsReward(Number(e.target.value))}
                  className="w-24"
                  data-testid="input-question-credits"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => addMutation.mutate()}
                  disabled={!conceptId || !question || options.filter(o => o.trim()).length < 2 || !explanation}
                  data-testid="button-save-question"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" onClick={() => setIsAdding(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {questions.length === 0 && !isAdding ? (
          <p className="text-muted-foreground text-center py-8">No questions yet.</p>
        ) : (
          <div className="space-y-2">
            {questions.map((q) => (
              <div key={q.id} className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium line-clamp-1">{q.question}</p>
                    <Badge variant="secondary" className="capitalize text-xs">{q.difficulty}</Badge>
                    <Badge className="text-xs">+{q.creditsReward}</Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(q.id)}
                  data-testid={`button-delete-question-${q.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
