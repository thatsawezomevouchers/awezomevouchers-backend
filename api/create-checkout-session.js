import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { country, city, name, email, phone, price } = req.body;

  // Validate required fields
  if (!country || !city || !email) {
    return res.status(400).json({ error: 'Missing required fields: country, city, email' });
  }

  const finalPrice = price || 99;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Vacation Voucher - ${city}, ${country}`,
              description: `Customer: ${name || 'Not provided'} | Email: ${email} | Phone: ${phone || 'Not provided'}`
            },
            unit_amount: finalPrice * 100,
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: 'https://awezomevouchers.vercel.app/success.html',
      cancel_url: 'https://awezomevouchers.vercel.app/cancel.html',
      metadata: {
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
        destination_country: country,
        destination_city: city
      }
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Failed to create checkout session: ' + error.message });
  }
}
