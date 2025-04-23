import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing STRIPE_SECRET_KEY, Stripe functionality will not work properly');
}

// Initialize Stripe with the secret key
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for the e-commerce app
  
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Stripe payment intent creation
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ 
          message: "Stripe payment processing is unavailable. Please configure STRIPE_SECRET_KEY." 
        });
      }

      const { amount } = req.body;
      
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount provided" });
      }

      // Convert to smallest currency unit (cents for USD)
      const amountInCents = Math.round(amount * 100);

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        // Payment method types supported by your integration
        payment_method_types: ["card"],
        metadata: {
          integration_check: "e_commerce_payment"
        }
      });

      // Send the client secret to the client
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ 
        message: "Error creating payment intent", 
        error: error.message 
      });
    }
  });

  // Validate promo codes
  app.post("/api/apply-promo", (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "No promo code provided" });
      }

      // Mock promo codes (in a real app, these would come from a database)
      const validPromoCodes: Record<string, { type: 'percentage' | 'fixed', value: number }> = {
        "SUMMER2023": { type: "fixed", value: 10 }, // $10 off
        "WELCOME15": { type: "fixed", value: 15 },  // $15 off
        "SAVE20": { type: "fixed", value: 20 }      // $20 off
      };

      if (validPromoCodes[code]) {
        res.json({
          valid: true,
          discount: validPromoCodes[code].value,
          type: validPromoCodes[code].type,
          message: `Promo code ${code} applied successfully!`
        });
      } else {
        res.json({
          valid: false,
          message: "Invalid promo code"
        });
      }
    } catch (error: any) {
      console.error("Error applying promo code:", error);
      res.status(500).json({ 
        message: "Error applying promo code", 
        error: error.message 
      });
    }
  });

  // Verify payment status
  app.get("/api/verify-payment/:paymentIntentId", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ 
          message: "Stripe payment processing is unavailable. Please configure STRIPE_SECRET_KEY." 
        });
      }

      const { paymentIntentId } = req.params;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: "No payment intent ID provided" });
      }

      // Retrieve the payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      // Check if the payment was successful
      if (paymentIntent.status === "succeeded") {
        // In a real app, you would create an order in your database here
        res.json({
          success: true,
          orderId: `order-${Date.now()}`, // Mock order ID
          message: "Payment successful"
        });
      } else {
        res.json({
          success: false,
          status: paymentIntent.status,
          message: "Payment not completed"
        });
      }
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ 
        message: "Error verifying payment", 
        error: error.message 
      });
    }
  });

  // Stripe webhook for payment events
  app.post("/api/stripe-webhook", async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ 
          message: "Stripe payment processing is unavailable. Please configure STRIPE_SECRET_KEY." 
        });
      }

      // Stripe requires the raw body to verify webhooks
      const payload = req.body;
      
      // In a production app, you would verify the webhook signature:
      // const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
      // const signature = req.headers['stripe-signature'];
      // let event;
      // try {
      //   event = stripe.webhooks.constructEvent(payload, signature, endpointSecret);
      // } catch (err) {
      //   return res.status(400).send(`Webhook Error: ${err.message}`);
      // }

      // Handle the event
      // Switch on event.type for different payment scenarios
      // Example: payment_intent.succeeded, payment_intent.payment_failed, etc.
      
      // For this demo, we'll just acknowledge receipt
      res.json({ received: true });
    } catch (error: any) {
      console.error("Error handling webhook:", error);
      res.status(500).json({ 
        message: "Error handling webhook", 
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
