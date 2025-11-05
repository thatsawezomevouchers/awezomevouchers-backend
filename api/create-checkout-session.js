import Stripe from 'stripe';
import nodemailer from 'nodemailer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Email transporter
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { country, city, name, email, phone, promo, price } = req.body;

  // Validate required fields
  if (!country || !city || !email || !price) {
    return res.status(400).json({ error: 'Missing required fields: country, city, email, price' });
  }

  try {
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
              description: `Customer: ${name || 'Not provided'} | Email: ${email} | Phone: ${phone || 'Not provided'}`
            },
            unit_amount: price * 100,
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
        destination_city: city,
        promo_code: promo || 'None',
        final_price: price.toString()
      }
    });

    // Send email notification
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'thatsawezomevouchers@gmail.com',
      subject: `New Voucher Order - ${name || 'Customer'}`,
      html: `
        <h2>New Vacation Voucher Order! 🎉</h2>
        <h3>Customer Information:</h3>
        <p><strong>Name:</strong> ${name || 'Not provided'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        
        <h3>Order Details:</h3>
        <p><strong>Destination:</strong> ${city}, ${country}</p>
        <p><strong>Promo Code:</strong> ${promo || 'None'}</p>
        <p><strong>Final Price:</strong> $${price}</p>
        
        <h3>Stripe Checkout:</h3>
        <p><strong>Session ID:</strong> ${session.id}</p>
        <p><strong>Payment Status:</strong> Pending</p>
        
        <hr>
        <p><em>Order received at: ${new Date().toLocaleString()}</em></p>
      `
    };

    // Send email (don't await - let it run in background)
    transporter.sendMail(mailOptions).catch(console.error);

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Failed to create checkout session: ' + error.message });
  }
}
