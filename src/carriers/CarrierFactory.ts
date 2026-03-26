import { Config } from '../config/env';
import { HttpClient } from '../http/httpClient';
import { TokenManager } from '../auth/tokenManager';
import { Carrier } from './base/Carrier';
import { UpsClient } from './ups/upsClient';
import { UPSCarrier } from './ups/UPSCarrier';

export type CarrierName = 'ups';

export class CarrierFactory {
  constructor(
    private readonly config: Config,
    private readonly http: HttpClient,
  ) {}

  create(carrier: CarrierName): Carrier {
    switch (carrier) {
      case 'ups': {
        const tokenManager = new TokenManager(this.config, this.http);
        const client = new UpsClient(this.config, tokenManager, this.http);
        return new UPSCarrier(client);
      }

      default: {
        const _: never = carrier;
        throw new Error(`Unknown carrier: ${String(_)}`);
      }
    }
  }

  createAll(): Carrier[] {
    const supported: CarrierName[] = ['ups'];
    return supported.map((name) => this.create(name));
  }
}
