import OpenAI from 'openai'

let _openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY ?? 'placeholder',
    })
  }
  return _openai
}

export const DEFAULT_REAL_ESTATE_SYSTEM_PROMPT = `You are a professional real estate AI assistant helping potential buyers, sellers, and renters find their perfect property. Your role is to:

1. **Understand Client Needs**: Ask targeted questions to understand their requirements including:
   - Property type (house, apartment, condo, commercial, land)
   - Location preferences (city, neighborhood, school district)
   - Budget range
   - Timeline (when they need to move)
   - Size requirements (bedrooms, bathrooms, square footage)
   - Must-have features (garage, pool, yard, parking)

2. **Qualify Leads**: Gently gather contact information by building rapport:
   - Ask for their name naturally in conversation
   - Request their email to send property listings
   - Get their phone number for urgent updates

3. **Provide Value**: Share relevant market insights, explain the buying/renting/selling process, and answer real estate questions professionally.

4. **Stay On Topic**: Focus on real estate. If asked about unrelated topics, politely redirect to property needs.

5. **Be Conversational**: Use a warm, professional tone. Ask one or two questions at a time, not a lengthy list.

Start by warmly greeting the visitor and asking what brings them here today. Build the conversation naturally.`

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function generateChatResponse(
  messages: ChatMessage[],
  systemPrompt: string
): Promise<{ content: string; tokensUsed: number }> {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ],
    temperature: 0.7,
    max_tokens: 500,
  })

  const content = response.choices[0]?.message?.content ?? ''
  const tokensUsed = response.usage?.total_tokens ?? 0

  return { content, tokensUsed }
}

export async function extractLeadInfo(conversationText: string): Promise<{
  name?: string
  email?: string
  phone?: string
  budget?: string
  propertyType?: string
  location?: string
  timeline?: string
}> {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Extract lead information from this real estate conversation. Return ONLY a valid JSON object with these fields (use null for missing fields):
{
  "name": string | null,
  "email": string | null,
  "phone": string | null,
  "budget": string | null,
  "propertyType": string | null,
  "location": string | null,
  "timeline": string | null
}

Only extract information that was explicitly stated. Do not infer or guess.`,
      },
      {
        role: 'user',
        content: conversationText,
      },
    ],
    temperature: 0,
    max_tokens: 300,
    response_format: { type: 'json_object' },
  })

  try {
    const raw = response.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw)
    return {
      name: parsed.name || undefined,
      email: parsed.email || undefined,
      phone: parsed.phone || undefined,
      budget: parsed.budget || undefined,
      propertyType: parsed.propertyType || undefined,
      location: parsed.location || undefined,
      timeline: parsed.timeline || undefined,
    }
  } catch {
    return {}
  }
}
