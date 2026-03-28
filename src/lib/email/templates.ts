// ─── Template helpers ─────────────────────────────────────────────────────────

function emailWrapper(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
          <!-- Header -->
          <tr>
            <td style="background:#18181b;padding:24px 32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:36px;height:36px;background:#ffffff;border-radius:8px;text-align:center;vertical-align:middle;">
                    <span style="font-size:14px;font-weight:700;color:#18181b;">SG</span>
                  </td>
                  <td style="padding-left:12px;">
                    <p style="margin:0;font-size:14px;font-weight:700;color:#ffffff;">SGIC</p>
                    <p style="margin:0;font-size:11px;color:#a1a1aa;">Giubilesi &amp; Associati — ISO 9001 Audit Suite</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #f4f4f5;">
              <p style="margin:0;font-size:11px;color:#a1a1aa;text-align:center;">
                Questo messaggio è stato generato automaticamente da SGIC.<br/>
                Giubilesi &amp; Associati S.r.l. — Sistema di Gestione Ispezioni e Conformità
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Urgency badge ─────────────────────────────────────────────────────────────

function urgencyBadge(daysUntil: number): string {
  if (daysUntil < 0) {
    return `<span style="display:inline-block;background:#fee2e2;color:#b91c1c;font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;">Scaduta da ${Math.abs(daysUntil)}gg</span>`;
  }
  if (daysUntil === 0) {
    return `<span style="display:inline-block;background:#fee2e2;color:#b91c1c;font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;">Oggi</span>`;
  }
  if (daysUntil <= 30) {
    return `<span style="display:inline-block;background:#fef3c7;color:#b45309;font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;">In ${daysUntil}gg</span>`;
  }
  return `<span style="display:inline-block;background:#dcfce7;color:#15803d;font-size:11px;font-weight:600;padding:2px 8px;border-radius:99px;">In ${daysUntil}gg</span>`;
}

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

// ─── Template 1: Riepilogo scadenze ───────────────────────────────────────────

export interface DeadlineSummaryItem {
  type: string;
  title: string;
  description: string;
  clientName: string;
  dueDate: string;
  daysUntil: number;
}

export function buildDeadlinesSummaryEmail(
  items: DeadlineSummaryItem[],
  generatedAt: string
): { subject: string; html: string } {
  const overdueCount = items.filter((i) => i.daysUntil < 0).length;
  const warning30Count = items.filter(
    (i) => i.daysUntil >= 0 && i.daysUntil <= 30
  ).length;

  const rows = items
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;vertical-align:top;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#18181b;">${item.title}</p>
        <p style="margin:2px 0 0;font-size:12px;color:#71717a;">${item.description} · ${item.clientName}</p>
      </td>
      <td style="padding:10px 0 10px 16px;border-bottom:1px solid #f4f4f5;vertical-align:top;white-space:nowrap;">
        <p style="margin:0;font-size:12px;color:#52525b;">${formatDate(item.dueDate)}</p>
        <div style="margin-top:4px;">${urgencyBadge(item.daysUntil)}</div>
      </td>
    </tr>`
    )
    .join("");

  const subject =
    overdueCount > 0
      ? `[SGIC] ${overdueCount} scadenza${overdueCount > 1 ? "e" : ""} già superate — riepilogo ${generatedAt}`
      : `[SGIC] Riepilogo scadenze — ${warning30Count} entro 30 giorni (${generatedAt})`;

  const body = `
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#18181b;">Riepilogo scadenze</h1>
    <p style="margin:0 0 24px;font-size:13px;color:#71717a;">Generato il ${generatedAt} · ${items.length} scadenze nei prossimi 90 giorni</p>

    ${
      overdueCount > 0
        ? `<div style="background:#fee2e2;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
        <p style="margin:0;font-size:13px;font-weight:600;color:#b91c1c;">${overdueCount} scadenza${overdueCount > 1 ? "e" : ""} già superate — richiedono attenzione immediata</p>
      </div>`
        : ""
    }

    <table width="100%" cellpadding="0" cellspacing="0">
      <thead>
        <tr>
          <th style="text-align:left;font-size:11px;font-weight:600;color:#a1a1aa;padding-bottom:8px;border-bottom:1px solid #e4e4e7;text-transform:uppercase;letter-spacing:.05em;">Scadenza</th>
          <th style="text-align:left;font-size:11px;font-weight:600;color:#a1a1aa;padding-bottom:8px;border-bottom:1px solid #e4e4e7;text-transform:uppercase;letter-spacing:.05em;padding-left:16px;">Data</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <p style="margin:24px 0 0;font-size:12px;color:#a1a1aa;">
      Per visualizzare il dettaglio completo, accedi a SGIC → sezione Scadenze.
    </p>`;

  return { subject, html: emailWrapper(subject, body) };
}

// ─── Template 2: Report audit ─────────────────────────────────────────────────

export interface AuditReportData {
  auditTitle: string;
  clientName: string;
  locationName: string;
  scheduledDate: string | null;
  score: number | null;
  openNCs: number;
  totalNCs: number;
  pendingACs: number;
  ncList: Array<{ title: string; severity: string; status: string }>;
}

export function buildAuditReportEmail(
  data: AuditReportData
): { subject: string; html: string } {
  const subject = `[SGIC] Report audit — ${data.auditTitle} · ${data.clientName}`;

  const scoreColor =
    data.score === null
      ? "#71717a"
      : data.score >= 85
        ? "#15803d"
        : data.score >= 70
          ? "#b45309"
          : "#b91c1c";

  const ncRows = data.ncList
    .map((nc) => {
      const sevColor =
        nc.severity === "critical"
          ? "#b91c1c"
          : nc.severity === "major"
            ? "#c2410c"
            : "#b45309";
      const sevLabel =
        nc.severity === "critical"
          ? "Critica"
          : nc.severity === "major"
            ? "Maggiore"
            : "Minore";
      return `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-size:13px;color:#18181b;">${nc.title}</td>
      <td style="padding:8px 0 8px 12px;border-bottom:1px solid #f4f4f5;">
        <span style="font-size:11px;font-weight:600;color:${sevColor};">${sevLabel}</span>
      </td>
    </tr>`;
    })
    .join("");

  const body = `
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#18181b;">Report audit</h1>
    <p style="margin:0 0 24px;font-size:13px;color:#71717a;">${data.clientName} · ${data.locationName}${data.scheduledDate ? ` · ${formatDate(data.scheduledDate)}` : ""}</p>

    <!-- Score -->
    <div style="background:#f4f4f5;border-radius:10px;padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;gap:16px;">
      <div>
        <p style="margin:0;font-size:11px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:.05em;">Compliance score</p>
        <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:${scoreColor};">${data.score !== null ? `${Math.round(data.score)}%` : "N/D"}</p>
      </div>
      <div style="margin-left:32px;">
        <p style="margin:0;font-size:11px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:.05em;">Non conformità</p>
        <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#18181b;">${data.openNCs} aperte / ${data.totalNCs} totali</p>
      </div>
      <div style="margin-left:32px;">
        <p style="margin:0;font-size:11px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:.05em;">Azioni correttive</p>
        <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#18181b;">${data.pendingACs} in corso</p>
      </div>
    </div>

    ${
      data.ncList.length > 0
        ? `<h2 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#18181b;">Non conformità rilevate</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
        <thead>
          <tr>
            <th style="text-align:left;font-size:11px;font-weight:600;color:#a1a1aa;padding-bottom:8px;border-bottom:1px solid #e4e4e7;text-transform:uppercase;">NC</th>
            <th style="text-align:left;font-size:11px;font-weight:600;color:#a1a1aa;padding-bottom:8px;border-bottom:1px solid #e4e4e7;text-transform:uppercase;padding-left:12px;">Severità</th>
          </tr>
        </thead>
        <tbody>${ncRows}</tbody>
      </table>`
        : `<p style="font-size:13px;color:#15803d;font-weight:600;">Nessuna non conformità rilevata in questo audit.</p>`
    }

    <p style="margin:0;font-size:12px;color:#a1a1aa;">
      Per il dettaglio completo delle azioni correttive richieste, accedere a SGIC.
    </p>`;

  return { subject, html: emailWrapper(subject, body) };
}

// ─── Template 3: Notifica AC scaduta ─────────────────────────────────────────

export interface OverdueACItem {
  acDescription: string;
  ncTitle: string;
  clientName: string;
  dueDate: string;
  daysOverdue: number;
  responsibleName: string;
}

export function buildOverdueACEmail(
  item: OverdueACItem
): { subject: string; html: string } {
  const subject = `[SGIC] Azione correttiva scaduta — ${item.ncTitle} (${item.daysOverdue}gg di ritardo)`;

  const body = `
    <div style="background:#fee2e2;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;font-weight:600;color:#b91c1c;">Azione correttiva scaduta da ${item.daysOverdue} giorno${item.daysOverdue > 1 ? "i" : ""}</p>
      <p style="margin:4px 0 0;font-size:12px;color:#7f1d1d;">Scadenza prevista: ${formatDate(item.dueDate)}</p>
    </div>

    <h1 style="margin:0 0 4px;font-size:18px;font-weight:700;color:#18181b;">Gentile ${item.responsibleName},</h1>
    <p style="margin:0 0 20px;font-size:13px;color:#52525b;">
      Le ricordiamo che l'azione correttiva assegnata risulta in ritardo rispetto alla scadenza concordata.
    </p>

    <div style="border:1px solid #e4e4e7;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:.05em;">Non conformità</p>
      <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#18181b;">${item.ncTitle}</p>
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:.05em;">Azione correttiva richiesta</p>
      <p style="margin:0 0 16px;font-size:13px;color:#52525b;">${item.acDescription}</p>
      <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:.05em;">Cliente</p>
      <p style="margin:0;font-size:13px;color:#52525b;">${item.clientName}</p>
    </div>

    <p style="margin:0;font-size:12px;color:#71717a;">
      Si prega di aggiornare lo stato dell'azione correttiva nel sistema SGIC o di contattare il referente Giubilesi &amp; Associati per concordare una nuova scadenza.
    </p>`;

  return { subject, html: emailWrapper(subject, body) };
}
