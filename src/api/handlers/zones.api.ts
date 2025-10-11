// src/api/handlers/zones.api.ts
import api from '../axios.config';

export interface DeliveryZone {
  address: string;
  lat: number;
  long: number;
  radius: number;
}

export interface ZonesResponse {
  delivery_zones: DeliveryZone[];
}

export interface SaveZonesResponse {
  message: string;
  delivery_zones: DeliveryZone[];
}

export const zonesAPI = {
  getZones: async (): Promise<ZonesResponse> => {
    try {
      const response = await api.get('/delivery-zones');
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to fetch delivery zones');
    }
  },

  saveZones: async (zones: DeliveryZone[]): Promise<SaveZonesResponse> => {
    try {
      const response = await api.post('/delivery-zones', { zones });
      return response.data;
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to save delivery zones');
    }
  },
};