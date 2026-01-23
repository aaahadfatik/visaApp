export const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      background-color: #f4f6f8;
    }
    .container {
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      padding: 20px;
      border-radius: 8px;
    }
    .header {
      text-align: center;
      padding-bottom: 10px;
    }
    .btn {
      display: inline-block;
      background: #2563eb;
      color: #ffffff !important;
      padding: 12px 20px;
      border-radius: 6px;
      text-decoration: none;
      margin-top: 20px;
    }
    .footer {
      margin-top: 30px;
      font-size: 12px;
      color: #888;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Your App</h2>
    </div>

    ${content}

    <div class="footer">
      © ${new Date().getFullYear()} Alem. All rights reserved.
    </div>
  </div>
</body>
</html>
`;
