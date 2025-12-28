import sgMail from '@sendgrid/mail';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=sendgrid',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key || !connectionSettings.settings.from_email)) {
    throw new Error('SendGrid not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, email: connectionSettings.settings.from_email };
}

async function getUncachableSendGridClient() {
  const { apiKey, email } = await getCredentials();
  sgMail.setApiKey(apiKey);
  return {
    client: sgMail,
    fromEmail: email
  };
}

export async function sendWelcomeEmail(toEmail: string, fullName: string, role: string) {
  try {
    const { client, fromEmail } = await getUncachableSendGridClient();
    
    const roleLabel = role === 'physician' ? 'Physician' : 
                      role === 'dietitian' ? 'Dietitian' : 'Patient';
    
    const msg = {
      to: toEmail,
      from: fromEmail,
      subject: 'Welcome to GenieSugar - Your Diabetes Management Journey Begins!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #16a34a; font-size: 28px; margin: 0;">GenieSugar</h1>
                <p style="color: #71717a; margin: 8px 0 0 0;">Diabetes Self-Management</p>
              </div>
              
              <h2 style="color: #18181b; font-size: 22px; margin: 0 0 16px 0;">Welcome, ${fullName}!</h2>
              
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for joining GenieSugar as a <strong>${roleLabel}</strong>. 
                We're excited to help you on your diabetes management journey.
              </p>
              
              <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <h3 style="color: #166534; font-size: 16px; margin: 0 0 12px 0;">What you can do with GenieSugar:</h3>
                <ul style="color: #166534; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                  ${role === 'patient' ? `
                    <li>Track your glucose readings (20-600 mg/dL)</li>
                    <li>Log meals and physical activities</li>
                    <li>View trends and reports</li>
                    <li>Connect with your healthcare team</li>
                    <li>Set up alerts for high/low readings</li>
                  ` : `
                    <li>Monitor your patients' glucose data</li>
                    <li>Review food and activity logs</li>
                    <li>Add clinical notes</li>
                    <li>Chat with patients securely</li>
                  `}
                </ul>
              </div>
              
              <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                <em>Note: GenieSugar is an educational project (Student ID: 202200033) for diabetes self-management. 
                It is not a medical device and should not replace professional medical advice.</em>
              </p>
            </div>
            
            <p style="text-align: center; color: #a1a1aa; font-size: 12px; margin-top: 24px;">
              This email was sent by GenieSugar. Please do not reply to this email.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    await client.send(msg);
    console.log(`Welcome email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

export async function sendVerificationEmail(toEmail: string, fullName: string, verificationToken: string) {
  try {
    const { client, fromEmail } = await getUncachableSendGridClient();
    
    const verificationUrl = `${process.env.REPLIT_DEV_DOMAIN ? 'https://' + process.env.REPLIT_DEV_DOMAIN : 'http://localhost:5000'}/api/verify-email/${verificationToken}`;
    
    const msg = {
      to: toEmail,
      from: fromEmail,
      subject: 'Verify Your GenieSugar Email Address',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #16a34a; font-size: 28px; margin: 0;">GenieSugar</h1>
              </div>
              
              <h2 style="color: #18181b; font-size: 22px; margin: 0 0 16px 0;">Verify Your Email</h2>
              
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ${fullName}, please verify your email address by clicking the button below:
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${verificationUrl}" style="background-color: #16a34a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
                This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await client.send(msg);
    console.log(`Verification email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

export async function sendGlucoseAlertEmail(
  toEmail: string, 
  fullName: string, 
  glucoseValue: number, 
  alertType: 'high' | 'low',
  timestamp: Date
) {
  try {
    const { client, fromEmail } = await getUncachableSendGridClient();
    
    const alertColor = alertType === 'high' ? '#dc2626' : '#f59e0b';
    const alertTitle = alertType === 'high' ? 'High Glucose Alert' : 'Low Glucose Alert';
    const alertMessage = alertType === 'high' 
      ? `Your glucose reading of ${glucoseValue} mg/dL is above your high threshold.`
      : `Your glucose reading of ${glucoseValue} mg/dL is below your low threshold.`;
    
    const msg = {
      to: toEmail,
      from: fromEmail,
      subject: `GenieSugar: ${alertTitle} - ${glucoseValue} mg/dL`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #16a34a; font-size: 28px; margin: 0;">GenieSugar</h1>
              </div>
              
              <div style="background-color: ${alertColor}; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
                <h2 style="margin: 0; font-size: 24px;">${alertTitle}</h2>
                <p style="margin: 8px 0 0 0; font-size: 36px; font-weight: bold;">${glucoseValue} mg/dL</p>
              </div>
              
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                Dear ${fullName},
              </p>
              
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                ${alertMessage}
              </p>
              
              <p style="color: #71717a; font-size: 14px;">
                Recorded at: ${timestamp.toLocaleString()}
              </p>
              
              <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; border-top: 1px solid #e4e4e7; padding-top: 20px;">
                <em>Please take appropriate action and consult your healthcare provider if needed. 
                This is an automated alert from GenieSugar (Student ID: 202200033).</em>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await client.send(msg);
    console.log(`Glucose alert email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send glucose alert email:', error);
    return false;
  }
}

export async function sendFamilyAlertEmail(
  toEmail: string,
  familyMemberName: string,
  patientName: string,
  glucoseValue: number,
  alertType: 'high' | 'low'
) {
  try {
    const { client, fromEmail } = await getUncachableSendGridClient();
    
    const alertColor = alertType === 'high' ? '#dc2626' : '#f59e0b';
    const alertTitle = alertType === 'high' ? 'High Glucose Alert' : 'Low Glucose Alert';
    
    const msg = {
      to: toEmail,
      from: fromEmail,
      subject: `GenieSugar Family Alert: ${patientName} - ${alertTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #16a34a; font-size: 28px; margin: 0;">GenieSugar</h1>
                <p style="color: #71717a; margin: 8px 0 0 0;">Family Support Alert</p>
              </div>
              
              <div style="background-color: ${alertColor}; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
                <h2 style="margin: 0; font-size: 20px;">Alert for ${patientName}</h2>
                <p style="margin: 8px 0 0 0; font-size: 32px; font-weight: bold;">${glucoseValue} mg/dL</p>
              </div>
              
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                Dear ${familyMemberName},
              </p>
              
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                ${patientName} has recorded a ${alertType === 'high' ? 'high' : 'low'} glucose reading of 
                <strong>${glucoseValue} mg/dL</strong>. You are receiving this notification as a registered 
                family support contact.
              </p>
              
              <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; border-top: 1px solid #e4e4e7; padding-top: 20px;">
                <em>This is an automated family support alert from GenieSugar (Student ID: 202200033). 
                Please check in with ${patientName} if you haven't heard from them.</em>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await client.send(msg);
    console.log(`Family alert email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send family alert email:', error);
    return false;
  }
}

export async function sendAppointmentBookedEmail(
  toEmail: string,
  patientName: string,
  physicianName: string,
  appointmentDate: Date,
  duration: number,
  notes?: string,
  requirements?: string
) {
  try {
    const { client, fromEmail } = await getUncachableSendGridClient();
    
    const dateStr = appointmentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const timeStr = appointmentDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const msg = {
      to: toEmail,
      from: fromEmail,
      subject: `GenieSugar: New Appointment with Dr. ${physicianName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #16a34a; font-size: 28px; margin: 0;">GenieSugar</h1>
                <p style="color: #71717a; margin: 8px 0 0 0;">Appointment Confirmation</p>
              </div>
              
              <div style="background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
                <h2 style="margin: 0; font-size: 20px;">Appointment Scheduled</h2>
                <p style="margin: 8px 0 0 0; font-size: 18px;">${dateStr}</p>
                <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: bold;">${timeStr}</p>
              </div>
              
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                Dear ${patientName},
              </p>
              
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                Your appointment with <strong>Dr. ${physicianName}</strong> has been scheduled for 
                <strong>${dateStr}</strong> at <strong>${timeStr}</strong> (${duration} minutes).
              </p>
              
              ${notes ? `
              <div style="background-color: #f0f9ff; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <h3 style="color: #0369a1; font-size: 14px; margin: 0 0 8px 0;">Doctor's Notes:</h3>
                <p style="color: #0c4a6e; font-size: 14px; margin: 0; line-height: 1.5;">${notes}</p>
              </div>
              ` : ''}
              
              ${requirements ? `
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <h3 style="color: #92400e; font-size: 14px; margin: 0 0 8px 0;">What to Bring/Prepare:</h3>
                <p style="color: #78350f; font-size: 14px; margin: 0; line-height: 1.5;">${requirements}</p>
              </div>
              ` : ''}
              
              <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; border-top: 1px solid #e4e4e7; padding-top: 20px;">
                <em>This is an automated appointment notification from GenieSugar (Student ID: 202200033). 
                Please log in to your account to view more details.</em>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await client.send(msg);
    console.log(`Appointment booked email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send appointment booked email:', error);
    return false;
  }
}

export async function sendAppointmentReminderEmail(
  toEmail: string,
  patientName: string,
  physicianName: string,
  appointmentDate: Date,
  daysUntil: number,
  requirements?: string
) {
  try {
    const { client, fromEmail } = await getUncachableSendGridClient();
    
    const dateStr = appointmentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const timeStr = appointmentDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const msg = {
      to: toEmail,
      from: fromEmail,
      subject: `GenieSugar Reminder: Appointment in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #16a34a; font-size: 28px; margin: 0;">GenieSugar</h1>
                <p style="color: #71717a; margin: 8px 0 0 0;">Appointment Reminder</p>
              </div>
              
              <div style="background-color: #f59e0b; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
                <h2 style="margin: 0; font-size: 20px;">Reminder: ${daysUntil} Day${daysUntil === 1 ? '' : 's'} Until Your Appointment</h2>
              </div>
              
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                Dear ${patientName},
              </p>
              
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                This is a reminder that you have an appointment with <strong>Dr. ${physicianName}</strong> on 
                <strong>${dateStr}</strong> at <strong>${timeStr}</strong>.
              </p>
              
              ${requirements ? `
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <h3 style="color: #92400e; font-size: 14px; margin: 0 0 8px 0;">Don't Forget to Bring:</h3>
                <p style="color: #78350f; font-size: 14px; margin: 0; line-height: 1.5;">${requirements}</p>
              </div>
              ` : ''}
              
              <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; border-top: 1px solid #e4e4e7; padding-top: 20px;">
                <em>This is an automated reminder from GenieSugar (Student ID: 202200033).</em>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await client.send(msg);
    console.log(`Appointment reminder email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send appointment reminder email:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(toEmail: string, fullName: string, resetToken: string) {
  try {
    const { client, fromEmail } = await getUncachableSendGridClient();
    
    const resetUrl = `${process.env.REPLIT_DEV_DOMAIN ? 'https://' + process.env.REPLIT_DEV_DOMAIN : 'http://localhost:5000'}/reset-password/${resetToken}`;
    
    const msg = {
      to: toEmail,
      from: fromEmail,
      subject: 'Reset Your GenieSugar Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #16a34a; font-size: 28px; margin: 0;">GenieSugar</h1>
                <p style="color: #71717a; margin: 8px 0 0 0;">Password Reset</p>
              </div>
              
              <h2 style="color: #18181b; font-size: 20px; margin: 0 0 16px 0;">Hello, ${fullName}</h2>
              
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                We received a request to reset your password. Click the button below to create a new password.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #16a34a; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 20px 0;">
                This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
              </p>
              
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-top: 20px;">
                <p style="color: #92400e; font-size: 14px; margin: 0;">
                  <strong>Security Tip:</strong> Never share this link with anyone. GenieSugar support will never ask for your password.
                </p>
              </div>
              
              <p style="color: #a1a1aa; font-size: 12px; line-height: 1.6; margin: 24px 0 0 0; border-top: 1px solid #e4e4e7; padding-top: 20px;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <span style="color: #16a34a;">${resetUrl}</span>
              </p>
            </div>
            
            <p style="text-align: center; color: #a1a1aa; font-size: 12px; margin-top: 24px;">
              This email was sent by GenieSugar (Student ID: 202200033). Please do not reply.
            </p>
          </div>
        </body>
        </html>
      `,
    };

    await client.send(msg);
    console.log(`Password reset email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}
