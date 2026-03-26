import { RateRequest } from '../../domain/models/RateRequest';
import { RateQuote } from '../../domain/models/RateQuote';

export interface Carrier {
  readonly name: string;
  getRates(request: RateRequest): Promise<RateQuote[]>;
}
