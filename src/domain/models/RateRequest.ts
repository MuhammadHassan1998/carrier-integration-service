import { Address } from './Address';
import { Package } from './Package';

export interface RateRequest {
  requestId: string;
  shipper: Address;
  recipient: Address;
  packages: Package[];
  serviceCode?: string;
}
