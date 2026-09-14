export const BUSINESS_ID = process.env.NEXT_PUBLIC_OUTSYDE_BUSINESS_ID!
export const API_URL = process.env.NEXT_PUBLIC_OUTSYDE_API_URL!
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!

export const VENDOR_CONFIG = {
  vendorName: "Braids With Lana",
  businessName: "Braids With Lana",
  businessSlug: "braids-with-lana",
  location: "Saint Albans, Queens, NY",
  ownerName: "Dede L Dounou",
  hasBookings: true,
  hasServices: true,
  hasProducts: false,
  hasAnalytics: true,
  hasSubscription: true,
} as const

export const ADMIN_EMAILS = [
  "donialana15@gmail.com",
  "info@goutsyde.com",
]

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const lower = email.toLowerCase()
  return lower === "donialana15@gmail.com" || lower === "info@goutsyde.com"
}
