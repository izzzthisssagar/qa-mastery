import { describe, expect, it } from "vitest";
import { SOAP_NS, parseTicketRef, soapEnvelope, soapFaultXml, xmlEscape } from "./soap";

describe("xmlEscape", () => {
  it("escapes the five XML special characters", () => {
    expect(xmlEscape(`<a & "b" > 'c'`)).toBe("&lt;a &amp; &quot;b&quot; &gt; 'c'");
  });

  it("stringifies non-string values", () => {
    expect(xmlEscape(42)).toBe("42");
  });

  it("treats null and undefined as an empty string", () => {
    expect(xmlEscape(null)).toBe("");
    expect(xmlEscape(undefined)).toBe("");
  });
});

describe("soapEnvelope", () => {
  it("wraps the body in a soap:Envelope/soap:Body with the TaskFlight namespace", () => {
    const xml = soapEnvelope("    <tf:Foo/>");
    expect(xml).toContain(`xmlns:tf="${SOAP_NS}"`);
    expect(xml).toContain("<soap:Body>");
    expect(xml).toContain("    <tf:Foo/>");
    expect(xml).toContain("</soap:Envelope>");
  });
});

describe("soapFaultXml", () => {
  it("renders faultcode and an escaped faultstring inside an envelope", () => {
    const xml = soapFaultXml("Client", `Ref must look like "TF-12" (got "<bad>").`);
    expect(xml).toContain("<faultcode>soap:Client</faultcode>");
    expect(xml).toContain(
      "<faultstring>Ref must look like &quot;TF-12&quot; (got &quot;&lt;bad&gt;&quot;).</faultstring>",
    );
  });
});

describe("parseTicketRef", () => {
  it("parses a well-formed ref into its project key and ticket number", () => {
    expect(parseTicketRef("TF-12")).toEqual({ key: "TF", number: 12 });
  });

  it("parses a multi-char alphanumeric key", () => {
    expect(parseTicketRef("OPS2-7")).toEqual({ key: "OPS2", number: 7 });
  });

  it("returns null for a ref with no dash", () => {
    expect(parseTicketRef("TF12")).toBeNull();
  });

  it("returns null for a lowercase key", () => {
    expect(parseTicketRef("tf-12")).toBeNull();
  });

  it("returns null for a non-numeric ticket number", () => {
    expect(parseTicketRef("TF-abc")).toBeNull();
  });

  it("returns null for an empty ref", () => {
    expect(parseTicketRef("")).toBeNull();
  });
});
