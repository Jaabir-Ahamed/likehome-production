import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Home, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Separator } from "../components/ui/separator";

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - in real app, this would authenticate with backend
    console.log("Login attempt:", {
      email,
      password,
      rememberMe,
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2563eb]/10 via-white to-[#f59e0b]/10 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="hidden lg:block">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <Home className="w-12 h-12 text-[#2563eb]" />
              <span className="text-5xl font-bold text-[#454545]">
                LikeHome
              </span>
            </div>
            <h2 className="text-4xl font-bold text-[#1f2937] leading-tight">
              Welcome Back to Your Home Away from Home
            </h2>
            <p className="text-lg text-[#6b7280]">
              Sign in to continue your journey and discover
              amazing stays around the world.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#2563eb]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🏨</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[#1f2937] mb-1">
                    Exclusive Deals
                  </h3>
                  <p className="text-[#6b7280]">
                    Access member-only rates and special offers
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#f59e0b]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💳</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[#1f2937] mb-1">
                    Fast Booking
                  </h3>
                  <p className="text-[#6b7280]">
                    Save payment info for quick reservations
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#10b981]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">❤️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-[#1f2937] mb-1">
                    Save Favorites
                  </h3>
                  <p className="text-[#6b7280]">
                    Keep track of hotels you love
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <Card className="p-8 lg:p-12 border-gray-200 shadow-2xl">
          <div className="mb-8">
            <h1 className="font-bold text-[#1f2937] mb-2">
              Sign In
            </h1>
            <p className="text-[#6b7280]">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#1f2937]">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b7280]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-[#1f2937]"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b7280]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#1f2937]"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked as boolean)
                  }
                />
                <Label
                  htmlFor="remember"
                  className="text-sm text-[#6b7280] cursor-pointer"
                >
                  Remember me
                </Label>
              </div>
              <Link
                to="#"
                className="text-sm text-[#2563eb] hover:text-[#1d4ed8] font-medium"
              >
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] h-12 text-base"
            >
              Sign In
            </Button>

            {/* Divider */}
            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-sm text-[#6b7280]">
                Or
              </span>
            </div>

            {/* Social Login */}
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12"
                onClick={() => console.log("Google login")}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12"
                onClick={() => console.log("Facebook login")}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Continue with Facebook
              </Button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center pt-4">
              <p className="text-[#6b7280]">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-[#2563eb] hover:text-[#1d4ed8] font-medium"
                >
                  Sign up for free
                </Link>
              </p>
            </div>

            {/* Homepage Link */}
            <div className="text-center pt-2">
              <p className="text-[#6b7280]">
                <Link
                  to="/"
                  className="text-[#2563eb] hover:text-[#1d4ed8] font-medium"
                >
                  Continue as Guest
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}