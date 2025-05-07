// import Stripe from 'stripe';

// const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY, {
//   apiVersion: '2020-08-27',
// });

// export default async (req, res) => {
//   if (req.method === 'POST') {
//     const YOUR_DOMAIN = 'http://localhost:3000'; // or your domain
//     const { selectedPlan } = req.body; // Get selected plan from the request body

//     const plans = {
//       yearly: {
//         priceId: 'price_1PKDms09wBOdwPD6qdgyjavf', // Replace with your actual price ID
//         plan: 'Yearly',
//         validityPeriod: '365', // days
//       },
//       monthly: {
//         priceId: 'price_1PKDoy09wBOdwPD6iRcRkskF', // Replace with your actual price ID
//         plan: 'Monthly',
//         validityPeriod: '30', // days
//       }
//     };

//     const selectedPlanDetails = plans[selectedPlan];

//     if (!selectedPlanDetails) {
//       return res.status(400).json({ error: 'Invalid plan selected' });
//     }

//     try {
//       const session = await stripe.checkout.sessions.create({
//         payment_method_types: ['card'],
//         line_items: [{
//           price: selectedPlanDetails.priceId,
//           quantity: 1,
//         }],
//         mode: 'subscription',
//         success_url: `${YOUR_DOMAIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
//         cancel_url: `${YOUR_DOMAIN}/payment-failure`,
//         metadata: {
//           plan: selectedPlanDetails.plan,
//           validityPeriod: selectedPlanDetails.validityPeriod,
//         },
//       });

//       res.status(200).json({ id: session.id });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   } else {
//     res.setHeader('Allow', 'POST');
//     res.status(405).end('Method Not Allowed');
//   }
// };
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { selectedPlan, userId } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: selectedPlan === 'yearly' ? process.env.STRIPE_YEARLY_PRICE_ID : process.env.STRIPE_MONTHLY_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing`,
      metadata: {
        userId,
        plan: selectedPlan,
      },
    });

    return res.status(200).json({ id: session.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}