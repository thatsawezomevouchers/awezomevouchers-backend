// api/create-checkout-session.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { country, city, promo } = req.body || {};
    if (!country || !city) return res.status(400).json({ error: "country and city are required" });

    // pricing logic (server authoritative)
    let base = 75;
    if (country === "Special Vouchers" || country === "Cruise Destinations" || country === "Cruise Vacations") base = 100;

    // promo rules
    const p = (promo || "").trim().toLowerCase();
    let final = base;
    if (p === "thats50" && base === 75) final = 50;
    if (p === "thats75" && base === 100) final = 75;
    if (p === "thatsfamily") final = Math.round(base * 0.5);

    const amount = Math.round(final * 100); // cents
    const description = `${country} — ${city}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Vacation Voucher", description },
            unit_amount: amount
          },
          quantity: 1
        }
      ],
      metadata: { country, city, promo: promo || "" },
      customer_email: req.body.customerEmail || undefined,
      success_url: `${process.env.FRONTEND_URL || ""}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || ""}/cancel.html`
    });

    return res.json({ sessionId: session.id });
  } catch (err) {
    console.error("create-checkout error:", err);
    return res.status(500).json({ error: err.message || "internal error" });
  }
}
