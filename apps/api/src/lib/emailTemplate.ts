type EventEmailData = {
  projectName: string;
  eventName: string;
  userId: string;
  payload: Record<string, unknown>;
  sentAt: Date;
};

// user-controlled values (event_name, user_id, payload) are interpolated into
// HTML below — escape every injected string or a payload value like
// "<img src=x onerror=...>" executes in the email client
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// email clients strip <style> blocks and <link> stylesheets — every style
// must be inline on the element itself
const FONT =
  "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO =
  "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export const renderEventEmail = ({
  projectName,
  eventName,
  userId,
  payload,
  sentAt,
}: EventEmailData): string => {
  const timestamp = sentAt
    .toISOString()
    .replace("T", " ")
    .slice(0, 19) + " UTC";

  const payloadHtml =
    Object.keys(payload).length === 0
      ? `<div style="color:#94a3b8;font-family:${MONO};font-size:13px;padding:12px 16px;">no payload</div>`
      : `<pre style="background:#0f172a;color:#e2e8f0;font-family:${MONO};font-size:13px;line-height:1.6;border-radius:8px;padding:16px;margin:0;white-space:pre-wrap;word-break:break-word;">${escapeHtml(
          JSON.stringify(payload, null, 2),
        )}</pre>`;

  // table wrapper = widest email-client compatibility (nested tables are evil
  // in Outlook; one outer table is fine)
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;font-family:${FONT};">
        <tr>
          <td style="padding:24px 28px;border-bottom:1px solid #f1f5f9;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;font-weight:600;letter-spacing:0.5px;color:#64748b;">PulseKit</td>
                <td align="right" style="font-size:11px;font-weight:600;letter-spacing:1px;color:#94a3b8;text-transform:uppercase;">Event received</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px 4px 28px;">
            <div style="font-size:12px;color:#94a3b8;margin-bottom:6px;">${escapeHtml(projectName)}</div>
            <div style="font-size:22px;font-weight:700;color:#0f172a;font-family:${MONO};line-height:1.3;">${escapeHtml(eventName)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 28px 28px 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:13px;color:#64748b;">
              <tr>
                <td style="padding-right:8px;">user</td>
                <td style="padding-right:24px;font-family:${MONO};color:#334155;">${escapeHtml(userId)}</td>
                <td style="padding-right:8px;color:#94a3b8;">sent</td>
                <td style="font-family:${MONO};color:#334155;">${timestamp}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 28px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;">
              <tr>
                <td style="background:#f8fafc;padding:8px 14px;border-bottom:1px solid #e2e8f0;font-size:11px;font-weight:600;letter-spacing:1px;color:#94a3b8;text-transform:uppercase;">payload</td>
              </tr>
              <tr>
                <td style="padding:16px;">${payloadHtml}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px 24px 28px;border-top:1px solid #f1f5f9;font-size:11px;color:#94a3b8;text-align:center;">
            PulseKit — developer notification infrastructure
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
};
