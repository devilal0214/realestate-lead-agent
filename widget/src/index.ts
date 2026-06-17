// RealEstate AI Chat Widget SDK
// Pure TypeScript/JavaScript - No React dependency

interface WidgetConfig {
  botId: string
  apiUrl: string
}

interface BotConfig {
  id: string
  name: string
  welcomeMessage: string
  themeColor: string
  fontFamily: string
  logoUrl: string | null
  widgetPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

class RealEstateAIChatWidget {
  private botId: string
  private apiUrl: string
  private sessionId: string
  private visitorId: string
  private botConfig: BotConfig | null = null
  private messages: Message[] = []
  private isOpen = false
  private isTyping = false
  private container: HTMLElement | null = null
  private button: HTMLElement | null = null
  private chatWindow: HTMLElement | null = null

  constructor(config: WidgetConfig) {
    this.botId = config.botId
    this.apiUrl = config.apiUrl
    this.sessionId = this.getOrCreateSessionId()
    this.visitorId = this.getOrCreateVisitorId()
    this.init()
  }

  private getOrCreateSessionId(): string {
    const key = `aiw_session_${this.botId}`
    let session = sessionStorage.getItem(key)
    if (!session) {
      session = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem(key, session)
    }
    return session
  }

  private getOrCreateVisitorId(): string {
    const key = 'aiw_visitor_id'
    let visitor = localStorage.getItem(key)
    if (!visitor) {
      visitor = `vis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem(key, visitor)
    }
    return visitor
  }

  private async init() {
    try {
      await this.loadBotConfig()
    } catch (e) {
      console.warn('[AIWidget] Failed to load config, using defaults')
      this.botConfig = {
        id: this.botId,
        name: 'AI Assistant',
        welcomeMessage: 'Hi! How can I help you find your perfect property?',
        themeColor: '#2563eb',
        fontFamily: 'Inter',
        logoUrl: null,
        widgetPosition: 'bottom-right',
      }
    }
    this.injectStyles()
    this.render()
    this.loadMessageHistory()
  }

  private async loadBotConfig() {
    const res = await fetch(`${this.apiUrl}/api/chatbots/${this.botId}`, {
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) throw new Error('Failed to load config')
    const data = await res.json()
    this.botConfig = data.data
  }

  private loadMessageHistory() {
    const key = `aiw_history_${this.botId}_${this.sessionId}`
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const parsed = JSON.parse(stored)
        this.messages = parsed.map((m: Message) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }))
        if (this.chatWindow) {
          this.messages.forEach((msg) => this.renderMessage(msg))
        }
      }
    } catch {}
  }

  private saveMessageHistory() {
    const key = `aiw_history_${this.botId}_${this.sessionId}`
    try {
      localStorage.setItem(key, JSON.stringify(this.messages.slice(-50)))
    } catch {}
  }

  private injectStyles() {
    if (document.getElementById('aiw-styles')) return
    const color = this.botConfig?.themeColor ?? '#2563eb'
    const font = this.botConfig?.fontFamily ?? 'Inter'

    const style = document.createElement('style')
    style.id = 'aiw-styles'
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=${font.replace(' ', '+')}:wght@400;500;600&display=swap');
      
      #aiw-container * {
        box-sizing: border-box;
        font-family: '${font}', -apple-system, BlinkMacSystemFont, sans-serif;
      }
      
      #aiw-button {
        position: fixed;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${color};
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 20px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483647;
        transition: transform 0.2s, box-shadow 0.2s;
        outline: none;
      }
      
      #aiw-button:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 25px rgba(0,0,0,0.35);
      }
      
      #aiw-button svg { transition: transform 0.3s; }
      #aiw-button.open svg.chat-icon { display: none; }
      #aiw-button.open svg.close-icon { display: block !important; }
      
      #aiw-window {
        position: fixed;
        width: 380px;
        height: 560px;
        max-height: calc(100vh - 100px);
        background: #fff;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.2);
        z-index: 2147483646;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s;
        transform-origin: bottom right;
      }
      
      #aiw-window.hidden {
        transform: scale(0.8);
        opacity: 0;
        pointer-events: none;
      }
      
      #aiw-header {
        background: ${color};
        padding: 16px 20px;
        color: white;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      #aiw-header-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        overflow: hidden;
      }
      
      #aiw-header-avatar img { width: 100%; height: 100%; object-fit: cover; }
      
      #aiw-header-info { flex: 1; }
      #aiw-header-name { font-weight: 600; font-size: 15px; }
      #aiw-header-status { font-size: 12px; opacity: 0.85; margin-top: 2px; }
      
      #aiw-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        scroll-behavior: smooth;
      }
      
      #aiw-messages::-webkit-scrollbar { width: 4px; }
      #aiw-messages::-webkit-scrollbar-track { background: transparent; }
      #aiw-messages::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 2px; }
      
      .aiw-message {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 18px;
        font-size: 14px;
        line-height: 1.5;
        word-break: break-word;
        animation: aiw-fade-in 0.2s ease-out;
      }
      
      @keyframes aiw-fade-in {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .aiw-message.user {
        background: ${color};
        color: white;
        align-self: flex-end;
        border-bottom-right-radius: 4px;
      }
      
      .aiw-message.assistant {
        background: #f3f4f6;
        color: #1f2937;
        align-self: flex-start;
        border-bottom-left-radius: 4px;
      }
      
      .aiw-typing {
        background: #f3f4f6;
        padding: 12px 16px;
        border-radius: 18px;
        border-bottom-left-radius: 4px;
        align-self: flex-start;
        display: flex;
        gap: 4px;
        align-items: center;
      }
      
      .aiw-typing span {
        width: 7px;
        height: 7px;
        background: #9ca3af;
        border-radius: 50%;
        animation: aiw-bounce 1.4s infinite;
      }
      
      .aiw-typing span:nth-child(2) { animation-delay: 0.2s; }
      .aiw-typing span:nth-child(3) { animation-delay: 0.4s; }
      
      @keyframes aiw-bounce {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-6px); }
      }
      
      #aiw-input-area {
        padding: 12px 16px;
        border-top: 1px solid #f3f4f6;
        display: flex;
        gap: 8px;
        align-items: flex-end;
        background: white;
      }
      
      #aiw-input {
        flex: 1;
        border: 1.5px solid #e5e7eb;
        border-radius: 12px;
        padding: 10px 14px;
        font-size: 14px;
        resize: none;
        outline: none;
        max-height: 100px;
        min-height: 40px;
        font-family: inherit;
        line-height: 1.4;
        transition: border-color 0.2s;
      }
      
      #aiw-input:focus { border-color: ${color}; }
      
      #aiw-send {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: ${color};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: opacity 0.2s, transform 0.1s;
        outline: none;
      }
      
      #aiw-send:hover { opacity: 0.9; transform: scale(1.05); }
      #aiw-send:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
      
      #aiw-branding {
        text-align: center;
        padding: 6px;
        font-size: 10px;
        color: #9ca3af;
      }
      
      #aiw-branding a { color: #9ca3af; text-decoration: none; }
      #aiw-branding a:hover { color: #6b7280; }
      
      @media (max-width: 480px) {
        #aiw-window {
          width: 100vw;
          height: 100vh;
          max-height: 100vh;
          border-radius: 0;
          bottom: 0 !important;
          right: 0 !important;
          left: 0 !important;
          top: 0 !important;
        }
      }
    `
    document.head.appendChild(style)
  }

  private getPositionStyles(): { button: string; window: string } {
    const pos = this.botConfig?.widgetPosition ?? 'bottom-right'
    const offset = '20px'

    const posMap: Record<string, { button: string; window: string }> = {
      'bottom-right': {
        button: `bottom: ${offset}; right: ${offset};`,
        window: `bottom: 90px; right: ${offset};`,
      },
      'bottom-left': {
        button: `bottom: ${offset}; left: ${offset};`,
        window: `bottom: 90px; left: ${offset};`,
      },
      'top-right': {
        button: `top: ${offset}; right: ${offset};`,
        window: `top: 90px; right: ${offset};`,
      },
      'top-left': {
        button: `top: ${offset}; left: ${offset};`,
        window: `top: 90px; left: ${offset};`,
      },
    }

    return posMap[pos] ?? posMap['bottom-right']
  }

  private render() {
    const config = this.botConfig!
    const pos = this.getPositionStyles()

    this.container = document.createElement('div')
    this.container.id = 'aiw-container'

    // Chat Button
    this.button = document.createElement('button')
    this.button.id = 'aiw-button'
    this.button.setAttribute('aria-label', 'Open chat')
    this.button.style.cssText = pos.button
    this.button.innerHTML = `
      <svg class="chat-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <svg class="close-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" style="display:none">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `
    this.button.addEventListener('click', () => this.toggle())

    // Chat Window
    this.chatWindow = document.createElement('div')
    this.chatWindow.id = 'aiw-window'
    this.chatWindow.classList.add('hidden')
    this.chatWindow.style.cssText = pos.window

    const logoHtml = config.logoUrl
      ? `<img src="${config.logoUrl}" alt="${config.name}" />`
      : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`

    this.chatWindow.innerHTML = `
      <div id="aiw-header">
        <div id="aiw-header-avatar">${logoHtml}</div>
        <div id="aiw-header-info">
          <div id="aiw-header-name">${this.escapeHtml(config.name)}</div>
          <div id="aiw-header-status">🟢 Online · Typically replies instantly</div>
        </div>
      </div>
      <div id="aiw-messages"></div>
      <div id="aiw-input-area">
        <textarea 
          id="aiw-input" 
          placeholder="Type your message..." 
          rows="1"
          aria-label="Chat message"
        ></textarea>
        <button id="aiw-send" aria-label="Send message">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
      <div id="aiw-branding">
        Powered by <a href="https://realestate.ai" target="_blank" rel="noopener">RealEstate AI</a>
      </div>
    `

    this.container.appendChild(this.button)
    this.container.appendChild(this.chatWindow)
    document.body.appendChild(this.container)

    // Event listeners
    const input = this.chatWindow.querySelector('#aiw-input') as HTMLTextAreaElement
    const sendBtn = this.chatWindow.querySelector('#aiw-send') as HTMLButtonElement

    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        this.sendMessage()
      }
    })

    input.addEventListener('input', () => {
      input.style.height = 'auto'
      input.style.height = `${Math.min(input.scrollHeight, 100)}px`
    })

    sendBtn.addEventListener('click', () => this.sendMessage())

    // Show welcome message if no history
    if (this.messages.length === 0) {
      this.addMessage('assistant', config.welcomeMessage)
    }
  }

  private toggle() {
    if (this.isOpen) {
      this.close()
    } else {
      this.open()
    }
  }

  private open() {
    this.isOpen = true
    this.button?.classList.add('open')
    this.chatWindow?.classList.remove('hidden')
    const input = this.chatWindow?.querySelector('#aiw-input') as HTMLTextAreaElement
    setTimeout(() => input?.focus(), 300)
  }

  private close() {
    this.isOpen = false
    this.button?.classList.remove('open')
    this.chatWindow?.classList.add('hidden')
  }

  private addMessage(role: 'user' | 'assistant', content: string): Message {
    const msg: Message = { role, content, timestamp: new Date() }
    this.messages.push(msg)
    this.renderMessage(msg)
    this.saveMessageHistory()
    return msg
  }

  private renderMessage(msg: Message) {
    const messagesEl = this.chatWindow?.querySelector('#aiw-messages')
    if (!messagesEl) return

    const div = document.createElement('div')
    div.className = `aiw-message ${msg.role}`
    div.textContent = msg.content
    messagesEl.appendChild(div)
    messagesEl.scrollTop = messagesEl.scrollHeight
  }

  private showTyping() {
    const messagesEl = this.chatWindow?.querySelector('#aiw-messages')
    if (!messagesEl || this.isTyping) return

    this.isTyping = true
    const div = document.createElement('div')
    div.className = 'aiw-typing'
    div.id = 'aiw-typing-indicator'
    div.innerHTML = '<span></span><span></span><span></span>'
    messagesEl.appendChild(div)
    messagesEl.scrollTop = messagesEl.scrollHeight
  }

  private hideTyping() {
    this.isTyping = false
    const indicator = this.chatWindow?.querySelector('#aiw-typing-indicator')
    indicator?.remove()
  }

  private async sendMessage() {
    const input = this.chatWindow?.querySelector('#aiw-input') as HTMLTextAreaElement
    const sendBtn = this.chatWindow?.querySelector('#aiw-send') as HTMLButtonElement
    const message = input?.value.trim()

    if (!message || this.isTyping) return

    input.value = ''
    input.style.height = 'auto'
    sendBtn.disabled = true

    this.addMessage('user', message)
    this.showTyping()

    try {
      const res = await fetch(`${this.apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId: this.botId,
          message,
          sessionId: this.sessionId,
          visitorId: this.visitorId,
          pageUrl: window.location.href,
        }),
      })

      this.hideTyping()

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        this.addMessage(
          'assistant',
          data.reply ?? "I'm sorry, I'm having trouble right now. Please try again."
        )
        return
      }

      const data = await res.json()
      this.addMessage('assistant', data.reply)
    } catch (err) {
      this.hideTyping()
      this.addMessage(
        'assistant',
        "I'm sorry, I can't connect right now. Please check your connection and try again."
      )
    } finally {
      sendBtn.disabled = false
      input?.focus()
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.appendChild(document.createTextNode(text))
    return div.innerHTML
  }
}

// Auto-initialize from script tag
(function () {
  function initWidget() {
    const scripts = document.querySelectorAll<HTMLScriptElement>('script[data-bot-id]')
    const apiUrl = window.location.origin

    scripts.forEach((script) => {
      const botId = script.getAttribute('data-bot-id')
      if (botId && !script.dataset.initialized) {
        script.dataset.initialized = 'true'
        new RealEstateAIChatWidget({ botId, apiUrl })
      }
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget)
  } else {
    initWidget()
  }
})()
