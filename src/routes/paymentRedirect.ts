import express from 'express';

const router = express.Router();

/**
 * Payment success redirect handler
 * Receives redirect from Nomod and forwards to mobile app via deep link
 */
router.get('/payment/success', (req, res) => {
  console.log('🟢 Payment success redirect received');
  console.log('Query params:', req.query);
  
  // Nomod may send payment ID as 'id', 'payment_id', 'reference_id', or in other formats
  const paymentId = String(req.query.id || req.query.payment_id || req.query.reference_id || '');
  const referenceId = String(req.query.reference_id || '');
  
  console.log('Payment ID:', paymentId);
  console.log('Reference ID:', referenceId);
  
  // Build deep link URL for mobile app - encodeURIComponent for XSS protection
  const deepLink = `uaevisaapp://payment/success?paymentId=${encodeURIComponent(paymentId)}&referenceId=${encodeURIComponent(referenceId)}`;
  
  // Escape for safe use in HTML/JavaScript context
  const deepLinkEscaped = deepLink.replace(/'/g, "\\'").replace(/"/g, '\\"');
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Successful</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
          max-width: 400px;
        }
        .icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        h1 {
          margin: 0 0 1rem 0;
          font-size: 2rem;
        }
        p {
          margin: 0.5rem 0;
          opacity: 0.9;
        }
        .spinner {
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 1rem auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .fallback {
          display: none;
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .fallback.show {
          display: block;
        }
        button {
          background: white;
          color: #667eea;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 25px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          margin-top: 1rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">✅</div>
        <h1>Payment Successful!</h1>
        <p>Your payment has been processed successfully.</p>
        <div class="spinner"></div>
        <p id="status">Redirecting to app...</p>
        
        <div class="fallback" id="fallback">
          <p>If the app doesn't open automatically:</p>
          <button onclick="window.location.href='${deepLinkEscaped}'">
            Open UAE Visa App
          </button>
        </div>
      </div>
      
      <script>
        console.log('Payment success page loaded');
        console.log('Deep link:', '${deepLinkEscaped}');
        
        // Try to open the app immediately
        setTimeout(() => {
          console.log('Attempting to open app...');
          window.location.href = '${deepLinkEscaped}';
        }, 1000);
        
        // Show fallback button after 3 seconds
        setTimeout(() => {
          document.getElementById('status').textContent = 'Opening app...';
          document.getElementById('fallback').classList.add('show');
        }, 3000);
        
        // Update status after 5 seconds
        setTimeout(() => {
          document.getElementById('status').textContent = 'Please tap the button above if the app hasn' + String.fromCharCode(39) + 't opened.';
        }, 5000);
      </script>
    </body>
    </html>
  `);
});

/**
 * Payment failure redirect handler
 * Receives redirect from Nomod when payment fails and forwards to mobile app
 */
router.get('/payment/failure', (req, res) => {
  console.log('🔴 Payment failure redirect received');
  console.log('Query params:', req.query);
  
  const paymentId = String(req.query.id || req.query.payment_id || req.query.reference_id || '');
  const referenceId = String(req.query.reference_id || '');
  const error = String(req.query.error || 'Payment failed');
  
  console.log('Payment ID:', paymentId);
  console.log('Error:', error);
  
  const deepLink = `uaevisaapp://payment/failure?paymentId=${encodeURIComponent(paymentId)}&referenceId=${encodeURIComponent(referenceId)}&error=${encodeURIComponent(error)}`;
  
  // Escape for safe use in HTML/JavaScript context
  const deepLinkEscaped = deepLink.replace(/'/g, "\\'").replace(/"/g, '\\"');
  
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Failed</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
          max-width: 400px;
        }
        .icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        h1 {
          margin: 0 0 1rem 0;
          font-size: 2rem;
        }
        p {
          margin: 0.5rem 0;
          opacity: 0.9;
        }
        .spinner {
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 1rem auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .fallback {
          display: none;
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        .fallback.show {
          display: block;
        }
        button {
          background: white;
          color: #f5576c;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 25px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          margin-top: 1rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">❌</div>
        <h1>Payment Failed</h1>
        <p>We couldn't process your payment.</p>
        <div class="spinner"></div>
        <p id="status">Redirecting to app...</p>
        
        <div class="fallback" id="fallback">
          <p>If the app doesn't open automatically:</p>
          <button onclick="window.location.href='${deepLinkEscaped}'">
            Open UAE Visa App
          </button>
        </div>
      </div>
      
      <script>
        console.log('Payment failure page loaded');
        console.log('Deep link:', '${deepLinkEscaped}');
        
        setTimeout(() => {
          console.log('Attempting to open app...');
          window.location.href = '${deepLinkEscaped}';
        }, 1000);
        
        setTimeout(() => {
          document.getElementById('status').textContent = 'Opening app...';
          document.getElementById('fallback').classList.add('show');
        }, 3000);
        
        setTimeout(() => {
          document.getElementById('status').textContent = 'Please tap the button above if the app hasn' + String.fromCharCode(39) + 't opened.';
        }, 5000);
      </script>
    </body>
    </html>
  `);
});

export default router;
