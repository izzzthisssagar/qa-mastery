/**
 * Pure SOAP envelope/XML helpers for the TaskFlight SOAP route
 * (`src/app/api/soap/route.ts`). Split out so the escaping, envelope shape,
 * and ticket-ref parsing can be unit tested without going through a
 * `Request`/`Response` roundtrip or touching the database.
 */

export const SOAP_NS = "urn:taskflight:soap";

export function xmlEscape(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function soapEnvelope(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tf="${SOAP_NS}">
  <soap:Body>
${body}
  </soap:Body>
</soap:Envelope>`;
}

export function soapFaultXml(code: string, message: string): string {
  return soapEnvelope(`    <soap:Fault>
      <faultcode>soap:${code}</faultcode>
      <faultstring>${xmlEscape(message)}</faultstring>
    </soap:Fault>`);
}

/**
 * Parse a ticket ref like "TF-12" into its project key and ticket number.
 * Returns null when the ref doesn't match the expected shape (BuggyAPI
 * returns a 400 Fault in that case).
 */
export function parseTicketRef(ref: string): { key: string; number: number } | null {
  const match = /^([A-Z][A-Z0-9]{1,9})-(\d+)$/.exec(ref);
  if (!match) return null;
  return { key: match[1], number: Number(match[2]) };
}
