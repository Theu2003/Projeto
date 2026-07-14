import { Resend } from 'resend';
import { config } from '@/config/env';

const resend = config.resendApiKey ? new Resend(config.resendApiKey) : null;

const FROM_EMAIL = 'EcoColeta <onboarding@resend.dev>';

/**
 * Envia um email com o código de recuperação de senha
 */
export async function sendPasswordResetCode(email: string, code: string): Promise<void> {
  const subject = '🔐 Código de recuperação de senha - EcoColeta';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background: #f0fdf4; padding: 40px 20px; }
        .container { max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .logo { text-align: center; font-size: 24px; font-weight: bold; color: #16a34a; margin-bottom: 24px; }
        .code { text-align: center; font-size: 36px; font-weight: bold; color: #16a34a; letter-spacing: 8px; background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 24px 0; }
        .info { color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center; }
        .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">♻️ EcoColeta</div>
        <p class="info">Você solicitou a recuperação de senha. Use o código abaixo para criar uma nova senha:</p>
        <div class="code">${code}</div>
        <p class="info">Este código é válido por <strong>15 minutos</strong>.<br/>Se você não solicitou esta alteração, ignore este email.</p>
        <div class="footer">EcoColeta - Conectando moradores à coleta seletiva</div>
      </div>
    </body>
    </html>
  `;

  if (resend) {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
    });
  } else {
    // Fallback para desenvolvimento: exibe o código no console
    console.log(`
╔══════════════════════════════════════════╗
║   🔐 CÓDIGO DE RECUPERAÇÃO DE SENHA     ║
╠══════════════════════════════════════════╣
║                                          ║
║     Email: ${email.padEnd(35)}║
║     Código: ${code.padEnd(33)}║
║                                          ║
║   ⚠️  Modo DEV - configure RESEND_API_KEY ║
║   para enviar emails de verdade          ║
╚══════════════════════════════════════════╝
    `);
  }
}
