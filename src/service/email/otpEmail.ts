import { baseTemplate } from "./baseTemplate";

export const getOtpEmailTemplate = (otpCode: string): string => {
  const logoUrl = "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    table { border-spacing: 0; border-collapse: collapse; }
    td { padding: 0; }
    img { border: 0; }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f4f6f8; padding-bottom: 40px; }
    .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .otp-box { background-color: #f0f4ff; border: 1px dashed #1a44c9; border-radius: 8px; font-size: 32px; font-weight: bold; color: #1a44c9; letter-spacing: 5px; text-align: center; padding: 20px; margin: 20px 0; }
  </style>
</head>
<body>
  <center class="wrapper">
    <table class="main" width="100%">
      <!-- HEADER -->
      <tr>
        <td style="background-color: #0b1c39; padding: 30px 20px; text-align: center;">
          <img src="${logoUrl}" alt="Alem" width="120" style="display: block; margin: 0 auto; max-width: 100%; height: auto;">
        </td>
      </tr>

      <!-- CONTENT -->
      <tr>
        <td style="padding: 40px;">
          <h1 style="font-size: 20px; color: #1a1a1a; margin-bottom: 15px; text-align: center;">Verify Your Email Address 🔐</h1>
          
          <p style="font-size: 15px; color: #555555; line-height: 1.6; text-align: center; margin-bottom: 20px;">
            Please use the verification code below to complete your sign-in or registration process on Alem.
          </p>

          <!-- OTP CODE BOX -->
          <div class="otp-box">
            ${otpCode}
          </div>

          <p style="font-size: 14px; color: #888888; text-align: center; margin-top: 20px;">
            This code will expire in 10 minutes.<br>If you did not request this, please ignore this email.
          </p>
        </td>
      </tr>
      
      <!-- FOOTER -->
      <tr>
        <td style="background-color: #f4f6f8; padding: 15px; text-align: center;">
          <p style="font-size: 12px; color: #999999;">© ${new Date().getFullYear()} Alem. All rights reserved.</p>
        </td>
      </tr>
    </table>
  </center>
</body>
</html>
  `;
};
