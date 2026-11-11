/**
 * One CSV cell. Names and emails are typed by visitors: a value starting with = + - or @ would run as a formula when
 * the file opens in Excel or Sheets, so those get a leading apostrophe (shown as plain text there).
 */
export function csvCell(value: string) {
  const s = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
