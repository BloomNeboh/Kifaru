import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

// CORS for local dev (adjust origins for production)
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    // Add your GitHub Pages domain if serving front-end from there
  ],
  credentials: false
}));

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Helper: simple itinerary generator (rule-based demo)
// Replace with calls to your AI provider for richer itineraries.
function generateItinerary({ itineraryItems = [], days = 7, budget = 3 }) {
  const items = itineraryItems.length ? itineraryItems : ['Arusha', 'Tarangire', 'Serengeti', 'Ngorongoro', 'Zanzibar'];
  const dayPlans = [];
  const perDayCost = budget <= 2 ? 180 : budget >= 4 ? 450 : 300;
  const activitiesMap = {
    'Serengeti': ['Game drive', 'Migration viewing', 'Sunset lookout'],
    'Ngorongoro': ['Crater descent', 'Picnic', 'Hippo pool'],
    'Tarangire': ['Elephant herds', 'Baobab tour', 'Birding'],
    'Lake Manyara': ['Tree-climbing lions', 'Hot springs', 'Birdwatching'],
    'Zanzibar': ['Stone Town tour', 'Spice farm', 'Snorkeling'],
    'Kilimanjaro': ['Acclimatization hike', 'Campfire', 'Summit attempt'],
    'Arusha': ['Coffee tour', 'Local market', 'Museum']
  };

  for (let i = 0; i < days; i++) {
    const place = items[i % items.length];
    const activities = activitiesMap[place] || ['Scenic drive', 'Local cuisine', 'Relax'];
    dayPlans.push({
      title: place,
      description: `Experience ${place} with guided activities and comfortable lodging.`,
      lodging: place === 'Zanzibar' ? 'Beach lodge' : 'Safari camp',
      distance: place === 'Zanzibar' ? 'Flight 1h' : 'Drive 2–4h',
      activities,
      estimated_cost: `$${perDayCost}`
    });
  }

  const total = perDayCost * days;
  return {
    days: dayPlans,
    total_estimated_cost: `$${total}`
  };
}

// Nyota API: server-backed responses
app.post('/api/nyota', async (req, res) => {
  const { message = '', context = {} } = req.body;

  // Build a friendly reply based on message intents
  const q = String(message).toLowerCase();
  let reply = "Here’s a personalized, day-by-day plan based on your preferences.";
  if (q.includes('best time')) reply = "June–October is ideal for safaris; Jan–Feb for calving in Serengeti; Zanzibar is great year-round.";
  else if (q.includes('kilimanjaro')) reply = "Plan 6–8 days; Machame or Lemosho routes are excellent. I’ve included acclimatization where possible.";
  else if (q.includes('budget')) reply = "I’ll balance mid-range camps with one splurge night and suggest shoulder-season travel for value.";
  else if (q.includes('optimize')) reply = "I optimized your route and placed Zanzibar at the end for a relaxing finish.";

  // Generate itinerary (replace with AI integration if desired)
  const itinerary = generateItinerary(context);

  // Example AI integration (pseudo-code):
  // const aiReply = await callYourAIProvider({ message, context });
  // reply = aiReply.text; itinerary = aiReply.itinerary;

  res.json({ reply, itinerary });
});

// Serve locally
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Nyota server running on http://localhost:${PORT}`);
});
