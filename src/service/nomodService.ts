import fetch from 'node-fetch';
import { dataSource } from "../datasource";
import { FormSubmission, Payment } from "../entity/";

const API_KEY = process.env.NOMOD_API_KEY;
const BASE_URL = process.env.NOMOD_API_BASE_URL || 'https://api.nomod.com';

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
    try {
      console.log('🔵 Creating Nomod payment link...');
      console.log('📤 Request URL:', `${BASE_URL}/links`);
      
      // Log payload details without exposing full sensitive data in production
      if (process.env.NODE_ENV === 'development') {
        console.log('📦 Request payload:', JSON.stringify(options, null, 2));
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
        body: JSON.stringify(options),
      });
    
      console.log('📥 Nomod API Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Nomod API Error Response:', errorText);
        throw new Error(`Nomod API error (${response.status}): ${errorText}`);
      }
    
      const data = await response.json();
      console.log('✅ Nomod payment link created successfully:', data.id);

  // 2. Save to DB
  const paymentRepo = dataSource.getRepository(Payment);

  const payment = paymentRepo.create({
    nomodId: data.id,
    title: data.title,
    url: data.url,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    note: data.note,
    items: data.items,
    discount: data.discount,
    service_fee: data.service_fee,
    custom_fields: data.custom_fields,
    allow_tip: data.allow_tip,
    allow_tabby: data.allow_tabby,
    allow_tamara: data.allow_tamara,
    allow_service_fee: data.allow_service_fee,
    success_url: options.success_url,
    failure_url: options.failure_url,
    payment_expiry_limit: data.payment_expiry_limit,
    expiry_date: data.expiry_date,
    requestPayload: options // store full request for debugging
  });

  await paymentRepo.save(payment);
  console.log('💾 Payment saved to database:', payment.id);

  // update form submission with paymentId if submittedFormId is provided
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
  
