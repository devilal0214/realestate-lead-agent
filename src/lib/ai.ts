import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function generateChatResponse(
  messages: ChatMessage[],
  systemPrompt: string,
  knowledgeContext?: string
): Promise<{ content: string; tokensUsed: number }> {
  const systemContent = knowledgeContext
    ? `${systemPrompt}\n\nKnowledge Base Context:\n${knowledgeContext}`
    : systemPrompt

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: systemContent }, ...messages],
    max_tokens: 500,
    temperature: 0.7,
  })

  return {
    content: response.choices[0]?.message?.content ?? 'I apologize, I could not generate a response.',
    tokensUsed: response.usage?.total_tokens ?? 0,
  }
}

export async function extractLeadInfo(conversationText: string): Promise<{
  name?: string; email?: string; phone?: string; budget?: string
  propertyType?: string; location?: string; timeline?: string
}> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Extract lead info from this real estate conversation. Return ONLY JSON with fields: name, email, phone, budget, propertyType, location, timeline (null if missing).',
        },
        { role: 'user', content: conversationText },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 200,
    })
    return JSON.parse(response.choices[0]?.message?.content ?? '{}')
  } catch {
    return {}
  }
}
