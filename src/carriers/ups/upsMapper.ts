import { Address } from '../../domain/models/Address';
import { Package } from '../../domain/models/Package';
import { RateRequest } from '../../domain/models/RateRequest';
import { RateQuote } from '../../domain/models/RateQuote';
import { Currency } from '../../domain/types';
import { UpsAddress, UpsPackage, UpsRateRequest, UpsRatedShipment } from './upsTypes';

const UPS_SERVICE_NAMES: Record<string, string> = {
  '01': 'UPS Next Day Air',
  '02': 'UPS 2nd Day Air',
  '03': 'UPS Ground',
  '12': 'UPS 3 Day Select',
  '13': 'UPS Next Day Air Saver',
  '14': 'UPS Next Day Air Early AM',
  '59': 'UPS 2nd Day Air AM',
  '65': 'UPS Worldwide Saver',
};

function toUpsAddress(address: Address): UpsAddress {
  return {
    AddressLine: address.street,
    City: address.city,
    StateProvinceCode: address.state,
    PostalCode: address.postalCode,
    CountryCode: address.countryCode,
  };
}

function toUpsPackage(pkg: Package): UpsPackage {
  const mapped: UpsPackage = {
    PackagingType: { Code: '02' },
    PackageWeight: {
      UnitOfMeasurement: { Code: pkg.weightUnit },
      Weight: String(pkg.weight),
    },
  };

  if (pkg.length !== undefined && pkg.width !== undefined && pkg.height !== undefined) {
    mapped.Dimensions = {
      UnitOfMeasurement: { Code: pkg.dimensionUnit ?? 'IN' },
      Length: String(pkg.length),
      Width: String(pkg.width),
      Height: String(pkg.height),
    };
  }

  return mapped;
}

export function mapToUpsRequest(request: RateRequest): UpsRateRequest {
  const shipperAddress = toUpsAddress(request.shipper);

  return {
    RateRequest: {
      Request: {
        TransactionReference: {
          CustomerContext: request.requestId,
        },
      },
      Shipment: {
        Shipper: { Address: shipperAddress },
        ShipFrom: { Address: shipperAddress },
        ShipTo: { Address: toUpsAddress(request.recipient) },
        Package: request.packages.map(toUpsPackage),
        ...(request.serviceCode && { Service: { Code: request.serviceCode } }),
      },
    },
  };
}

export function mapFromUpsResponse(shipments: UpsRatedShipment[]): RateQuote[] {
  return shipments.map((shipment): RateQuote => {
    const serviceCode = shipment.Service.Code;
    const transitDays = shipment.GuaranteedDelivery?.BusinessDaysInTransit
      ? parseInt(shipment.GuaranteedDelivery.BusinessDaysInTransit, 10)
      : undefined;

    return {
      carrier: 'UPS',
      serviceCode,
      serviceName: UPS_SERVICE_NAMES[serviceCode] ?? `UPS Service ${serviceCode}`,
      totalCharge: parseFloat(shipment.TotalCharges.MonetaryValue),
      currency: shipment.TotalCharges.CurrencyCode as Currency,
      transitDays,
      quotedAt: new Date().toISOString(),
    };
  });
}
