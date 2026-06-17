import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const industries = [
  {
    name: 'Real Estate',
    slug: 'real-estate',
    description: 'AI chatbot for real estate agents, brokers, and property managers',
    icon: '🏠',
    defaultPrompt: `You are a friendly real estate AI assistant. Help visitors find their dream property by asking qualifying questions about:
- Budget range
- Property type (house, condo, apartment, commercial)
- Location preferences
- Number of bedrooms/bathrooms
- Timeline for purchase/rental
- Must-have features

Be professional, empathetic, and helpful. Capture contact information when the visitor shows genuine interest.`,
    defaultColor: '#2563eb',
    features: [
      { name: 'Lead Qualification', description: 'Automatically qualify leads by budget and requirements' },
      { name: 'Property Matching', description: 'Match visitors with relevant properties' },
      { name: 'Virtual Tours', description: 'Schedule virtual property tours' },
      { name: 'Price Estimates', description: 'Provide property value estimates' }
    ],
    pricing: [
      { plan: 'free', monthlyPrice: 0, yearlyPrice: 0, trialDays: 0, messageLimit: 100, chatbotLimit: 1, leadLimit: 50 },
      { plan: 'starter', monthlyPrice: 2900, yearlyPrice: 29000, trialDays: 14, messageLimit: 1000, chatbotLimit: 3, leadLimit: 500 },
      { plan: 'pro', monthlyPrice: 9900, yearlyPrice: 99000, trialDays: 14, messageLimit: 10000, chatbotLimit: 10, leadLimit: 5000 },
      { plan: 'enterprise', monthlyPrice: 29900, yearlyPrice: 299000, trialDays: 14, messageLimit: -1, chatbotLimit: -1, leadLimit: -1 }
    ]
  },
  {
    name: 'Legal Services',
    slug: 'legal',
    description: 'AI chatbot for law firms and legal professionals',
    icon: '⚖️',
    defaultPrompt: `You are a professional legal intake assistant. Help visitors by:
- Understanding their legal issue/case type (family law, personal injury, criminal, business, etc.)
- Determining urgency (immediate, urgent, routine consultation)
- Collecting basic case details (without providing legal advice)
- Scheduling initial consultations
- Capturing contact information

Always remind visitors that this is not legal advice and encourage them to speak with an attorney. Be empathetic and professional.`,
    defaultColor: '#1e40af',
    features: [
      { name: 'Case Intake', description: 'Automated case intake and qualification' },
      { name: 'Appointment Booking', description: 'Schedule consultations with attorneys' },
      { name: 'Document Collection', description: 'Request and collect necessary documents' },
      { name: 'Client Portal Access', description: 'Provide portal access for existing clients' }
    ],
    pricing: [
      { plan: 'free', monthlyPrice: 0, yearlyPrice: 0, trialDays: 0, messageLimit: 100, chatbotLimit: 1, leadLimit: 50 },
      { plan: 'starter', monthlyPrice: 4900, yearlyPrice: 49000, trialDays: 14, messageLimit: 1000, chatbotLimit: 3, leadLimit: 500 },
      { plan: 'pro', monthlyPrice: 14900, yearlyPrice: 149000, trialDays: 14, messageLimit: 10000, chatbotLimit: 10, leadLimit: 5000 },
      { plan: 'enterprise', monthlyPrice: 39900, yearlyPrice: 399000, trialDays: 14, messageLimit: -1, chatbotLimit: -1, leadLimit: -1 }
    ]
  },
  {
    name: 'Healthcare',
    slug: 'healthcare',
    description: 'AI chatbot for medical practices and healthcare providers',
    icon: '🏥',
    defaultPrompt: `You are a helpful medical office assistant. Help patients by:
- Understanding their health concern or reason for visit
- Collecting basic patient information (name, date of birth, contact)
- Checking insurance information
- Scheduling appointments with appropriate providers
- Providing office hours and location information
- Answering common questions about services offered

Always remind patients that this is not medical advice and to seek emergency care for urgent situations (direct them to 911 or ER). Be caring, professional, and HIPAA-compliant.`,
    defaultColor: '#dc2626',
    features: [
      { name: 'Appointment Scheduling', description: 'Book appointments with doctors and specialists' },
      { name: 'Symptom Checker', description: 'Initial symptom assessment and triage' },
      { name: 'Insurance Verification', description: 'Verify insurance coverage' },
      { name: 'Patient Portal', description: 'Guide patients to portal for records' }
    ],
    pricing: [
      { plan: 'free', monthlyPrice: 0, yearlyPrice: 0, trialDays: 0, messageLimit: 100, chatbotLimit: 1, leadLimit: 50 },
      { plan: 'starter', monthlyPrice: 3900, yearlyPrice: 39000, trialDays: 14, messageLimit: 1000, chatbotLimit: 3, leadLimit: 500 },
      { plan: 'pro', monthlyPrice: 11900, yearlyPrice: 119000, trialDays: 14, messageLimit: 10000, chatbotLimit: 10, leadLimit: 5000 },
      { plan: 'enterprise', monthlyPrice: 34900, yearlyPrice: 349000, trialDays: 14, messageLimit: -1, chatbotLimit: -1, leadLimit: -1 }
    ]
  },
  {
    name: 'Restaurants',
    slug: 'restaurants',
    description: 'AI chatbot for restaurants and food service businesses',
    icon: '🍽️',
    defaultPrompt: `You are a friendly restaurant host assistant. Help customers with:
- Table reservations (date, time, party size, special occasions)
- Menu questions and recommendations
- Dietary restrictions and allergies
- Special requests (high chairs, wheelchair access, private dining)
- Takeout and delivery orders
- Hours and location information

Be warm, welcoming, and make customers excited about dining with us!`,
    defaultColor: '#ea580c',
    features: [
      { name: 'Reservation System', description: 'Take and manage table reservations' },
      { name: 'Menu Assistance', description: 'Answer menu questions and make recommendations' },
      { name: 'Order Taking', description: 'Process takeout and delivery orders' },
      { name: 'Special Occasions', description: 'Handle birthday parties and special events' }
    ],
    pricing: [
      { plan: 'free', monthlyPrice: 0, yearlyPrice: 0, trialDays: 0, messageLimit: 200, chatbotLimit: 1, leadLimit: 100 },
      { plan: 'starter', monthlyPrice: 1900, yearlyPrice: 19000, trialDays: 14, messageLimit: 2000, chatbotLimit: 3, leadLimit: 1000 },
      { plan: 'pro', monthlyPrice: 4900, yearlyPrice: 49000, trialDays: 14, messageLimit: 10000, chatbotLimit: 10, leadLimit: 5000 },
      { plan: 'enterprise', monthlyPrice: 14900, yearlyPrice: 149000, trialDays: 14, messageLimit: -1, chatbotLimit: -1, leadLimit: -1 }
    ]
  },
  {
    name: 'Hotels & Hospitality',
    slug: 'hotels',
    description: 'AI chatbot for hotels, resorts, and hospitality businesses',
    icon: '🏨',
    defaultPrompt: `You are a professional hotel concierge assistant. Help guests with:
- Room availability and booking
- Check-in/check-out information
- Amenities and services (pool, gym, spa, room service)
- Local recommendations (restaurants, attractions, transportation)
- Special requests (extra towels, late checkout, room upgrades)
- Business services for corporate guests

Be hospitable, professional, and make guests feel welcome and cared for.`,
    defaultColor: '#7c3aed',
    features: [
      { name: 'Booking Engine', description: 'Check availability and book rooms' },
      { name: 'Concierge Services', description: 'Provide local recommendations and assistance' },
      { name: 'Guest Services', description: 'Handle guest requests and inquiries' },
      { name: 'Event Planning', description: 'Coordinate meetings and events' }
    ],
    pricing: [
      { plan: 'free', monthlyPrice: 0, yearlyPrice: 0, trialDays: 0, messageLimit: 100, chatbotLimit: 1, leadLimit: 50 },
      { plan: 'starter', monthlyPrice: 3900, yearlyPrice: 39000, trialDays: 14, messageLimit: 1000, chatbotLimit: 3, leadLimit: 500 },
      { plan: 'pro', monthlyPrice: 11900, yearlyPrice: 119000, trialDays: 14, messageLimit: 10000, chatbotLimit: 10, leadLimit: 5000 },
      { plan: 'enterprise', monthlyPrice: 34900, yearlyPrice: 349000, trialDays: 14, messageLimit: -1, chatbotLimit: -1, leadLimit: -1 }
    ]
  },
  {
    name: 'Education',
    slug: 'education',
    description: 'AI chatbot for schools, universities, and educational institutions',
    icon: '🎓',
    defaultPrompt: `You are a helpful admissions and student services assistant. Help visitors with:
- Program information and course offerings
- Admission requirements and application process
- Tuition, fees, and financial aid
- Campus tours and open house events
- Student life and campus facilities
- Contact information for specific departments

Be informative, encouraging, and help prospective students envision their future at the institution.`,
    defaultColor: '#0891b2',
    features: [
      { name: 'Admissions Support', description: 'Guide prospective students through admissions' },
      { name: 'Course Catalog', description: 'Provide information about programs and courses' },
      { name: 'Financial Aid Info', description: 'Explain tuition and financial aid options' },
      { name: 'Campus Tours', description: 'Schedule campus visits and tours' }
    ],
    pricing: [
      { plan: 'free', monthlyPrice: 0, yearlyPrice: 0, trialDays: 0, messageLimit: 100, chatbotLimit: 1, leadLimit: 50 },
      { plan: 'starter', monthlyPrice: 2900, yearlyPrice: 29000, trialDays: 14, messageLimit: 1000, chatbotLimit: 3, leadLimit: 500 },
      { plan: 'pro', monthlyPrice: 8900, yearlyPrice: 89000, trialDays: 14, messageLimit: 10000, chatbotLimit: 10, leadLimit: 5000 },
      { plan: 'enterprise', monthlyPrice: 24900, yearlyPrice: 249000, trialDays: 14, messageLimit: -1, chatbotLimit: -1, leadLimit: -1 }
    ]
  },
  {
    name: 'E-commerce',
    slug: 'ecommerce',
    description: 'AI chatbot for online stores and e-commerce businesses',
    icon: '🛒',
    defaultPrompt: `You are a helpful online shopping assistant. Help customers with:
- Product recommendations based on needs and preferences
- Product availability, specifications, and pricing
- Order tracking and shipping information
- Returns, exchanges, and refund policies
- Discount codes and promotions
- Account and payment questions

Be friendly, helpful, and focused on providing an excellent shopping experience.`,
    defaultColor: '#16a34a',
    features: [
      { name: 'Product Recommendations', description: 'Suggest products based on preferences' },
      { name: 'Order Status', description: 'Track orders and shipments' },
      { name: 'Shopping Cart Help', description: 'Assist with cart and checkout issues' },
      { name: 'Return Processing', description: 'Handle returns and exchanges' }
    ],
    pricing: [
      { plan: 'free', monthlyPrice: 0, yearlyPrice: 0, trialDays: 0, messageLimit: 200, chatbotLimit: 1, leadLimit: 100 },
      { plan: 'starter', monthlyPrice: 2900, yearlyPrice: 29000, trialDays: 14, messageLimit: 2000, chatbotLimit: 3, leadLimit: 1000 },
      { plan: 'pro', monthlyPrice: 9900, yearlyPrice: 99000, trialDays: 14, messageLimit: 10000, chatbotLimit: 10, leadLimit: 5000 },
      { plan: 'enterprise', monthlyPrice: 29900, yearlyPrice: 299000, trialDays: 14, messageLimit: -1, chatbotLimit: -1, leadLimit: -1 }
    ]
  },
  {
    name: 'Custom AI Agent',
    slug: 'custom',
    description: 'Build your own custom AI chatbot for any industry',
    icon: '🤖',
    defaultPrompt: `You are a helpful AI assistant. Engage with visitors in a friendly, professional manner and help them with their questions. Adapt your tone and approach based on the context of the conversation.`,
    defaultColor: '#64748b',
    features: [
      { name: 'Custom Prompts', description: 'Create your own AI personality and behavior' },
      { name: 'Flexible Fields', description: 'Collect any data you need from visitors' },
      { name: 'Integration Ready', description: 'Connect with your existing tools' },
      { name: 'White Label', description: 'Fully customizable branding' }
    ],
    pricing: [
      { plan: 'free', monthlyPrice: 0, yearlyPrice: 0, trialDays: 0, messageLimit: 100, chatbotLimit: 1, leadLimit: 50 },
      { plan: 'starter', monthlyPrice: 3900, yearlyPrice: 39000, trialDays: 14, messageLimit: 1000, chatbotLimit: 3, leadLimit: 500 },
      { plan: 'pro', monthlyPrice: 12900, yearlyPrice: 129000, trialDays: 14, messageLimit: 10000, chatbotLimit: 10, leadLimit: 5000 },
      { plan: 'enterprise', monthlyPrice: 39900, yearlyPrice: 399000, trialDays: 14, messageLimit: -1, chatbotLimit: -1, leadLimit: -1 }
    ]
  }
]

async function main() {
  console.log('🌱 Seeding industries...')

  for (const industry of industries) {
    const { features, pricing, ...industryData } = industry

    const createdIndustry = await prisma.industry.upsert({
      where: { slug: industryData.slug },
      update: industryData,
      create: industryData
    })

    console.log(`✓ Created industry: ${createdIndustry.name}`)

    // Create features
    for (const feature of features) {
      await prisma.industryFeature.upsert({
        where: {
          id: `${createdIndustry.id}-${feature.name.toLowerCase().replace(/\s+/g, '-')}`
        },
        update: {
          ...feature,
          industryId: createdIndustry.id
        },
        create: {
          id: `${createdIndustry.id}-${feature.name.toLowerCase().replace(/\s+/g, '-')}`,
          ...feature,
          industryId: createdIndustry.id
        }
      })
    }

    // Create pricing tiers
    for (const price of pricing) {
      await prisma.industryPricing.upsert({
        where: {
          industryId_plan: {
            industryId: createdIndustry.id,
            plan: price.plan
          }
        },
        update: price,
        create: {
          ...price,
          industryId: createdIndustry.id
        }
      })
    }

    console.log(`  ✓ Added ${features.length} features and ${pricing.length} pricing tiers`)
  }

  console.log('✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
