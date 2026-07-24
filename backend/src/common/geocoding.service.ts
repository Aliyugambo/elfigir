import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GeocodingService {
  constructor(private configService: ConfigService) {}

  async geocode(address: string, city: string, state: string): Promise<{ latitude: number; longitude: number }> {
    const query = encodeURIComponent(`${address}, ${city}, ${state}`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Elfigir-Food-Delivery/1.0',
        },
      }) as Response;

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const data = await response.json() as Array<{ lat: string; lon: string }>;

      if (!data || data.length === 0) {
        throw new BadRequestException('Unable to geocode the provided address. Please check the address, city, and state.');
      }

      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Geocoding service is currently unavailable. Please try again later.');
    }
  }
}
