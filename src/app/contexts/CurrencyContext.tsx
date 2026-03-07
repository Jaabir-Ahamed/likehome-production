import { createContext, useContext, useState, ReactNode } from 'react';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertPrice: (price: number) => number;
  getCurrencySymbol: () => string;
}

const exchangeRates: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
  AUD: 1.52,
  CAD: 1.36,
};

const currencySymbols: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<Currency>('USD');

  const convertPrice = (price: number): number => {
    const converted = price * exchangeRates[currency];
    return Math.round(converted);
  };

  const getCurrencySymbol = (): string => {
    return currencySymbols[currency];
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice, getCurrencySymbol }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
