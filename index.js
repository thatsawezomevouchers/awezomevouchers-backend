import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Awezome Vouchers Backend is running ✅");
});

app.post("/create-checkout-session", async (req, res) => {
  const { destination, promo } = req.body;

  let price = 99; // default
  if (promo === "SAVE20") price = 79;
  if (promo === "SAVE50") price = 49;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Voucher for ${destination}` },
            unit_amount: price * 100,
          },
          quantity: 1,
        },
      ],
      success_url: "https://awezomevouchers.vercel.app/success.html",
      cancel_url: "https://awezomevouchers.vercel.app/cancel.html",
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

export default app;
