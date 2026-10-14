/**
 * Sends an email using the Resend API.
 * Uses native Node fetch to avoid external package dependencies.
 * @param {object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.html - Email body content (HTML)
 */
export async function sendEmail({ to, subject, html }) {
  let apiKey = (process.env.RESEND_API_KEY || '').trim();
  let from = (process.env.RESEND_FROM_EMAIL || 'Elevata <info@voltaleltd.com>').trim();

  // Strip leading and trailing quotes if user pasted them into environment variables (common in Render dashboard)
  if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || (apiKey.startsWith("'") && apiKey.endsWith("'"))) {
    apiKey = apiKey.slice(1, -1).trim();
  }
  if ((from.startsWith('"') && from.endsWith('"')) || (from.startsWith("'") && from.endsWith("'"))) {
    from = from.slice(1, -1).trim();
  }

  // Safety fallback: if unverified kigalibespoke.com is specified, auto-switch to verified domain voltaleltd.com
  if (from.includes('@kigalibespoke.com')) {
    console.warn('⚠️ Warning: @kigalibespoke.com is unverified in Resend. Auto-switching to verified domain: info@voltaleltd.com');
    from = 'Elevata <info@voltaleltd.com>';
  }

  if (!apiKey) {
    console.error('❌ RESEND_API_KEY is missing in environment variables.');
    throw new Error('RESEND_API_KEY is not configured in environment variables. Please add it to your Render service environment settings.');
  }

  console.log(`📨 Dispatching email via Resend to: ${to} from: ${from}`);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedMessage = errorText;
    try {
      const parsed = JSON.parse(errorText);
      parsedMessage = parsed.message || parsed.error || errorText;
    } catch {
      // Keep errorText
    }
    console.error(`❌ Resend HTTP ${response.status} Error:`, parsedMessage);
    throw new Error(`Resend email delivery failed (${response.status}): ${parsedMessage}`);
  }

  const result = await response.json();
  console.log(`✅ Resend accepted email ${result.id || '(no message id)'} for ${to}`);
  return result;
}

