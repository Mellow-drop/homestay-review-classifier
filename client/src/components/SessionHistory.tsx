import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronDown, Copy, CheckCircle2, History, Calendar, Edit2, Trash2, Download, Search, LayoutList, Wand2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const sentimentColors = {
  positive: "bg-emerald-50/80 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20",
  neutral: "bg-slate-50/80 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400 border border-slate-200/50 dark:border-slate-500/20",
  negative: "bg-rose-50/80 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/20",
};

const themeIcons = {
  food: "🍽️",
  host: "👤",
  location: "📍",
  cleanliness: "✨",
  value: "💰",
  experience: "⭐",
};

interface SessionBrief {
  id: number;
  sessionName: string;
  totalReviews: number;
  createdAt: string;
}

interface ClassifiedReview {
  id: number;
  originalReview: string;
  sentiment: "positive" | "neutral" | "negative";
  theme: "food" | "host" | "location" | "cleanliness" | "value" | "experience";
  suggestedResponse: string;
}

export default function SessionHistory() {
  const [expandedSession, setExpandedSession] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  
  // Premium Feature States
  const [viewMode, setViewMode] = useState<"sessions" | "all">("sessions");
  const [filterSentiment, setFilterSentiment] = useState<string>("all");
  const [filterTheme, setFilterTheme] = useState<string>("all");
  const [isDownloading, setIsDownloading] = useState<number | null>(null);

  // Advanced Feature States
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editSentiment, setEditSentiment] = useState<string>("");
  const [editTheme, setEditTheme] = useState<string>("");
  const [editResponse, setEditResponse] = useState<string>("");
  const [summaryData, setSummaryData] = useState<{ [key: number]: string }>({});
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<{ [key: number]: boolean }>({});

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/sessions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session deleted successfully");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number, name: string }) => {
      await axios.patch(`/api/sessions/${id}`, { sessionName: name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setEditingId(null);
      toast.success("Session renamed successfully");
    }
  });

  const updateReviewMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      await axios.patch(`/api/reviews/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessionDetails"] });
      queryClient.invalidateQueries({ queryKey: ["all-reviews-history"] });
      setEditingReviewId(null);
      toast.success("Review updated successfully");
    }
  });

  const sessionsQuery = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const response = await axios.get("/api/sessions");
      return response.data;
    },
  });

  const sessionDetailsQuery = useQuery({
    queryKey: ["sessionDetails", expandedSession],
    queryFn: async () => {
      const response = await axios.get(`/api/sessions/${expandedSession}`);
      return response.data;
    },
    enabled: expandedSession !== null,
  });

  const allReviewsQuery = useQuery({
    queryKey: ["all-reviews-history"],
    queryFn: async () => {
      const response = await axios.get("/api/reviews/search");
      return response.data;
    },
    enabled: viewMode === "all",
  });

  const handleDownloadCSV = async (session: SessionBrief) => {
    try {
      setIsDownloading(session.id);
      const response = await axios.get(`/api/sessions/${session.id}`);
      const reviews = response.data.reviews;
      
      let csvContent = "Review,Sentiment,Theme,Suggested Response\n";
      reviews.forEach((r: ClassifiedReview) => {
        // Escape quotes and wrap in quotes for CSV
        const safeReview = `"${r.originalReview.replace(/"/g, '""')}"`;
        const safeResponse = `"${r.suggestedResponse.replace(/"/g, '""')}"`;
        csvContent += `${safeReview},${r.sentiment},${r.theme},${safeResponse}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `session-${session.id}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV Downloaded successfully");
    } catch (error) {
      toast.error("Failed to download CSV");
    } finally {
      setIsDownloading(null);
    }
  };

  const handleGenerateSummary = async (sessionId: number) => {
    try {
      setIsGeneratingSummary(prev => ({ ...prev, [sessionId]: true }));
      const response = await axios.get(`/api/sessions/${sessionId}/summary`);
      setSummaryData(prev => ({ ...prev, [sessionId]: response.data.summary }));
      toast.success("Summary generated!");
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to generate summary");
    } finally {
      setIsGeneratingSummary(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  const handleCopyResponse = (sessionId: number, reviewId: number, response: string) => {
    navigator.clipboard.writeText(response);
    const key = `${sessionId}-${reviewId}`;
    setCopiedIndex(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (sessionsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="h-10 w-10 text-emerald-500" />
      </div>
    );
  }

  if (sessionsQuery.isError) {
    return (
      <Alert className="border-rose-500/30 bg-rose-500/5 text-rose-600 dark:text-rose-400">
        <AlertCircle className="h-5 w-5 text-rose-500" />
        <AlertDescription className="font-semibold">
          Failed to load session history: {sessionsQuery.error?.message}
        </AlertDescription>
      </Alert>
    );
  }

  const sessions: SessionBrief[] = sessionsQuery.data || [];

  if (sessions.length === 0) {
    return (
      <Card className="glass-card border shadow-sm max-w-2xl mx-auto text-center py-16 px-6">
        <CardContent className="space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500">
            <History className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">No Sessions Yet</CardTitle>
          <CardDescription className="text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Your historic audit classifications will appear here once you process feedback in the Classifier tab.
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <History className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight animate-fade-in">Audit Session Logs</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Browse through historical classification runs, review computed tags, and fetch suggested management replies.
            </p>
          </div>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl shrink-0">
          <Button 
            variant={viewMode === "sessions" ? "secondary" : "ghost"} 
            className={`h-9 px-4 rounded-lg text-sm font-semibold transition-all ${viewMode === "sessions" ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white" : "text-slate-500"}`}
            onClick={() => setViewMode("sessions")}
          >
            <History className="h-4 w-4 mr-2" /> By Session
          </Button>
          <Button 
            variant={viewMode === "all" ? "secondary" : "ghost"} 
            className={`h-9 px-4 rounded-lg text-sm font-semibold transition-all ${viewMode === "all" ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white" : "text-slate-500"}`}
            onClick={() => setViewMode("all")}
          >
            <LayoutList className="h-4 w-4 mr-2" /> All Reviews
          </Button>
        </div>
      </div>

      {viewMode === "sessions" ? (
      <div className="space-y-5">
        {sessions.map((session: SessionBrief) => (
          <Card key={session.id} className="glass-card border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden rounded-2xl">
            <Collapsible
              open={expandedSession === session.id}
              onOpenChange={(open) => setExpandedSession(open ? session.id : null)}
              className="w-full"
            >
              <CollapsibleTrigger asChild>
                <div className="p-6 sm:p-7 flex items-center justify-between w-full cursor-pointer group hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors duration-150">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-800 transition-colors border border-slate-200/40 dark:border-slate-800/40">
                      <Calendar className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      {editingId === session.id ? (
                        <div className="flex items-center gap-2 max-w-sm" onClick={(e) => e.stopPropagation()}>
                          <Input 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') updateMutation.mutate({ id: session.id, name: editName });
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <Button size="sm" onClick={() => updateMutation.mutate({ id: session.id, name: editName })}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <div className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-50 group-hover:text-emerald-600 transition-colors">
                          {session.sessionName || `Audit Session #${session.id}`}
                        </div>
                      )}
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex flex-wrap gap-2.5 items-center">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider uppercase border border-slate-200/40">
                          {session.totalReviews} reviews
                        </span>
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <span className="flex items-center gap-1">
                          {new Date(session.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {editingId !== session.id && (
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-emerald-600" onClick={() => { setEditingId(session.id); setEditName(session.sessionName); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600" onClick={() => handleDownloadCSV(session)} disabled={isDownloading === session.id}>
                      {isDownloading === session.id ? <Spinner className="h-4 w-4 text-blue-500" /> : <Download className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-rose-600" onClick={() => deleteMutation.mutate(session.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)} className="cursor-pointer">
                      <ChevronDown
                        className={`h-5 w-5 ml-2 text-slate-400 group-hover:text-slate-600 transition-transform duration-300 ${
                          expandedSession === session.id ? "rotate-180 text-emerald-500" : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="border-t border-slate-100 dark:border-slate-800 p-6 sm:p-7 bg-slate-50/20 dark:bg-slate-950/10">
                {sessionDetailsQuery.isLoading && expandedSession === session.id ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner className="h-7 w-7 text-emerald-500" />
                  </div>
                ) : sessionDetailsQuery.data && expandedSession === session.id ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                      <div>
                        <h4 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                          <Wand2 className="h-4 w-4" /> AI Executive Summary
                        </h4>
                        <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80 mt-1 max-w-2xl leading-relaxed">
                          {summaryData[session.id] 
                            ? summaryData[session.id]
                            : "Generate a 1-paragraph summary of these reviews using Google Gemini."}
                        </p>
                      </div>
                      {!summaryData[session.id] && (
                        <Button 
                          onClick={() => handleGenerateSummary(session.id)}
                          disabled={isGeneratingSummary[session.id]}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shrink-0"
                        >
                          {isGeneratingSummary[session.id] ? <Spinner className="h-4 w-4 mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                          Generate
                        </Button>
                      )}
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-950/30">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                        <TableRow className="border-slate-200/80 dark:border-slate-800/80 hover:bg-transparent">
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 min-w-[280px]">Guest Review</TableHead>
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 w-32">Sentiment</TableHead>
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 w-36">Theme Tag</TableHead>
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 min-w-[320px]">Suggested Management Reply</TableHead>
                          <TableHead className="w-24 text-center font-semibold text-slate-700 dark:text-slate-300 py-3.5">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessionDetailsQuery.data.reviews.map((review: ClassifiedReview, idx: number) => (
                          <TableRow key={idx} className="border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100/30 dark:hover:bg-slate-500/5 transition-colors duration-150">
                            <TableCell className="text-sm font-medium text-slate-800 dark:text-slate-200 py-4 pr-6 leading-relaxed whitespace-pre-wrap">
                              {review.originalReview}
                            </TableCell>
                            <TableCell className="py-4">
                              {editingReviewId === review.id ? (
                                <select 
                                  value={editSentiment} 
                                  onChange={(e) => setEditSentiment(e.target.value)}
                                  className="h-8 px-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-700 dark:text-slate-300"
                                >
                                  <option value="positive">Positive</option>
                                  <option value="neutral">Neutral</option>
                                  <option value="negative">Negative</option>
                                </select>
                              ) : (
                                <Badge className={`${sentimentColors[review.sentiment] || sentimentColors.neutral} font-bold capitalize px-2.5 py-0.5 rounded-full text-xs shadow-sm`}>
                                  {review.sentiment}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="py-4">
                              {editingReviewId === review.id ? (
                                <select 
                                  value={editTheme} 
                                  onChange={(e) => setEditTheme(e.target.value)}
                                  className="h-8 px-2 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-700 dark:text-slate-300"
                                >
                                  <option value="food">Food</option>
                                  <option value="host">Host</option>
                                  <option value="location">Location</option>
                                  <option value="cleanliness">Cleanliness</option>
                                  <option value="value">Value</option>
                                  <option value="experience">Experience</option>
                                </select>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/40 dark:border-slate-700/40 shadow-sm">
                                  <span>{themeIcons[review.theme as keyof typeof themeIcons]}</span>
                                  <span className="capitalize">{review.theme}</span>
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="py-4 pr-6">
                              {editingReviewId === review.id ? (
                                <textarea 
                                  value={editResponse}
                                  onChange={(e) => setEditResponse(e.target.value)}
                                  className="w-full min-h-[60px] p-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none text-slate-700 dark:text-slate-300 resize-y"
                                />
                              ) : (
                                <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic whitespace-pre-wrap">
                                  "{review.suggestedResponse}"
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center py-4">
                              <div className="flex items-center justify-center gap-1">
                                {editingReviewId === review.id ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => updateReviewMutation.mutate({ 
                                        id: review.id, 
                                        data: { sentiment: editSentiment, theme: editTheme, suggestedResponse: editResponse } 
                                      })}
                                      className="h-8 w-8 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                                      title="Save"
                                    >
                                      {updateReviewMutation.isPending ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setEditingReviewId(null)}
                                      className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                      title="Cancel"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setEditingReviewId(review.id);
                                        setEditSentiment(review.sentiment);
                                        setEditTheme(review.theme);
                                        setEditResponse(review.suggestedResponse);
                                      }}
                                      className="h-8 w-8 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                      title="Edit review"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        handleCopyResponse(
                                          session.id,
                                          review.id,
                                          review.suggestedResponse
                                        )
                                      }
                                      className="h-8 w-8 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-slate-100"
                                      title="Copy response"
                                    >
                                      {copiedIndex === `${session.id}-${review.id}` ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  </div>
                ) : null}
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm items-center">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-slate-400" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Filters:</span>
            </div>
            <select 
              value={filterSentiment} 
              onChange={(e) => setFilterSentiment(e.target.value)}
              className="h-9 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
            <select 
              value={filterTheme} 
              onChange={(e) => setFilterTheme(e.target.value)}
              className="h-9 px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="all">All Themes</option>
              <option value="food">Food</option>
              <option value="host">Host</option>
              <option value="location">Location</option>
              <option value="cleanliness">Cleanliness</option>
              <option value="value">Value</option>
              <option value="experience">Experience</option>
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-950/30">
            {allReviewsQuery.isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Spinner className="h-8 w-8 text-emerald-500" />
              </div>
            ) : allReviewsQuery.isError ? (
              <div className="py-20 text-center text-rose-500 text-sm font-medium">Failed to load reviews</div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                  <TableRow className="border-slate-200/80 dark:border-slate-800/80 hover:bg-transparent">
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 min-w-[280px]">Guest Review</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 w-28">Sentiment</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 w-32">Theme Tag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allReviewsQuery.data
                    ?.filter((r: any) => filterSentiment === "all" || r.sentiment === filterSentiment)
                    .filter((r: any) => filterTheme === "all" || r.theme === filterTheme)
                    .map((review: ClassifiedReview, idx: number) => (
                    <TableRow key={idx} className="border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100/30 dark:hover:bg-slate-500/5 transition-colors duration-150">
                      <TableCell className="text-sm font-medium text-slate-800 dark:text-slate-200 py-4 pr-6 leading-relaxed whitespace-pre-wrap">
                        {review.originalReview}
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge className={`${sentimentColors[review.sentiment] || sentimentColors.neutral} font-bold capitalize px-2.5 py-0.5 rounded-full text-xs shadow-sm`}>
                          {review.sentiment}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/40 dark:border-slate-700/40 shadow-sm">
                          <span>{themeIcons[review.theme as keyof typeof themeIcons]}</span>
                          <span className="capitalize">{review.theme}</span>
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {allReviewsQuery.data?.filter((r: any) => filterSentiment === "all" || r.sentiment === filterSentiment)
                    .filter((r: any) => filterTheme === "all" || r.theme === filterTheme).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-10 text-slate-500 font-medium">
                        No reviews match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
