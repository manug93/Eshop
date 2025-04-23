import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const CheckoutSuccess = () => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Extract the payment_intent from the URL
        const url = new URL(window.location.href);
        const paymentIntentId = url.searchParams.get('payment_intent');
        
        if (!paymentIntentId) {
          throw new Error('No payment intent ID found');
        }

        // Verify the payment with our backend
        const response = await fetch(`/api/verify-payment/${paymentIntentId}`);
        const data = await response.json();

        if (data.success) {
          setPaymentStatus('success');
          setOrderId(data.orderId);
          toast({
            title: "Payment Successful",
            description: "Your order has been placed successfully!",
          });
        } else {
          setPaymentStatus('failed');
          toast({
            title: "Payment Failed",
            description: data.message || "Your payment could not be processed",
            variant: "destructive",
          });
        }
      } catch (error) {
        setPaymentStatus('failed');
        toast({
          title: "Verification Error",
          description: error instanceof Error ? error.message : "An error occurred while verifying your payment",
          variant: "destructive",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [toast]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <h1 className="text-xl font-medium">Verifying your payment...</h1>
          <p className="text-gray-600 mt-2">Please wait while we confirm your order.</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Failed</h1>
          <p className="text-gray-600 mb-6">
            We couldn't process your payment. Please try again or contact our customer support.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => setLocation('/checkout')}
              className="w-full"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => setLocation('/')}
              variant="outline"
              className="w-full"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="h-8 w-8 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-green-600 mb-4">Order Confirmed!</h1>
        <p className="text-gray-600 mb-2">
          Thank you for your purchase. Your order has been placed successfully.
        </p>
        {orderId && (
          <p className="text-gray-700 font-medium mb-6">
            Order ID: {orderId}
          </p>
        )}
        <p className="text-gray-600 mb-6">
          You will receive an email confirmation shortly.
        </p>
        <div className="space-y-3">
          <Button 
            onClick={() => setLocation('/')}
            className="w-full"
          >
            Continue Shopping
          </Button>
          <Button 
            onClick={() => setLocation('/orders')}
            variant="outline"
            className="w-full"
          >
            View My Orders
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;