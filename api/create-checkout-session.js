// api/create-checkout-session.js
import Stripe from "stripe";

/**
 * Serverless endpoint for creating Stripe Checkout Sessions.
 * Deploy to Vercel in the repository "awezomevouchers-backend" under /api/create-checkout-session.js
 *
 * Requirements:
 * - Environment variable STRIPE_SECRET_KEY must be set in the Vercel project (Production).
 */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    console.error("Missing STRIPE_SECRET_KEY env var");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const stripe = new Stripe(stripeKey);

  try {
    const { country, city, name, email, phone, price } = req.body || {};

    if (!country || !city || !email || !price) {
      return res.status(400).json({ error: "Missing required fields (country, city, email, price)." });
    }

    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${country} — ${city}`,
              description: `Voucher for ${name || "Customer"} (${phone || "no phone"})`,
            },
            unit_amount: Math.round(Number(price) * 100),
          },
          quantity: 1,
        },
      ],
      // redirect back to the calling origin if available (works with Vercel)
      success_url: `${req.headers.origin || "https://awezomevouchers-frontend.vercel.app"}/success.html`,
      cancel_url: `${req.headers.origin || "https://awezomevouchers-frontend.vercel.app"}/cancel.html`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    return res.status(500).json({ error: err.message || "Failed to create session" });
  }
}
