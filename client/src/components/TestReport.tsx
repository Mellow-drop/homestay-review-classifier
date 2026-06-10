import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Sparkles, CheckSquare, Award, XCircle, BarChart3, Activity, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";

type TestReview = {
  review: string;
  expectedSentiment: "positive" | "neutral" | "negative";
  expectedTheme: "food" | "host" | "location" | "cleanliness" | "value" | "experience";
};

const testReviews: TestReview[] = [
  {
    review: "The host was incredibly welcoming and made us feel right at home. Amazing experience!",
    expectedSentiment: "positive",
    expectedTheme: "host",
  },
  {
    review: "The breakfast was delicious with fresh local ingredients. Highly recommend!",
    expectedSentiment: "positive",
    expectedTheme: "food",
  },
  {
    review: "Beautiful location with stunning views of the mountains. Perfect for nature lovers.",
    expectedSentiment: "positive",
    expectedTheme: "location",
  },
  {
    review: "The rooms were spotless and well-maintained. Very clean and tidy.",
    expectedSentiment: "positive",
    expectedTheme: "cleanliness",
  },
  {
    review: "Great value for money. Excellent amenities at a reasonable price.",
    expectedSentiment: "positive",
    expectedTheme: "value",
  },
  {
    review: "Unforgettable experience with wonderful hosts and activities. Will definitely return!",
    expectedSentiment: "positive",
    expectedTheme: "experience",
  },
  {
    review: "The room was okay but nothing special. Average accommodations.",
    expectedSentiment: "neutral",
    expectedTheme: "experience",
  },
  {
    review: "The food was adequate. Some dishes were good, others were just average.",
    expectedSentiment: "neutral",
    expectedTheme: "food",
  },
  {
    review: "The location is decent. Not far from town but not particularly scenic either.",
    expectedSentiment: "neutral",
    expectedTheme: "location",
  },
  {
    review: "The host was friendly enough. Standard hospitality, nothing extraordinary.",
    expectedSentiment: "neutral",
    expectedTheme: "host",
  },
  {
    review: "The price is reasonable for what you get. Fair value.",
    expectedSentiment: "neutral",
    expectedTheme: "value",
  },
  {
    review: "It was an okay stay. Some good moments, some not so good.",
    expectedSentiment: "neutral",
    expectedTheme: "experience",
  },
  {
    review: "The bathroom was dirty and the room smelled bad. Very disappointed.",
    expectedSentiment: "negative",
    expectedTheme: "cleanliness",
  },
  {
    review: "The food was cold and tasteless. Terrible dining experience.",
    expectedSentiment: "negative",
    expectedTheme: "food",
  },
  {
    review: "The host was rude and unhelpful. Made our stay very uncomfortable.",
    expectedSentiment: "negative",
    expectedTheme: "host",
  },
  {
    review: "Located in a noisy area far from attractions. Very inconvenient location.",
    expectedSentiment: "negative",
    expectedTheme: "location",
  },
  {
    review: "Way too expensive for what you get. Terrible value for money.",
    expectedSentiment: "negative",
    expectedTheme: "value",
  },
  {
    review: "Worst stay ever. Everything was wrong from check-in to check-out.",
    expectedSentiment: "negative",
    expectedTheme: "experience",
  },
  {
    review: "The host went above and beyond to make our stay special. Exceptional service!",
    expectedSentiment: "positive",
    expectedTheme: "host",
  },
  {
    review: "Disappointed with the overall experience. Did not meet expectations.",
    expectedSentiment: "negative",
    expectedTheme: "experience",
  },
];

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

export default function TestReport() {
  const [testResults, setTestResults] = useState<
    Array<{
      review: string;
      expectedSentiment: string;
      expectedTheme: string;
      actualSentiment?: string;
      actualTheme?: string;
      actualResponse?: string;
      sentimentMatch?: boolean;
      themeMatch?: boolean;
    }>
  >([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyResponse = (index: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Suggested response copied");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const [isRunning, setIsRunning] = useState(false);

  const classifyMutation = useMutation({
    mutationFn: async (variables: { reviews: string[]; sessionName?: string }) => {
      const response = await axios.post("/api/classify", variables);
      return response.data;
    },
    onSuccess: (data) => {
      const results = testReviews.map((testReview, index) => {
        const classification = data.classifications[index];
        return {
          review: testReview.review,
          expectedSentiment: testReview.expectedSentiment,
          expectedTheme: testReview.expectedTheme,
          actualSentiment: classification?.sentiment,
          actualTheme: classification?.theme,
          actualResponse: classification?.suggestedResponse,
          sentimentMatch: classification?.sentiment === testReview.expectedSentiment,
          themeMatch: classification?.theme === testReview.expectedTheme,
        };
      });

      setTestResults(results);
      setIsRunning(false);

      const sentimentAccuracy =
        (results.filter((r) => r.sentimentMatch).length / results.length) * 100;
      const themeAccuracy = (results.filter((r) => r.themeMatch).length / results.length) * 100;

      toast.success(
        `Test complete! Sentiment: ${sentimentAccuracy.toFixed(0)}%, Theme: ${themeAccuracy.toFixed(0)}%`
      );
    },
    onError: (error: any) => {
      const errMsg = error.response?.data?.detail || error.message || "An error occurred";
      toast.error(`Test failed: ${errMsg}`);
      setIsRunning(false);
    },
  });

  const handleRunTests = async () => {
    setIsRunning(true);
    classifyMutation.mutate({
      reviews: testReviews.map((r) => r.review),
      sessionName: `Verification Test Run - ${new Date().toLocaleString()}`,
    });
  };

  const sentimentAccuracy =
    testResults.length > 0
      ? (testResults.filter((r) => r.sentimentMatch).length / testResults.length) * 100
      : 0;
  const themeAccuracy =
    testResults.length > 0
      ? (testResults.filter((r) => r.themeMatch).length / testResults.length) * 100
      : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 gap-4 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Classifier Verification Suite</h2>
            <p className="text-sm text-slate-500 font-medium">
              Run local classification accuracy evaluations using a baseline set of 20 simulated eco-homestay reviews.
            </p>
          </div>
        </div>
      </div>

      {/* Action Card */}
      <Card className="glass-card border shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="py-5 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">System Accuracy Evaluation</div>
            <div className="text-sm font-semibold text-slate-700">
              Validate classifier performance against standard response sheet entries.
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {testResults.length > 0 && (
              <Button
                onClick={() => {
                  setTestResults([]);
                }}
                variant="ghost"
                className="h-9 px-3.5 text-xs text-rose-600 hover:bg-rose-50 font-bold rounded-lg transition-colors duration-150"
              >
                Clear Results
              </Button>
            )}
            <Button
              onClick={handleRunTests}
              disabled={isRunning || classifyMutation.isPending}
              className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-sm rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-2"
            >
              {isRunning && <Spinner className="h-3.5 w-3.5 text-white" />}
              {isRunning ? "Evaluating System..." : "Run Test Suite"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Baseline Dataset Preview Card (if tests not run yet) */}
      {testResults.length === 0 && (
        <Card className="glass-card border shadow-sm rounded-2xl">
          <CardHeader className="pb-4 border-b border-slate-100/80">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-indigo-500" />
              <CardTitle className="text-lg font-bold text-slate-900">
                Baseline Dataset Preview (20 Standard Reviews)
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-slate-500 font-medium mt-1">
              These standardized simulated eco-homestay reviews cover positive, neutral, and negative tones across all core operations.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-hidden rounded-xl border border-slate-150 shadow-sm bg-white">
              <div className="max-h-[420px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                    <TableRow className="border-slate-200 hover:bg-transparent">
                      <TableHead className="font-semibold text-slate-700 py-3.5 pl-6 min-w-[280px]">Review</TableHead>
                      <TableHead className="font-semibold text-slate-700 py-3.5 w-48">Expected Sentiment</TableHead>
                      <TableHead className="font-semibold text-slate-700 py-3.5 w-48 pr-6">Expected Theme</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testReviews.map((item, index) => (
                      <TableRow key={index} className="border-slate-100 hover:bg-slate-50/60 transition-colors duration-150">
                        <TableCell className="text-sm font-medium text-slate-800 py-4 pl-6 pr-6 leading-relaxed whitespace-pre-wrap">
                          {item.review}
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge className={`${sentimentColors[item.expectedSentiment]} font-bold capitalize px-2.5 py-0.5 rounded-full text-xs shadow-sm`}>
                            {item.expectedSentiment}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 pr-6">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200/40 shadow-sm">
                            <span>{themeIcons[item.expectedTheme]}</span>
                            <span className="capitalize">{item.expectedTheme}</span>
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards (if results available) */}
      {testResults.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="glass-card border shadow-sm rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-blue-500" />
            <CardContent className="pt-6 pb-6 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sentiment Accuracy</span>
                <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <BarChart3 className="h-4 w-4" />
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {sentimentAccuracy.toFixed(0)}%
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {testResults.filter((r) => r.sentimentMatch).length} of {testResults.length} matches
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border shadow-sm rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-indigo-500" />
            <CardContent className="pt-6 pb-6 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Theme Accuracy</span>
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Activity className="h-4 w-4" />
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {themeAccuracy.toFixed(0)}%
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {testResults.filter((r) => r.themeMatch).length} of {testResults.length} matches
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border shadow-sm rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />
            <CardContent className="pt-6 pb-6 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Success</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {((testResults.filter((r) => r.sentimentMatch && r.themeMatch).length / testResults.length) * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  {testResults.filter((r) => r.sentimentMatch && r.themeMatch).length} perfect dual matches
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border shadow-sm rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-500" />
            <CardContent className="pt-6 pb-6 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verification Status</span>
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                  <Award className="h-4 w-4" />
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-xl font-extrabold text-slate-900 uppercase pt-2">
                  {sentimentAccuracy >= 80 && themeAccuracy >= 80 ? (
                    <span className="text-emerald-600 font-black">Passed</span>
                  ) : (
                    <span className="text-rose-600 font-black">Unverified</span>
                  )}
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Requires 80% accuracy target
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Evaluation Matrix Card */}
      {testResults.length > 0 && (
        <Card className="glass-card border shadow-sm rounded-2xl">
          <CardHeader className="pb-4 border-b border-slate-100/80">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-900">
                Evaluation Matrix ({testResults.length} test reviews)
              </CardTitle>
              <Badge variant="outline" className="bg-slate-100 border-slate-200 text-slate-700 px-3 py-1 font-bold rounded-lg text-xs">
                Active Session Results
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto rounded-xl border border-slate-150 shadow-sm bg-white">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-200 hover:bg-transparent">
                    <TableHead className="font-semibold text-slate-700 py-3.5 pl-6 min-w-[200px]">Review</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-3.5 w-32">Expected Sentiment</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-3.5 w-36">Actual Sentiment</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-3.5 w-32">Expected Theme</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-3.5 w-36">Actual Theme</TableHead>
                    <TableHead className="font-semibold text-slate-700 py-3.5 min-w-[260px]">Suggested Reply</TableHead>
                    <TableHead className="text-center font-semibold text-slate-700 py-3.5 w-16">Copy</TableHead>
                    <TableHead className="text-center font-semibold text-slate-700 py-3.5 w-20 pr-6">Match</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testResults.map((result, index) => {
                    const perfectMatch = result.sentimentMatch && result.themeMatch;
                    const partialMatch = !perfectMatch && (result.sentimentMatch || result.themeMatch);
                    return (
                      <TableRow 
                        key={index} 
                        className={`border-slate-100 hover:bg-slate-50/60 transition-colors duration-150 ${
                          !result.sentimentMatch && !result.themeMatch ? 'bg-rose-50/10' : ''
                        }`}
                      >
                        <TableCell className="text-sm font-medium text-slate-800 py-4 pl-6 pr-6 leading-relaxed whitespace-pre-wrap">
                          {result.review}
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge className={`${sentimentColors[result.expectedSentiment as keyof typeof sentimentColors]} font-bold capitalize px-2.5 py-0.5 rounded-full text-xs shadow-sm`}>
                            {result.expectedSentiment}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                            <Badge
                              className={`${
                                sentimentColors[result.actualSentiment as keyof typeof sentimentColors] || sentimentColors.neutral
                              } font-bold capitalize px-2.5 py-0.5 rounded-full text-xs shadow-sm`}
                            >
                              {result.actualSentiment || "None"}
                            </Badge>
                            {!result.sentimentMatch && (
                              <span className="inline-flex text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-100/80 px-1 rounded uppercase tracking-wider">
                                Mismatch
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200/40 shadow-sm">
                            <span>{themeIcons[result.expectedTheme as keyof typeof themeIcons]}</span>
                            <span className="capitalize">{result.expectedTheme}</span>
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200/40 shadow-sm">
                              <span>{themeIcons[result.actualTheme as keyof typeof themeIcons] || "❓"}</span>
                              <span className="capitalize">{result.actualTheme || "None"}</span>
                            </span>
                            {!result.themeMatch && (
                              <span className="inline-flex text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-100/80 px-1 rounded uppercase tracking-wider">
                                Mismatch
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 leading-relaxed py-4 pr-6 italic whitespace-pre-wrap">
                          {result.actualResponse ? `"${result.actualResponse}"` : <span className="text-slate-400">Not generated</span>}
                        </TableCell>
                        <TableCell className="text-center py-4">
                          {result.actualResponse ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopyResponse(index, result.actualResponse || "")}
                              className="h-8 w-8 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-950 transition-colors duration-150"
                              title="Copy response"
                            >
                              {copiedIndex === index ? (
                                <Check className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          ) : (
                            <span className="text-slate-350">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center py-4 pr-6">
                          {perfectMatch ? (
                            <div className="inline-flex items-center justify-center p-1 rounded-full bg-emerald-50 border border-emerald-100" title="Perfect Match">
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            </div>
                          ) : partialMatch ? (
                            <div className="inline-flex items-center justify-center p-1 rounded-full bg-amber-50 border border-amber-100" title="Partial Match">
                              <AlertCircle className="h-5 w-5 text-amber-500" />
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center p-1 rounded-full bg-rose-50 border border-rose-100" title="Complete Mismatch">
                              <XCircle className="h-5 w-5 text-rose-500" />
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {classifyMutation.isError && (
        <Alert className="border-rose-500/30 bg-rose-500/5 text-rose-600 rounded-2xl">
          <AlertCircle className="h-5 w-5 text-rose-500" />
          <AlertDescription className="font-semibold">
            {classifyMutation.error?.message || "Test execution failed"}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
