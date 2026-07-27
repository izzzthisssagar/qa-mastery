import { XMLParser } from "fast-xml-parser";
import { resolveAuth } from "@/api/auth";
import { buggyapiDb } from "@/api/db";
import { SOAP_NS as NS, parseTicketRef, soapEnvelope, soapFaultXml, xmlEscape } from "@/api/soap";

/**
 * TaskFlight SOAP 1.1 — one deliberately-small legacy endpoint so learners
 * meet XML envelopes, WSDLs, and SOAP Faults next to the modern surfaces.
 *
 * Operations (see ?wsdl):
 *  - ListProjects            → all sandbox projects
 *  - GetTicket(ref)          → one ticket by its "TF-12" ref
 *
 * Auth: same X-API-Key HTTP header as REST (SOAP-header auth exists in the
 * wild, but one new concept at a time).
 */

function fault(code: string, message: string, status: number): Response {
  return new Response(soapFaultXml(code, message), {
    status,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

function ok(body: string): Response {
  return new Response(soapEnvelope(body), {
    status: 200,
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

const WSDL = `<?xml version="1.0" encoding="UTF-8"?>
<definitions name="TaskFlight" targetNamespace="${NS}"
  xmlns="http://schemas.xmlsoap.org/wsdl/"
  xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
  xmlns:tf="${NS}"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <types>
    <xsd:schema targetNamespace="${NS}">
      <xsd:element name="ListProjects"><xsd:complexType/></xsd:element>
      <xsd:element name="ListProjectsResponse">
        <xsd:complexType><xsd:sequence>
          <xsd:element name="Project" minOccurs="0" maxOccurs="unbounded">
            <xsd:complexType><xsd:sequence>
              <xsd:element name="Key" type="xsd:string"/>
              <xsd:element name="Name" type="xsd:string"/>
              <xsd:element name="Status" type="xsd:string"/>
            </xsd:sequence></xsd:complexType>
          </xsd:element>
        </xsd:sequence></xsd:complexType>
      </xsd:element>
      <xsd:element name="GetTicket">
        <xsd:complexType><xsd:sequence>
          <xsd:element name="Ref" type="xsd:string"/>
        </xsd:sequence></xsd:complexType>
      </xsd:element>
      <xsd:element name="GetTicketResponse">
        <xsd:complexType><xsd:sequence>
          <xsd:element name="Ref" type="xsd:string"/>
          <xsd:element name="Title" type="xsd:string"/>
          <xsd:element name="Status" type="xsd:string"/>
          <xsd:element name="Priority" type="xsd:string"/>
        </xsd:sequence></xsd:complexType>
      </xsd:element>
    </xsd:schema>
  </types>
  <message name="ListProjectsIn"><part name="parameters" element="tf:ListProjects"/></message>
  <message name="ListProjectsOut"><part name="parameters" element="tf:ListProjectsResponse"/></message>
  <message name="GetTicketIn"><part name="parameters" element="tf:GetTicket"/></message>
  <message name="GetTicketOut"><part name="parameters" element="tf:GetTicketResponse"/></message>
  <portType name="TaskFlightPort">
    <operation name="ListProjects">
      <input message="tf:ListProjectsIn"/><output message="tf:ListProjectsOut"/>
    </operation>
    <operation name="GetTicket">
      <input message="tf:GetTicketIn"/><output message="tf:GetTicketOut"/>
    </operation>
  </portType>
  <binding name="TaskFlightBinding" type="tf:TaskFlightPort">
    <soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/>
    <operation name="ListProjects">
      <soap:operation soapAction="${NS}#ListProjects"/>
      <input><soap:body use="literal"/></input><output><soap:body use="literal"/></output>
    </operation>
    <operation name="GetTicket">
      <soap:operation soapAction="${NS}#GetTicket"/>
      <input><soap:body use="literal"/></input><output><soap:body use="literal"/></output>
    </operation>
  </binding>
  <service name="TaskFlightService">
    <port name="TaskFlightPort" binding="tf:TaskFlightBinding">
      <soap:address location="/api/soap"/>
    </port>
  </service>
</definitions>`;

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.has("wsdl")) {
    return new Response(WSDL, {
      status: 200,
      headers: { "Content-Type": "text/xml; charset=utf-8" },
    });
  }
  return fault("Client", "This is a SOAP endpoint — POST an envelope, or GET ?wsdl.", 400);
}

export async function POST(request: Request) {
  const auth = await resolveAuth((name) => request.headers.get(name));
  if (!auth.ok) return fault("Client", auth.message, 401);

  const raw = await request.text();
  let parsed: Record<string, unknown>;
  try {
    parsed = new XMLParser({
      removeNSPrefix: true,
      ignoreAttributes: true,
    }).parse(raw) as Record<string, unknown>;
  } catch {
    return fault("Client", "Malformed XML envelope.", 400);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = (parsed as any)?.Envelope?.Body;
  if (!body || typeof body !== "object") {
    return fault("Client", "Missing soap:Body.", 400);
  }

  const db = buggyapiDb();

  if ("ListProjects" in body) {
    const { data } = await db
      .from("ba_projects")
      .select("key, name, status")
      .eq("sandbox_id", auth.sandboxId)
      .order("created_at", { ascending: true });
    const projects = (data ?? [])
      .map(
        (p) => `      <Project>
        <Key>${xmlEscape(p.key)}</Key>
        <Name>${xmlEscape(p.name)}</Name>
        <Status>${xmlEscape(p.status)}</Status>
      </Project>`,
      )
      .join("\n");
    return ok(`    <tf:ListProjectsResponse>\n${projects}\n    </tf:ListProjectsResponse>`);
  }

  if ("GetTicket" in body) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ref = String((body as any).GetTicket?.Ref ?? "");
    const parsedRef = parseTicketRef(ref);
    if (!parsedRef) return fault("Client", `Ref must look like "TF-12" (got "${ref}").`, 400);

    const { data: project } = await db
      .from("ba_projects")
      .select("id")
      .eq("sandbox_id", auth.sandboxId)
      .eq("key", parsedRef.key)
      .maybeSingle();
    const { data: ticket } = project
      ? await db
          .from("ba_tickets")
          .select("title, status, priority")
          .eq("project_id", project.id)
          .eq("number", parsedRef.number)
          .maybeSingle()
      : { data: null };
    if (!ticket) return fault("Client", `Ticket ${ref} does not exist.`, 404);

    return ok(`    <tf:GetTicketResponse>
      <Ref>${xmlEscape(ref)}</Ref>
      <Title>${xmlEscape(ticket.title)}</Title>
      <Status>${xmlEscape(ticket.status)}</Status>
      <Priority>${xmlEscape(ticket.priority)}</Priority>
    </tf:GetTicketResponse>`);
  }

  return fault("Client", "Unknown operation. Supported: ListProjects, GetTicket.", 400);
}
