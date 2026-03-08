import {useState, useEffect, useRef} from "react";

const RESEND_COOLDOWN = 5;

interface ResendEmailButtonProps {
    onResend: () => Promise<void>;
    loading: boolean;
}

export function ResendEmailButton({onResend, loading}: ResendEmailButtonProps) {
    const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Start countdown on mount
    useEffect(() => {
        startCountdown();
        return () => clearInterval(intervalRef.current!);
    }, []);

    function startCountdown() {
        setCountdown(RESEND_COOLDOWN);
        intervalRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }

    async function handleClick() {
        if (countdown > 0 || loading) return;
        await onResend();
        startCountdown();
    }

    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - countdown / RESEND_COOLDOWN);

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={countdown > 0 || loading}
            className={`w-full flex items-center justify-center gap-3 rounded-md border px-4 py-2 text-sm font-medium transition-colors
                ${countdown > 0 || loading
                ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                : "border-gray-300 bg-white text-[#1f2937] hover:bg-gray-50 cursor-pointer"
            }`}
        >
            {countdown > 0 ? (
                <>
                    <svg width="28" height="28" viewBox="0 0 48 48" className="flex-shrink-0 -my-1">
                        {/* Track */}
                        <circle cx="24" cy="24" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="4"/>
                        {/* Draining arc */}
                        <circle
                            cx="24" cy="24" r={radius}
                            fill="none"
                            stroke="#2563eb"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            transform="rotate(-90 24 24)"
                            style={{transition: "stroke-dashoffset 1s linear"}}
                        />
                        {/* Number */}
                        <text
                            x="24" y="24"
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="14"
                            fontWeight="600"
                            fill="#2563eb"
                        >
                            {countdown}
                        </text>
                    </svg>
                    <span>Resend confirmation available in {countdown}s</span>
                </>
            ) : loading ? (
                "Resending..."
            ) : (
                "Resend Email"
            )}
        </button>
    );
}