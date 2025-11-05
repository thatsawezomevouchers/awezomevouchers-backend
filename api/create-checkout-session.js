import Stripe from "stripe";
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { country, city, name, email, phone, price } = req.body;

    if (!country || !city || !email) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${country} - ${city}`,
              description: `Voucher for ${name} (${phone})`
            },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.origin}/success.html`,
      cancel_url: `${req.headers.origin}/cancel.html`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe Error:", err);
    res.status(500).json({ error: err.message });
  }
}
