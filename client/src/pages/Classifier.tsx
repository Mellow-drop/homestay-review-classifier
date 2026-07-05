import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button, Modal, Toast, Loader } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Download, AlertCircle, CheckCircle2, History, ChevronUp, ChevronDown, ListFilter, ArrowLeft, TreePine, AlertTriangle, Plus, X } from "lucide-react";
import { Link } from "wouter";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TestReport from "@/components/TestReport";
import SessionHistory from "@/components/SessionHistory";

type ClassificationResult = {
  originalReview: string;
  sentiment: "positive" | "neutral" | "negative";
  theme: string;
  suggestedResponse: string;
  urgencyLevel?: string;
  needsEscalation?: boolean;
};

type ReviewProgress = {
  index: number;
  review: string;
  status: "pending" | "processing" | "completed" | "error";
  result?: ClassificationResult;
  error?: string;
};

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

const PRESETS = [
  {
    label: "👤 Welcoming Host",
    text: "The host was incredibly welcoming and made us feel right at home. Amazing experience!",
    session: "Demo - Welcoming Host",
    brandVoice: "Warm and inviting, like a family-run bed and breakfast."
  },
  {
    label: "🍽️ Delicious Food",
    text: "The breakfast was delicious with fresh local ingredients. Highly recommend!",
    session: "Demo - Fresh Breakfast",
    brandVoice: "Enthusiastic and proud, like a passionate local chef."
  },
  {
    label: "✨ Dirty Room/Bathroom",
    text: "The bathroom was dirty and the room smelled bad. Very disappointed.",
    session: "Demo - Cleanliness Issues",
    brandVoice: "Deeply apologetic and professional, ensuring strict quality control."
  },
  {
    label: "📍 Noisy Location",
    text: "Located in a noisy area far from attractions. Very inconvenient location.",
    session: "Demo - Location Issues",
    brandVoice: "Empathetic and practical, offering solutions for future stays."
  }
];

export default function Classifier() {
  const { theme, toggleTheme } = useTheme();
  const [reviewInput, setReviewInput] = useState("");
  const [results, setResults] = useState<ClassificationResult[]>([]);
  const [reviewProgress, setReviewProgress] = useState<ReviewProgress[]>([]);
  const [sortColumn, setSortColumn] = useState<keyof ClassificationResult | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sessionName, setSessionName] = useState("");
  const [brandVoice, setBrandVoice] = useState("Professional and polite hospitality tone");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [savedVoices, setSavedVoices] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('savedBrandVoices');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('savedBrandVoices', JSON.stringify(savedVoices));
  }, [savedVoices]);

  const handleSaveVoice = () => {
    if (brandVoice.trim() && !savedVoices.includes(brandVoice)) {
      setSavedVoices(prev => [...prev, brandVoice]);
      Toast.success("Brand voice saved");
    }
  };

  const handleRemoveVoice = (index: number) => {
    setSavedVoices(prev => prev.filter((_, i) => i !== index));
  };
  
  const queryClient = useQueryClient();

  const classifyMutation = useMutation({
    mutationFn: async (variables: { reviews: string[]; sessionName?: string; brandVoice?: string }) => {
      const response = await axios.post("/api/classify", variables);
      return response.data;
    },
    onSuccess: (data) => {
      setResults(data.classifications);
      setReviewInput("");
      setIsProcessing(false);
      
      // Update progress tracking
      const updatedProgress = reviewProgress.map((item, idx) => ({
        ...item,
        status: (data.classifications[idx] ? "completed" : "error") as "completed" | "error",
        result: data.classifications[idx],
      }));
      setReviewProgress(updatedProgress);

      // Invalidate sessions list in cache to trigger real-time refresh of History tab
      queryClient.invalidateQueries({ queryKey: ["sessions"] });

      if (data.errorCount > 0) {
        Toast.warning(`Classified ${data.successCount} reviews with ${data.errorCount} errors`);
      } else {
        Toast.success(`Successfully classified ${data.successCount} reviews`);
      }
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.detail || error.message || "An error occurred";
      Toast.error(`Classification failed: ${errMsg}`);
      setIsProcessing(false);
      
      const updatedProgress = reviewProgress.map((item) => ({
        ...item,
        status: "error" as const,
        error: errMsg,
      })) as ReviewProgress[];
      setReviewProgress(updatedProgress);
    },
  });

  const handleClassify = async () => {
    const reviews = reviewInput
      .split("\n")
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    if (reviews.length === 0) {
      Toast.error("Please enter at least one review");
      return;
    }

    const initialProgress: ReviewProgress[] = reviews.map((review, index) => ({
      index,
      review,
      status: "pending",
    }));
    setReviewProgress(initialProgress);
    setIsProcessing(true);
    setIsInputExpanded(false);

    setTimeout(() => {
      setReviewProgress((prev) =>
        prev.map((item) => ({
          ...item,
          status: item.status === "pending" ? "processing" : item.status,
        }))
      );
    }, 400);

    classifyMutation.mutate({
      reviews,
      sessionName: sessionName || undefined,
      brandVoice: brandVoice || undefined,
    });
  };

  const handleCopyResponse = (index: number, response: string) => {
    navigator.clipboard.writeText(response);
    setCopiedIndex(index);
    Toast.success("Copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setReviewInput(preset.text);
    setSessionName(preset.session);
    setBrandVoice(preset.brandVoice);
    Toast.info(`Filled with preset review: ${preset.label}`);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleExportCSV = () => {
    if (results.length === 0) {
      Toast.error("No results to export");
      return;
    }

    const headers = ["Review", "Sentiment", "Theme", "Suggested Response", "Urgency", "Escalate"];
    const rows = results.map((r) => [
      `"${r.originalReview.replace(/"/g, '""')}"`,
      r.sentiment,
      `"${(r.theme || "").replace(/"/g, '""')}"`,
      `"${r.suggestedResponse.replace(/"/g, '""')}"`,
      r.urgencyLevel || "",
      r.needsEscalation || false,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${sessionName || 'classification'}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Toast.success("CSV exported successfully");
  };

  const sortedResults = [...results].sort((a, b) => {
    if (!sortColumn) return 0;

    const aVal = a[sortColumn];
    const bVal = b[sortColumn];

    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    return 0;
  });

  const handleSort = (column: keyof ClassificationResult) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("asc");
    }
  };

  const progressStats = {
    total: reviewProgress.length,
    completed: reviewProgress.filter((p) => p.status === "completed").length,
    processing: reviewProgress.filter((p) => p.status === "processing").length,
    pending: reviewProgress.filter((p) => p.status === "pending").length,
    error: reviewProgress.filter((p) => p.status === "error").length,
  };

  const renderInputForm = () => (
    <CardContent className="space-y-5 px-4 sm:px-6 pb-24 sm:pb-6 pt-6">
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Audit session name</label>
        <input
          type="text"
          placeholder="e.g., June 2026 Audit Run"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800/85 bg-white dark:bg-slate-950/40 px-4 py-2.5 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:border-slate-400 dark:focus:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300/30 text-slate-900 dark:text-white"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Custom Brand Voice (Optional)</label>
        <div className="relative">
          <input
            type="text"
            placeholder="e.g., Formal luxury resort, or laid-back surfer hostel"
            value={brandVoice}
            onChange={(e) => setBrandVoice(e.target.value)}
            className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800/85 bg-white dark:bg-slate-950/40 px-4 py-2.5 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:border-slate-400 dark:focus:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300/30 text-slate-900 dark:text-white"
          />
          <button 
            type="button"
            onClick={handleSaveVoice}
            className="absolute right-2 top-2 p-1 text-slate-400 hover:text-emerald-500 transition-colors bg-white dark:bg-slate-950/40 rounded-lg"
            title="Save this brand voice"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {savedVoices.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {savedVoices.map((voice, idx) => (
              <div key={idx} className="group flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
                <span onClick={() => setBrandVoice(voice)} className="truncate max-w-[200px]" title={voice}>
                  {voice}
                </span>
                <X className="h-3 w-3 opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-opacity" onClick={(e) => { e.stopPropagation(); handleRemoveVoice(idx); }} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Guest Reviews</label>
        <Textarea
          ref={textareaRef}
          placeholder="Paste one review per line, for example:&#10;The breakfast was amazing! Highly recommend.&#10;The bathroom was dirty and the room smelled bad."
          value={reviewInput}
          onChange={(e) => setReviewInput(e.target.value)}
          className="min-h-48 resize-none rounded-xl border border-slate-200/80 dark:border-slate-800/85 bg-white dark:bg-slate-950/40 p-4 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:border-slate-400 dark:focus:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300/30 text-slate-900 dark:text-white"
        />
      </div>

      {/* Preset review prompts */}
      <div className="space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick preset templates</div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset, i) => (
            <button
              key={i}
              type="button"
              onClick={() => applyPreset(preset)}
              className="px-3 sm:px-2.5 py-2 sm:py-1.5 text-xs font-bold rounded-lg bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/40 dark:border-slate-700/40 transition-colors duration-150 active:scale-95"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-800/50 sm:relative sm:p-0 sm:bg-transparent sm:backdrop-blur-none sm:border-0 z-40 flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          onClick={handleClassify}
          disabled={isProcessing || reviewInput.trim().length === 0}
          className="flex-1 h-12 sm:h-11 px-5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold shadow-sm rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-98"
        >
          {isProcessing && <Loader variant="spinner" size="sm" className="p-0 mr-1 inline-flex" />}
          {results.length > 0 ? "Re-Classify Reviews" : "Classify Reviews"}
        </Button>
        {results.length > 0 && (
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="h-11 px-5 border-slate-200/80 dark:border-slate-800 rounded-xl hover:bg-slate-50 text-slate-700 dark:text-slate-300"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>
    </CardContent>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Tabs defaultValue="classifier" className="w-full">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-50 glass-header">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between py-3 gap-4 border-b border-transparent">
              <div className="flex items-center gap-3">
                <Link href="/">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-500 dark:text-slate-400">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-sm border border-slate-800">
                    <TreePine className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                      SentiNest
                    </h1>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Trishul Eco-Homestays Sentiment Center</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-3 flex-1 md:flex-none">
                <TabsList className="bg-slate-100 dark:bg-slate-800/40 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/20">
                  <TabsTrigger value="classifier" className="text-xs sm:text-sm px-3 py-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
                    Classifier
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-xs sm:text-sm px-3 py-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
                    <History className="mr-1.5 h-3.5 w-3.5 inline" />
                    History logs
                  </TabsTrigger>
                  <TabsTrigger value="test" className="text-xs sm:text-sm px-3 py-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm">
                    Verifier
                  </TabsTrigger>
                </TabsList>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInfoOpen(true)}
                  className="h-9 px-3 rounded-xl border-slate-200/80 dark:border-slate-800 text-slate-750 dark:text-slate-300 font-bold"
                >
                  Model Info
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Content 1: Classifier */}
        <TabsContent value="classifier" className="mx-auto max-w-7xl px-0 sm:px-6 lg:px-8 py-4 sm:py-8 focus-visible:outline-none">
          {results.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Header Actions / Collapsible Input Card */}
              <Card className="glass-card border shadow-sm transition-all duration-200 border-x-0 sm:border-x rounded-none sm:rounded-xl">
                <CardContent className="py-4 px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Audit Session</div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200/50 dark:border-slate-700/30">
                        {sessionName || "Draft Audit Session"}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {results.length} review{results.length > 1 ? "s" : ""} classified
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      onClick={() => {
                        setResults([]);
                        setReviewInput("");
                        setReviewProgress([]);
                        setSessionName("");
                        setIsInputExpanded(false);
                      }}
                      variant="ghost"
                      className="h-9 px-3 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-semibold"
                    >
                      Clear & Start Over
                    </Button>
                    <Button
                      onClick={() => setIsInputExpanded(!isInputExpanded)}
                      variant="outline"
                      className="h-9 px-4 text-xs border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                    >
                      {isInputExpanded ? "Hide Panel" : "Edit / New Audit"}
                    </Button>
                    <Button
                      onClick={handleExportCSV}
                      className="h-9 px-4 text-xs bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold shadow-sm rounded-lg"
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Export CSV
                    </Button>
                  </div>
                </CardContent>
                
                {/* Expanded Input Section */}
                {isInputExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="max-w-3xl space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Audit session name</label>
                        <input
                          type="text"
                          placeholder="e.g., June 2026 Audit Run"
                          value={sessionName}
                          onChange={(e) => setSessionName(e.target.value)}
                          className="w-full max-w-md rounded-xl border border-slate-200/80 dark:border-slate-800/85 bg-white dark:bg-slate-950/40 px-4 py-2.5 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:border-slate-400 dark:focus:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300/30 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Custom Brand Voice (Optional)</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="e.g., Formal luxury resort, or laid-back surfer hostel"
                            value={brandVoice}
                            onChange={(e) => setBrandVoice(e.target.value)}
                            className="w-full rounded-xl border border-slate-200/80 dark:border-slate-800/85 bg-white dark:bg-slate-950/40 px-4 py-2.5 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:border-slate-400 dark:focus:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300/30 text-slate-900 dark:text-white"
                          />
                          <button 
                            type="button"
                            onClick={handleSaveVoice}
                            className="absolute right-2 top-2 p-1 text-slate-400 hover:text-emerald-500 transition-colors bg-white dark:bg-slate-950/40 rounded-lg"
                            title="Save this brand voice"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        {savedVoices.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {savedVoices.map((voice, idx) => (
                              <div key={idx} className="group flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
                                <span onClick={() => setBrandVoice(voice)} className="truncate max-w-[200px]" title={voice}>
                                  {voice}
                                </span>
                                <X className="h-3 w-3 opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-opacity" onClick={(e) => { e.stopPropagation(); handleRemoveVoice(idx); }} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Guest Reviews</label>
                        <Textarea
                          ref={textareaRef}
                          placeholder="Paste one review per line, for example:&#10;The breakfast was amazing! Highly recommend.&#10;The bathroom was dirty and the room smelled bad."
                          value={reviewInput}
                          onChange={(e) => setReviewInput(e.target.value)}
                          className="min-h-48 resize-none rounded-xl border border-slate-200/80 dark:border-slate-800/85 bg-white dark:bg-slate-950/40 p-4 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:border-slate-400 dark:focus:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-300/30 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Quick preset templates</div>
                        <div className="flex flex-wrap gap-2">
                          {PRESETS.map((preset, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => applyPreset(preset)}
                              className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/40 dark:border-slate-700/40 transition-colors duration-150 active:scale-95"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button
                          onClick={handleClassify}
                          disabled={isProcessing || reviewInput.trim().length === 0}
                          className="w-full sm:w-auto h-12 sm:h-11 px-6 bg-slate-900 hover:bg-slate-800 dark:bg-slate-50 dark:hover:bg-slate-200 text-white dark:text-slate-950 font-bold shadow-sm rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-98"
                        >
                          {isProcessing && <Loader variant="spinner" size="sm" className="p-0 mr-1 inline-flex" />}
                          Re-Classify Reviews
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* Progress Section (shown if re-running) */}
              {reviewProgress.length > 0 && isProcessing && (
                <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Analysis pipeline status</h3>
                    <Badge variant="outline" className="animate-pulse bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-full text-xs">
                      Running Batch
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-950/40 p-2.5 border border-slate-100 dark:border-slate-800/40">
                      <div className="text-lg font-black text-slate-900 dark:text-slate-50">{progressStats.completed}</div>
                      <div className="text-[10px] font-medium text-slate-500">Done</div>
                    </div>
                    <div className="rounded-xl bg-blue-50/80 dark:bg-blue-500/10 p-2.5 border border-blue-100 dark:border-blue-500/15">
                      <div className="text-lg font-black text-blue-600 dark:text-blue-400">{progressStats.processing}</div>
                      <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Processing</div>
                    </div>
                    <div className="rounded-xl bg-amber-50/80 dark:bg-amber-500/10 p-2.5 border border-amber-100 dark:border-amber-500/15">
                      <div className="text-lg font-black text-amber-600 dark:text-amber-400">{progressStats.pending}</div>
                      <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Pending</div>
                    </div>
                    <div className="rounded-xl bg-rose-50/80 dark:bg-rose-500/10 p-2.5 border border-rose-100 dark:border-rose-500/15">
                      <div className="text-lg font-black text-rose-600 dark:text-rose-400 animate-pulse">{progressStats.error}</div>
                      <div className="text-[10px] font-medium text-slate-400">Errors</div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Classification Output Card */}
              <Card className="glass-card border shadow-sm border-x-0 sm:border-x rounded-none sm:rounded-xl">
                <CardHeader className="pb-4 px-4 sm:px-6">
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                    Classification Output
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                    <Table>
                      <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                        <TableRow className="border-slate-200/80 dark:border-slate-800/80 hover:bg-transparent">
                          <TableHead
                            onClick={() => handleSort("originalReview")}
                            className="cursor-pointer font-semibold text-slate-700 dark:text-slate-300 py-3.5 hover:text-slate-900 dark:hover:text-white min-w-[280px]"
                          >
                            Review {sortColumn === "originalReview" && (sortOrder === "asc" ? <ChevronUp className="inline h-3.5 w-3.5 ml-1 text-slate-800 dark:text-white" /> : <ChevronDown className="inline h-3.5 w-3.5 ml-1 text-slate-800 dark:text-white" />)}
                          </TableHead>
                          <TableHead
                            onClick={() => handleSort("sentiment")}
                            className="cursor-pointer font-semibold text-center text-slate-700 dark:text-slate-300 py-3.5 w-28 hover:text-slate-900 dark:hover:text-white"
                          >
                            Sentiment {sortColumn === "sentiment" && (sortOrder === "asc" ? <ChevronUp className="inline h-3.5 w-3.5 ml-1 text-slate-800 dark:text-white" /> : <ChevronDown className="inline h-3.5 w-3.5 ml-1 text-slate-800 dark:text-white" />)}
                          </TableHead>
                          <TableHead
                            onClick={() => handleSort("theme")}
                            className="cursor-pointer font-semibold text-center text-slate-700 dark:text-slate-300 py-3.5 w-32 hover:text-slate-900 dark:hover:text-white"
                          >
                            Theme {sortColumn === "theme" && (sortOrder === "asc" ? <ChevronUp className="inline h-3.5 w-3.5 ml-1 text-slate-800 dark:text-white" /> : <ChevronDown className="inline h-3.5 w-3.5 ml-1 text-slate-800 dark:text-white" />)}
                          </TableHead>
                          <TableHead className="font-semibold text-center text-slate-700 dark:text-slate-300 py-3.5 w-24">Urgency</TableHead>
                          <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3.5 min-w-[320px]">Suggested Reply</TableHead>
                          <TableHead className="w-16 text-center font-semibold text-slate-700 dark:text-slate-300 py-3.5">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedResults.map((result, index) => (
                          <TableRow key={index} className="border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-100/30 dark:hover:bg-slate-500/5 transition-colors duration-150">
                            <TableCell className="text-sm font-medium text-slate-800 dark:text-slate-200 py-4 pr-6 leading-relaxed whitespace-pre-wrap">
                              {result.originalReview}
                            </TableCell>
                            <TableCell className="py-4 text-center">
                              <Badge className={`${sentimentColors[result.sentiment]} font-bold capitalize px-2.5 py-0.5 rounded-full text-xs shadow-sm`}>
                                {result.sentiment}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-4 text-center">
                              <div className="flex flex-wrap items-center justify-center gap-2">
                                {(result.theme || 'experience').split(',').map((t) => {
                                  const themeName = t.trim();
                                  return (
                                    <span key={themeName} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200/40 dark:border-slate-700/40 shadow-sm">
                                      <span>{themeIcons[themeName] || themeIcons['experience']}</span>
                                      <span className="capitalize">{themeName}</span>
                                    </span>
                                  );
                                })}
                              </div>
                            </TableCell>
                            <TableCell className="py-4 text-center">
                              {result.urgencyLevel && (
                                <div className="flex flex-col gap-1 items-center">
                                  <Badge className={`${
                                    result.urgencyLevel === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30' :
                                    result.urgencyLevel === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30' :
                                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                  } font-bold capitalize px-2.5 py-0.5 rounded-full text-xs shadow-sm`}>
                                    {result.urgencyLevel}
                                  </Badge>
                                  {result.needsEscalation && (
                                    <span className="flex items-center text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Escalate
                                    </span>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed py-4 pr-6 italic whitespace-pre-wrap">
                              "{result.suggestedResponse}"
                            </TableCell>
                            <TableCell className="text-center py-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopyResponse(index, result.suggestedResponse)}
                                className="h-8 w-8 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-slate-100"
                                title="Copy response"
                              >
                                {copiedIndex === index ? (
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
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-12 items-start">
              
              {/* Input Section */}
              <div className="lg:col-span-5 space-y-4 sm:space-y-6">
                <Card className="glass-card border shadow-sm border-x-0 sm:border-x rounded-none sm:rounded-xl pb-2 sm:pb-0">
                  <CardHeader className="space-y-1.5 pb-4 px-4 sm:px-6 pt-6">
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                      New Classification Audit
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                      Paste guest comments (one per line) to categorize sentiment and extract themes.
                    </CardDescription>
                  </CardHeader>
                  {renderInputForm()}
                </Card>

                {/* Progress Section */}
                {reviewProgress.length > 0 && isProcessing && (
                  <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-5 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Analysis pipeline status</h3>
                      <Badge variant="outline" className="animate-pulse bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold px-2 py-0.5 rounded-full text-xs">
                        Running Batch
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-950/40 p-2.5 border border-slate-100 dark:border-slate-800/40">
                        <div className="text-lg font-black text-slate-900 dark:text-slate-50">{progressStats.completed}</div>
                        <div className="text-[10px] font-medium text-slate-500">Done</div>
                      </div>
                      <div className="rounded-xl bg-blue-50/80 dark:bg-blue-500/10 p-2.5 border border-blue-100 dark:border-blue-500/15">
                        <div className="text-lg font-black text-blue-600 dark:text-blue-400">{progressStats.processing}</div>
                        <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400">Processing</div>
                      </div>
                      <div className="rounded-xl bg-amber-50/80 dark:bg-amber-500/10 p-2.5 border border-amber-100 dark:border-amber-500/15">
                        <div className="text-lg font-black text-amber-600 dark:text-amber-400">{progressStats.pending}</div>
                        <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Pending</div>
                      </div>
                      <div className="rounded-xl bg-rose-50/80 dark:bg-rose-500/10 p-2.5 border border-rose-100 dark:border-rose-500/15">
                        <div className="text-lg font-black text-rose-600 dark:text-rose-400 animate-pulse">{progressStats.error}</div>
                        <div className="text-[10px] font-medium text-slate-400">Errors</div>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {reviewProgress.map((item) => (
                        <div key={item.index} className="flex items-center gap-2 rounded-lg bg-slate-50/50 dark:bg-slate-950/20 p-2 border border-slate-100 dark:border-slate-800/40 text-xs">
                          <div className="flex-shrink-0">
                            {item.status === "completed" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                            {item.status === "processing" && <Loader variant="spinner" size="sm" className="p-0 inline-flex text-blue-500" />}
                            {item.status === "pending" && <div className="h-4 w-4 rounded-full border border-amber-300 bg-amber-500/5" />}
                            {item.status === "error" && <AlertCircle className="h-4 w-4 text-rose-500" />}
                          </div>
                          <p className="flex-1 truncate font-medium text-slate-800 dark:text-slate-200">{item.review}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              {/* Results Section */}
              <div className="lg:col-span-7 h-full">
                {isProcessing ? (
                  <Card className="glass-card border shadow-sm p-8 h-full flex flex-col justify-center space-y-6 min-h-[300px]">
                    <div className="space-y-2">
                      <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Analyzing reviews...</CardTitle>
                      <CardDescription className="text-sm text-slate-500">Gemini is processing the audit batch</CardDescription>
                    </div>
                    <Loader variant="skeleton" count={4} />
                  </Card>
                ) : (
                  <Card className="glass-card border shadow-sm text-center py-20 px-6 h-full flex flex-col justify-center items-center space-y-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-800/60">
                      <ListFilter className="h-7 w-7 text-slate-400 dark:text-slate-500 animate-pulse" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">Awaiting Audits</CardTitle>
                    <CardDescription className="text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                      Input reviews on the left or select a preset template, and click "Classify Reviews" to run the classification model.
                    </CardDescription>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Error Message Alert */}
          {classifyMutation.isError && (
            <Alert className="mt-8 border-rose-500/30 bg-rose-500/5 text-rose-600 dark:text-rose-400 max-w-7xl mx-auto rounded-2xl">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              <AlertDescription className="font-semibold text-sm">
                {classifyMutation.error?.message || "An error occurred during classification"}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Tab Content 2: History logs */}
        <TabsContent value="history" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 focus-visible:outline-none">
          <SessionHistory />
        </TabsContent>

        {/* Tab Content 3: Accuracy Verifier */}
        <TabsContent value="test" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 focus-visible:outline-none">
          <TestReport />
        </TabsContent>
      </Tabs>

      <Modal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} title="Gemini AI Model Details">
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300">
            SentiNest leverages the Google Gemini model to perform automated, high-accuracy multi-class sentiment analysis and theme tag extraction.
          </p>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">Supported Sentiments:</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Positive, Neutral, Negative</p>
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 dark:text-slate-200">Supported Themes:</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Cleanliness, Host, Food, Location, Value, Experience</p>
          </div>
          <div className="pt-2">
            <Button onClick={() => setIsInfoOpen(false)} className="w-full">
              Got it
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
