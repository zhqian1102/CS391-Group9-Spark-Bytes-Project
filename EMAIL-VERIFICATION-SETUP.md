# Email Verification Setup Guide

This application now includes email verification with confirmation codes during user registration. Follow these steps to set up email sending functionality.

## Prerequisites

- A Gmail account (or other email service)
- Node.js and npm installed

## Gmail Setup (Recommended)

### Step 1: Enable 2-Step Verification

1. Go to your [Google Account](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification**
3. Follow the prompts to enable 2-Step Verification

### Step 2: Generate an App Password

1. After enabling 2-Step Verification, go to **Security** → **App passwords**
2. Select **Mail** as the app and **Other** as the device
3. Name it "Spark Bytes" or similar
4. Click **Generate**
5. Copy the 16-character password (it will look like: `xxxx xxxx xxxx xxxx`)

### Step 3: Update Environment Variables

1. Open the `.env` file in the root directory
2. Update the following variables:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # The app password from step 2
```

⚠️ **Important**: Use the App Password, NOT your regular Gmail password!

## Alternative Email Services

### Using SendGrid

```javascript
// In server/routes/auth.js, replace the transporter with:
const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

### Using Mailgun

```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.mailgun.org',
  port: 587,
  auth: {
    user: process.env.MAILGUN_USERNAME,
    pass: process.env.MAILGUN_PASSWORD
  }
});
```

## How It Works

1. **User Registration**: When a user signs up, they enter their name, email, and password
2. **Code Generation**: A 6-digit verification code is generated and sent to their email
3. **Email Verification**: The user receives an email with the code
4. **Code Entry**: User enters the 6-digit code on the verification screen
5. **Account Creation**: If the code is correct, the account is created and user is logged in

## Features

- ✅ 6-digit verification codes
- ✅ Code expiration (10 minutes)
- ✅ Resend code functionality
- ✅ Beautiful email templates
- ✅ BU email validation (@bu.edu)
- ✅ User-friendly verification interface

## Testing

1. Start the server: `npm run server`
2. Start the client: `npm run client`
3. Navigate to the login page
4. Click "Sign Up"
5. Fill in the registration form
6. Check your email for the verification code
7. Enter the code on the verification screen

## Troubleshooting

### Email not sending?

1. Check that `EMAIL_USER` and `EMAIL_PASSWORD` are correctly set in `.env`
2. Make sure you're using an App Password, not your regular password
3. Check the server console for error messages
4. Verify that 2-Step Verification is enabled on your Google account

### "Invalid verification code" error?

1. Make sure you're entering all 6 digits
2. Check if the code has expired (10 minutes)
3. Click "Resend" to get a new code

### Code expired?

1. Click the "Didn't receive the code? Resend" button
2. A new code will be sent to your email

## Security Notes

- Verification codes expire after 10 minutes
- Codes are stored in memory (for production, use a database or Redis)
- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- All emails must be @bu.edu addresses

## Production Considerations

For production deployment:

1. Use a professional email service (SendGrid, AWS SES, Mailgun)
2. Store verification codes in Redis or a database
3. Add rate limiting to prevent abuse
4. Use environment variables from your hosting service
5. Enable HTTPS for secure communication
6. Consider adding additional verification methods (SMS, etc.)

## Support

If you encounter any issues, check:
- Server console logs for detailed error messages
- Browser console for client-side errors
- Network tab to see API requests/responses
