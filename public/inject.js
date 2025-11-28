const r=(()=>{const i=document.getElementsByTagName("script");for(let e=i.length-1;e>=0;e--){const t=i[e].src;if(t.includes("inject.js"))return new URL(t).origin}return"http://localhost:5173"})();class n{iframe=null;wrapper=null;config=null;eventHandlers=new Map;pendingMessages=[];currentLang="en";isOpen=!1;_ready=!1;constructor(){window.addEventListener("message",this.handleMessage.bind(this))}init(e){if(this.iframe){console.warn("Botpress webchat is already initialized");return}this.config=e,this.currentLang=e.lang||"en",this.createWrapper(),this.createIframe(),this.injectStyles()}createWrapper(){this.wrapper=document.createElement("div"),this.wrapper.id="bp-webchat-wrapper",this.wrapper.className="bp-webchat-wrapper bp-webchat-closed",document.body.appendChild(this.wrapper)}createIframe(){if(!this.config||!this.wrapper)return;const e=new URLSearchParams({clientId:this.config.clientId,...this.config.botId&&{botId:this.config.botId},lang:this.currentLang,iframe:"true"});this.config.configuration&&e.set("config",JSON.stringify(this.config.configuration)),this.iframe=document.createElement("iframe"),this.iframe.id="bp-webchat-iframe",this.iframe.className="bp-webchat-iframe",this.iframe.src=`${r}/embed?${e}`,this.iframe.allow="microphone",this.iframe.setAttribute("aria-label","Chat widget"),this.wrapper.appendChild(this.iframe)}injectStyles(){if(document.getElementById("bp-webchat-styles"))return;const e=document.createElement("style");e.id="bp-webchat-styles",e.textContent=`
      .bp-webchat-wrapper {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        transition: all 0.3s ease;
      }

      .bp-webchat-wrapper.bp-webchat-closed {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        overflow: hidden;
      }

      .bp-webchat-wrapper.bp-webchat-open {
        width: 400px;
        height: 600px;
        max-width: calc(100vw - 40px);
        max-height: calc(100vh - 100px);
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      }

      .bp-webchat-iframe {
        width: 100%;
        height: 100%;
        border: none;
        background: white;
        border-radius: inherit;
      }

      @media (max-width: 480px) {
        .bp-webchat-wrapper.bp-webchat-open {
          width: 100%;
          height: 100%;
          max-width: 100%;
          max-height: 100%;
          bottom: 0;
          right: 0;
          border-radius: 0;
        }
      }
    `,document.head.appendChild(e)}handleMessage(e){if(!this.iframe||e.source!==this.iframe.contentWindow)return;const{type:t,payload:s}=e.data||{};if(t)switch(t){case"bp:ready":this._ready=!0,this.pendingMessages.forEach(a=>this.postToIframe(a.type,a.payload)),this.pendingMessages=[];break;case"bp:fabClick":this.toggle();break;case"bp:event":this._emit(s.event,s.data);break;default:t.startsWith("bp:")&&this._emit(t.replace("bp:",""),s)}}postToIframe(e,t){if(!this.iframe?.contentWindow){this.pendingMessages.push({type:e,payload:t});return}if(!this._ready){this.pendingMessages.push({type:e,payload:t});return}this.iframe.contentWindow.postMessage({type:e,payload:t},r)}open(){this.wrapper&&(this.wrapper.classList.remove("bp-webchat-closed"),this.wrapper.classList.add("bp-webchat-open"),this.isOpen=!0,this.postToIframe("bp:open"),this._emit("webchat:opened",{}))}close(){this.wrapper&&(this.wrapper.classList.remove("bp-webchat-open"),this.wrapper.classList.add("bp-webchat-closed"),this.isOpen=!1,this.postToIframe("bp:close"),this._emit("webchat:closed",{}))}toggle(){this.isOpen?this.close():this.open()}sendMessage(e){this.postToIframe("bp:sendMessage",{text:e})}sendEvent(e){this.postToIframe("bp:sendEvent",e)}on(e,t){return this.eventHandlers.has(e)||this.eventHandlers.set(e,new Set),this.eventHandlers.get(e).add(t),()=>{this.eventHandlers.get(e)?.delete(t)}}setLanguage(e){this.currentLang=e,this.postToIframe("bp:setLanguage",{lang:e}),this._emit("languageChanged",{language:e})}getLanguage(){return this.currentLang}_emit(e,t){this.eventHandlers.get(e)?.forEach(s=>s(t)),this.eventHandlers.get("*")?.forEach(s=>s({type:e,payload:t}))}}window.botpress=new n;
