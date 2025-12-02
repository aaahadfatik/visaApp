import fetch from 'node-fetch';
import { dataSource } from "../datasource";
import { FormSubmission, Payment } from "../entity/";

const API_KEY = process.env.NOMOD_API_KEY;
const BASE_URL = process.env.NOMOD_API_BASE_URL || 'https://api.nomod.com';

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
    const response = await fetch(`${BASE_URL}/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY ? { 'X-API-KEY': API_KEY } : {}), // include X-API-KEY only if defined
      },
      body: JSON.stringify(options),
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Nomod API error: ${errorText}`);
    }
  
    const data = await response.json();

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

  // update form submission with paymentId if submittedFormId is provided
  if (options.submittedFormId) {
    const submission = await submissionRepo.findOneBy({ id: options.submittedFormId });
    if (submission) {
      submission.paymentId = payment.id;
      await submissionRepo.save(submission);
    }
  }

  return data;
  }
  

  export async function getPaymentStatus(paymentId: string) {
    const response = await fetch(`${BASE_URL}/links/${paymentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY ? { 'X-API-KEY': API_KEY } : {}), // include X-API-KEY only if defined
      }
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Nomod API error: ${errorText}`);
    }
  
    return response.json();
  }
  
