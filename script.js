// Year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Theme presets
const root = document.documentElement;
const themeSelect = document.getElementById('themeSelect');
const applyTheme = (name) => {
  root.setAttribute('data-theme', name);
  // Optionally persist
  localStorage.setItem('theme', name);
};
applyTheme(localStorage.getItem('theme') || 'light');
themeSelect.value = root.getAttribute('data-theme');
themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));

// Smooth scrolling for nav links (enhanced for older browsers)
document.querySelectorAll('a.nav-link, .cta .btn').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', href);
    }
  });
});

// Parallax effect on cards via IntersectionObserver
const parallaxEls = document.querySelectorAll('[data-parallax]');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.dataset.inView = '1';
    } else {
      delete entry.target.dataset.inView;
    }
  });
}, { threshold: 0.1 });
parallaxEls.forEach(el => io.observe(el));

// Smooth translate based on scroll
window.addEventListener('scroll', () => {
  parallaxEls.forEach(el => {
    if (!el.dataset.inView) return;
    const rect = el.getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    const vhMid = window.innerHeight / 2;
    const offset = (mid - vhMid) / window.innerHeight; // -0.5..0.5
    el.style.transform = `translateY(${offset * -18}px)`; // subtle parallax
  });
});

// Planner drag & drop
const chips = document.querySelectorAll('.chip');
const itinerary = document.querySelector('.itinerary');
const hint = itinerary.querySelector('.hint');
chips.forEach(chip => {
  chip.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', chip.dataset.destination);
  });
});
itinerary.addEventListener('dragover', (e) => {
  e.preventDefault();
  itinerary.classList.add('dragover');
});
itinerary.addEventListener('dragleave', () => itinerary.classList.remove('dragover'));
itinerary.addEventListener('drop', (e) => {
  e.preventDefault();
  itinerary.classList.remove('dragover');
  const dest = e.dataTransfer.getData('text/plain');
  if (!dest) return;
  hint?.remove();
  const item = document.createElement('div');
  item.className = 'chip';
  item.textContent = dest;
  itinerary.appendChild(item);
});

// Nyota AI (rule-based + voice)
const chatLog = document.getElementById('chatLog');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const voiceBtn = document.getElementById('voiceBtn');
const listenBtn = document.getElementById('listenBtn');
const planFeedback = document.getElementById('planFeedback');
const optimizeBtn = document.getElementById('optimizeBtn');

// Simple intent responses
function nyotaRespond(text) {
  const q = text.toLowerCase();
  let a = "I’m thinking about that. Tell me what you value more—wildlife, coast, or summit?";
  if (q.includes('best time')) a = "June–October is ideal for safaris; Jan–Feb for calving in the Serengeti; Zanzibar is lovely year-round.";
  else if (q.includes('serengeti')) a = "Serengeti stuns with the Great Migration; add Ngorongoro for predators and Tarangire for elephants.";
  else if (q.includes('zanzibar')) a = "Zanzibar blends spice, Stone Town’s history, and beaches—perfect after northern circuit safaris.";
  else if (q.includes('kilimanjaro')) a = "Allow 6–8 days; Machame is scenic, Lemosho is quieter; acclimatization days help.";
  else if (q.includes('budget')) a = "Balance by mixing mid-range lodges with one splurge night; travel shoulder season for value.";
  return a;
}

// Chat UI helpers
function addBubble(text, who = 'nyota') {
  const div = document.createElement('div');
  div.className = `chat-bubble ${who}`;
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// Send message
function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  addBubble(text, 'user');
  const reply = nyotaRespond(text);
  addBubble(reply, 'nyota');
  speak(reply);
  chatInput.value = '';
}
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// Voice output (SpeechSynthesis)
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  // Pick a suitable voice if available
  const voices = speechSynthesis.getVoices();
  const swahiliPref = voices.find(v => /swahili|ki?swahili/i.test(v.name + ' ' + v.lang));
  utter.voice = swahiliPref || voices.find(v => v.lang.startsWith('en')) || null;
  utter.rate = 1.0;
  speechSynthesis.cancel(); // prevent overlap
  speechSynthesis.speak(utter);
}
voiceBtn.addEventListener('click', () => {
  addBubble("Speaking the last response.", 'nyota');
  // Find the last Nyota bubble
  const bubbles = [...document.querySelectorAll('.chat-bubble.nyota')];
  const last = bubbles[bubbles.length - 1];
  if (last) speak(last.textContent);
});

// Optional voice input (Web Speech API)
let recognition;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = 'en-US'; // Change to 'sw-TZ' if supported
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    chatInput.value = transcript;
    sendMessage();
  };
  recognition.onerror = () => addBubble("I couldn’t catch that—try again or type your question.", 'nyota');
}
listenBtn.addEventListener('click', () => {
  if (!recognition) {
    addBubble("Voice input isn’t supported on this browser—type your question and I’ll reply.", 'nyota');
    return;
  }
  recognition.start();
  addBubble("Listening… speak your question.", 'nyota');
});

// Optimize plan (simple demo)
optimizeBtn.addEventListener('click', () => {
  const itineraryItems = [...document.querySelectorAll('.itinerary .chip')].map(el => el.textContent);
  const days = Number(document.getElementById('days').value);
  const budget = Number(document.getElementById('budget').value);

  if (itineraryItems.length < 2) {
    planFeedback.textContent = "Add at least two destinations for a meaningful route.";
    return;
  }

  // Very simple heuristic
  let suggestion = [...itineraryItems];
  // Put Serengeti adjacent to Ngorongoro if both present
  if (suggestion.includes('Serengeti') && suggestion.includes('Ngorongoro')) {
    suggestion = suggestion.filter(x => x !== 'Ngorongoro');
    const sIndex = suggestion.indexOf('Serengeti');
    suggestion.splice(sIndex + 1, 0, 'Ngorongoro');
  }
  // Place Zanzibar at the end as a wind-down
  if (suggestion.includes('Zanzibar')) {
    suggestion = suggestion.filter(x => x !== 'Zanzibar');
    suggestion.push('Zanzibar');
  }

  const tone = budget <= 2 ? 'value-friendly lodges' : budget >= 4 ? 'premium camps' : 'mid-range comfort';
  planFeedback.textContent = `Suggested ${days}-day flow: ${suggestion.join(' → ')} with ${tone}.`;
});

// Virtual panorama hover-pan
const pano = document.querySelector('.panorama');
if (pano) {
  let rafId;
  pano.addEventListener('mousemove', (e) => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const rect = pano.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width; // 0..1
      const tilt = (x - 0.5) * 8; // -4..4 deg
      pano.style.transform = `scale(1.05) perspective(600px) rotateY(${tilt}deg)`;
    });
  });
  pano.addEventListener('mouseleave', () => {
    pano.style.transform = 'none';
  });
}

// Contact form (client-side demo)
const form = document.querySelector('.contact-form');
const formFeedback = document.querySelector('.form-feedback');
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  formFeedback.textContent = "Thanks for reaching out—expect a reply within 24–48 hours.";
  form.reset();
});
