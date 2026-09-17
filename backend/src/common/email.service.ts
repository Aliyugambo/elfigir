import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    });
  }

  async sendVerificationEmail(
    email: string,
    token: string,
    firstName: string,
    credentials?: { password: string },
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;
    const loginLink = `${frontendUrl}/login`;
    const credentialsSection = credentials
      ? `
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 24px 0;">
            <h3 style="margin: 0 0 12px; color: #333;">Your login details</h3>
            <p style="margin: 6px 0;"><strong>Username:</strong> ${email}</p>
            <p style="margin: 6px 0;"><strong>Password:</strong> ${credentials.password}</p>
            <p style="margin: 14px 0 0;"><a href="${loginLink}" style="color: #2563eb;">Login to Elfigir</a></p>
          </div>
        `
      : '';

    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM') || 'noreply@elfigir.com',
      to: email,
      subject: 'Verify your Elfigir account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">Welcome to Elfigir, ${firstName}!</h2>
          <p>Thank you for joining our team. Please verify your email address to activate your account.</p>
          ${credentialsSection}
          <p>Click the button below to verify your email:</p>
          <div style="margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <span style="word-break: break-all; color: #2563eb;">${verificationLink}</span>
          </p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This link will expire in 24 hours. If you didn't create an account, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} Elfigir. All rights reserved.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      throw new Error('Failed to send verification email');
    }
  }
}
