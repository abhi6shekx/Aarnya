const functions = require('firebase-functions')
const fetch = require('node-fetch')

// Example Cloud Function to proxy Shiprocket rate requests securely.
// Requires setting functions config or environment variables for credentials:
// firebase functions:config:set shiprocket.email="you@domain.com" shiprocket.password="pwd" shiprocket.pickup_pin="110059"

exports.getRates = functions.https.onRequest(async (req, res) => {
  // Allow only POST
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed')
    return
  }

  try {
    const { delivery_pincode, weight, length, breadth, height } = req.body
    if (!delivery_pincode) return res.status(400).json({ error: 'delivery_pincode required' })

    // Read credentials from functions config
    const cfg = functions.config().shiprocket || {}
    const email = cfg.email
    const password = cfg.password
    const pickup_pin = cfg.pickup_pin || cfg.pickup || process.env.SHIPROCKET_PICKUP_PIN || ''

    if (!email || !password) {
      console.error('Shiprocket credentials not set in functions config')
      return res.status(500).json({ error: 'Shiprocket not configured' })
    }

    // Authenticate to Shiprocket
    const tokenRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!tokenRes.ok) {
      const text = await tokenRes.text()
      console.error('Auth failed', tokenRes.status, text)
      return res.status(500).json({ error: 'Shiprocket auth failed' })
    }

    const tokenData = await tokenRes.json()
    const token = tokenData.token

    // Call serviceability
    const body = {
      pickup_postcode: pickup_pin,
      delivery_postcode: String(delivery_pincode),
      weight: weight || 0.1,
      length: length || 1,
      breadth: breadth || 1,
      height: height || 1,
      cod: 0
    }

    const rateRes = await fetch('https://apiv2.shiprocket.in/v1/external/courier/serviceability/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    })

    const rateJson = await rateRes.json()
    return res.json(rateJson)
  } catch (err) {
    console.error('getRates error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})
