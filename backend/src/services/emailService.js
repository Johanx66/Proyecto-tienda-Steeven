const { transporter, mailFrom, mockMode } = require('../config/mailer');

function buildActionUrl(token, action) {
  const base = process.env.WEBHOOK_BASE_URL || 'http://localhost:5000';
  return `${base}/api/orders/confirm?token=${token}&action=${action}`;
}

function buildEmailHtml(order, user, token) {
  const approveUrl = buildActionUrl(token, 'approve');
  const rejectUrl = buildActionUrl(token, 'reject');
  return `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
    <h2 style="color: #198754;">Frutería Web</h2>
    <p>Hola ${user.nombre},</p>
    <p>Gracias por su compra. Para confirmar su pedido <strong>#${order.id}</strong>
       por un total de <strong>$${Number(order.monto_total).toFixed(2)}</strong>,
       use uno de los siguientes enlaces:</p>
    <p style="text-align: center; margin: 28px 0;">
      <a href="${approveUrl}"
         style="background:#198754;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:bold;">
        Autorizar pedido
      </a>
    </p>
    <p style="text-align: center; margin: 20px 0;">
      <a href="${rejectUrl}"
         style="background:#dc3545;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:bold;">
        No reconozco esta compra
      </a>
    </p>
    <p style="color:#6c757d;font-size:13px;">
      Si no realizó esta compra, utilice el segundo enlace para reportarla.
      Este enlace expirará en ${process.env.VERIFICATION_TOKEN_TTL_MINUTES || 30} minutos.
    </p>
  </div>`;
}

async function sendOrderConfirmation(order, user, token) {
  const approveUrl = buildActionUrl(token, 'approve');
  const rejectUrl = buildActionUrl(token, 'reject');
  const subject = `Confirma tu pedido #${order.id} - Frutería Web`;
  const html = buildEmailHtml(order, user, token);

  if (mockMode) {
    console.log('[MAIL_MOCK] Correo de confirmación no enviado (modo mock).');
    console.log(`  Para: ${user.email}`);
    console.log(`  Autorizar: ${approveUrl}`);
    console.log(`  Reportar fraude: ${rejectUrl}`);
    return { mock: true, approveUrl, rejectUrl };
  }

  try {
    const info = await transporter.sendMail({
      from: mailFrom,
      to: user.email,
      subject,
      html,
    });
    return info;
  } catch (err) {
    console.error('Error al enviar correo de confirmación:', err.message);
    throw err;
  }
}

module.exports = { sendOrderConfirmation };
