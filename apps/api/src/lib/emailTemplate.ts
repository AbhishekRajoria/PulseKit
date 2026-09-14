type EventEmailData = {
  projectName: string;
  eventName: string;
  userId: string;
  userName?: string;
  payload: Record<string, unknown>;
  sentAt: Date;
};

// user-controlled values (event_name, user_id, user_name, payload) are
// interpolated into HTML below — escape every injected string or a payload
// value like "<img src=x onerror=...>" executes in the email client
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// "payment.failed" -> "Payment failed"; "apiKey" -> "Api key"; "insufficient_funds" -> "Insufficient funds"
export const sentenceCase = (value: string): string => {
  const words = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[_\-\s.]+/)
    .filter(Boolean);
  if (words.length === 0) return value;
  const joined = words.join(" ").toLowerCase();
  return joined.charAt(0).toUpperCase() + joined.slice(1);
};

// "decline_reason" -> "Decline Reason"
const titleCase = (value: string): string =>
  sentenceCase(value)
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

// turn arbitrary payload values into something a person can read:
// booleans -> Yes/No, null -> "—", nested objects collapse to a count
// instead of dumping raw JSON; snake_case/camelCase strings get humanized
const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value))
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (typeof value === "object")
    return `${Object.keys(value).length} field${
      Object.keys(value).length === 1 ? "" : "s"
    }`;
  if (typeof value === "string") {
    if (value.includes("_") || /([a-z])([A-Z])/.test(value))
      return sentenceCase(value);
    return value;
  }
  return String(value);
};

// email clients strip <style> blocks and <link> stylesheets — every style
// must be inline on the element itself
const FONT =
  "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const renderEventEmail = ({
  projectName,
  eventName,
  userId,
  userName,
  payload,
  sentAt,
}: EventEmailData): string => {
  const sent =
    sentAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

  const entries = Object.entries(payload);
  const MAX_ROWS = 10;
  const visible = entries.slice(0, MAX_ROWS);
  const hiddenCount = entries.length - visible.length;

  const payloadRows = visible
    .map(
      ([key, value]) => `
        <tr>
          <td style="padding:14px 18px;border-top:1px solid #f1f5f9;">
            <div style="font-size:12px;color:#94a3b8;margin-bottom:4px;">${escapeHtml(
              titleCase(key),
            )}</div>
            <div style="font-size:14px;color:#1e293b;line-height:1.5;word-break:break-word;">${escapeHtml(
              formatValue(value),
            )}</div>
          </td>
        </tr>`,
    )
    .join("");

  const payloadHtml =
    payloadRows === ""
      ? `<div style="font-size:14px;color:#94a3b8;padding:12px 0;">No additional details</div>`
      : payloadRows +
        (hiddenCount > 0
          ? `
        <tr>
          <td style="padding:10px 18px;border-top:1px solid #f1f5f9;font-size:12px;color:#94a3b8;">+ ${hiddenCount} more</td>
        </tr>`
          : "");

  // greeting fires only when the sender supplied a user_name — the end
  // recipient is a human, so we address them by name when possible
  const greeting = userName
    ? `<div style="font-size:16px;color:#334155;margin-bottom:10px;">Hi ${escapeHtml(
        userName,
      )},</div>`
    : "";

  // "user_44" is the developer's internal identifier, meaningless to the
  // person reading this — it never appears; the recipient is shown a name
  // when the sender provides one
  void userId;

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
                <td align="right" style="font-size:11px;font-weight:600;letter-spacing:1px;color:#94a3b8;text-transform:uppercase;">Notification</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px 4px 28px;">
            ${greeting}
            <div style="font-size:12px;color:#94a3b8;margin-bottom:6px;">${escapeHtml(
              projectName,
            )}</div>
            <div style="font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">${escapeHtml(
              sentenceCase(eventName),
            )}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 28px 24px 28px;font-size:13px;color:#64748b;">
            ${
              userName
                ? `For ${escapeHtml(userName)} · `
                : ""
            }Sent ${escapeHtml(sent)}
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 28px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;">
              <tr>
                <td style="background:#f8fafc;padding:10px 18px;border-bottom:1px solid #e2e8f0;font-size:11px;font-weight:600;letter-spacing:1px;color:#94a3b8;text-transform:uppercase;">Details</td>
              </tr>
              ${payloadHtml}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px 24px 28px;border-top:1px solid #f1f5f9;font-size:12px;color:#94a3b8;text-align:center;">
            Sent by ${escapeHtml(projectName)} · via PulseKit
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
};