import {useState} from "react";
import {Link, useNavigate} from "react-router";
import {Eye, EyeOff, Lock, Mail, Phone, User,} from "lucide-react";
import {Button} from "../components/ui/button";
import {Input} from "../components/ui/input";
import {Label} from "../components/ui/label";
import {Card} from "../components/ui/card";
import {Checkbox} from "../components/ui/checkbox";
import {Separator} from "../components/ui/separator";
import {supabase} from "../../lib/supabaseClient";
import {appEnv} from "../../lib/appEnv";
import {ResendEmailButton} from "../components/ResendEmailButton";


export function SignupPage() {
    const navigate = useNavigate();
    const [signupSuccess, setSignupSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        if (!agreeToTerms) {
            alert("You must agree to the terms");
            return;
        }

        try {
            setLoading(true); // ✅ START loading

            const {data, error} = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    emailRedirectTo: `${appEnv.appURL}/signin`,
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        phone: formData.phone,
                    },
                },
            });

            if (error) {
                throw error;
            }

            setSignupSuccess(true);

        } catch (error: any) {
            console.error("Signup error:", error.message);
            alert(error.message);
        } finally {
            setLoading(false); // ✅ STOP loading (always runs)
        }
    }


    async function handleResendEmail() {
        try {
            setLoading(true);

            const {error} = await supabase.auth.resend({
                type: "signup",
                email: formData.email,
                options: {
                    emailRedirectTo: `${appEnv.appURL}/signin`,
                },
            });

            if (error) throw error;

            alert("Verification email resent!");
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    }

    const updateFormData = (field: string, value: string) => {
        setFormData((prev) => ({...prev, [field]: value}));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#2563eb]/10 via-white to-[#f59e0b]/10">
            {/* Main Content */}
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Side - Hero Content */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-5xl font-bold text-[#1f2937] leading-tight mb-4">
                                Start Your Journey with LikeHome
                            </h1>
                            <p className="text-xl text-[#6b7280]">
                                Join thousands of travelers discovering their
                                perfect stay around the world.
                            </p>
                        </div>

                        {/* Benefits */}
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div
                                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <span className="text-3xl">🌍</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[#1f2937] mb-2 text-lg">
                                        Global Selection
                                    </h3>
                                    <p className="text-[#6b7280]">
                                        Access over 100,000 hotels worldwide with
                                        the best prices guaranteed
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div
                                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <span className="text-3xl">💎</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[#1f2937] mb-2 text-lg">
                                        Exclusive Rewards
                                    </h3>
                                    <p className="text-[#6b7280]">
                                        Earn points on every booking and unlock
                                        special member benefits
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div
                                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <span className="text-3xl">🔒</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[#1f2937] mb-2 text-lg">
                                        Secure Booking
                                    </h3>
                                    <p className="text-[#6b7280]">
                                        Your data is protected with bank-level
                                        encryption and security
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div
                                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <span className="text-3xl">⚡</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-[#1f2937] mb-2 text-lg">
                                        Instant Confirmation
                                    </h3>
                                    <p className="text-[#6b7280]">
                                        Get instant booking confirmation and 24/7
                                        customer support
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Social Proof */}
                        <div className="flex items-center gap-8 pt-4">
                            <div>
                                <div className="text-3xl font-bold text-[#2563eb]">
                                    1M+
                                </div>
                                <div className="text-sm text-[#6b7280]">
                                    Happy Travelers
                                </div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-[#f59e0b]">
                                    100K+
                                </div>
                                <div className="text-sm text-[#6b7280]">
                                    Hotels Worldwide
                                </div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-[#10b981]">
                                    4.9★
                                </div>
                                <div className="text-sm text-[#6b7280]">
                                    Average Rating
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Signup Form */}
                    <Card className="p-8 lg:p-10 border-gray-200 shadow-2xl">
                        <div className="mb-6">
                            <h2 className="text-3xl font-bold text-[#1f2937] mb-2">
                                Create Account
                            </h2>
                            <p className="text-[#6b7280]">
                                Fill in your details to get started
                            </p>
                        </div>

                        {signupSuccess ? (
                            <div className="space-y-6 text-center">
                                <div className="text-6xl">📩</div>

                                <h2 className="text-2xl font-bold text-[#1f2937]">
                                    Check Your Email
                                </h2>

                                <p className="text-[#6b7280]">
                                    We've sent a verification link to
                                    <br/>
                                    <span className="font-medium text-[#1f2937]">
          {formData.email}
        </span>
                                    <br/>
                                    Please verify your account before signing in.
                                </p>

                                <div className="space-y-3">
                                    <Button
                                        className="w-full bg-[#2563eb] hover:bg-[#1d4ed8]"
                                        onClick={() => navigate("/login")}
                                    >
                                        Go to Login
                                    </Button>

                                    {/*<Button*/}
                                    {/*    variant="outline"*/}
                                    {/*    className="w-full"*/}
                                    {/*    onClick={handleResendEmail}*/}
                                    {/*    disabled={loading}*/}
                                    {/*>*/}
                                    {/*    {loading ? "Resending..." : "Resend Email"}*/}
                                    {/*</Button>*/}

                                    <ResendEmailButton
                                        onResend={handleResendEmail}
                                        loading={loading}
                                    />
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSignup} className="space-y-5">
                                {/* Name Fields */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="firstName"
                                            className="text-[#1f2937]"
                                        >
                                            First Name
                                        </Label>
                                        <div className="relative">
                                            <User
                                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]"/>
                                            <Input
                                                id="firstName"
                                                placeholder="John"
                                                value={formData.firstName}
                                                onChange={(e) =>
                                                    updateFormData(
                                                        "firstName",
                                                        e.target.value,
                                                    )
                                                }
                                                className="pl-10"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="lastName"
                                            className="text-[#1f2937]"
                                        >
                                            Last Name
                                        </Label>
                                        <Input
                                            id="lastName"
                                            placeholder="Doe"
                                            value={formData.lastName}
                                            onChange={(e) =>
                                                updateFormData("lastName", e.target.value)
                                            }
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email Input */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="email"
                                        className="text-[#1f2937]"
                                    >
                                        Email Address
                                    </Label>
                                    <div className="relative">
                                        <Mail
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]"/>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={(e) =>
                                                updateFormData("email", e.target.value)
                                            }
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Phone Input */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="phone"
                                        className="text-[#1f2937]"
                                    >
                                        Phone Number
                                    </Label>
                                    <div className="relative">
                                        <Phone
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]"/>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="+1 (555) 123-4567"
                                            value={formData.phone}
                                            onChange={(e) =>
                                                updateFormData("phone", e.target.value)
                                            }
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
                                        <Lock
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]"/>
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Create a strong password"
                                            value={formData.password}
                                            onChange={(e) =>
                                                updateFormData("password", e.target.value)
                                            }
                                            className="pl-10 pr-10"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#1f2937]"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-4 h-4"/>
                                            ) : (
                                                <Eye className="w-4 h-4"/>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password Input */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="confirmPassword"
                                        className="text-[#1f2937]"
                                    >
                                        Confirm Password
                                    </Label>
                                    <div className="relative">
                                        <Lock
                                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]"/>
                                        <Input
                                            id="confirmPassword"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Confirm your password"
                                            value={formData.confirmPassword}
                                            onChange={(e) =>
                                                updateFormData(
                                                    "confirmPassword",
                                                    e.target.value,
                                                )
                                            }
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Terms Agreement */}
                                <div className="flex items-start gap-2">
                                    <Checkbox
                                        id="terms"
                                        checked={agreeToTerms}
                                        onCheckedChange={(checked) =>
                                            setAgreeToTerms(checked as boolean)
                                        }
                                        className="mt-1"
                                    />
                                    <Label
                                        htmlFor="terms"
                                        className="text-sm text-[#6b7280] cursor-pointer leading-relaxed"
                                    >
                                        I agree to the{" "}
                                        <Link
                                            to="#"
                                            className="text-[#2563eb] hover:text-[#1d4ed8]"
                                        >
                                            Terms of Service
                                        </Link>{" "}
                                        and{" "}
                                        <Link
                                            to="#"
                                            className="text-[#2563eb] hover:text-[#1d4ed8]"
                                        >
                                            Privacy Policy
                                        </Link>
                                    </Label>
                                </div>

                                {/* Signup Button */}
                                <Button
                                    type="submit"
                                    disabled={!agreeToTerms || loading}
                                    className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] h-12 text-base"
                                >
                                    {loading ? "Creating account..." : "Create Account"}
                                </Button>

                                {/* Divider */}
                                <div className="relative">
                                    <Separator/>
                                    <span
                                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-sm text-[#6b7280]">
                  Or sign up with
                </span>
                                </div>

                                {/* Social Signup */}
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => console.log("Google signup")}
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
                                        Google
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => console.log("Facebook signup")}
                                    >
                                        <svg
                                            className="w-5 h-5 mr-2"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                        </svg>
                                        Facebook
                                    </Button>
                                </div>

                                {/* Login Link */}
                                <div className="text-center pt-2">
                                    <p className="text-[#6b7280]">
                                        Already have an account?{" "}
                                        <Link
                                            to="/login"
                                            className="text-[#2563eb] hover:text-[#1d4ed8] font-medium"
                                        >
                                            Sign in
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
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}