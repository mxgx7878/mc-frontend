// FILE PATH: src/api/handlers/payment.api.ts

import api from '../axios.config';
import type { PayInvoiceResponse } from '../../types/clientOrder.types';

/**
 * Pay (mark as paid) a specific invoice
 */
export const paymentAPI = {
  payInvoice: async (invoiceId: number): Promise<PayInvoiceResponse> => {
    const response = await api.post(`/client/invoices/${invoiceId}/pay`);
    return response.data;
  },
};