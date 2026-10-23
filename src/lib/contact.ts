/** Public contact address. Mail to it forwards to the owner's inbox (Namecheap email forwarding). */
export const CONTACT_EMAIL = "hello@creatour.co";

export function mailto(subject?: string) {
  return `mailto:${CONTACT_EMAIL}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
}
