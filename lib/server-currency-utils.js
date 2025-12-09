// Server-side currency utility functions
import PaymentGatewaySettings from '@/models/PaymentGatewaySettings';
import dbConnect from '@/lib/db';

// Get global currency from super admin settings (server-side only)
export async function getGlobalCurrency() {
  try {
    await dbConnect();
    
    const settings = await PaymentGatewaySettings.findOne({ global: true });
    
    if (settings && settings.general && settings.general.currency) {
      return settings.general.currency;
    }
    
    // Default to USD if no settings found
    return 'USD';
  } catch (error) {
    console.error('Error fetching global currency:', error);
    return 'USD';
  }
}
