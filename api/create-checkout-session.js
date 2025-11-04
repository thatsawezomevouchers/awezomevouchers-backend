import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { price, name, email, phone } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "apple_pay"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Awezome Vacation Voucher",
              description: `Voucher for ${name || "Customer"}`
            },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      metadata: { phone },
      success_url: "https://awezomevouchers-frontend.vercel.app/success.html",
      cancel_url: "https://awezomevouchers-frontend.vercel.app/cancel.html",
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: err.message });
  }
}
