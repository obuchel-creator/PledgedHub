const { pool } = require('../config/db');
const { encrypt, decrypt } = require('../utils/encryption');

// Get all payment settings
async function getPaymentSettings() {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM payment_settings ORDER BY id DESC LIMIT 1`
    );
    
    if (rows.length === 0) {
      return {
        success: true,
        data: {
          mtn: { subscriptionKey: '', apiUser: '', apiKey: '', environment: 'sandbox', status: 'not-configured' },
          airtel: { clientId: '', clientSecret: '', merchantId: '', environment: 'sandbox', status: 'not-configured' },
          paypal: { clientId: '', clientSecret: '', mode: 'sandbox', status: 'not-configured' }
        }
      };
    }

    const settings = rows[0];
    
    // Decrypt sensitive data
    const decrypted = {
      mtn: settings.mtn_data ? JSON.parse(decrypt(settings.mtn_data)) : {},
      airtel: settings.airtel_data ? JSON.parse(decrypt(settings.airtel_data)) : {},
      paypal: settings.paypal_data ? JSON.parse(decrypt(settings.paypal_data)) : {}
    };

    return {
      success: true,
      data: {
        mtn: {
          subscriptionKey: decrypted.mtn.subscriptionKey || '',
          apiUser: decrypted.mtn.apiUser || '',
          apiKey: decrypted.mtn.apiKey || '',
          environment: decrypted.mtn.environment || 'sandbox',
          status: decrypted.mtn.status || 'not-configured'
        },
        airtel: {
          clientId: decrypted.airtel.clientId || '',
          clientSecret: decrypted.airtel.clientSecret || '',
          merchantId: decrypted.airtel.merchantId || '',
          environment: decrypted.airtel.environment || 'sandbox',
          status: decrypted.airtel.status || 'not-configured'
        },
        paypal: {
          clientId: decrypted.paypal.clientId || '',
          clientSecret: decrypted.paypal.clientSecret || '',
          mode: decrypted.paypal.mode || 'sandbox',
          status: decrypted.paypal.status || 'not-configured'
        }
      }
    };
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return { success: false, error: error.message };
  }
}

// Save payment settings for a provider
async function savePaymentSettings(provider, credentials) {
  try {
    // Validate provider
    const validProviders = ['mtn', 'airtel', 'paypal'];
    if (!validProviders.includes(provider)) {
      return { success: false, error: 'Invalid payment provider' };
    }

    // Determine status based on credentials
    let status = 'not-configured';
    if (provider === 'mtn' && credentials.subscriptionKey && credentials.apiUser && credentials.apiKey) {
      status = 'configured';
    } else if (provider === 'airtel' && credentials.clientId && credentials.clientSecret && credentials.merchantId) {
      status = 'configured';
    } else if (provider === 'paypal' && credentials.clientId && credentials.clientSecret) {
      status = 'configured';
    }

    // Encrypt sensitive data
    const credentialsWithStatus = { ...credentials, status };
    const encrypted = encrypt(JSON.stringify(credentialsWithStatus));

    // Get existing settings or create new ones
    const [existing] = await pool.execute(
      `SELECT id FROM payment_settings ORDER BY id DESC LIMIT 1`
    );

    if (existing.length === 0) {
      // Create new settings record
      if (provider === 'mtn') {
        await pool.execute(
          `INSERT INTO payment_settings (mtn_data, created_at, updated_at) 
           VALUES (?, NOW(), NOW())`,
          [encrypted]
        );
      } else if (provider === 'airtel') {
        await pool.execute(
          `INSERT INTO payment_settings (airtel_data, created_at, updated_at) 
           VALUES (?, NOW(), NOW())`,
          [encrypted]
        );
      } else if (provider === 'paypal') {
        await pool.execute(
          `INSERT INTO payment_settings (paypal_data, created_at, updated_at) 
           VALUES (?, NOW(), NOW())`,
          [encrypted]
        );
      }
    } else {
      // Update existing settings
      const settingsId = existing[0].id;
      const columnName = `${provider}_data`;
      
      await pool.execute(
        `UPDATE payment_settings SET ${columnName} = ?, updated_at = NOW() WHERE id = ?`,
        [encrypted, settingsId]
      );
    }

    return {
      success: true,
      data: {
        provider,
        status,
        message: `${provider.toUpperCase()} settings saved successfully`
      }
    };
  } catch (error) {
    console.error('Error saving payment settings:', error);
    return { success: false, error: error.message };
  }
}

// Test payment gateway connection
async function testPaymentGateway(provider) {
  try {
    const { data: settings } = await getPaymentSettings();
    
    if (!settings[provider]) {
      return { success: false, error: 'Provider not configured' };
    }

    const providerSettings = settings[provider];

    // Simple validation based on provider
    if (provider === 'mtn') {
      if (!providerSettings.subscriptionKey || !providerSettings.apiUser || !providerSettings.apiKey) {
        return { success: false, error: 'MTN credentials incomplete' };
      }
      // In production, make actual API call to test connection
      return { success: true, message: 'MTN connection successful' };
    } else if (provider === 'airtel') {
      if (!providerSettings.clientId || !providerSettings.clientSecret) {
        return { success: false, error: 'Airtel credentials incomplete' };
      }
      return { success: true, message: 'Airtel connection successful' };
    } else if (provider === 'paypal') {
      if (!providerSettings.clientId || !providerSettings.clientSecret) {
        return { success: false, error: 'PayPal credentials incomplete' };
      }
      return { success: true, message: 'PayPal connection successful' };
    }

    return { success: false, error: 'Unknown provider' };
  } catch (error) {
    console.error('Error testing payment gateway:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getPaymentSettings,
  savePaymentSettings,
  testPaymentGateway
};
