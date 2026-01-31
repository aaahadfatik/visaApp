import express from "express";

const router = express.Router();

/**
 * Payment Success Redirect
 * Nomod redirects here after successful payment
 * This page then redirects to the mobile app
 */
router.get(
  "/payment/success",
  (req: express.Request, res: express.Response) => {
    // Extract our internal payment ID from query params (included in the URL we sent to Nomod)
    // Also check for Nomod's own IDs as fallback
    const paymentId = String(
      req.query.paymentId || req.query.id || req.query.reference_id || "",
    );
    const status = String(req.query.status || "paid");

    // Construct deep link to open mobile app (URL encode query parameters)
    const deepLink = `uaevisaapp://payment/success?paymentId=${encodeURIComponent(paymentId)}&status=${encodeURIComponent(status)}`;

    // Send HTML page with auto-redirect
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Successful</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
          padding: 20px;
        }
        .container {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          max-width: 400px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 28px;
          margin: 0 0 10px 0;
        }
        p {
          font-size: 16px;
          opacity: 0.9;
          margin: 10px 0;
        }
        .loader {
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .manual-link {
          display: inline-block;
          margin-top: 20px;
          padding: 12px 24px;
          background: white;
          color: #667eea;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">✅</div>
        <h1>Payment Successful!</h1>
        <p>Your transaction has been completed.</p>
        <div class="loader"></div>
        <p id="status">Opening UAE Visa App...</p>
        <a href="${deepLink}" class="manual-link" id="manual-link" style="display:none;">
          Open App Manually
        </a>
      </div>
      
      <script>
        // Attempt to open the app immediately
        window.location.href = ${JSON.stringify(deepLink)};
        
        // Show manual link after 2 seconds if redirect didn't work
        setTimeout(function() {
          document.getElementById('status').textContent = 'App not opening automatically?';
          document.getElementById('manual-link').style.display = 'inline-block';
        }, 2000);
        
        // Log for debugging
        console.log('Redirecting to:', ${JSON.stringify(deepLink)});
        console.log('Payment ID:', ${JSON.stringify(String(paymentId))});
      </script>
    </body>
    </html>
  `);
  },
);

/**
 * Payment Failure Redirect
 * Nomod redirects here after failed payment
 */
router.get(
  "/payment/failure",
  (req: express.Request, res: express.Response) => {
    // Extract our internal payment ID from query params (included in the URL we sent to Nomod)
    // Also check for Nomod's own IDs as fallback
    const paymentId = String(
      req.query.paymentId || req.query.id || req.query.reference_id || "",
    );
    const status = String(req.query.status || "failed");
    const errorMessage = String(
      req.query.error || req.query.message || "Payment was not completed",
    );

    // Construct deep link to open mobile app (URL encode all query parameters)
    const deepLink = `uaevisaapp://payment/failure?paymentId=${encodeURIComponent(paymentId)}&status=${encodeURIComponent(status)}&error=${encodeURIComponent(errorMessage)}`;

    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Failed</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          text-align: center;
          padding: 20px;
        }
        .container {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          max-width: 400px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 28px;
          margin: 0 0 10px 0;
        }
        p {
          font-size: 16px;
          opacity: 0.9;
          margin: 10px 0;
        }
        .loader {
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .manual-link {
          display: inline-block;
          margin-top: 20px;
          padding: 12px 24px;
          background: white;
          color: #f5576c;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">❌</div>
        <h1>Payment Failed</h1>
        <p>Your transaction could not be completed.</p>
        <div class="loader"></div>
        <p id="status">Opening UAE Visa App...</p>
        <a href="${deepLink}" class="manual-link" id="manual-link" style="display:none;">
          Open App Manually
        </a>
      </div>
      
      <script>
        window.location.href = ${JSON.stringify(deepLink)};
        
        setTimeout(function() {
          document.getElementById('status').textContent = 'App not opening automatically?';
          document.getElementById('manual-link').style.display = 'inline-block';
        }, 2000);
        
        console.log('Redirecting to:', ${JSON.stringify(deepLink)});
        console.log('Payment ID:', ${JSON.stringify(String(paymentId))});
        console.log('Error:', ${JSON.stringify(String(errorMessage))});
      </script>
    </body>
    </html>
  `);
  },
);

export default router;
