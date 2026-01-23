export const baseEmailTemplate = ({
  title,
  message,
  actionText,
  actionUrl,
}: {
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
}) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>

  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: Arial, Helvetica, sans-serif;
    }

    table {
      border-spacing: 0;
      width: 100%;
    }

    img {
      border: 0;
      display: block;
      max-width: 100%;
    }

    .email-wrapper {
      width: 100%;
      background-color: #f4f6f8;
      padding: 20px 0;
    }

    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
    }

    .header {
      background: #0b1033;
      padding: 32px 20px;
      text-align: center;
    }

    .header img {
      max-width: 140px;
      margin: 0 auto 10px;
    }

    .header p {
      color: #cbd5f5;
      font-size: 14px;
      margin: 0;
    }

    .content {
      padding: 32px 24px;
      color: #444;
      font-size: 16px;
      line-height: 1.6;
    }

    .footer {
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #999;
      border-top: 1px solid #e5e7eb;
    }

    @media screen and (max-width: 600px) {
      .content {
        padding: 24px 16px;
        font-size: 15px;
      }
    }
  </style>
</head>

<body>
  <table class="email-wrapper" role="presentation">
    <tr>
      <td align="center">

        <table class="email-container" role="presentation">

          <!-- HEADER -->
          <tr>
            <td class="header">
              <img
                src=""
                alt="Alem"
                width="140"
              />
              <p>Explore, Negotiate, Succeed</p>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td class="content">
              ${message}

              ${
                actionText && actionUrl
                  ? `
                    <div style="text-align:center; margin-top:24px;">
                      <a href="${actionUrl}"
                        style="
                          background:#2563eb;
                          color:#ffffff;
                          padding:14px 22px;
                          text-decoration:none;
                          border-radius:6px;
                          font-weight:bold;
                          display:inline-block;
                        ">
                        ${actionText}
                      </a>
                    </div>
                  `
                  : ""
              }
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td class="footer">
              © ${new Date().getFullYear()} Alem. All rights reserved.<br />
              Need help? Contact our support team.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`;
};
