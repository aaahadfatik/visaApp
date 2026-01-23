import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { logger } from "../utils/logger";

dotenv.config({ path: "../../.env" });

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false, // MUST be false for port 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });  

  export const sendEmail = async ({ to, subject, html }: SendEmailParams) => {
    try {
      await transporter.sendMail({
        from: `"Alem" <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html,
      });
  
      logger.info(`Email sent to ${to}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to send email to ${to}`, error);
      return false;
    }
  };
  
