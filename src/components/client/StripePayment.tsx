// FILE PATH: src/components/client/StripePayment.tsx

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { CreditCard, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentAPI } from '../../api/handlers/payment.api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PaymentFormProps {
  orderId: number;
  totalAmount: number;
  onSuccess: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  orderId,
  totalAmount,
  onSuccess,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      // Create payment method
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (error) {
        setErrorMessage(error.message || 'Failed to create payment method');
        toast.error(error.message || 'Failed to create payment method');
        setIsProcessing(false);
        return;
      }

      // Send to backend for processing
      const response = await paymentAPI.processPayment({
        payment_method_id: paymentMethod.id,
        order_id: orderId,
      });

      if (response.success) {
        toast.success('Payment successful!');
        onSuccess();
      } else {
        setErrorMessage(response.message || 'Payment failed');
        toast.error(response.message || 'Payment failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setErrorMessage(error.message || 'An unexpected error occurred');
      toast.error(error.message || 'An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        fontFamily: 'system-ui, sans-serif',
        '::placeholder': {
          color: '#9ca3af',
        },
      },
      invalid: {
        color: '#dc2626',
        iconColor: '#dc2626',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Element */}
      <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Card Details
        </label>
        <div className="p-4 border-2 border-gray-200 rounded-lg focus-within:border-green-500 transition-colors">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900 mb-1">Payment Error</h4>
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-lg shadow-lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pay ${totalAmount.toFixed(2)} AUD
          </>
        )}
      </button>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
        <CheckCircle2 className="w-4 h-4 text-green-600" />
        <span>Secure payment powered by Stripe</span>
      </div>
    </form>
  );
};

interface StripePaymentProps {
  orderId: number;
  totalAmount: number;
  onSuccess: () => void;
}

const StripePayment: React.FC<StripePaymentProps> = ({
  orderId,
  totalAmount,
  onSuccess,
}) => {
  // Safety check
  const safeAmount = isNaN(totalAmount) || totalAmount <= 0 ? 0 : totalAmount;

  if (safeAmount === 0) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <XCircle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="text-lg font-bold text-red-900">Payment Error</h3>
            <p className="text-sm text-red-700">Invalid order amount. Please refresh the page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border-2 border-green-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-100 rounded-xl border-2 border-green-300">
          <CreditCard className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Complete Payment</h3>
          <p className="text-sm text-gray-600">
            Total Amount: <span className="font-bold text-green-600">${safeAmount.toFixed(2)} AUD</span>
          </p>
        </div>
      </div>

      <Elements stripe={stripePromise}>
        <PaymentForm
          orderId={orderId}
          totalAmount={safeAmount}
          onSuccess={onSuccess}
        />
      </Elements>
    </div>
  );
};

export default StripePayment;