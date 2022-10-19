import hmacSHA256 from 'crypto-js/hmac-sha256'
import hex from 'crypto-js/enc-hex'

export default {
  async fetch(request, env) {
    try {
        const body = await request.json()
    } catch(e) {
        return new Response("Bad request", { status: 405 })
    }
    // Verify that the Mailgun Signature matches the one that they sent us and ensure the signature has not been used already
    const hmacDigest = hex.stringify(hmacSHA256(body.signature.timestamp + body.signature.token, env.MAILGUN_SIGNING_KEY))
    if (hmacDigest === body.signature.signature) {
        try {
            const mailOptions = {
                from: `Galexia Mail Reporting <info@${env.DOMAIN}>`,
                to: env.REPORTING_ADDRESS,
                subject: "New delivery failure in Mailgun",
                text: `
                    An email to:
                    ${body['event-data'].recipient}

                    From:
                    ${body['event-data'].envelope.sender}

                    With a subject of:
                    ${body['event-data'].message.headers.subject}

                    Has failed.
                    
                    The error message was:
                    ${body['event-data']['delivery-status'].description}
                `
            };
            const form_data = new FormData()
            for (var key in mailOptions) {
                form_data.append(key, mailOptions[key]);
            }
            const sendEmail = await fetch(`https://api.eu.mailgun.net/v3/${env.DOMAIN}/messages`, {
                method: 'POST',
                body: form_data,
                headers: {
                    'authorization': `Basic ${new Buffer('api' + ':' + env.MAILGUN_API_KEY).toString('base64')}`,
                    'accept': 'application/json'
                }
            })
            if (sendEmail.ok) {
                return new Response("Message sent successfully", { status: 200 })
            }
            throw sendEmail
        } catch (e) {
            return new Response("Could not send message", { status: 500 })
        }
    }
    return new Response("Could not verify signature", { status: 406 })
  }
}