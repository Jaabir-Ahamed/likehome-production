import React, {useCallback, useEffect, useImperativeHandle, useRef, useState,} from "react";
import {Play} from "lucide-react";
import {toast} from "sonner";
import {useReward} from "react-rewards";
import {useRewards} from "../contexts/RewardsContext";
import {api} from "../../api/liteApi";

// ─── Constants ────────────────────────────────────────────────────────────────
const SYMBOLS = ["🍒", "🍋", "⭐", "🍓", "💎", "🍀"];
const CELL_H = 80;   // px — height of ONE symbol cell, must be consistent
const STRIP_REPS = 50;   // DOM copies of symbol list — determines max travel
const BASE_DURATION = 3400; // ms for reel 0; reels 1 & 2 get +200ms each
const MIN_BET = 50;
const DEFAULT_BET = 50;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randomFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getPayout(result: string[], bet: number) {
    const counts = result.reduce<Record<string, number>>((acc, s) => {
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});
    const max = Math.max(...Object.values(counts));
    if (max === 3) return {amount: bet * 5, label: "Jackpot! 3 matched"};
    if (max === 2) return {amount: bet * 2, label: "Nice! 2 matched"};
    return {amount: 0, label: "No match"};
}

// ─── Reel component ───────────────────────────────────────────────────────────
//
// HOW THE SCROLL WORKS
// ────────────────────
// The strip div is STRIP_REPS × SYMBOLS.length × CELL_H pixels tall.
// On every spin call we:
//   1. Disable CSS transition (instant), snap translateY back to 0  ← the rewind
//   2. Wait two rAF ticks so the browser paints the reset
//   3. Re-enable the transition and set translateY to a large negative value
//      that places the target symbol in the visible window
//
// Landing math:
//   We land in the second-to-last repetition block, so the strip always
//   travels (STRIP_REPS - 4) × SYMBOLS.length × CELL_H pixels — roughly
//   46 × 6 × 80 = 22 080 px per spin regardless of which symbol we land on.
//
// This is PURELY imperative (no Framer Motion) so the transition state never
// drifts between renders and every spin starts from the same physical position.

export interface ReelHandle {
    spin: (target: string, durationMs: number) => Promise<void>;
}

interface ReelProps {
    symbols: string[];
    spinning: boolean;
}

const Reel = React.forwardRef<ReelHandle, ReelProps>(
    ({symbols, spinning}, ref) => {
        const stripRef = useRef<HTMLDivElement>(null);

        // Pre-build the strip once — STRIP_REPS copies of symbols
        const strip = React.useMemo(
            () => Array.from({length: STRIP_REPS}, () => symbols).flat(),
            [symbols]
        );

        useImperativeHandle(ref, () => ({
            spin(target: string, durationMs: number): Promise<void> {
                return new Promise((resolve) => {
                    const el = stripRef.current;
                    if (!el) {
                        resolve();
                        return;
                    }

                    const symIdx = symbols.indexOf(target);
                    const safeIdx = symIdx >= 0 ? symIdx : 0;

                    // Land in the (STRIP_REPS - 4)th repetition block so we always
                    // travel the full length of the strip minus the last few rows.
                    const landRep = STRIP_REPS - 4;
                    const cellIndex = landRep * symbols.length + safeIdx;
                    const finalY = -(cellIndex * CELL_H);

                    // ── Step 1: kill transition, snap to top ──────────────────
                    el.style.transition = "none";
                    el.style.transform = "translateY(0px)";

                    // ── Step 2: wait two paint frames, then animate ───────────
                    // Two rAF calls are necessary: the first schedules after the
                    // current frame is committed; the second fires after the browser
                    // has actually painted the reset, so the transition never sees
                    // the same start and end state.
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            el.style.transition = `transform ${durationMs}ms cubic-bezier(0.11, 0.00, 0.06, 1.00)`;
                            el.style.transform = `translateY(${finalY}px)`;
                            setTimeout(resolve, durationMs);
                        });
                    });
                });
            },
        }));

        return (
            <div
                style={{
                    position: "relative",
                    height: `${CELL_H}px`,
                    overflow: "hidden",
                    borderRadius: "10px",
                    background: "#050200",
                    border: `2px solid ${spinning ? "#FFD700" : "#5C3D00"}`,
                    boxShadow: spinning
                        ? "0 0 22px rgba(255,200,50,0.6), inset 0 2px 12px rgba(0,0,0,0.95)"
                        : "inset 0 2px 12px rgba(0,0,0,0.95)",
                    transition: "border-color 0.3s, box-shadow 0.3s",
                }}
            >
                {/* Top gradient fade */}
                <div style={{
                    pointerEvents: "none",
                    position: "absolute",
                    top: 0, left: 0, right: 0,
                    height: "26px",
                    background: "linear-gradient(to bottom, rgba(0,0,0,0.94), transparent)",
                    zIndex: 10,
                }}/>
                {/* Bottom gradient fade */}
                <div style={{
                    pointerEvents: "none",
                    position: "absolute",
                    bottom: 0, left: 0, right: 0,
                    height: "26px",
                    background: "linear-gradient(to top, rgba(0,0,0,0.94), transparent)",
                    zIndex: 10,
                }}/>
                {/* Center win-line */}
                {/*<div style={{*/}
                {/*    pointerEvents: "none",*/}
                {/*    position: "absolute",*/}
                {/*    left: 0, right: 0,*/}
                {/*    top: "50%",*/}
                {/*    transform: "translateY(-50%)",*/}
                {/*    height: "2px",*/}
                {/*    background: "linear-gradient(90deg, transparent, rgba(255,200,50,0.65), transparent)",*/}
                {/*    zIndex: 200,*/}
                {/*}}/>*/}

                {/* Scrolling strip */}
                <div
                    ref={stripRef}
                    style={{willChange: "transform", transform: "translateY(0px)"}}
                >
                    {strip.map((sym, i) => (
                        <div
                            key={i}
                            style={{
                                height: `${CELL_H}px`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "42px",
                                lineHeight: 1,
                                userSelect: "none",
                            }}
                        >
                            {sym}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
);

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SlotMachinePage() {
    const {points, loading: rewardsLoading} = useRewards();

    const [balance, setBalance] = useState(0);
    const [balanceLoading, setBalanceLoading] = useState(true);
    const [bet, setBet] = useState(DEFAULT_BET);
    const [spinning, setSpinning] = useState(false);
    const [shaking, setShaking] = useState(false);

    const reel0 = useRef<ReelHandle>(null);
    const reel1 = useRef<ReelHandle>(null);
    const reel2 = useRef<ReelHandle>(null);
    const mountedRef = useRef(true);

    const {reward: jackpotReward} = useReward("spinRewardId", "emoji", {
        emoji: ["🤓", "😊", "🥳", "🎉", "💰", "⭐"],
        elementCount: 30,
        spread: 80,
        startVelocity: 25,
        lifetime: 220,
    });
    const {reward: confettiReward} = useReward("spinRewardId", "confetti", {
        elementCount: 40,
        spread: 60,
        startVelocity: 20,
    });

    // ── Balance helpers ──────────────────────────────────────────────────────
    const setSafeBalance = useCallback((next: number) => {
        if (!mountedRef.current) return;
        setBalance(next);
        setBet(prev => {
            if (next < MIN_BET) return MIN_BET;
            return Math.min(Math.max(prev, MIN_BET), next);
        });
    }, []);

    const syncBalance = useCallback(async () => {
        const profile = await api.getProfile();
        const live = profile?.reward_points ?? 0;
        setSafeBalance(live);
        return live;
    }, [setSafeBalance]);

    useEffect(() => {
        mountedRef.current = true;
        (async () => {
            try {
                setBalanceLoading(true);
                if (typeof points === "number") setSafeBalance(points);
                await syncBalance();
            } catch {
                toast.error("Could not load your latest reward points.");
            } finally {
                if (mountedRef.current) setBalanceLoading(false);
            }
        })();
        return () => {
            mountedRef.current = false;
        };
    }, [points, setSafeBalance, syncBalance]);

    // ── Spin logic ───────────────────────────────────────────────────────────
    const canSpin =
        !spinning &&
        !rewardsLoading &&
        !balanceLoading &&
        balance >= MIN_BET &&
        bet >= MIN_BET &&
        bet <= balance;

    const clamp = (v: number) =>
        Math.min(Math.max(v, MIN_BET), Math.max(balance, MIN_BET));

    const handleSpinClick = () => {
        // Always shake on click regardless of canSpin
        setShaking(true);
        setTimeout(() => setShaking(false), 520);
        if (canSpin) void doSpin();
    };

    const doSpin = async () => {
        if (!canSpin) return;
        try {
            setSpinning(true);

            // Debit points before the animation so balance is live immediately
            const afterDebit = await api.redeemRewardPoints(bet);
            setSafeBalance(afterDebit);

            // Pick outcomes
            const next = [
                randomFrom(SYMBOLS),
                randomFrom(SYMBOLS),
                randomFrom(SYMBOLS),
            ];

            // Fire all three reels concurrently; each lands slightly later (cascade)
            await Promise.all([
                reel0.current?.spin(next[0], BASE_DURATION),
                reel1.current?.spin(next[1], BASE_DURATION + 200),
                reel2.current?.spin(next[2], BASE_DURATION + 400),
            ]);

            // All reels have settled — resolve payout
            const payout = getPayout(next, bet);
            let finalBalance = afterDebit;

            if (payout.amount > 0) {
                finalBalance = await api.addRewardPoints(payout.amount);
                setSafeBalance(finalBalance);
                if (payout.amount >= bet * 5) jackpotReward();
                else confettiReward();
                toast.success(
                    `${payout.label} — You won ${payout.amount} points! Balance: ${finalBalance}`
                );
            } else {
                toast.error(`No match this time. Balance: ${afterDebit}`);
            }

            if (finalBalance < MIN_BET) toast.warning("Not enough points to spin again.");
            await syncBalance();

        } catch (err) {
            console.error(err);
            toast.error("Could not place bet. You may not have enough reward points.");
            try {
                await syncBalance();
            } catch { /* ignore */
            }
        } finally {
            if (mountedRef.current) setSpinning(false);
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Oswald:wght@400;600;700&display=swap');

                @keyframes goldPulse {
                    0%,100% {
                        box-shadow: 0 0 28px rgba(255,180,30,0.5),
                                    0 0 56px rgba(255,130,0,0.25),
                                    0 6px 24px rgba(0,0,0,0.7);
                        transform: scale(1);
                    }
                    50% {
                        box-shadow: 0 0 50px rgba(255,220,60,0.9),
                                    0 0 100px rgba(255,160,0,0.6),
                                    0 6px 24px rgba(0,0,0,0.7);
                        transform: scale(1.038);
                    }
                }

                @keyframes violentShake {
                    0%   { transform: translateX(0)    rotate(0deg)  scale(1.04); }
                    8%   { transform: translateX(-14px) rotate(-3.5deg) scale(1.04); }
                    16%  { transform: translateX(15px)  rotate(3.5deg)  scale(1.04); }
                    24%  { transform: translateX(-17px) rotate(-4deg)   scale(1.04); }
                    32%  { transform: translateX(17px)  rotate(4deg)    scale(1.04); }
                    40%  { transform: translateX(-11px) rotate(-2deg)   scale(1.04); }
                    50%  { transform: translateX(11px)  rotate(2deg)    scale(1.04); }
                    62%  { transform: translateX(-6px)  rotate(-1deg)   scale(1.04); }
                    74%  { transform: translateX(6px)   rotate(1deg)    scale(1.04); }
                    86%  { transform: translateX(-2px)                  scale(1.04); }
                    100% { transform: translateX(0)    rotate(0deg)     scale(1.04); }
                }

                @keyframes bulbFlicker {
                    0%,100% { opacity:1;    box-shadow: 0 0 7px #FFD700, 0 0 14px #FFD700; }
                    50%     { opacity:0.32; box-shadow: 0 0 3px #FFD700; }
                }

                .slot-root    { font-family: 'Oswald', sans-serif; }
                .casino-title { font-family: 'Playfair Display', serif; }

                .spin-idle  { animation: goldPulse 2.1s ease-in-out infinite; }
                .spin-shake { animation: violentShake 0.52s ease-in-out forwards !important; }
                .spin-idle:hover {
                    animation: none !important;
                    transform: scale(1.055) !important;
                    box-shadow: 0 0 80px rgba(255,230,80,0.98),
                                0 0 160px rgba(255,160,0,0.65),
                                0 8px 32px rgba(0,0,0,0.8) !important;
                }

                .bulb {
                    width: 9px; height: 9px; border-radius: 50%;
                    background: #FFD700;
                    animation: bulbFlicker 1.1s ease-in-out infinite;
                    flex-shrink: 0;
                }
            `}</style>

            <div
                className="slot-root"
                style={{
                    minHeight: "100vh",
                    background: "radial-gradient(ellipse at top, #1e0e00 0%, #0d0600 55%, #080300 100%)",
                    padding: "24px 16px",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "center",
                }}
            >
                <div style={{width: "100%", maxWidth: "600px"}}>

                    {/* ── Cabinet shell ── */}
                    <div style={{
                        borderRadius: "20px",
                        border: "3px solid #7A5A10",
                        background: "linear-gradient(180deg, #1a0c00 0%, #110800 100%)",
                        boxShadow: "0 0 80px rgba(160,100,0,0.2), 0 40px 100px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,190,60,0.12)",
                        overflow: "hidden",
                    }}>

                        {/* ── Marquee top ── */}
                        <div style={{
                            background: "linear-gradient(180deg, #2e1500 0%, #1c0d00 100%)",
                            borderBottom: "2px solid #7A5A10",
                            padding: "18px 20px 14px",
                            textAlign: "center",
                        }}>
                            <div style={{display: "flex", gap: "8px", justifyContent: "center", marginBottom: "10px"}}>
                                {Array.from({length: 18}).map((_, i) => (
                                    <div key={i} className="bulb"
                                         style={{animationDelay: `${(i * 0.065).toFixed(2)}s`}}/>
                                ))}
                            </div>

                            <h1
                                className="casino-title"
                                style={{
                                    margin: "0 0 4px",
                                    fontSize: "clamp(30px, 7vw, 52px)",
                                    fontWeight: 900,
                                    lineHeight: 1.05,
                                    color: "#FFD700",
                                    textShadow: "0 0 24px rgba(255,200,0,0.9), 0 3px 0 rgba(0,0,0,0.9), 0 0 50px rgba(255,140,0,0.4)",
                                    letterSpacing: "0.02em",
                                }}
                            >
                                REWARD$
                                <span style={{
                                    color: "#fff",
                                    textShadow: "0 0 22px rgba(255,255,255,0.55), 0 3px 0 rgba(0,0,0,0.9)",
                                }}>
                                    {" "}SLOTS
                                </span>
                            </h1>

                            <p style={{
                                margin: 0,
                                color: "#A07820",
                                fontSize: "12px",
                                letterSpacing: "0.18em",
                                textTransform: "uppercase",
                            }}>
                                Spin your points · Win bigger
                            </p>

                            <div style={{display: "flex", gap: "8px", justifyContent: "center", marginTop: "10px"}}>
                                {Array.from({length: 18}).map((_, i) => (
                                    <div key={i} className="bulb"
                                         style={{animationDelay: `${(0.58 + i * 0.065).toFixed(2)}s`}}/>
                                ))}
                            </div>
                        </div>

                        {/* ── Stats row ── */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 1fr",
                            borderBottom: "2px solid #7A5A10",
                            background: "#7A5A10",
                            gap: "1px",
                        }}>
                            {[
                                {icon: "💰", label: "Balance", value: rewardsLoading || balanceLoading ? "…" : balance},
                                {icon: "🎲", label: "Bet", value: bet},
                                {icon: "🏆", label: "Min Bet", value: MIN_BET},
                            ].map((s, i) => (
                                <div key={i} style={{
                                    background: "linear-gradient(180deg,#1a0c00 0%,#110800 100%)",
                                    padding: "14px 8px",
                                    textAlign: "center",
                                }}>
                                    <div style={{fontSize: "15px", marginBottom: "4px"}}>{s.icon}</div>
                                    <div style={{
                                        color: "#7A5A10",
                                        fontSize: "10px",
                                        letterSpacing: "0.1em",
                                        textTransform: "uppercase",
                                        marginBottom: "4px",
                                    }}>
                                        {s.label}
                                    </div>
                                    <div style={{
                                        color: "#FFD700",
                                        fontSize: "26px",
                                        fontWeight: 700,
                                        lineHeight: 1,
                                        textShadow: "0 0 12px rgba(255,200,0,0.5)",
                                    }}>
                                        {s.value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ── Reel window ── */}
                        <div style={{padding: "20px 20px 12px"}}>
                            <div style={{
                                borderRadius: "14px",
                                border: "2px solid #5C3D00",
                                background: "#040200",
                                padding: "14px 12px",
                                boxShadow: "inset 0 4px 20px rgba(0,0,0,0.96), 0 0 0 1px rgba(255,180,30,0.06)",
                            }}>
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr 1fr",
                                    gap: "10px",
                                }}>
                                    <Reel ref={reel0} symbols={SYMBOLS} spinning={spinning}/>
                                    <Reel ref={reel1} symbols={SYMBOLS} spinning={spinning}/>
                                    <Reel ref={reel2} symbols={SYMBOLS} spinning={spinning}/>
                                </div>
                            </div>
                        </div>

                        {/* ── Payout banner ── */}
                        <div style={{
                            margin: "0 20px 16px",
                            borderRadius: "10px",
                            border: "1px solid rgba(122,90,16,0.45)",
                            background: "rgba(255,160,0,0.05)",
                            padding: "12px 16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "28px",
                        }}>
                            <div style={{display: "flex", alignItems: "baseline", gap: "6px"}}>
                                <span style={{
                                    color: "#7A5A10",
                                    fontSize: "12px",
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase"
                                }}>
                                    3 match
                                </span>
                                <span style={{
                                    fontSize: "40px",
                                    fontWeight: 700,
                                    lineHeight: 1,
                                    color: "#FFD700",
                                    textShadow: "0 0 18px rgba(255,200,0,1), 0 0 36px rgba(255,150,0,0.6)",
                                }}>
                                    5×
                                </span>
                                <span style={{color: "#5C3D00", fontSize: "12px"}}>bet</span>
                            </div>
                            <div style={{width: "1px", height: "40px", background: "rgba(122,90,16,0.4)"}}/>
                            <div style={{display: "flex", alignItems: "baseline", gap: "6px"}}>
                                <span style={{
                                    color: "#7A5A10",
                                    fontSize: "12px",
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase"
                                }}>
                                    2 match
                                </span>
                                <span style={{
                                    fontSize: "40px",
                                    fontWeight: 700,
                                    lineHeight: 1,
                                    color: "#FF8C00",
                                    textShadow: "0 0 18px rgba(255,140,0,0.9), 0 0 36px rgba(255,100,0,0.5)",
                                }}>
                                    2×
                                </span>
                                <span style={{color: "#5C3D00", fontSize: "12px"}}>bet</span>
                            </div>
                        </div>

                        {/* ── Bet controls ── */}
                        <div style={{padding: "0 20px 20px"}}>
                            <div style={{
                                border: "1px solid rgba(122,90,16,0.3)",
                                borderRadius: "12px",
                                background: "rgba(255,160,0,0.03)",
                                padding: "14px",
                                marginBottom: "14px",
                            }}>
                                <div style={{
                                    color: "#7A5A10",
                                    fontSize: "10px",
                                    letterSpacing: "0.14em",
                                    textTransform: "uppercase",
                                    marginBottom: "10px",
                                }}>
                                    Bet Amount
                                </div>

                                <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                                    {/* Decrement button */}
                                    <button
                                        onClick={() => setBet(clamp(bet - MIN_BET))}
                                        disabled={spinning || balance < MIN_BET || bet <= MIN_BET}
                                        style={{
                                            flexShrink: 0,
                                            width: "44px",
                                            height: "44px",
                                            borderRadius: "8px",
                                            border: "2px solid #5C3D00",
                                            background: "linear-gradient(180deg,#221000,#160900)",
                                            color: "#FFD700",
                                            fontSize: "22px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            opacity: spinning || balance < MIN_BET || bet <= MIN_BET ? 0.3 : 1,
                                            transition: "opacity 0.15s",
                                        }}
                                    >
                                        −
                                    </button>

                                    {/* Read-only bet display */}
                                    <div style={{
                                        flex: 1,
                                        height: "44px",
                                        borderRadius: "8px",
                                        border: "2px solid #5C3D00",
                                        background: "linear-gradient(180deg,#060300,#0a0500)",
                                        color: "#FFD700",
                                        fontSize: "24px",
                                        fontWeight: 700,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        textShadow: "0 0 12px rgba(255,200,0,0.65)",
                                        boxShadow: "inset 0 2px 10px rgba(0,0,0,0.8)",
                                        letterSpacing: "0.05em",
                                        userSelect: "none",
                                    }}>
                                        {bet}
                                    </div>

                                    {/* Increment button */}
                                    <button
                                        onClick={() => setBet(clamp(bet + MIN_BET))}
                                        disabled={spinning || balance < MIN_BET || bet + MIN_BET > balance}
                                        style={{
                                            flexShrink: 0,
                                            width: "44px",
                                            height: "44px",
                                            borderRadius: "8px",
                                            border: "2px solid #5C3D00",
                                            background: "linear-gradient(180deg,#221000,#160900)",
                                            color: "#FFD700",
                                            fontSize: "22px",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            opacity: spinning || balance < MIN_BET || bet + MIN_BET > balance ? 0.3 : 1,
                                            transition: "opacity 0.15s",
                                        }}
                                    >
                                        +
                                    </button>

                                    {/* All In button */}
                                    <button
                                        onClick={() => {
                                            if (balance >= MIN_BET) setBet(balance);
                                        }}
                                        disabled={spinning || balance < MIN_BET}
                                        style={{
                                            flexShrink: 0,
                                            height: "44px",
                                            padding: "0 14px",
                                            borderRadius: "8px",
                                            border: "2px solid #5C3D00",
                                            background: "linear-gradient(180deg,#221000,#160900)",
                                            color: "#A07820",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            letterSpacing: "0.1em",
                                            textTransform: "uppercase",
                                            whiteSpace: "nowrap",
                                            fontFamily: "'Oswald',sans-serif",
                                            opacity: spinning || balance < MIN_BET ? 0.3 : 1,
                                            transition: "opacity 0.15s",
                                        }}
                                    >
                                        All In
                                    </button>
                                </div>
                            </div>

                            {/* ── SPIN BUTTON ── */}
                            <div style={{position: "relative", textAlign: "center"}}>
                                <span
                                    id="spinRewardId"
                                    style={{position: "absolute", left: "50%", top: 0, pointerEvents: "none"}}
                                />
                                <button
                                    onClick={handleSpinClick}
                                    className={
                                        shaking ? "spin-shake" :
                                            canSpin ? "spin-idle" :
                                                ""
                                    }
                                    style={{
                                        width: "100%",
                                        height: "76px",
                                        borderRadius: "14px",
                                        border: "none",
                                        background: canSpin
                                            ? "linear-gradient(180deg,#FFE844 0%,#FFB800 45%,#FF7800 100%)"
                                            : "linear-gradient(180deg,#4a3a18,#2e2410)",
                                        color: canSpin ? "#1a0400" : "#6a5520",
                                        fontSize: "23px",
                                        fontWeight: 700,
                                        letterSpacing: "0.1em",
                                        textTransform: "uppercase",
                                        fontFamily: "'Oswald',sans-serif",
                                        cursor: canSpin ? "pointer" : "not-allowed",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "10px",
                                        position: "relative",
                                        zIndex: 1,
                                        transition: "background 0.25s, color 0.25s",
                                    }}
                                >
                                    <Play style={{width: 22, height: 22, fill: "currentColor"}}/>
                                    {spinning ? "Spinning…" : "Spin for a Win"}
                                </button>
                            </div>

                            <p style={{
                                textAlign: "center",
                                fontSize: "11px",
                                color: "#4a3010",
                                margin: "10px 0 0",
                                letterSpacing: "0.05em",
                            }}>
                                Every spin uses real reward points and updates your live balance.
                            </p>

                            {balance < MIN_BET && !rewardsLoading && !balanceLoading && (
                                <div style={{
                                    marginTop: "12px",
                                    borderRadius: "10px",
                                    border: "1px solid rgba(200,50,50,0.4)",
                                    background: "rgba(180,20,20,0.1)",
                                    padding: "12px 16px",
                                    color: "#FF6B6B",
                                    fontSize: "13px",
                                    textAlign: "center",
                                    letterSpacing: "0.05em",
                                }}>
                                    ⚠ Not enough points to spin.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}