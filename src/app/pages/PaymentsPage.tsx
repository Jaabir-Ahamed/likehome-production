import { useState } from 'react';
import { CreditCard, Plus, Eye, EyeOff, Trash2, Edit2, Check } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

// Mock payment methods
const initialPaymentMethods = [
  {
    id: 1,
    type: 'visa',
    lastFour: '4242',
    holderName: 'John Anderson',
    expiryMonth: '12',
    expiryYear: '2028',
    isDefault: true,
  },
  {
    id: 2,
    type: 'mastercard',
    lastFour: '5555',
    holderName: 'John Anderson',
    expiryMonth: '08',
    expiryYear: '2027',
    isDefault: false,
  },
  {
    id: 3,
    type: 'amex',
    lastFour: '3782',
    holderName: 'John Anderson',
    expiryMonth: '06',
    expiryYear: '2029',
    isDefault: false,
  },
];

const cardBrandColors: Record<string, string> = {
  visa: 'from-[#1a1f71] to-[#2563eb]',
  mastercard: 'from-[#eb001b] to-[#f79e1b]',
  amex: 'from-[#006fcf] to-[#00b4e5]',
  discover: 'from-[#ff6000] to-[#ff9500]',
};

export function PaymentsPage() {
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods);
  const [showSensitive, setShowSensitive] = useState<Record<number, boolean>>({});
  const [isAddingCard, setIsAddingCard] = useState(false);

  const toggleSensitive = (id: number) => {
    setShowSensitive((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSetDefault = (id: number) => {
    setPaymentMethods(
      paymentMethods.map((method) => ({
        ...method,
        isDefault: method.id === id,
      }))
    );
  };

  const handleDeleteCard = (id: number) => {
    setPaymentMethods(paymentMethods.filter((method) => method.id !== id));
  };

  const renderCardNumber = (lastFour: string, show: boolean) => {
    if (show) {
      return `•••• •••• •••• ${lastFour}`;
    }
    return `•••• •••• •••• ••••`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="font-bold text-[#1f2937] mb-2">Payment Methods</h1>
            <p className="text-[#6b7280]">Manage your saved payment methods securely</p>
          </div>

          <Dialog open={isAddingCard} onOpenChange={setIsAddingCard}>
            <DialogTrigger asChild>
              <Button className="bg-[#2563eb] hover:bg-[#1d4ed8]">
                <Plus className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Payment Method</DialogTitle>
                <DialogDescription>
                  Enter your card details to add a new payment method.
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input
                    id="cardName"
                    placeholder="John Anderson"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expMonth">Month</Label>
                    <Input
                      id="expMonth"
                      placeholder="MM"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expYear">Year</Label>
                    <Input
                      id="expYear"
                      placeholder="YYYY"
                      maxLength={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      type="password"
                      placeholder="123"
                      maxLength={4}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#2563eb] hover:bg-[#1d4ed8]"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsAddingCard(false);
                  }}
                >
                  Add Card
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Security Notice */}
        <Card className="p-6 mb-8 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-[#2563eb] rounded-lg">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1f2937] mb-1">Secure Payment Storage</h3>
              <p className="text-sm text-[#6b7280]">
                Your payment information is encrypted and stored securely. We never share your card details with third parties.
              </p>
            </div>
          </div>
        </Card>

        {/* Payment Methods */}
        <div className="space-y-6">
          {paymentMethods.map((method) => (
            <Card key={method.id} className="overflow-hidden border-gray-200">
              <div className="flex flex-col lg:flex-row">
                {/* Card Visual */}
                <div
                  className={`lg:w-96 p-8 bg-gradient-to-br ${
                    cardBrandColors[method.type]
                  } text-white relative`}
                >
                  {method.isDefault && (
                    <Badge className="absolute top-4 right-4 bg-[#10b981] hover:bg-[#059669] border-0">
                      <Check className="w-3 h-3 mr-1" />
                      Default
                    </Badge>
                  )}
                  <div className="mb-8">
                    <CreditCard className="w-12 h-12 opacity-80" />
                  </div>
                  <div className="mb-6">
                    <div className="text-2xl font-mono tracking-wider mb-2">
                      {renderCardNumber(method.lastFour, showSensitive[method.id] || false)}
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-xs opacity-80 mb-1">CARDHOLDER</div>
                      <div className="font-medium">{method.holderName}</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-80 mb-1">EXPIRES</div>
                      <div className="font-medium">
                        {showSensitive[method.id]
                          ? `${method.expiryMonth}/${method.expiryYear}`
                          : '••/••'}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-8 right-8">
                    <div className="text-xl font-bold uppercase">{method.type}</div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex-1 p-8 bg-white">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-[#1f2937] mb-2">
                        {method.type.charAt(0).toUpperCase() + method.type.slice(1)} ending in {method.lastFour}
                      </h3>
                      <p className="text-sm text-[#6b7280]">
                        Added on January 15, 2024
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => toggleSensitive(method.id)}
                      >
                        {showSensitive[method.id] ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Hide Card Details
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Show Card Details
                          </>
                        )}
                      </Button>

                      {!method.isDefault && (
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleSetDefault(method.id)}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Set as Default
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:border-red-300"
                        onClick={() => handleDeleteCard(method.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Card
                      </Button>
                    </div>

                    <Separator />

                    <div className="text-xs text-[#6b7280] space-y-1">
                      <p>• Used for {Math.floor(Math.random() * 10) + 5} bookings</p>
                      <p>• Last used on February {Math.floor(Math.random() * 28) + 1}, 2026</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {paymentMethods.length === 0 && (
            <Card className="p-12 text-center border-gray-200">
              <CreditCard className="w-16 h-16 text-[#6b7280] mx-auto mb-4" />
              <h3 className="font-semibold text-[#1f2937] mb-2">No Payment Methods</h3>
              <p className="text-[#6b7280] mb-6">
                Add a payment method to make booking faster and easier.
              </p>
              <Button
                className="bg-[#2563eb] hover:bg-[#1d4ed8]"
                onClick={() => setIsAddingCard(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Payment Method
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
