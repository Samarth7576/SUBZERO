# Android SMS Ingestion (Phase 6)

To fully automate SMS ingestion from an Android device, Ledger uses a minimal "Share Sheet" wrapper rather than requesting the highly restricted `READ_SMS` permission from the Play Store.

## Architecture

1. **User Flow**: The user receives a bank or UPI SMS. They highlight the text, tap "Share", and select the "Ledger" app.
2. **Android Wrapper**: A simple PWA (Progressive Web App) with the Web Share Target API, or a basic Capacitor app, receives the text intent.
3. **API POST**: The wrapper securely forwards the text to Ledger's ingest endpoint.

## Integration Guide

### Endpoint
`POST https://<your-ledger-domain>.com/api/sms/ingest`

### Request Payload
```json
{
  "text": "Rs.199.00 debited from a/c **1234 on 05-06-26 to VPA netflix@upi",
  "sender": "VM-ICICIB",
  "sourceKind": "sms_android"
}
```

### Response
```json
{
  "success": true,
  "parsed": {
    "amountMinor": 19900,
    "currency": "INR",
    "vendorName": "netflix",
    "isRecurring": false
  }
}
```

### Security Note
In production, this endpoint must be authenticated. The Android app should hold a long-lived JWT or session token obtained during initial login and pass it in the `Cookie` or `Authorization` header.
