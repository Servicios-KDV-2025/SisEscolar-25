import Stripe from "stripe";
import { NextResponse } from "next/server";
 
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: "2022-08-01",
});
 
 
export const paymentSession = async (request, res) => {
  try {
    const { sessionId } = await request.json();
 
    if (!sessionId) {
      return res.status(400).json({ error: "Missing required fields" });
    }
 
    const session = await stripe.checkout.sessions.retrieve(sessionId);
 
    let subscription = null;
    if (session.subscription) {
      subscription = await stripe.subscriptions.retrieve(session.subscription);
    }
 
    return NextResponse.json({
      email: session.customer_details?.email,
      amount: session.amount_total,
      currency: session.currency,
      subscriptionId: session.subscription,
      subscription_start: subscription?.start_date,
      subscription_current_period_start: subscription?.current_period_start,
      subscription_current_period_end: subscription?.current_period_end,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};