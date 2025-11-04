// FILE PATH: src/api/handlers/payment.api.ts

import api from '../axios.config';

export interface ProcessPaymentPayload {
  payment_method_id: string;
  order_id: number;
}

export interface ProcessPaymentResponse {
  success: boolean;
  message: string;
  order?: {
    id: number;
    payment_status: string;
    workflow: string;
  };
}

export const paymentAPI = {
  processPayment: async (payload: ProcessPaymentPayload): Promise<ProcessPaymentResponse> => {
    const response = await api.post('/process-payment', payload);
    return response.data;
  },
};