/**
 * One CSV cell. Names and emails are typed by visitors: a value starting with = + - or @ would run as a formula when
 * the file opens in Excel or Sheets, so those get a leading apostrophe (shown as plain text there). An email address
 * is left as typed: it can't be a working formula (no spaces, brackets or quotes), and the apostrophe would break
 * "+tag@example.com" for the email tool the file is imported into.
 */
const PLAIN_EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
export function csvCell(value: string) {
  const s = /^[=+\-@\t\r]/.test(value) && !PLAIN_EMAIL.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
