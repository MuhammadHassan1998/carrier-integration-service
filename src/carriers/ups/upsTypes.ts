export interface UpsAddress {
  AddressLine?: string[];
  City: string;
  StateProvinceCode: string;
  PostalCode: string;
  CountryCode: string;
}

export interface UpsParty {
  Address: UpsAddress;
}

export interface UpsDimensions {
  UnitOfMeasurement: { Code: string };
  Length: string;
  Width: string;
  Height: string;
}

export interface UpsPackage {
  PackagingType: { Code: string };
  Dimensions?: UpsDimensions;
  PackageWeight: {
    UnitOfMeasurement: { Code: string };
    Weight: string;
  };
}

export interface UpsRateRequest {
  RateRequest: {
    Request: {
      TransactionReference: {
        CustomerContext: string;
      };
    };
    Shipment: {
      Shipper: UpsParty;
      ShipTo: UpsParty;
      ShipFrom: UpsParty;
      Package: UpsPackage[];
      Service?: { Code: string };
    };
  };
}

export interface UpsMonetaryAmount {
  CurrencyCode: string;
  MonetaryValue: string;
}

export interface UpsRatedShipment {
  Service: { Code: string };
  TotalCharges: UpsMonetaryAmount;
  TransportationCharges: UpsMonetaryAmount;
  ServiceOptionsCharges: UpsMonetaryAmount;
  GuaranteedDelivery?: {
    BusinessDaysInTransit: string;
  };
  RatedShipmentAlert?: Array<{ Code: string; Description: string }>;
}

export interface UpsRateResponse {
  RateResponse: {
    Response: {
      ResponseStatus: {
        Code: string;
        Description: string;
      };
    };
    RatedShipment: UpsRatedShipment[];
  };
}

export interface UpsErrorResponse {
  response: {
    errors: Array<{
      code: string;
      message: string;
    }>;
  };
}
