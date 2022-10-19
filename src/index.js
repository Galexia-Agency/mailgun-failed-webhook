import hmacSHA256 from 'crypto-js/hmac-sha256'
import hex from 'crypto-js/enc-hex'

export default {
  async fetch(request, env) {
    let body
    try {
        body = await request.json()
    } catch(e) {
        return new Response("Bad request", { status: 405 })
    }
    console.log(request.url)
    // Verify that the Mailgun Signature matches the one that they sent us
    const hmacDigest = hex.stringify(hmacSHA256(body.signature.timestamp + body.signature.token, env.MAILGUN_SIGNING_KEY))
    // Load Cloudflare Cache
    const cache = caches.default
    // Set Cache Key for this signature = https://worker.domain/signature
    const cacheKey = request.url + hmacDigest
    // Ensure the signature has not been used already
    const alreadyUsedSignature = await cache.match(cacheKey)
    if (hmacDigest === body.signature.signature && alreadyUsedSignature === undefined) {
        try {
            // Cache the signature so it can't be used again
            const response = new Response(hmacDigest)
            response.headers.append('Cache-Control', 's-maxage=3600')
            console.log(await cache.put(cacheKey, response))
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
            console.error(e)
            return new Response("Could not send message", { status: 500 })
        }
    }
    return new Response("Could not verify signature", { status: 406 })
  }
}