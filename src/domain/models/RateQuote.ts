import { Currency } from '../types';

export interface RateQuote {
  carrier: string;
  serviceCode: string;
  serviceName: string;
  totalCharge: number;
  currency: Currency;
  transitDays?: number;
  quotedAt: string;
}
