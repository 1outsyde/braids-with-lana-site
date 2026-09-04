export const BUSINESS_ID = process.env.NEXT_PUBLIC_OUTSYDE_BUSINESS_ID!
export const API_URL = process.env.NEXT_PUBLIC_OUTSYDE_API_URL!
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!

export const VENDOR_CONFIG = {
  vendorName: "Braids With Love",
  ownerName: "Danei Johnson",
  hasBookings: true,
  hasServices: true,
  hasProducts: true,
  hasAnalytics: true,
  hasSubscription: true,
} as const

export const ADMIN_EMAILS = [
  "braidswithlove757@gmail.com",
  "info@goutsyde.com",
]

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
