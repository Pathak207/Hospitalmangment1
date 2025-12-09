import dbConnect from '../lib/dbConnect.js';
import SubscriptionPlan from '../models/SubscriptionPlan.js';
import { stripeUtils } from '../lib/stripe.js';

async function seedStripePrices() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Get all subscription plans
    const plans = await SubscriptionPlan.find({ isActive: true });
    console.log(`Found ${plans.length} subscription plans`);

    for (const plan of plans) {
      console.log(`\nProcessing plan: ${plan.name}`);

      // Skip if already has Stripe price IDs
      if (plan.stripePriceIdMonthly && plan.stripePriceIdYearly) {
        console.log(`Plan ${plan.name} already has Stripe price IDs`);
        continue;
      }

      // Create Stripe product
      const productResult = await stripeUtils.createProduct({
        name: plan.name,
        description: plan.description || `${plan.name} subscription plan`
      });

      if (!productResult.success) {
        console.error(`Failed to create product for ${plan.name}:`, productResult.error);
        continue;
      }

      const product = productResult.product;
      console.log(`Created Stripe product: ${product.id}`);

      // Create monthly price
      const monthlyPriceResult = await stripeUtils.createPrice({
        productId: product.id,
        amount: plan.monthlyPrice,
        currency: 'usd',
        interval: 'month'
      });

      if (!monthlyPriceResult.success) {
        console.error(`Failed to create monthly price for ${plan.name}:`, monthlyPriceResult.error);
        continue;
      }

      // Create yearly price
      const yearlyPriceResult = await stripeUtils.createPrice({
        productId: product.id,
        amount: plan.yearlyPrice,
        currency: 'usd',
        interval: 'year'
      });

      if (!yearlyPriceResult.success) {
        console.error(`Failed to create yearly price for ${plan.name}:`, yearlyPriceResult.error);
        continue;
      }

      // Update plan with Stripe price IDs
      plan.stripePriceIdMonthly = monthlyPriceResult.price.id;
      plan.stripePriceIdYearly = yearlyPriceResult.price.id;
      await plan.save();

      console.log(`Updated plan ${plan.name} with price IDs:`);
      console.log(`  Monthly: ${monthlyPriceResult.price.id}`);
      console.log(`  Yearly: ${yearlyPriceResult.price.id}`);
    }

    console.log('\n✅ Stripe prices seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Error seeding Stripe prices:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedStripePrices(); 