import { Gift, Award, Star, Trophy, Crown, Zap, TrendingUp } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';

export function RewardsPage() {
  // Mock user rewards data
  const currentPoints = 3850;
  const nextTierPoints = 5000;
  const progressPercentage = (currentPoints / nextTierPoints) * 100;
  const currentTier = 'Gold';

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
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Rewards Program
          </h1>
          <p className="text-lg text-muted-foreground">
            Earn points with every booking and unlock exclusive benefits
          </p>
        </div>

        {/* Points Overview */}
        <Card className="p-6 mb-8 bg-gradient-to-br from-secondary to-secondary/80">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-white fill-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {currentPoints.toLocaleString()} Points
                  </h2>
                  <p className="text-white/80">Current Tier: {currentTier}</p>
                </div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-sm text-white/90 mb-2">
                  <span>{currentPoints.toLocaleString()} / {nextTierPoints.toLocaleString()} points</span>
                  <span>{nextTierPoints - currentPoints} points to Platinum</span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <Trophy className="w-16 h-16 text-white mx-auto mb-2" />
                <p className="text-white font-bold text-xl">{currentTier} Member</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Available Rewards */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Redeem Rewards
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {availableRewards.map((reward) => (
                  <Card key={reward.id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <reward.icon className="w-6 h-6 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground mb-1">
                          {reward.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {reward.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-secondary">
                            {reward.points} points
                          </span>
                          <Button
                            size="sm"
                            variant={currentPoints >= reward.points ? 'default' : 'outline'}
                            className={currentPoints >= reward.points ? 'bg-secondary hover:bg-secondary/90' : ''}
                            disabled={currentPoints < reward.points}
                          >
                            {currentPoints >= reward.points ? 'Redeem' : 'Locked'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Rewards History */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Rewards History
              </h2>
              <Card className="p-6">
                <div className="space-y-4">
                  {rewardHistory.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          item.type === 'earned' 
                            ? 'bg-[#10b981]/10' 
                            : 'bg-[#f59e0b]/10'
                        }`}>
                          {item.type === 'earned' ? (
                            <TrendingUp className={`w-5 h-5 ${
                              item.type === 'earned' ? 'text-[#10b981]' : 'text-[#f59e0b]'
                            }`} />
                          ) : (
                            <Gift className="w-5 h-5 text-[#f59e0b]" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.date}</p>
                        </div>
                      </div>
                      <div className={`font-bold ${
                        item.type === 'earned' ? 'text-[#10b981]' : 'text-[#f59e0b]'
                      }`}>
                        {item.type === 'earned' ? '+' : ''}{item.points}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* How to Earn */}
            <Card className="p-6">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-secondary" />
                How to Earn Points
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-1">•</span>
                  <span>Earn 1 point per €1 spent on bookings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-1">•</span>
                  <span>Bonus points for booking 3+ nights</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-1">•</span>
                  <span>Double points on weekend bookings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-1">•</span>
                  <span>Special promotions and challenges</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-secondary mt-1">•</span>
                  <span>Refer friends and earn 500 points</span>
                </li>
              </ul>
            </Card>

            {/* Tier Benefits */}
            <Card className="p-6">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-secondary" />
                Membership Tiers
              </h3>
              <div className="space-y-4">
                {Object.entries(tierBenefits).map(([tier, benefits]) => (
                  <div key={tier} className={`p-4 rounded-lg ${
                    tier === currentTier ? 'bg-secondary/10 border-2 border-secondary' : 'bg-muted/30'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-bold text-foreground">{tier}</h4>
                      {tier === currentTier && (
                        <span className="text-xs bg-secondary text-white px-2 py-0.5 rounded-full">
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
