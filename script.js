const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatSend = document.getElementById("chat-send");
const chatThread = document.getElementById("chat-thread");
const chatTooltip = document.getElementById("chat-tooltip");
const tooltipBackdrop = document.getElementById("tooltip-backdrop");
const tooltipCta = document.getElementById("tooltip-cta");
const tooltipTitle = document.getElementById("tooltip-title");
const tooltipCaption = document.getElementById("tooltip-caption");
const demoNotice =
  "This is a demo for the State Product Challenge so this functionality doesn't actually work";

const tooltipContent = {
  first: {
    title: "Ask State AI a Question",
    caption:
      "You can ask State AI a question to see what your citizens think about any topic.",
    cta: "Ask a question",
  },
  second: {
    title: "Ask a Follow-Up",
    caption:
      "You can follow up on anything the State AI responds with for more info or sources",
    cta: "Send Follow Up",
  },
};

const scriptedQuestion =
  "What are the most common frustrations being voiced by people at the moment?";
const followUpQuestion =
  "Can you tell me more about what people are saying on the housing developments?";
const scriptedResponse = `There are several frustrations being voiced by your citizens recently.

These include global/national topics such as:

- Immigration - this is an ongoing debate with people increasingly voicing frustrations on this topic and its handling by the government

- Foreign Policy - people are concerned that our relationship with the US is fracturing

- Defence - people are worried about the increasing number of conflicts across the globe and the potential for this to spiral into a broader multi-nation war

And more regional topics in your constituancy like:

- Housing - people are frustrated by the recent developments that have been approved with general sentiment that the developers won't do enough to offset negative impacts e.g. increased traffic or load on public services

- Pot Holes - there are quite a few people reporting pot holes damaging their cars and not being sorted even weeks after being reported

Would you like sources for any of the above or to further explore any specific topics?`;
const followUpResponse = `Across the local Berkhamsted social media groups there are several people complaining about the housing developments that were just approved in Northchurch. They worry that these will be...

- too dense for the local road network, with peak-time traffic already strained around key junctions
- under-supported by GP capacity, school places, and other local public services
- weak on infrastructure guarantees, with concerns that improvements may lag behind construction
- damaging to local character, green space, and the existing feel of nearby neighbourhoods

There are also residents who support more homes in principle, but they want clearer phasing plans, stronger developer accountability, and regular public updates so the impact feels managed rather than imposed.

If useful, I can break this down by recurring themes, sentiment direction, and representative local posts.`;

let shouldUseScriptedResponse = false;
let isDemoSequenceRunning = false;
let activeTooltipStep = "first";
let pendingAfterScriptedResponse = null;
const INPUT_TYPE_DELAY_MS = 9;
const RESPONSE_TYPE_DELAY_MS = 7;
const RESPONSE_NEWLINE_DELAY_MS = 12;
const TYPING_BUBBLE_DELAY_MS = 520;

function setSidebarOpen(isOpen) {
  sidebar.classList.toggle("open", isOpen);
  overlay.hidden = !isOpen;
  menuToggle.setAttribute("aria-expanded", String(isOpen));
}

if (menuToggle && sidebar && overlay) {
  menuToggle.addEventListener("click", () => {
    const isOpen = !sidebar.classList.contains("open");
    setSidebarOpen(isOpen);
  });

  overlay.addEventListener("click", () => setSidebarOpen(false));

  window.addEventListener("resize", () => {
    if (window.innerWidth > 920) {
      setSidebarOpen(false);
    }
  });
}

if (sidebar) {
  sidebar.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const clickable = target.closest("a, button");
    if (!clickable) return;

    event.preventDefault();
    window.alert(demoNotice);
  });
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function resizeChatInput() {
  if (!chatInput) return;
  chatInput.style.height = "auto";
  chatInput.style.height = `${Math.min(chatInput.scrollHeight, 160)}px`;
}

function setTooltipStep(step) {
  if (!tooltipTitle || !tooltipCaption || !tooltipCta) return;
  const content = tooltipContent[step];
  if (!content) return;
  tooltipTitle.textContent = content.title;
  tooltipCaption.textContent = content.caption;
  tooltipCta.textContent = content.cta;
  activeTooltipStep = step;
}

function showChatTooltip(step = activeTooltipStep) {
  if (!chatTooltip) return;
  if (!tooltipContent[step]) return;
  setTooltipStep(step);
  if (tooltipBackdrop) {
    tooltipBackdrop.hidden = false;
    tooltipBackdrop.classList.add("visible");
  }
  chatTooltip.hidden = false;
  window.requestAnimationFrame(() => {
    chatTooltip.classList.add("visible");
  });
}

function hideChatTooltip() {
  if (!chatTooltip) return;
  chatTooltip.classList.remove("visible");
  if (tooltipBackdrop) {
    tooltipBackdrop.classList.remove("visible");
  }
  window.setTimeout(() => {
    if (!chatTooltip.classList.contains("visible")) {
      chatTooltip.hidden = true;
    }
    if (tooltipBackdrop && !chatTooltip.classList.contains("visible")) {
      tooltipBackdrop.hidden = true;
    }
  }, 200);
}

if (chatTooltip) {
  window.setTimeout(() => showChatTooltip("first"), 2000);
}

async function runScriptedPrompt(question, response) {
  if (!chatForm || !chatSend || !chatInput) return;

  isDemoSequenceRunning = true;
  hideChatTooltip();
  chatInput.focus();
  chatInput.value = "";
  resizeChatInput();

  for (const char of question) {
    chatInput.value += char;
    resizeChatInput();
    await sleep(INPUT_TYPE_DELAY_MS);
  }

  chatSend.classList.remove("flash-send");
  void chatSend.offsetWidth;
  chatSend.classList.add("flash-send");

  await sleep(360);
  shouldUseScriptedResponse = true;
  chatForm.dataset.scriptedResponse = response;
  chatForm.requestSubmit();
  isDemoSequenceRunning = false;
}

if (tooltipCta && chatInput) {
  tooltipCta.addEventListener("click", async (event) => {
    event.stopPropagation();
    if (!chatForm || !chatSend || isDemoSequenceRunning) return;

    if (activeTooltipStep === "first") {
      activeTooltipStep = "awaiting-second";
      pendingAfterScriptedResponse = async () => {
        await sleep(1000);
        showChatTooltip("second");
      };
      await runScriptedPrompt(scriptedQuestion, scriptedResponse);
      return;
    }

    if (activeTooltipStep === "second") {
      activeTooltipStep = "done";
      await runScriptedPrompt(followUpQuestion, followUpResponse);
    }
  });
}

function appendMessage(type, author, content) {
  if (!chatThread) return;

  const message = document.createElement("article");
  message.className = `message ${type}`;

  const contentWrap = document.createElement("div");
  contentWrap.className = "message-content";

  const label = document.createElement("div");
  label.className = "message-label";
  label.textContent = author;

  const text = document.createElement("p");
  text.textContent = content;

  contentWrap.append(label, text);

  if (type === "assistant" || type === "typing") {
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = "AI";
    message.append(avatar);
  }

  message.append(contentWrap);
  chatThread.appendChild(message);
  chatThread.scrollTop = chatThread.scrollHeight;
  return { message, text };
}

function appendTypingMessage() {
  const typing = appendMessage("assistant typing", "State AI", "");
  if (!typing) return null;

  typing.text.innerHTML =
    '<span class="typing-dots"><span></span><span></span><span></span></span>';
  return typing.message;
}

async function streamAssistantResponse(content) {
  const typingBubble = appendTypingMessage();
  await sleep(TYPING_BUBBLE_DELAY_MS);

  if (typingBubble) {
    typingBubble.remove();
  }

  const assistant = appendMessage("assistant", "State AI", "");
  if (!assistant) return;

  for (const char of content) {
    assistant.text.textContent += char;
    if (chatThread) {
      chatThread.scrollTop = chatThread.scrollHeight;
    }
    await sleep(char === "\n" ? RESPONSE_NEWLINE_DELAY_MS : RESPONSE_TYPE_DELAY_MS);
  }
}

function shouldShowGuidedTooltip() {
  if (isDemoSequenceRunning) return false;
  return activeTooltipStep === "first" || activeTooltipStep === "second";
}

if (chatForm && chatInput && chatThread) {
  chatInput.readOnly = true;

  chatInput.addEventListener("focus", () => {
    if (shouldShowGuidedTooltip()) {
      showChatTooltip(activeTooltipStep);
    }
  });
  chatInput.addEventListener("click", () => {
    if (shouldShowGuidedTooltip()) {
      showChatTooltip(activeTooltipStep);
    }
  });

  if (chatSend) {
    chatSend.addEventListener("click", () => {
      if (shouldShowGuidedTooltip()) {
        showChatTooltip(activeTooltipStep);
      }
    });
  }

  chatInput.addEventListener("input", resizeChatInput);

  chatInput.addEventListener("keydown", (event) => {
    event.preventDefault();
  });

  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!shouldUseScriptedResponse) {
      return;
    }

    const prompt = chatInput.value.trim();
    if (!prompt) return;

    appendMessage("user", "You", prompt);
    chatInput.value = "";
    resizeChatInput();

    if (shouldUseScriptedResponse) {
      shouldUseScriptedResponse = false;
      const responseToStream = chatForm.dataset.scriptedResponse || scriptedResponse;
      const afterResponse = pendingAfterScriptedResponse;
      pendingAfterScriptedResponse = null;
      void (async () => {
        await streamAssistantResponse(responseToStream);
        if (afterResponse) {
          await afterResponse();
        }
      })();
      return;
    }

    window.setTimeout(() => {
      appendMessage(
        "assistant",
        "State AI",
        "Demo mode: connect this input to your backend endpoint to return real citizen sentiment insights."
      );
    }, 420);
  });
}
