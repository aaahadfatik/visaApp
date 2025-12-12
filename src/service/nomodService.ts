import fetch from 'node-fetch';
import { dataSource } from "../datasource";
import { FormSubmission, Payment } from "../entity/";

const API_KEY = process.env.NOMOD_API_KEY;
const BASE_URL = process.env.NOMOD_API_BASE_URL || 'https://api.nomod.com/v1';

// Log configuration on startup (without exposing the full API key)
if (API_KEY) {
  console.log('✅ Nomod API Key is configured');
  console.log(`📡 Nomod Base URL: ${BASE_URL}`);
} else {
  console.warn('⚠️  WARNING: NOMOD_API_KEY is not set! Payment creation will fail.');
}

interface PaymentItem {
    name: string;
    amount: string; // amount as string
    quantity: number;
    sku?: string;
  }
  
  interface PaymentLinkOptions {
    title: string;
    currency: string;
    items: PaymentItem[];
    note?: string;
    success_url: string;
    failure_url: string;
    discount_percentage?: number;
    shipping_address_required?: boolean;
    allow_tip?: boolean;
    allow_tabby?: boolean;
    allow_tamara?: boolean;
    allow_service_fee?: boolean;
    payment_expiry_limit?: number;
    expiry_date?: string;
    custom_fields?: { name: string }[];
    submittedFormId?: string;
  }  

  const submissionRepo = dataSource.getRepository(FormSubmission);
  
  
  export async function createPaymentLink(options: PaymentLinkOptions) {
    const paymentRepo = dataSource.getRepository(Payment);
    let payment: Payment | null = null;
    let paymentSavedToDb = false;
    
    try {
      console.log('🔵 Creating Nomod payment link...');
      
      // 1. First, save a placeholder Payment to DB to get UUID
      payment = paymentRepo.create({
        nomodId: '', // Will be updated after Nomod API call
        title: options.title,
        url: '', // Will be updated after Nomod API call
        amount: '0', // Will be updated after Nomod API call
        currency: options.currency,
        status: 'pending', // Temporary status
        note: options.note || '',
        items: options.items,
        discount: '0',
        service_fee: '0',
        custom_fields: options.custom_fields || [],
        allow_tip: options.allow_tip || false,
        allow_tabby: options.allow_tabby || false,
        allow_tamara: options.allow_tamara || false,
        allow_service_fee: options.allow_service_fee || false,
        success_url: options.success_url,
        failure_url: options.failure_url,
        payment_expiry_limit: options.payment_expiry_limit,
        expiry_date: options.expiry_date,
        requestPayload: options // store full request for debugging
      });

      await paymentRepo.save(payment);
      paymentSavedToDb = true;
      console.log('💾 Payment created in database with ID:', payment.id);

      // 2. Append payment ID to success and failure URLs
      const urlSeparator = (url: string) => url.includes('?') ? '&' : '?';
      const successUrlWithPaymentId = `${options.success_url}${urlSeparator(options.success_url)}paymentId=${encodeURIComponent(payment.id)}`;
      const failureUrlWithPaymentId = `${options.failure_url}${urlSeparator(options.failure_url)}paymentId=${encodeURIComponent(payment.id)}`;
      
      console.log('🔗 Success URL with payment ID:', successUrlWithPaymentId);
      console.log('🔗 Failure URL with payment ID:', failureUrlWithPaymentId);

      // 3. Create the Nomod payment link with updated URLs
      const nomodPayload = {
        ...options,
        success_url: successUrlWithPaymentId,
        failure_url: failureUrlWithPaymentId
      };

      console.log('📤 Request URL:', `${BASE_URL}/links`);
      
      // Log payload details without exposing full sensitive data in production
      if (process.env.NODE_ENV === 'development') {
        console.log('📦 Request payload:', JSON.stringify(nomodPayload, null, 2));
      } else {
        console.log('📦 Payment request:', { title: options.title, currency: options.currency, itemCount: options.items.length });
      }
      
      if (!API_KEY) {
        throw new Error('NOMOD_API_KEY is not configured. Please set the environment variable.');
      }

      const response = await fetch(`${BASE_URL}/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
        },
        body: JSON.stringify(nomodPayload),
      });
    
      console.log('📥 Nomod API Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Nomod API Error Response:', errorText);
        throw new Error(`Nomod API error (${response.status}): ${errorText}`);
      }
    
      const data = await response.json();
      console.log('✅ Nomod payment link created successfully:', data.id);

      // 4. Update the payment record with Nomod response data
      payment.nomodId = data.id;
      payment.url = data.url;
      payment.amount = data.amount;
      payment.status = data.status;
      payment.discount = data.discount;
      payment.service_fee = data.service_fee;
      payment.custom_fields = data.custom_fields;
      payment.allow_tip = data.allow_tip;
      payment.allow_tabby = data.allow_tabby;
      payment.allow_tamara = data.allow_tamara;
      payment.allow_service_fee = data.allow_service_fee;
      payment.payment_expiry_limit = data.payment_expiry_limit;
      payment.expiry_date = data.expiry_date;

      try {
        await paymentRepo.save(payment);
        console.log('✅ Payment record updated in database');
      } catch (updateError) {
        // Critical: Nomod payment link was created successfully but database update failed
        // Log critical error but don't throw - the payment link is valid in Nomod's system
        console.error('🚨 CRITICAL: Payment created in Nomod but database update failed:', updateError);
        console.error('🚨 Nomod Payment ID:', data.id);
        console.error('🚨 Internal Payment ID:', payment.id);
        // Continue execution to return the Nomod response
      }

      // 5. Update form submission with paymentId if submittedFormId is provided
      if (options.submittedFormId) {
        const submission = await submissionRepo.findOneBy({ id: options.submittedFormId });
        if (submission) {
          submission.paymentId = payment.id;
          await submissionRepo.save(submission);
          console.log('🔗 Form submission linked to payment');
        }
      }

      return data;
    } catch (error) {
      console.error('❌ Error in createPaymentLink:', error);
      
      // Only mark payment as failed if it was successfully saved to DB
      // and the error occurred during/after Nomod API call
      if (paymentSavedToDb && payment && payment.id) {
        try {
          payment.status = 'failed';
          await paymentRepo.save(payment);
          console.log('⚠️ Payment marked as failed due to error:', payment.id);
        } catch (updateError) {
          console.error('❌ Failed to update payment status:', updateError);
        }
      }
      
      throw error;
    }
  }
  

  export async function getPaymentStatus(paymentId: string) {
    try {
      console.log('🔵 Fetching payment status for:', paymentId);
      
      if (!API_KEY) {
        throw new Error('NOMOD_API_KEY is not configured. Please set the environment variable.');
      }

      const response = await fetch(`${BASE_URL}/links/${paymentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
        }
      });
    
      console.log('📥 Payment status response:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Nomod API Error:', errorText);
        throw new Error(`Nomod API error (${response.status}): ${errorText}`);
      }
    
      const data = await response.json();
      console.log('✅ Payment status retrieved:', data.status);
      return data;
    } catch (error) {
      console.error('❌ Error in getPaymentStatus:', error);
      throw error;
    }
  }
  
