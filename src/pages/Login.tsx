import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showBotCheck, setShowBotCheck] = useState(false);
  const [botCheckConfirmed, setBotCheckConfirmed] = useState(false);
  const attemptsResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();

  const BOT_CHECK_THRESHOLD = 3; // Show bot check after 3 failed attempts
  const ATTEMPTS_RESET_TIME = 30000; // Reset attempts after 30 seconds

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Reset attempts after a period of inactivity
  useEffect(() => {
    if (loginAttempts > 0) {
      // Clear existing timeout
      if (attemptsResetTimeoutRef.current) {
        clearTimeout(attemptsResetTimeoutRef.current);
      }

      // Set new timeout to reset attempts
      attemptsResetTimeoutRef.current = setTimeout(() => {
        setLoginAttempts(0);
        setShowBotCheck(false);
        setBotCheckConfirmed(false);
      }, ATTEMPTS_RESET_TIME);

      return () => {
        if (attemptsResetTimeoutRef.current) {
          clearTimeout(attemptsResetTimeoutRef.current);
        }
      };
    }
  }, [loginAttempts]);

  // Show bot check when threshold is reached
  useEffect(() => {
    if (loginAttempts >= BOT_CHECK_THRESHOLD) {
      setShowBotCheck(true);
      setBotCheckConfirmed(false);
    }
  }, [loginAttempts]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Increment login attempts
    setLoginAttempts((prev) => prev + 1);

    // Check if bot check is required and confirmed
    if (showBotCheck && !botCheckConfirmed) {
      setError("Please confirm you are not a bot");
      toast.error("Please confirm you are not a bot");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (!email || !password) throw new Error("Email and password are required");

      const result = await login({ email, password });
      if (result.success) {
        toast.success("Logged in successfully");
        // Reset attempts and bot check on success
        setLoginAttempts(0);
        setShowBotCheck(false);
        setBotCheckConfirmed(false);
        if (attemptsResetTimeoutRef.current) {
          clearTimeout(attemptsResetTimeoutRef.current);
        }
        navigate("/");
      } else {
        throw new Error(result.error || "Invalid credentials");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="rounded-lg flex items-center justify-center bg-white p-2">
              <img
                src={`${import.meta.env.BASE_URL}ressy-logo.png`}
                alt="Ressy AI Logo"
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground">Sign in to your CRM dashboard</p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>Enter your email and password to continue</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {error && <div className="text-sm text-destructive">{error}</div>}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Having trouble logging in? Contact developers for assistance.
              </p>

              {/* Bot Check */}
              {showBotCheck && (
                <div className="p-4 bg-muted/50 rounded-lg border border-muted">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                    <Label htmlFor="bot-check" className="text-sm font-medium cursor-pointer">
                      Bot Check
                    </Label>
                    <Checkbox
                      id="bot-check"
                      checked={botCheckConfirmed}
                      onCheckedChange={(checked) => {
                        setBotCheckConfirmed(checked === true);
                        if (checked) {
                          setError(null);
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={isSubmitting || (showBotCheck && !botCheckConfirmed)}
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
