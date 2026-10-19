const { client, twilioPhoneNumber } = require('../config/twilio');

async function makeCall(to, orderUrl) {
  try {
    const call = await client.calls.create({
      url: orderUrl,
      to,
      from: twilioPhoneNumber,
      statusCallback: `${process.env.WEBHOOK_BASE_URL}/api/webhooks/twilio/response`,
      statusCallbackEvent: ['completed', 'no-answer', 'busy', 'failed'],
      statusCallbackMethod: 'POST',
    });
    return call;
  } catch (err) {
    console.error('Error al realizar llamada Twilio:', err.message);
    throw err;
  }
}

function generateTwiML(orderId) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="${process.env.WEBHOOK_BASE_URL}/api/webhooks/twilio/response?pedido_id=${orderId}" method="POST" timeout="30">
    <Say language="es-MX">Gracias por su compra en Frutería Web. Para autorizar su pedido presione 1. Para reportar una compra no autorizada presione 2.</Say>
  </Gather>
  <Say language="es-MX">No recibimos respuesta. Volviendo a llamar.</Say>
  <Redirect method="POST">${process.env.WEBHOOK_BASE_URL}/api/webhooks/twilio/outbound?pedido_id=${orderId}</Redirect>
</Response>`;
}

function generateNoAnswerTwiML() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="es-MX">No se pudo verificar el pedido. Intentaremos de nuevo más tarde.</Say>
  <Hangup/>
</Response>`;
}

module.exports = { makeCall, generateTwiML, generateNoAnswerTwiML };
