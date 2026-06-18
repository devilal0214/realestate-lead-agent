// RealEstate AI Chat Widget v1.0.0
// Auto-generated - run 'npm run widget:build' to rebuild from source
// This is the pre-built IIFE bundle served from /widget.js
(function () {
  "use strict";

  var RealEstateAIChatWidget = (function () {
    function Widget(config) {
      this.botId = config.botId;
      const currentScript = document.currentScript;
      const scriptUrl = currentScript ? currentScript.src : '';
      this.apiUrl = config.apiUrl || new URL(scriptUrl).origin;
      this.sessionId = this._getOrCreateSessionId();
      this.visitorId = this._getOrCreateVisitorId();
      this.messages = [];
      this.isOpen = false;
      this.isTyping = false;
      this.botConfig = null;
      this._init();
    }

    Widget.prototype._getOrCreateSessionId = function () {
      var key = "aiw_session_" + this.botId;
      var s = sessionStorage.getItem(key);
      if (!s) {
        s = "sess_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem(key, s);
      }
      return s;
    };

    Widget.prototype._getOrCreateVisitorId = function () {
      var key = "aiw_visitor_id";
      var v = localStorage.getItem(key);
      if (!v) {
        v = "vis_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(key, v);
      }
      return v;
    };

    Widget.prototype._init = function () {
      var self = this;
      fetch(self.apiUrl + "/api/bots/" + self.botId)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          self.botConfig = data.data || {};
          self._injectStyles();
          self._render();
          self._loadHistory();
        })
        .catch(function () {
          self.botConfig = {
            id: self.botId, name: "AI Assistant",
            welcomeMessage: "Hi! How can I help you find your perfect property?",
            themeColor: "#2563eb", fontFamily: "Inter",
            logoUrl: null, widgetPosition: "bottom-right"
          };
          self._injectStyles();
          self._render();
        });
    };

    Widget.prototype._loadHistory = function () {
      try {
        var key = "aiw_history_" + this.botId + "_" + this.sessionId;
        var stored = localStorage.getItem(key);
        if (stored) {
          var msgs = JSON.parse(stored);
          var self = this;
          msgs.forEach(function (m) { self._renderMessage(m); });
          this.messages = msgs;
        }
      } catch (e) { }
    };

    Widget.prototype._saveHistory = function () {
      try {
        var key = "aiw_history_" + this.botId + "_" + this.sessionId;
        localStorage.setItem(key, JSON.stringify(this.messages.slice(-50)));
      } catch (e) { }
    };

    Widget.prototype._injectStyles = function () {
      if (document.getElementById("aiw-styles")) return;
      var c = (this.botConfig && this.botConfig.themeColor) || "#2563eb";
      var f = (this.botConfig && this.botConfig.fontFamily) || "Inter";
      var style = document.createElement("style");
      style.id = "aiw-styles";
      style.textContent = [
        "#aiw-container *{box-sizing:border-box;font-family:'" + f + "',-apple-system,sans-serif}",
        "#aiw-button{position:fixed;width:60px;height:60px;border-radius:50%;background:" + c + ";border:none;cursor:pointer;",
        "box-shadow:0 4px 20px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;",
        "z-index:2147483647;transition:transform .2s,box-shadow .2s;outline:none}",
        "#aiw-button:hover{transform:scale(1.1);box-shadow:0 6px 25px rgba(0,0,0,.35)}",
        "#aiw-button .close-icon{display:none}#aiw-button.open .chat-icon{display:none}#aiw-button.open .close-icon{display:block}",
        "#aiw-window{position:fixed;width:380px;height:560px;max-height:calc(100vh - 100px);",
        "background:#fff;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.2);",
        "z-index:2147483646;display:flex;flex-direction:column;overflow:hidden;",
        "transition:transform .3s cubic-bezier(.175,.885,.32,1.275),opacity .3s;transform-origin:bottom right}",
        "#aiw-window.hidden{transform:scale(.8);opacity:0;pointer-events:none}",
        "#aiw-header{background:" + c + ";padding:16px 20px;color:#fff;display:flex;align-items:center;gap:12px}",
        "#aiw-header-avatar{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.2);",
        "display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden}",
        "#aiw-header-avatar img{width:100%;height:100%;object-fit:cover}",
        "#aiw-header-info{flex:1}#aiw-header-name{font-weight:600;font-size:15px}",
        "#aiw-header-status{font-size:12px;opacity:.85;margin-top:2px}",
        "#aiw-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;scroll-behavior:smooth}",
        "#aiw-messages::-webkit-scrollbar{width:4px}#aiw-messages::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:2px}",
        ".aiw-msg{max-width:80%;padding:10px 14px;border-radius:18px;font-size:14px;line-height:1.5;word-break:break-word;",
        "animation:aiw-in .2s ease-out}",
        "@keyframes aiw-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}",
        ".aiw-msg.user{background:" + c + ";color:#fff;align-self:flex-end;border-bottom-right-radius:4px}",
        ".aiw-msg.assistant{background:#f3f4f6;color:#1f2937;align-self:flex-start;border-bottom-left-radius:4px}",
        ".aiw-typing{background:#f3f4f6;padding:12px 16px;border-radius:18px;border-bottom-left-radius:4px;",
        "align-self:flex-start;display:flex;gap:4px;align-items:center}",
        ".aiw-typing span{width:7px;height:7px;background:#9ca3af;border-radius:50%;animation:aiw-bounce 1.4s infinite}",
        ".aiw-typing span:nth-child(2){animation-delay:.2s}.aiw-typing span:nth-child(3){animation-delay:.4s}",
        "@keyframes aiw-bounce{0%,60%,100%{transform:none}30%{transform:translateY(-6px)}}",
        "#aiw-input-area{padding:12px 16px;border-top:1px solid #f3f4f6;display:flex;gap:8px;align-items:flex-end;background:#fff}",
        "#aiw-input{flex:1;border:1.5px solid #e5e7eb;border-radius:12px;padding:10px 14px;font-size:14px;",
        "resize:none;outline:none;max-height:100px;min-height:40px;font-family:inherit;line-height:1.4;transition:border-color .2s}",
        "#aiw-input:focus{border-color:" + c + "}",
        "#aiw-send{width:40px;height:40px;border-radius:10px;background:" + c + ";border:none;cursor:pointer;",
        "display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity .2s,transform .1s;outline:none}",
        "#aiw-send:hover{opacity:.9;transform:scale(1.05)}#aiw-send:disabled{opacity:.5;cursor:not-allowed;transform:none}",
        "#aiw-branding{text-align:center;padding:6px;font-size:10px;color:#9ca3af}",
        "#aiw-branding a{color:#9ca3af;text-decoration:none}",
        "@media(max-width:480px){#aiw-window{width:100vw;height:100vh;max-height:100vh;border-radius:0;",
        "bottom:0!important;right:0!important;left:0!important;top:0!important}}"
      ].join("");
      document.head.appendChild(style);
    };

    Widget.prototype._getPos = function () {
      var p = (this.botConfig && this.botConfig.widgetPosition) || "bottom-right";
      var o = "20px";
      var map = {
        "bottom-right": { btn: "bottom:" + o + ";right:" + o, win: "bottom:90px;right:" + o },
        "bottom-left": { btn: "bottom:" + o + ";left:" + o, win: "bottom:90px;left:" + o },
        "top-right": { btn: "top:" + o + ";right:" + o, win: "top:90px;right:" + o },
        "top-left": { btn: "top:" + o + ";left:" + o, win: "top:90px;left:" + o }
      };
      return map[p] || map["bottom-right"];
    };

    Widget.prototype._render = function () {
      var self = this;
      var cfg = self.botConfig;
      var pos = self._getPos();

      var container = document.createElement("div");
      container.id = "aiw-container";

      var btn = document.createElement("button");
      btn.id = "aiw-button";
      btn.setAttribute("aria-label", "Open chat");
      btn.style.cssText = pos.btn;
      btn.innerHTML = '<svg class="chat-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg><svg class="close-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      btn.addEventListener("click", function () { self._toggle(); });

      var win = document.createElement("div");
      win.id = "aiw-window";
      win.classList.add("hidden");
      win.style.cssText = pos.win;

      var logo = cfg.logoUrl
        ? '<img src="' + cfg.logoUrl + '" alt="' + cfg.name + '">'
        : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';

      win.innerHTML = '<div id="aiw-header"><div id="aiw-header-avatar">' + logo + '</div><div id="aiw-header-info"><div id="aiw-header-name">' + self._esc(cfg.name || "AI Assistant") + '</div><div id="aiw-header-status">🟢 Online &middot; Replies instantly</div></div></div><div id="aiw-messages"></div><div id="aiw-input-area"><textarea id="aiw-input" placeholder="Type your message..." rows="1" aria-label="Chat message"></textarea><button id="aiw-send" aria-label="Send"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg></button></div><div id="aiw-branding">Powered by <a href="#" target="_blank" rel="noopener">RealEstate AI</a></div>';

      container.appendChild(btn);
      container.appendChild(win);
      document.body.appendChild(container);

      self.button = btn;
      self.chatWindow = win;

      var input = win.querySelector("#aiw-input");
      var sendBtn = win.querySelector("#aiw-send");

      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); self._send(); }
      });
      input.addEventListener("input", function () {
        input.style.height = "auto";
        input.style.height = Math.min(input.scrollHeight, 100) + "px";
      });
      sendBtn.addEventListener("click", function () { self._send(); });

      if (self.messages.length === 0) {
        self._addMsg("assistant", cfg.welcomeMessage || "Hi! How can I help you?");
      }
    };

    Widget.prototype._toggle = function () {
      this.isOpen ? this._close() : this._open();
    };

    Widget.prototype._open = function () {
      this.isOpen = true;
      this.button.classList.add("open");
      this.chatWindow.classList.remove("hidden");
      var input = this.chatWindow.querySelector("#aiw-input");
      setTimeout(function () { input && input.focus(); }, 300);
    };

    Widget.prototype._close = function () {
      this.isOpen = false;
      this.button.classList.remove("open");
      this.chatWindow.classList.add("hidden");
    };

    Widget.prototype._addMsg = function (role, content) {
      var msg = { role: role, content: content, timestamp: new Date() };
      this.messages.push(msg);
      this._renderMessage(msg);
      this._saveHistory();
      return msg;
    };

    Widget.prototype._renderMessage = function (msg) {
      var el = this.chatWindow && this.chatWindow.querySelector("#aiw-messages");
      if (!el) return;
      var div = document.createElement("div");
      div.className = "aiw-msg " + msg.role;
      div.textContent = msg.content;
      el.appendChild(div);
      el.scrollTop = el.scrollHeight;
    };

    Widget.prototype._showTyping = function () {
      if (this.isTyping) return;
      this.isTyping = true;
      var el = this.chatWindow && this.chatWindow.querySelector("#aiw-messages");
      if (!el) return;
      var div = document.createElement("div");
      div.className = "aiw-typing";
      div.id = "aiw-typing";
      div.innerHTML = "<span></span><span></span><span></span>";
      el.appendChild(div);
      el.scrollTop = el.scrollHeight;
    };

    Widget.prototype._hideTyping = function () {
      this.isTyping = false;
      var el = this.chatWindow && this.chatWindow.querySelector("#aiw-typing");
      if (el) el.remove();
    };

    Widget.prototype._send = function () {
      var self = this;
      var input = self.chatWindow && self.chatWindow.querySelector("#aiw-input");
      var sendBtn = self.chatWindow && self.chatWindow.querySelector("#aiw-send");
      var msg = input && input.value.trim();
      if (!msg || self.isTyping) return;

      input.value = "";
      input.style.height = "auto";
      if (sendBtn) sendBtn.disabled = true;

      self._addMsg("user", msg);
      self._showTyping();

      fetch(self.apiUrl + "/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botId: self.botId, message: msg,
          sessionId: self.sessionId, visitorId: self.visitorId,
          pageUrl: window.location.href
        })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          self._hideTyping();
          self._addMsg("assistant", data.reply || "I'm sorry, something went wrong.");
        })
        .catch(function () {
          self._hideTyping();
          self._addMsg("assistant", "I'm sorry, I can't connect right now. Please try again.");
        })
        .finally(function () {
          if (sendBtn) sendBtn.disabled = false;
          if (input) input.focus();
        });
    };

    Widget.prototype._esc = function (s) {
      var d = document.createElement("div");
      d.appendChild(document.createTextNode(s));
      return d.innerHTML;
    };

    return Widget;
  })();

  // Auto-init
  function init() {
    var scripts = document.querySelectorAll("script[data-bot-id]");
    var apiUrl = window.location.origin;
    for (var i = 0; i < scripts.length; i++) {
      var botId = scripts[i].getAttribute("data-bot-id");
      if (botId && !scripts[i].dataset.initialized) {
        scripts[i].dataset.initialized = "true";
        new RealEstateAIChatWidget({ botId: botId, apiUrl: apiUrl });
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
