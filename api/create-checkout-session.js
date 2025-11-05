import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Received request:', req.body);
    
    const { country, city, name, email, phone, promo, price } = req.body;

    // Validate required fields
    if (!country || !city || !email || !price) {
      console.log('Missing fields:', { country, city, email, price });
      return res.status(400).json({ 
        error: 'Missing required fields: country, city, email, price',
        received: { country, city, email, price }
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Vacation Voucher - ${city}, ${country}`,
              description: `Customer: ${name || 'Not provided'} | Email: ${email}`
            },
            unit_amount: Math.round(price * 100), // Ensure it's an integer
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: 'https://awezomevouchers.vercel.app/success.html',
      cancel_url: 'https://awezomevouchers.vercel.app/cancel.html',
      metadata: {
        customer_name: name || '',
        customer_email: email,
        customer_phone: phone || '',
        destination_country: country,
        destination_city: city,
        promo_code: promo || 'None',
        final_price: price.toString()
      }
    });

    console.log('Stripe session created:', session.id);
    
    res.status(200).json({ 
      url: session.url,
      sessionId: session.id 
    });
    
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
}
