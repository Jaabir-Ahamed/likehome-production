import {Award, Crown, Gift, Laugh, Star, TrendingUp, Trophy, Zap} from 'lucide-react';
import {Card} from '../components/ui/card';
import {Button} from '../components/ui/button';
import {Progress} from '../components/ui/progress';
import {useRewards} from '../contexts/RewardsContext';
import {Link} from "react-router";

export function RewardsPage() {
    const {points, loading: rewardsLoading} = useRewards();
    const currentPoints = points ?? 0;

    const currentTier =
        currentPoints >= 20000
            ? 'Diamond'
            : currentPoints >= 10000
                ? 'Platinum'
                : currentPoints >= 5000
                    ? 'Gold'
                    : 'Silver';

    const nextTierPoints =
        currentTier === 'Silver'
            ? 5000
            : currentTier === 'Gold'
                ? 10000
                : currentTier === 'Platinum'
                    ? 20000
                    : null;

    const currentTierFloor =
        currentTier === 'Silver'
            ? 0
            : currentTier === 'Gold'
                ? 5000
                : currentTier === 'Platinum'
                    ? 10000
                    : 20000;

    const progressPercentage = nextTierPoints
        ? Math.min(
            ((currentPoints - currentTierFloor) / (nextTierPoints - currentTierFloor)) * 100,
            100
        )
        : 100;

    const rewardHistory = [
        {
            id: 1,
            title: 'Booking at The Grand Palace Hotel',
            points: 320,
            date: 'March 15, 2026',
            type: 'earned',
        },
        {
            id: 2,
            title: '10% Discount Redeemed',
            points: -500,
            date: 'March 10, 2026',
            type: 'redeemed',
        },
        {
            id: 3,
            title: 'Booking at Ocean View Resort',
            points: 180,
            date: 'February 28, 2026',
            type: 'earned',
        },
        {
            id: 4,
            title: 'Welcome Bonus',
            points: 1000,
            date: 'February 1, 2026',
            type: 'earned',
        },
    ];

    const availableRewards = [
        {
            id: 0,
            title: 'Slot Machine',
            points: 50,
            description: 'Spin for a colorful chance to win extra reward points and big smiles.',
            icon: Laugh,
        },
        {
            id: 1,
            title: '10% Off Next Booking',
            points: 500,
            description: 'Get 10% discount on your next hotel booking',
            icon: Gift,
        },
        {
            id: 2,
            title: 'Free Breakfast Upgrade',
            points: 750,
            description: 'Complimentary breakfast for two at participating hotels',
            icon: Award,
        },
        {
            id: 3,
            title: 'Room Upgrade',
            points: 1500,
            description: 'Free room upgrade to next category (subject to availability)',
            icon: Crown,
        },
        {
            id: 4,
            title: 'Late Checkout',
            points: 300,
            description: 'Enjoy late checkout until 2 PM at any hotel',
            icon: Zap,
        },
        {
            id: 5,
            title: '€50 Travel Credit',
            points: 2000,
            description: 'Redeem for €50 credit on any booking',
            icon: Trophy,
        },
    ];

    const tierBenefits = {
        Silver: ['5% bonus points', 'Early check-in', 'Free Wi-Fi'],
        Gold: ['10% bonus points', 'Free breakfast', 'Priority support', 'Late checkout'],
        Platinum: ['15% bonus points', 'Free upgrades', 'Exclusive deals', 'Concierge service'],
        Diamond: ['20% bonus points', 'Suite upgrades', 'VIP support', 'Exclusive partner perks'],
    };

    return (
        <div className="min-h-screen bg-background py-8">
            <div className="container mx-auto max-w-7xl px-4">
                <div className="mb-8">
                    <h1 className="mb-2 text-3xl font-bold text-foreground md:text-4xl">
                        Rewards Program
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Earn points with every booking and unlock exclusive benefits
                    </p>
                </div>

                <Card className="mb-8 bg-gradient-to-br from-secondary to-secondary/80 p-6">
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="md:col-span-2">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                                    <Star className="h-6 w-6 fill-white text-white"/>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">
                                        {rewardsLoading ? 'Loading...' : `${currentPoints.toLocaleString()} Points`}
                                    </h2>
                                    <p className="text-white/80">Current Tier: {currentTier}</p>
                                </div>
                            </div>

                            <div className="mb-3">
                                <div className="mb-2 flex justify-between text-sm text-white/90">
                                    <span>
                                        {nextTierPoints
                                            ? `${currentPoints.toLocaleString()} / ${nextTierPoints.toLocaleString()} points`
                                            : `${currentPoints.toLocaleString()} points`}
                                    </span>
                                    <span>
                                        {nextTierPoints
                                            ? `${Math.max(nextTierPoints - currentPoints, 0)} points to ${
                                                nextTierPoints === 5000
                                                    ? 'Gold'
                                                    : nextTierPoints === 10000
                                                        ? 'Platinum'
                                                        : 'Diamond'
                                            }`
                                            : 'Top tier reached'}
                                    </span>
                                </div>
                                <Progress value={progressPercentage} className="h-3"/>
                            </div>
                        </div>

                        <div className="flex items-center justify-center">
                            <div className="text-center">
                                <Trophy className="mx-auto mb-2 h-16 w-16 text-white"/>
                                <p className="text-xl font-bold text-white">{currentTier} Member</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="space-y-8 lg:col-span-2">
                        <div>
                            <h2 className="mb-4 text-2xl font-bold text-foreground">Redeem Rewards</h2>

                            <div className="grid gap-4 md:grid-cols-2">
                                {availableRewards.map((reward) => {
                                    const isSlotMachine = reward.id === 0;
                                    const RewardIcon = reward.icon;

                                    return (
                                        <Card
                                            key={reward.id}
                                            className={
                                                isSlotMachine
                                                    ? 'group relative overflow-hidden border border-white/20 bg-gradient-to-br from-fuchsia-500/70 via-pink-500/60 to-amber-400/60 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-pink-500/30'
                                                    : 'p-6 transition-shadow hover:shadow-lg'
                                            }
                                        >
                                            {isSlotMachine && (
                                                <>
                                                    <div className="absolute inset-0 bg-white/10 backdrop-blur-xl"/>
                                                    <div
                                                        className="absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-fuchsia-300/30 blur-3xl"/>
                                                    <div
                                                        className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-yellow-300/40 blur-3xl"/>
                                                    <div
                                                        className="absolute left-1/2 top-0 h-24 w-24 -translate-x-1/2 rounded-full bg-white/20 blur-2xl"/>
                                                    <div
                                                        className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
                                                        Lucky Pick
                                                    </div>
                                                </>
                                            )}

                                            <div className="relative flex items-start gap-4">
                                                <div
                                                    className={
                                                        isSlotMachine
                                                            ? 'flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-white/30 bg-white/20 shadow-lg backdrop-blur-md'
                                                            : 'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary/10'
                                                    }
                                                >
                                                    <RewardIcon
                                                        className={
                                                            isSlotMachine
                                                                ? 'h-11 w-11 text-yellow-100 drop-shadow-[0_0_18px_rgba(255,240,150,0.95)]'
                                                                : 'h-6 w-6 text-secondary'
                                                        }
                                                    />
                                                </div>

                                                <div className="flex-1">
                                                    <h3
                                                        className={
                                                            isSlotMachine
                                                                ? 'mb-1 text-xl font-extrabold text-white'
                                                                : 'mb-1 font-bold text-foreground'
                                                        }
                                                    >
                                                        {reward.title}
                                                    </h3>

                                                    <p
                                                        className={
                                                            isSlotMachine
                                                                ? 'mb-4 text-sm text-white/90'
                                                                : 'mb-3 text-sm text-muted-foreground'
                                                        }
                                                    >
                                                        {reward.description}
                                                    </p>

                                                    {isSlotMachine && (
                                                        <div className="mb-4 flex flex-wrap items-center gap-2">
                                                            <span
                                                                className="rounded-full border border-white/20 bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                                                                Big smiles
                                                            </span>
                                                            <span
                                                                className="rounded-full border border-yellow-200/20 bg-yellow-300/20 px-3 py-1 text-xs font-medium text-yellow-50 backdrop-blur-md">
                                                                Earn points
                                                            </span>
                                                            <span
                                                                className="rounded-full border border-pink-200/20 bg-pink-300/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                                                                Extra fun
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between">
                                                        <span
                                                            className={
                                                                isSlotMachine
                                                                    ? 'text-lg font-bold text-yellow-50'
                                                                    : 'font-bold text-secondary'
                                                            }
                                                        >
                                                            {reward.points} points
                                                        </span>

                                                        <Button
                                                            size="sm"
                                                            variant={currentPoints >= reward.points ? 'default' : 'outline'}
                                                            className={
                                                                isSlotMachine
                                                                    ? currentPoints >= reward.points
                                                                        ? 'border-0 bg-yellow-300 text-blue-800 font-extrabold shadow-lg shadow-yellow-500/30 hover:bg-yellow-200 hover:scale-[1.40] transition-all'
                                                                        : 'border border-white/20 bg-white/10 text-white/70 backdrop-blur-md'
                                                                    : currentPoints >= reward.points
                                                                        ? 'bg-secondary hover:bg-secondary/90'
                                                                        : ''
                                                            }
                                                            disabled={currentPoints < reward.points}
                                                        >
                                                            {currentPoints >= reward.points
                                                                ? isSlotMachine
                                                                    ?
                                                                    <Link to={`/slot`}>
                                                                        Play Now
                                                                    </Link>


                                                                    : 'Redeem'
                                                                : 'Locked'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <h2 className="mb-4 text-2xl font-bold text-foreground">Rewards History</h2>
                            <Card className="p-6">
                                <div className="space-y-4">
                                    {rewardHistory.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between border-b border-border py-3 last:border-0"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                                                        item.type === 'earned'
                                                            ? 'bg-[#10b981]/10'
                                                            : 'bg-[#f59e0b]/10'
                                                    }`}
                                                >
                                                    {item.type === 'earned' ? (
                                                        <TrendingUp className="h-5 w-5 text-[#10b981]"/>
                                                    ) : (
                                                        <Gift className="h-5 w-5 text-[#f59e0b]"/>
                                                    )}
                                                </div>

                                                <div>
                                                    <p className="font-medium text-foreground">{item.title}</p>
                                                    <p className="text-sm text-muted-foreground">{item.date}</p>
                                                </div>
                                            </div>

                                            <div
                                                className={`font-bold ${
                                                    item.type === 'earned' ? 'text-[#10b981]' : 'text-[#f59e0b]'
                                                }`}
                                            >
                                                {item.type === 'earned' ? '+' : ''}
                                                {item.points}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Card className="p-6">
                            <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
                                <Star className="h-5 w-5 text-secondary"/>
                                How to Earn Points
                            </h3>
                            <ul className="space-y-3 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 text-secondary">•</span>
                                    <span>Earn 1 point per €1 spent on bookings</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 text-secondary">•</span>
                                    <span>Bonus points for booking 3+ nights</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 text-secondary">•</span>
                                    <span>Double points on weekend bookings</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 text-secondary">•</span>
                                    <span>Special promotions and challenges</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 text-secondary">•</span>
                                    <span>Refer friends and earn 500 points</span>
                                </li>
                            </ul>
                        </Card>

                        <Card className="p-6">
                            <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground">
                                <Trophy className="h-5 w-5 text-secondary"/>
                                Membership Tiers
                            </h3>

                            <div className="space-y-4">
                                {Object.entries(tierBenefits).map(([tier, benefits]) => (
                                    <div
                                        key={tier}
                                        className={`rounded-lg p-4 ${
                                            tier === currentTier
                                                ? 'border-2 border-secondary bg-secondary/10'
                                                : 'bg-muted/30'
                                        }`}
                                    >
                                        <div className="mb-2 flex items-center gap-2">
                                            <h4 className="font-bold text-foreground">{tier}</h4>
                                            {tier === currentTier && (
                                                <span
                                                    className="rounded-full bg-secondary px-2 py-0.5 text-xs text-white">
                                                    Current
                                                </span>
                                            )}
                                        </div>

                                        <ul className="space-y-1 text-sm text-muted-foreground">
                                            {benefits.map((benefit, idx) => (
                                                <li key={idx} className="flex items-center gap-2">
                                                    <span className="text-secondary">✓</span>
                                                    {benefit}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}