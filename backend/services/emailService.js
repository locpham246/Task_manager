const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter using Gmail SMTP
const createTransporter = () => {
  // Option 1: Using App Password (Recommended for Google Workspace)
  // You need to generate an App Password in your Google Account settings
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // Your @ductridn.edu.vn email
        pass: process.env.GMAIL_APP_PASSWORD // App Password (not regular password)
      }
    });
  }

  // Option 2: Using OAuth2 (More secure, but more complex)
  // If you want to use OAuth2 instead, uncomment and configure this:
  /*
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_USER,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: process.env.GMAIL_ACCESS_TOKEN
    }
  });
  */

  // Fallback: Return null if no credentials configured
  return null;
};

/**
 * Send invitation email to new user
 * @param {string} toEmail - Recipient email address
 * @param {string} inviterName - Name of person who sent invitation
 * @param {string} systemUrl - URL of the application
 * @returns {Promise<Object>} Email send result
 */
const sendInvitationEmail = async (toEmail, inviterName, systemUrl = 'http://localhost:5173') => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.warn('⚠️ Email service not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    const mailOptions = {
      from: `"Hệ thống Quản lý Công việc" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: 'Lời mời tham gia hệ thống Quản lý Công việc - Trường Đức Trí',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, rgb(92, 193, 96) 0%, rgb(70, 160, 74) 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #ffffff;
              padding: 30px;
              border: 1px solid #e4e6eb;
              border-top: none;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: rgb(92, 193, 96);
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: 600;
            }
            .button:hover {
              background: rgb(70, 160, 74);
            }
            .footer {
              background: #f8f9fa;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #65676b;
              border-radius: 0 0 10px 10px;
              border: 1px solid #e4e6eb;
              border-top: none;
            }
            .info-box {
              background: #f0f4f8;
              border-left: 4px solid rgb(92, 193, 96);
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🎉 Lời mời tham gia hệ thống</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Trường Đức Trí</p>
          </div>
          
          <div class="content">
            <p>Xin chào,</p>
            
            <p><strong>${inviterName}</strong> đã mời bạn tham gia hệ thống <strong>Quản lý Công việc</strong> của Trường Đức Trí.</p>
            
            <div class="info-box">
              <p style="margin: 0;"><strong>📧 Email của bạn:</strong> ${toEmail}</p>
              <p style="margin: 5px 0 0 0;"><strong>🔐 Đăng nhập bằng:</strong> Google OAuth</p>
            </div>
            
            <p>Để bắt đầu sử dụng hệ thống, vui lòng:</p>
            <ol>
              <li>Truy cập vào hệ thống bằng nút bên dưới</li>
              <li>Đăng nhập bằng tài khoản Google của bạn (${toEmail})</li>
              <li>Bạn sẽ được tự động thêm vào hệ thống</li>
            </ol>
            
            <div style="text-align: center;">
              <a href="${systemUrl}/login" class="button">Đăng nhập ngay</a>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #65676b;">
              <strong>Lưu ý:</strong> Bạn chỉ có thể đăng nhập bằng email <strong>@ductridn.edu.vn</strong>
            </p>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">Hệ thống Quản lý Công việc - Trường Đức Trí</p>
            <p style="margin: 5px 0 0 0;">Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </body>
        </html>
      `,
      text: `
Lời mời tham gia hệ thống Quản lý Công việc - Trường Đức Trí

Xin chào,

${inviterName} đã mời bạn tham gia hệ thống Quản lý Công việc của Trường Đức Trí.

Email của bạn: ${toEmail}
Đăng nhập bằng: Google OAuth

Để bắt đầu:
1. Truy cập: ${systemUrl}/login
2. Đăng nhập bằng tài khoản Google của bạn (${toEmail})
3. Bạn sẽ được tự động thêm vào hệ thống

Lưu ý: Bạn chỉ có thể đăng nhập bằng email @ductridn.edu.vn

---
Hệ thống Quản lý Công việc - Trường Đức Trí
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Invitation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending invitation email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendInvitationEmail
};
