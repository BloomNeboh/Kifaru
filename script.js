// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Theme presets
const root = document.documentElement;
const themeSelect = document.getElementById('themeSelect');
const applyTheme = (name) => { root.setAttribute('data-theme', name); localStorage.setItem('theme', name); };
applyTheme(localStorage.getItem('theme') || 'light');
themeSelect.value = root.getAttribute('data-theme');
themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));

// Smooth scroll
document.querySelectorAll('a.nav-link, .cta .btn').forEach(link => {
  link.addEventListener('click', (e) => {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', href);
    }
  });
});

// Parallax cards
const parallaxEls = document.querySelectorAll('[data-parallax]');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => entry.isIntersecting ? entry.target.dataset.inView = '1' : delete entry.target.dataset.inView);
}, { threshold: 0.1 });
parallaxEls.forEach(el => io.observe(el));
window.addEventListener('scroll', () => {
  parallaxEls.forEach(el => {
    if (!el.dataset.inView) return;
    const rect = el.getBoundingClientRect();
    const mid = rect.top + rect.height / 2;
    const offset = (mid - window.innerHeight / 2) / window.innerHeight;
    el.style.transform = `translateY(${offset * -18}px)`;
  });
});

// Planner drag & drop
const chips = document.querySelectorAll('.chip');
const itinerary = document.querySelector('.itinerary');
const hint = itinerary.querySelector('.hint');
chips.forEach(chip => chip.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', chip.dataset.destination)));
itinerary.addEventListener('dragover', e => { e.preventDefault(); itinerary.classList.add('dragover'); });
itinerary.addEventListener('dragleave', () => itinerary.classList.remove('dragover'));
itinerary.addEventListener('drop', (e) => {
  e.preventDefault(); itinerary.classList.remove('dragover');
  const dest = e.dataTransfer.getData('text/plain'); if (!dest) return;
  hint?.remove();
  const item = document.createElement('div'); item.className = 'chip'; item.textContent = dest;
  itinerary.appendChild(item);
});

// Chat helpers
const chatLog = document.getElementById('chatLog');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const voiceBtn = document.getElementById('voiceBtn');
const listenBtn = document.getElementById('listenBtn');
const itineraryView = document.getElementById('itineraryView');

// Bubbles
function addBubble(text, who = 'nyota') {
  const div = document.createElement('div');
  div.className = `chat-bubble ${who}`;
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// Speech synthesis
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  const voices = speechSynthesis.getVoices();
  const swahiliPref = voices.find(v => /swahili|ki?swahili/i.test(v.name + ' ' + v.lang));
  utter.voice = swahiliPref || voices.find(v => v.lang.startsWith('en')) || null;
  utter.rate = 1.0;
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}
voiceBtn.addEventListener('click', () => {
  const bubbles = [...document.querySelectorAll('.chat-bubble.nyota')];
  const last = bubbles[bubbles.length - 1];
  if (last) speak(last.textContent);
});

// Speech recognition (optional)
let recognition;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR(); recognition.lang = 'en-US'; recognition.interimResults = false;
  recognition.onresult = (event) => { chatInput.value = event.results[0][0].transcript; sendMessage(); };
  recognition.onerror = () => addBubble("I couldn’t catch that—try again or type your question.", 'nyota');
}
listenBtn.addEventListener('click', () => {
  if (!recognition) { addBubble("Voice input isn’t supported on this browser.", 'nyota'); return; }
  recognition.start(); addBubble("Listening… speak your question.", 'nyota');
});

// Render itinerary cards
function renderItinerary(itineraryJson) {
  itineraryView.innerHTML = '';
  if (!itineraryJson?.days?.length) return;
  itineraryJson.days.forEach((day, i) => {
    const card = document.createElement('div');
    card.className = 'itinerary-card';
    card.innerHTML = `
      <h4>Day ${i + 1}: ${day.title || ''}</h4>
      <p>${day.description || ''}</p>
      <div class="itinerary-meta">
        ${day.lodging ? `<span>Stay: ${day.lodging}</span>` : ''}
        ${day.distance ? `<span>Distance: ${day.distance}</span>` : ''}
        ${day.activities ? `<span>Activities: ${day.activities.join(', ')}</span>` : ''}
        ${day.estimated_cost ? `<span>Est. cost: ${day.estimated_cost}</span>` : ''}
      </div>
    `;
    itineraryView.appendChild(card);
  });
  if (itineraryJson.total_estimated_cost) {
    const total = document.createElement('div');
    total.className = 'itinerary-card';
    total.innerHTML = `<strong>Total estimated cost:</strong> ${itineraryJson.total_estimated_cost}`;
    itineraryView.appendChild(total);
  }
}

// Server-backed Nyota
async function askNyotaServer(message, context = {}) {
  addBubble(message, 'user');
  try {
    const res = await fetch('/api/nyota', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context })
    });
    const data = await res.json();

    if (data.itinerary) renderItinerary(data.itinerary);
    if (data.reply) { addBubble(data.reply, 'nyota'); speak(data.reply); }
  } catch (err) {
    addBubble("I couldn’t reach my server. Please try again.", 'nyota');
  }
}

// Send message
function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = '';
  // Include itinerary chips as context
  const itineraryItems = [...document.querySelectorAll('.itinerary .chip')].map(el => el.textContent);
  const days = Number(document.getElementById('days').value);
  const budget = Number(document.getElementById('budget').value);
  askNyotaServer(text, { itineraryItems, days, budget });
}
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

// Planner button calls server with current plan
document.getElementById('optimizeBtn').addEventListener('click', () => {
  const itineraryItems = [...document.querySelectorAll('.itinerary .chip')].map(el => el.textContent);
  const days = Number(document.getElementById('days').value);
  const budget = Number(document.getElementById('budget').value);
  askNyotaServer('Optimize my itinerary', { itineraryItems, days, budget });
});

// Panorama hover-pan
const pano = document.querySelector('.panorama');
if (pano) {
  let rafId;
  pano.addEventListener('mousemove', (e) => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const rect = pano.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const tilt = (x - 0.5) * 8;
      pano.style.transform = `scale(1.05) perspective(600px) rotateY(${tilt}deg)`;
    });
  });
  pano.addEventListener('mouseleave', () => { pano.style.transform = 'none'; });
}

// Contact form (demo)
const form = document.querySelector('.contact-form');
const formFeedback = document.querySelector('.form-feedback');
form?.addEventListener('submit', (e) => { e.preventDefault(); formFeedback.textContent = "Thanks—expect a reply within 24–48 hours."; form.reset(); });
