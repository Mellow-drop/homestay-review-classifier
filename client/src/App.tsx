import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Classifier from "./pages/Classifier";
import About from "./pages/About";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/classifier"} component={Classifier} />
      <Route path={"/about"} component={About} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/login"} component={Login} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
