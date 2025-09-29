// Year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Theme toggle with wave animation
const themeToggle = document.getElementById('themeToggle');
const waveOverlay = document.querySelector('.wave-overlay');
themeToggle.addEventListener('click', () => {
  // animate overlay
  waveOverlay.classList.remove('animate');
  // trigger reflow
  void waveOverlay.offsetWidth;
  waveOverlay.classList.add('animate');
  // toggle theme after short delay for nicer sync
  const isDark = document.body.classList.contains('theme-dark');
  setTimeout(() => {
    document.body.classList.toggle('theme-dark', !isDark);
    document.body.classList.toggle('theme-light', isDark);
  }, 150);
});

// Smooth internal link offset fix for sticky header (optional enhancement)
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const targetId = link.getAttribute('href').substring(1);
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      e.preventDefault();
      const headerHeight = document.querySelector('.site-header').offsetHeight;
      const y = targetEl.getBoundingClientRect().top + window.pageYOffset - headerHeight - 8;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  });
});

// Nyota: interactive star assistant
const nyotaBtn = document.getElementById('nyota');

const nyotaResponses = [
  "Karibu sana! I'm Nyota. Unataka nini leo? Kilimanjaro, Serengeti, au chai kwanza? Hehe!",
  "Twende safari! Telling you, the sunrise on the crater is sweeter than mandazi and chai.",
  "Eeh, my friend! If you blink, the zebra will think you're winking — then it's a party.",
  "Relax kidogo — Tanzania time is like a lion nap: strong, then swift. What can I help you with?",
  "Habari yako? I’m glowing brighter than a Dar sunset. Ask me about tours or bookings!"
];

// Simple random joke
function nyotaJoke() {
  const jokes = [
    "You know why lions don't do cardio? They already run the savannah!",
    "Kilimanjaro tip: carry layers. The mountain has mood swings like a DJ in Stone Town.",
    "If a warthog crosses the road, don’t ask where it’s going — it's shy like me!",
    "Zanzibar sunsets are free. The only tax is awe. Pay with your jaw dropping.",[&#95;{{{CITATION{{{&#95;2{](https://github.com/szerintedmi/roadmap-radar-chart/tree/45ee5f9f7a1d44100313358e369abb025b935cea/README.md)
    
