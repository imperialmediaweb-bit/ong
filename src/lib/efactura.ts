/**
 * e-Factura / ANAF SPV Integration
 *
 * Generates UBL 2.1 XML invoices and uploads them to ANAF SPV
 * (Sistemul Patrimonial Virtual)
 *
 * Flow:
 * 1. Generate UBL XML from our invoice data
 * 2. Upload XML to ANAF via API
 * 3. ANAF validates and returns index_incarcare
 * 4. Check status periodically
 *
 * OAuth2 flow for ANAF:
 * 1. Redirect to ANAF login
 * 2. Get authorization code
 * 3. Exchange for access/refresh tokens
 * 4. Use access token for API calls
 */

// ─── ANAF API URLs ──────────────────────────────────────────────

const ANAF_OAUTH_SANDBOX = "https://logincert.anaf.ro/anaf-oauth2/v1";
const ANAF_OAUTH_PRODUCTION = "https://logincert.anaf.ro/anaf-oauth2/v1";
const ANAF_API_SANDBOX = "https://api.anaf.ro/test/FCTEL/rest";
const ANAF_API_PRODUCTION = "https://api.anaf.ro/prod/FCTEL/rest";

function getApiUrl(sandbox: boolean): string {
  return sandbox ? ANAF_API_SANDBOX : ANAF_API_PRODUCTION;
}

function getOAuthUrl(sandbox: boolean): string {
  return sandbox ? ANAF_OAUTH_SANDBOX : ANAF_OAUTH_PRODUCTION;
}

// ─── Types ──────────────────────────────────────────────────────

export interface EFacturaConfig {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date | null;
  sandbox: boolean;
  cui: string;
  callbackUrl: string;
}

export interface InvoiceForXml {
  invoiceNumber: string;
  invoiceSeries?: string;
  issueDate: string;  // YYYY-MM-DD
  dueDate?: string;
  currency: string;
  // Seller
  sellerName: string;
  sellerCui?: string;
  sellerRegCom?: string;
  sellerAddress?: string;
  sellerCity?: string;
  sellerCounty?: string;
  sellerCountry?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  sellerIban?: string;
  sellerBankName?: string;
  sellerVatPayer: boolean;
  // Buyer
  buyerName: string;
  buyerCui?: string;
  buyerRegCom?: string;
  buyerAddress?: string;
  buyerCity?: string;
  buyerCounty?: string;
  buyerCountry?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  // Items
  items: {
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    vatRate: number;
    totalNet: number;
    totalVat: number;
    totalGross: number;
  }[];
  // Totals
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  // Notes
  notes?: string;
}

export interface EFacturaUploadResult {
  success: boolean;
  indexIncarcare?: string;
  errors?: string[];
  responseXml?: string;
}

export interface EFacturaStatusResult {
  status: string;  // ok, nok, in_prelucrare
  errors?: string[];
  downloadId?: string;
}

// ─── OAuth2 Helpers ─────────────────────────────────────────────

/**
 * Get OAuth2 authorization URL for ANAF login
 */
export function getAnafAuthUrl(config: { clientId: string; callbackUrl: string; sandbox: boolean }): string {
  const baseUrl = getOAuthUrl(config.sandbox);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
    token_content_type: "jwt",
  });
  return `${baseUrl}/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeAnafCode(
  code: string,
  config: { clientId: string; clientSecret: string; callbackUrl: string; sandbox: boolean }
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const baseUrl = getOAuthUrl(config.sandbox);

  const response = await fetch(`${baseUrl}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.callbackUrl,
      token_content_type: "jwt",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`ANAF OAuth error: ${response.status} - ${text}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Refresh expired access token
 */
export async function refreshAnafToken(
  config: { clientId: string; clientSecret: string; refreshToken: string; sandbox: boolean }
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const baseUrl = getOAuthUrl(config.sandbox);

  const response = await fetch(`${baseUrl}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: config.refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      token_content_type: "jwt",
    }),
  });

  if (!response.ok) {
    throw new Error(`ANAF token refresh error: ${response.status}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || config.refreshToken,
    expiresIn: data.expires_in,
  };
}

// ─── UBL XML Generation ────────────────────────────────────────

/**
 * Generate UBL 2.1 Invoice XML for ANAF e-Factura
 * Follows Romanian CIUS-RO standard
 */
export function generateUblXml(invoice: InvoiceForXml): string {
  const escXml = (str: string | undefined | null): string => {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  };

  const formatDate = (date: string): string => {
    // Ensure YYYY-MM-DD format
    return date.substring(0, 10);
  };

  const taxCategoryCode = invoice.sellerVatPayer ? "S" : "E";
  const vatExemptionReason = invoice.sellerVatPayer
    ? ""
    : "VATE - Scutit de TVA conform art. 292 Cod Fiscal";

  // Group items by VAT rate
  const vatGroups: Record<number, { taxableAmount: number; taxAmount: number }> = {};
  for (const item of invoice.items) {
    const rate = item.vatRate || 0;
    if (!vatGroups[rate]) {
      vatGroups[rate] = { taxableAmount: 0, taxAmount: 0 };
    }
    vatGroups[rate].taxableAmount += item.totalNet;
    vatGroups[rate].taxAmount += item.totalVat;
  }

  const taxSubtotals = Object.entries(vatGroups).map(([rate, amounts]) => `
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${escXml(invoice.currency)}">${amounts.taxableAmount.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${escXml(invoice.currency)}">${amounts.taxAmount.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>${taxCategoryCode}</cbc:ID>
        <cbc:Percent>${Number(rate).toFixed(2)}</cbc:Percent>
        ${!invoice.sellerVatPayer ? `<cbc:TaxExemptionReason>${vatExemptionReason}</cbc:TaxExemptionReason>` : ""}
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`).join("");

  const invoiceLines = invoice.items.map((item, index) => `
    <cac:InvoiceLine>
      <cbc:ID>${index + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="${escXml(item.unit) || "C62"}">${item.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="${escXml(invoice.currency)}">${item.totalNet.toFixed(2)}</cbc:LineExtensionAmount>
      <cac:Item>
        <cbc:Description>${escXml(item.description)}</cbc:Description>
        <cbc:Name>${escXml(item.description)}</cbc:Name>
        <cac:ClassifiedTaxCategory>
          <cbc:ID>${taxCategoryCode}</cbc:ID>
          <cbc:Percent>${(item.vatRate || 0).toFixed(2)}</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="${escXml(invoice.currency)}">${item.unitPrice.toFixed(2)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ccts="urn:un:unece:uncefact:documentation:2"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:efactura.mfinante.ro:CIUS-RO:1.0.1</cbc:CustomizationID>
  <cbc:ID>${escXml(invoice.invoiceNumber)}</cbc:ID>
  <cbc:IssueDate>${formatDate(invoice.issueDate)}</cbc:IssueDate>
  ${invoice.dueDate ? `<cbc:DueDate>${formatDate(invoice.dueDate)}</cbc:DueDate>` : ""}
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  ${invoice.notes ? `<cbc:Note>${escXml(invoice.notes)}</cbc:Note>` : ""}
  <cbc:DocumentCurrencyCode>${escXml(invoice.currency)}</cbc:DocumentCurrencyCode>

  <!-- Seller -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${escXml(invoice.sellerName)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        ${invoice.sellerAddress ? `<cbc:StreetName>${escXml(invoice.sellerAddress)}</cbc:StreetName>` : ""}
        ${invoice.sellerCity ? `<cbc:CityName>${escXml(invoice.sellerCity)}</cbc:CityName>` : ""}
        ${invoice.sellerCounty ? `<cbc:CountrySubentity>${escXml(invoice.sellerCounty)}</cbc:CountrySubentity>` : ""}
        <cac:Country>
          <cbc:IdentificationCode>${escXml(invoice.sellerCountry || "RO")}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      ${invoice.sellerCui ? `
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${invoice.sellerVatPayer ? "RO" : ""}${escXml(invoice.sellerCui)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>` : ""}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escXml(invoice.sellerName)}</cbc:RegistrationName>
        ${invoice.sellerCui ? `<cbc:CompanyID>${escXml(invoice.sellerCui)}</cbc:CompanyID>` : ""}
        ${invoice.sellerRegCom ? `<cbc:CompanyLegalForm>${escXml(invoice.sellerRegCom)}</cbc:CompanyLegalForm>` : ""}
      </cac:PartyLegalEntity>
      ${invoice.sellerEmail ? `
      <cac:Contact>
        <cbc:ElectronicMail>${escXml(invoice.sellerEmail)}</cbc:ElectronicMail>
        ${invoice.sellerPhone ? `<cbc:Telephone>${escXml(invoice.sellerPhone)}</cbc:Telephone>` : ""}
      </cac:Contact>` : ""}
    </cac:Party>
  </cac:AccountingSupplierParty>

  <!-- Buyer -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>${escXml(invoice.buyerName)}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        ${invoice.buyerAddress ? `<cbc:StreetName>${escXml(invoice.buyerAddress)}</cbc:StreetName>` : ""}
        ${invoice.buyerCity ? `<cbc:CityName>${escXml(invoice.buyerCity)}</cbc:CityName>` : ""}
        ${invoice.buyerCounty ? `<cbc:CountrySubentity>${escXml(invoice.buyerCounty)}</cbc:CountrySubentity>` : ""}
        <cac:Country>
          <cbc:IdentificationCode>${escXml(invoice.buyerCountry || "RO")}</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      ${invoice.buyerCui ? `
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${escXml(invoice.buyerCui)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>` : ""}
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${escXml(invoice.buyerName)}</cbc:RegistrationName>
        ${invoice.buyerCui ? `<cbc:CompanyID>${escXml(invoice.buyerCui)}</cbc:CompanyID>` : ""}
      </cac:PartyLegalEntity>
      ${invoice.buyerEmail ? `
      <cac:Contact>
        <cbc:ElectronicMail>${escXml(invoice.buyerEmail)}</cbc:ElectronicMail>
        ${invoice.buyerPhone ? `<cbc:Telephone>${escXml(invoice.buyerPhone)}</cbc:Telephone>` : ""}
      </cac:Contact>` : ""}
    </cac:Party>
  </cac:AccountingCustomerParty>

  ${invoice.sellerIban ? `
  <!-- Payment Means -->
  <cac:PaymentMeans>
    <cbc:PaymentMeansCode>30</cbc:PaymentMeansCode>
    <cac:PayeeFinancialAccount>
      <cbc:ID>${escXml(invoice.sellerIban)}</cbc:ID>
      ${invoice.sellerBankName ? `
      <cac:FinancialInstitutionBranch>
        <cbc:Name>${escXml(invoice.sellerBankName)}</cbc:Name>
      </cac:FinancialInstitutionBranch>` : ""}
    </cac:PayeeFinancialAccount>
  </cac:PaymentMeans>` : ""}

  <!-- Tax Total -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${escXml(invoice.currency)}">${invoice.vatAmount.toFixed(2)}</cbc:TaxAmount>
    ${taxSubtotals}
  </cac:TaxTotal>

  <!-- Legal Monetary Total -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${escXml(invoice.currency)}">${invoice.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${escXml(invoice.currency)}">${invoice.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${escXml(invoice.currency)}">${invoice.totalAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${escXml(invoice.currency)}">${invoice.totalAmount.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>

  <!-- Invoice Lines -->
  ${invoiceLines}
</Invoice>`;
}

// ─── Upload to ANAF ─────────────────────────────────────────────

/**
 * Upload UBL XML invoice to ANAF SPV
 */
export async function uploadToAnaf(
  xml: string,
  config: EFacturaConfig
): Promise<EFacturaUploadResult> {
  const apiUrl = getApiUrl(config.sandbox);
  const uploadUrl = `${apiUrl}/upload?standard=UBL&cif=${config.cui}`;

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      "Authorization": `Bearer ${config.accessToken}`,
    },
    body: xml,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[e-Factura] Upload error:", response.status, text);
    return {
      success: false,
      errors: [`ANAF API error: ${response.status} - ${text}`],
    };
  }

  const data = await response.json();

  if (data.erpiduireroare) {
    return {
      success: false,
      errors: [data.erpiduireroare],
    };
  }

  return {
    success: true,
    indexIncarcare: data.index_incarcare?.toString(),
    responseXml: JSON.stringify(data),
  };
}

/**
 * Check the status of an uploaded e-Factura
 */
export async function checkEFacturaStatus(
  indexIncarcare: string,
  config: EFacturaConfig
): Promise<EFacturaStatusResult> {
  const apiUrl = getApiUrl(config.sandbox);
  const statusUrl = `${apiUrl}/stareMesaj?id_incarcare=${indexIncarcare}`;

  const response = await fetch(statusUrl, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${config.accessToken}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    return {
      status: "error",
      errors: [`ANAF status check error: ${response.status} - ${text}`],
    };
  }

  const data = await response.json();

  return {
    status: data.stare || "unknown",
    errors: data.erpiduireroare ? [data.erpiduireroare] : undefined,
    downloadId: data.id_descarcare?.toString(),
  };
}

/**
 * Download the validated e-Factura from ANAF
 */
export async function downloadEFactura(
  downloadId: string,
  config: EFacturaConfig
): Promise<string> {
  const apiUrl = getApiUrl(config.sandbox);
  const downloadUrl = `${apiUrl}/descarcare?id=${downloadId}`;

  const response = await fetch(downloadUrl, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${config.accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Download error: ${response.status}`);
  }

  return response.text();
}

// ─── Config Loader ──────────────────────────────────────────────

export async function getEFacturaConfig(): Promise<EFacturaConfig | null> {
  try {
    const { default: prisma } = await import("@/lib/db");
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "platform" },
      select: {
        eFacturaEnabled: true,
        anafClientId: true,
        anafClientSecret: true,
        anafAccessToken: true,
        anafRefreshToken: true,
        anafTokenExpiresAt: true,
        anafSandbox: true,
        anafCui: true,
        anafCallbackUrl: true,
      },
    });

    if (!settings?.eFacturaEnabled || !settings.anafClientId || !settings.anafCui) {
      return null;
    }

    const appUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || "https://binevo.ro";

    return {
      clientId: settings.anafClientId,
      clientSecret: settings.anafClientSecret || "",
      accessToken: settings.anafAccessToken || "",
      refreshToken: settings.anafRefreshToken || "",
      tokenExpiresAt: settings.anafTokenExpiresAt,
      sandbox: settings.anafSandbox,
      cui: settings.anafCui,
      callbackUrl: settings.anafCallbackUrl || `${appUrl}/api/admin/efactura/callback`,
    };
  } catch (err) {
    console.error("Failed to load e-Factura config:", err);
    return null;
  }
}

/**
 * Ensure we have a valid access token, refreshing if needed
 */
export async function ensureValidToken(config: EFacturaConfig): Promise<EFacturaConfig> {
  if (config.tokenExpiresAt && new Date() < config.tokenExpiresAt) {
    return config; // Token still valid
  }

  if (!config.refreshToken) {
    throw new Error("Token expirat si nu exista refresh token. Reautorizati in ANAF.");
  }

  // Refresh the token
  const result = await refreshAnafToken({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    refreshToken: config.refreshToken,
    sandbox: config.sandbox,
  });

  // Update in database
  const { default: prisma } = await import("@/lib/db");
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + result.expiresIn);

  await prisma.platformSettings.update({
    where: { id: "platform" },
    data: {
      anafAccessToken: result.accessToken,
      anafRefreshToken: result.refreshToken,
      anafTokenExpiresAt: expiresAt,
    },
  });

  return {
    ...config,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    tokenExpiresAt: expiresAt,
  };
}
