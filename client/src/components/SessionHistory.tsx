import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronDown, Copy, CheckCircle2, History, Calendar } from "lucide-react";
import { toast } from "sonner";
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
      </div>

      {/* Session Cards List */}
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
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-800 transition-colors border border-slate-200/40 dark:border-slate-800/40">
                      <Calendar className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-50 group-hover:text-emerald-600 transition-colors">
                        {session.sessionName || `Audit Session #${session.id}`}
                      </div>
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
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-transform duration-300 ${
                      expandedSession === session.id ? "rotate-180 text-emerald-500" : ""
                    }`}
                  />
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="border-t border-slate-100 dark:border-slate-800 p-6 sm:p-7 bg-slate-50/20 dark:bg-slate-950/10">
                {sessionDetailsQuery.isLoading && expandedSession === session.id ? (
                  <div className="flex items-center justify-center py-12">
                    <Spinner className="h-7 w-7 text-emerald-500" />
                  </div>
                ) : sessionDetailsQuery.data && expandedSession === session.id ? (
                  <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm bg-white dark:bg-slate-950/30">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                        <TableRow className="border-slate-200/80 dark:border-slate-800/80 hover:bg-transparent">
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 min-w-[280px]">Guest Review</TableHead>
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 w-28">Sentiment</TableHead>
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 w-32">Theme Tag</TableHead>
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 min-w-[320px]">Suggested Management Reply</TableHead>
                          <TableHead className="w-16 text-center font-semibold text-slate-700 dark:text-slate-300 py-3.5">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessionDetailsQuery.data.reviews.map((review: ClassifiedReview, idx: number) => (
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
                                <span>{themeIcons[review.theme]}</span>
                                <span className="capitalize">{review.theme}</span>
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed py-4 pr-6 italic whitespace-pre-wrap">
                              "{review.suggestedResponse}"
                            </TableCell>
                            <TableCell className="text-center py-4">
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
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : null}
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  );
}
