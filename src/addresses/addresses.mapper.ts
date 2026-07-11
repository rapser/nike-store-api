import { Address } from '@prisma/client';
import { AddressResponseDto } from './dto/address-response.dto';

export function toAddressResponse(address: Address): AddressResponseDto {
  return {
    id: address.id,
    street: address.street,
    city: address.city,
    state: address.state,
    zipCode: address.zipCode,
    country: address.country,
    latitude: address.latitude,
    longitude: address.longitude,
    isDefault: address.isDefault,
  };
}
