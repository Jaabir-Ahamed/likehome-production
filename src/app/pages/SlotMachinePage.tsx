import {useMemo, useRef, useState} from "react";
import {motion} from "framer-motion";
import {Coins, Minus, Play, Plus, RotateCcw, Settings2, Trophy} from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle} from "../components/ui/card";
import {Button} from "../components/ui/button";
import {Input} from "../components/ui/input";
import {Label} from "../components/ui/label";
import {Badge} from "../components/ui/badge";
import {toast} from "sonner";
import {useReward} from "react-rewards";


/**
 * PRODUCT REQUIREMENTS DOCUMENT (PRD)
 *
 * Product Name:
 * Rewards Points Slot Machine Page
 *
 * Objective:
 * Create a lightweight slot machine page where users can risk virtual rewards points
 * in exchange for a chance to win bonus points. The experience should feel playful,
 * transparent, and easy to configure.
 *
 * Core Requirements:
 * 1. Three reels (3-slot layout).
 * 2. Unlimited spin until rewards points is lower than minimum perspin, set at 50, spins available per session by default.
 * 3. A customizable options array to control the reel symbols.
 * 4. Animated spin interaction.
 * 5. Clear points accounting: balance, bet amount, and payout.
 * 6. Clear win conditions shown in the UI.
 *
 * User Story:
 * As a user, I want to spend some of my rewards points on a slot machine spin,
 * so I can try to win extra points in a fast, animated, game-like experience.
 *
 * Functional Requirements:
 * - User starts with a configurable points balance.
 * - User can set a bet amount before spinning. Increase by a button, plus or minus, adding a minimum per spin.
 * - Have a bet all button to bet all posible amount.
 * - Each spin deducts the bet amount from the balance.
 * - If all 3 reels match: award jackpot multiplier.
 * - If 2 reels match: award smaller multiplier.
 * - If no match: no payout.
 * - The symbol set is editable via a simple comma-separated input backed by an array.
 * - Reels animate vertically during the spin.
 * - Spin button is disabled while spinning or when no spins remain.
 * - Notify how much win, lose, use toast
 *
 * Non-Functional Requirements:
 * - Responsive single-page layout.
 * - Easy to modify symbols and starting values in code.
 * - Minimal dependencies beyond standard UI components and framer-motion.
 * - Clear, readable state transitions.
 * - Non repeated reel options (use a Set or something)
 *
 * Default Game Rules:
 * - Starting balance: 1000 points
 * - Starting bet: 50 points
 * - Spins per session: 3
 * - 3-match payout: bet * 5
 * - 2-match payout: bet * 2
 *
 * Success Criteria:
 * - User can complete a full session of 3 spins.
 * - User sees animated reel motion on every spin.
 * - User can customize the options array and immediately use it.
 * - User always understands the result and resulting points balance.
 */

const DEFAULT_OPTIONS = ["🍒", "🍋", "⭐", "7", "💎", "🍀"];
const REEL_HEIGHT = 72;
const VISIBLE_REPEATS = 12;
const STARTING_BALANCE = 1000;
const DEFAULT_BET = 50;
const MIN_BET = 50;

function randomFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getPayout(result: string[], bet: number) {
    const counts = result.reduce<Record<string, number>>((acc, symbol) => {
        acc[symbol] = (acc[symbol] || 0) + 1;
        return acc;
    }, {});

    const maxMatch = Math.max(...Object.values(counts));

    if (maxMatch === 3) {
        return {amount: bet * 5, label: "Jackpot! 3 matched"};
    }

    if (maxMatch === 2) {
        return {amount: bet * 2, label: "Nice! 2 matched"};
    }

    return {amount: 0, label: "No match"};
}

function Reel({
                  symbols,
                  finalSymbol,
                  spinning,
                  delay = 0,
              }: {
    symbols: string[];
    finalSymbol: string;
    spinning: boolean;
    delay?: number;
}) {
    const repeated = useMemo(
        () => Array.from({length: VISIBLE_REPEATS}, () => symbols).flat(),
        [symbols]
    );

    const finalIndexBase = symbols.indexOf(finalSymbol);
    const safeIndex = finalIndexBase >= 0 ? finalIndexBase : 0;
    const targetIndex = symbols.length * (VISIBLE_REPEATS - 2) + safeIndex;
    const y = -(targetIndex * REEL_HEIGHT);

    return (
        <div className="relative h-[72px] overflow-hidden rounded-2xl border bg-white/70 shadow-inner">
            <div
                className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white to-transparent"/>
            <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent"/>

            <motion.div
                animate={{y: spinning ? y : y}}
                initial={{y: -(symbols.length * (VISIBLE_REPEATS - 3)) * REEL_HEIGHT}}
                transition={{
                    duration: 1.2 + delay,
                    ease: [0.22, 1, 0.36, 1],
                }}
                className="will-change-transform"
            >
                {repeated.map((symbol, index) => (
                    <div
                        key={`${symbol}-${index}`}
                        className="flex h-[72px] items-center justify-center text-4xl"
                    >
                        {symbol}
                    </div>
                ))}
            </motion.div>
        </div>
    );
}

export default function SlotMachinePage() {
    const [options, setOptions] = useState<string[]>(DEFAULT_OPTIONS);
    const [optionsInput, setOptionsInput] = useState(DEFAULT_OPTIONS.join(", "));
    const [balance, setBalance] = useState(STARTING_BALANCE);
    const [bet, setBet] = useState(DEFAULT_BET);
    const [spinning, setSpinning] = useState(false);
    const [result, setResult] = useState<string[]>(["🍒", "🍋", "⭐"]);
    const timeoutRef = useRef<number | null>(null);

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

    // Spin is available as long as balance >= MIN_BET and a valid bet is set
    const canSpin = !spinning && balance >= MIN_BET && bet >= MIN_BET && bet <= balance && options.length > 0;

    const clampBet = (value: number) => Math.min(Math.max(value, MIN_BET), balance);

    const incrementBet = () => setBet((prev) => clampBet(prev + MIN_BET));
    const decrementBet = () => setBet((prev) => clampBet(prev - MIN_BET));
    const betAll = () => setBet(balance);

    const applyOptions = () => {
        const parsed = Array.from(new Set(
            optionsInput
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
        ));

        if (parsed.length < 2) {
            toast.error("Add at least 2 symbols to update the reel options.");
            return;
        }

        setOptions(parsed);
        setResult([parsed[0], parsed[1] ?? parsed[0], parsed[0]]);
        toast.success("Options updated.");
    };

    const handleSpin = () => {
        if (!canSpin) return;

        const next = [randomFrom(options), randomFrom(options), randomFrom(options)];
        const payout = getPayout(next, bet);

        setSpinning(true);
        setBalance((prev) => prev - bet);
        setResult(next);

        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = window.setTimeout(() => {
            setSpinning(false);
            setBalance((prev) => {
                const newBalance = prev + payout.amount;
                if (payout.amount >= bet * 5) {
                    jackpotReward();
                    toast.success(`${payout.label} — You won ${payout.amount} points! Balance: ${newBalance}`);
                } else if (payout.amount > 0) {
                    confettiReward();
                    toast.success(`${payout.label} — You won ${payout.amount} points! Balance: ${newBalance}`);
                } else {
                    toast.error(`No match this time. Balance: ${newBalance}`);
                }
                if (newBalance < MIN_BET) {
                    toast.warning("Not enough points to spin again. Reset to play more.");
                }
                return newBalance;
            });
        }, 1800);
    };

    const resetGame = () => {
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
        }

        setBalance(STARTING_BALANCE);
        setBet(DEFAULT_BET);
        setSpinning(false);
        setResult(["🍒", "🍋", "⭐"]);
        toast.info("Game reset. Spin away!");
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 p-6 text-slate-900">
            <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <Card className="rounded-3xl border-0 shadow-xl">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <CardTitle className="text-3xl font-bold tracking-tight">Rewards Slot
                                    Machine</CardTitle>
                                <p className="mt-2 text-sm text-slate-600">
                                    Spend virtual rewards points for a chance to win bonus points.
                                </p>
                            </div>
                            <Badge className="rounded-full px-3 py-1 text-sm">3 Reels</Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-2xl bg-slate-100 p-4">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Coins className="h-4 w-4"/> Balance
                                </div>
                                <div className="mt-2 text-3xl font-bold">{balance}</div>
                            </div>

                            <div className="rounded-2xl bg-slate-100 p-4">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Play className="h-4 w-4"/> Bet
                                </div>
                                <div className="mt-2 text-3xl font-bold">{bet}</div>
                            </div>

                            <div className="rounded-2xl bg-slate-100 p-4">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Trophy className="h-4 w-4"/> Min Bet
                                </div>
                                <div className="mt-2 text-3xl font-bold">{MIN_BET}</div>
                            </div>
                        </div>

                        <div className="rounded-[28px] border border-slate-200 bg-slate-900 p-5 shadow-2xl">
                            <div className="grid grid-cols-3 gap-3">
                                <Reel symbols={options} finalSymbol={result[0]} spinning={spinning} delay={0}/>
                                <Reel symbols={options} finalSymbol={result[1]} spinning={spinning} delay={0.15}/>
                                <Reel symbols={options} finalSymbol={result[2]} spinning={spinning} delay={0.3}/>
                            </div>

                            <div className="mt-5 flex flex-wrap items-center gap-3">
                                <Button onClick={handleSpin} disabled={!canSpin} className="relative rounded-2xl px-6">
                                    <span id="spinRewardId" className="absolute inset-x-1/2 top-0"/>
                                    <Play className="mr-2 h-4 w-4"/> Spin
                                </Button>
                                <Button variant="secondary" onClick={resetGame} className="rounded-2xl px-6">
                                    <RotateCcw className="mr-2 h-4 w-4"/> Reset
                                </Button>
                                <div className="text-sm text-slate-300">3 match = 5x bet · 2 match = 2x bet</div>
                            </div>
                        </div>

                        {balance < MIN_BET && (
                            <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 font-medium">
                                Not enough points to spin. Hit Reset to play again.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="rounded-3xl border-0 shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-xl">Controls</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="bet">Bet Amount</Label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={decrementBet}
                                        disabled={spinning || bet <= MIN_BET}
                                        className="rounded-xl"
                                    >
                                        <Minus className="h-4 w-4"/>
                                    </Button>
                                    <Input
                                        id="bet"
                                        type="number"
                                        min={MIN_BET}
                                        max={balance}
                                        value={bet}
                                        onChange={(e) => setBet(clampBet(Number(e.target.value) || MIN_BET))}
                                        className="rounded-xl text-center"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={incrementBet}
                                        disabled={spinning || bet + MIN_BET > balance}
                                        className="rounded-xl"
                                    >
                                        <Plus className="h-4 w-4"/>
                                    </Button>
                                </div>
                                <Button
                                    variant="secondary"
                                    onClick={betAll}
                                    disabled={spinning}
                                    className="w-full rounded-2xl"
                                >
                                    Bet All
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="symbols">Customizable Options Array</Label>
                                <Input
                                    id="symbols"
                                    value={optionsInput}
                                    onChange={(e) => setOptionsInput(e.target.value)}
                                    className="rounded-xl"
                                    placeholder="🍒, 🍋, ⭐, 7, 💎, 🍀"
                                />
                                <p className="text-xs text-slate-500">
                                    Comma-separated symbols. Duplicates are removed automatically.
                                </p>
                                <Button variant="secondary" onClick={applyOptions} className="rounded-2xl">
                                    <Settings2 className="mr-2 h-4 w-4"/> Apply Options
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-3xl border-0 shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-xl">Current Config</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-slate-700">
                            <div>
                                <span
                                    className="font-medium">Options Array:</span> [{options.map((o) => `"${o}"`).join(", ")}]
                            </div>
                            <div>
                                <span className="font-medium">Starting Balance:</span> {STARTING_BALANCE}
                            </div>
                            <div>
                                <span className="font-medium">Min Bet / Spin:</span> {MIN_BET}
                            </div>
                            <div>
                                <span className="font-medium">Spins:</span> Unlimited (while balance ≥ {MIN_BET})
                            </div>
                            <div>
                                <span className="font-medium">Payout Rules:</span> 3-match = 5x, 2-match = 2x
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}