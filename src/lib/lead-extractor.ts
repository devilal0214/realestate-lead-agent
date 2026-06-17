export interface ExtractedLead {
  name?: string
  email?: string
  phone?: string
  budget?: string
  propertyType?: string
  location?: string
  timeline?: string
}

// Regex patterns for extracting lead info from conversation text
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
const PHONE_REGEX = /(\+?1?\s?)?(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/
const BUDGET_REGEX =
  /\$[\d,]+(?:\s*(?:k|K|thousand|million|M))?\s*(?:to|-)\s*\$[\d,]+(?:\s*(?:k|K|thousand|million|M))?|\$[\d,]+(?:\s*(?:k|K|thousand|million|M))?/i

const PROPERTY_TYPES = [
  'house',
  'home',
  'apartment',
  'condo',
  'condominium',
  'townhouse',
  'townhome',
  'villa',
  'studio',
  'duplex',
  'commercial',
  'office',
  'retail',
  'land',
  'lot',
  'farm',
  'ranch',
]

const TIMELINE_PATTERNS = [
  /(?:asap|immediately|right away|as soon as possible)/i,
  /(?:within|in)\s+(?:\d+\s+)?(?:week|month|year)s?/i,
  /(?:by|before)\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)/i,
  /(?:\d+)\s+(?:week|month|year)s?/i,
  /(?:next|this)\s+(?:week|month|year|quarter)/i,
  /(?:spring|summer|fall|winter|q1|q2|q3|q4)/i,
]

export function extractLeadFromText(conversationText: string): ExtractedLead {
  const result: ExtractedLead = {}

  const emailMatch = conversationText.match(EMAIL_REGEX)
  if (emailMatch) result.email = emailMatch[0]

  const phoneMatch = conversationText.match(PHONE_REGEX)
  if (phoneMatch) result.phone = phoneMatch[0].trim()

  const budgetMatch = conversationText.match(BUDGET_REGEX)
  if (budgetMatch) result.budget = budgetMatch[0].trim()

  const lowerText = conversationText.toLowerCase()
  for (const type of PROPERTY_TYPES) {
    if (lowerText.includes(type)) {
      result.propertyType = type.charAt(0).toUpperCase() + type.slice(1)
      break
    }
  }

  for (const pattern of TIMELINE_PATTERNS) {
    const match = conversationText.match(pattern)
    if (match) {
      result.timeline = match[0].trim()
      break
    }
  }

  return result
}

export function hasEnoughLeadData(lead: ExtractedLead): boolean {
  // Consider a lead ready if we have at least an email or phone, plus some context
  const hasContact = !!(lead.email || lead.phone)
  const hasContext = !!(lead.budget || lead.propertyType || lead.location || lead.timeline)
  return hasContact || (hasContext && !!(lead.name))
}

export function mergeLeadData(existing: ExtractedLead, newData: ExtractedLead): ExtractedLead {
  return {
    name: newData.name || existing.name,
    email: newData.email || existing.email,
    phone: newData.phone || existing.phone,
    budget: newData.budget || existing.budget,
    propertyType: newData.propertyType || existing.propertyType,
    location: newData.location || existing.location,
    timeline: newData.timeline || existing.timeline,
  }
}
