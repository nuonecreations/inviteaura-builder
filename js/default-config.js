/* Embedded fallback config — used when JSON fetch is unavailable (file://).
   The real source of truth is wedding.config.json / weddings/<slug>.json.
   Keep this in sync with wedding.config.json for the default wedding. */
window.DEFAULT_CONFIG = {
  weddingId: "kasun-shanika",
  groomName: "Kasun",
  brideName: "Shanika",
  groomFullName: "Kasun Bandara",
  brideFullName: "Shanika Perera",
  weddingDate: "2027-02-14T09:00:00+05:30",
  weddingTimeLabel: "Sunday, 14 February 2027 • 9.00 AM",
  venueShort: "Grand Monarch Ballroom, Colombo",
  tagline: "Together with their families",
  invitationText: "With hearts full of joy, we invite you to witness the beginning of our forever. Your presence will make our special day truly unforgettable.",
  quote: "And suddenly, all the love songs were about you.",
  quoteAuthor: "— Our Story",
  hero: {
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&q=80",
    subtitle: "Are getting married"
  },
  theme: {
    preset: "burgundy-gold",
    primaryColor: "#5C1A2B",
    secondaryColor: "#8C2A3A",
    accentColor: "#C9A86C",
    background: "#FAF3E8",
    surface: "#FFFEFB",
    textColor: "#3A2A1F"
  },
  music: { url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", title: "Wedding Theme" },
  story: {
    title: "Our Love Story",
    subtitle: "How two hearts became one",
    milestones: [
      { date: "2019", title: "The First Meeting", description: "A chance encounter at a friend's gathering turned into hours of conversation and laughter.", image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=80" },
      { date: "2021", title: "The First Date", description: "Coffee, a long walk, and the feeling that this was something special.", image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&q=80" },
      { date: "2025", title: "The Proposal", description: "Under the evening sky, Kasun asked the question that changed everything — and Shanika said yes!", image: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800&q=80" }
    ]
  },
  events: [
    { id: "wedding", type: "wedding", title: "The Wedding", date: "2027-02-14T09:00:00+05:30", time: "9.00 AM onwards", venue: "Grand Monarch Ballroom", address: "123 Galle Road, Colombo 03", mapsUrl: "https://www.google.com/maps/search/?api=1&query=Colombo", dressCode: "Formal — Burgundy, Gold & Cream encouraged", description: "Ceremony followed by lunch reception." },
    { id: "poruwa", type: "poruwa", title: "Poruwa Ceremony", date: "2027-02-14T11:30:00+05:30", time: "11.30 AM", venue: "Grand Monarch Ballroom — Poruwa Mandala", address: "123 Galle Road, Colombo 03", mapsUrl: "https://www.google.com/maps/search/?api=1&query=Colombo", dressCode: "Traditional / Formal", description: "Traditional Kandyan poruwa ceremony." },
    { id: "homecoming", type: "homecoming", title: "Homecoming", date: "2027-02-20T18:00:00+05:30", time: "6.00 PM onwards", venue: "Shanika Residence", address: "45 Kandy Road, Kadawatha", mapsUrl: "https://www.google.com/maps/search/?api=1&query=Kadawatha", dressCode: "Smart Casual", description: "An evening of dinner, music and celebration with family." }
  ],
  gallery: [
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=900&q=80",
    "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=900&q=80",
    "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=900&q=80",
    "https://images.unsplash.com/photo-1529636798458-92182e662485?w=900&q=80",
    "https://images.unsplash.com/photo-1525772764200-be829a350797?w=900&q=80",
    "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=900&q=80"
  ],
  rsvp: { deadline: "2027-01-15", enabled: true, note: "Kindly confirm your presence before 15 January 2027." },
  wishes: { enabled: true, sampleWishes: [] },
  contact: { whatsapp: "94770000000", phone: "+94 77 000 0000", email: "hello@example.com" },
  share: { text: "You're invited to Kasun & Shanika's wedding! 💍" }
};

window.THEME_PRESETS = {
  "burgundy-gold": { label: "Burgundy Gold", primaryColor: "#5C1A2B", secondaryColor: "#8C2A3A", accentColor: "#C9A86C", background: "#FAF3E8", surface: "#FFFEFB", textColor: "#3A2A1F" },
  "royal-emerald": { label: "Royal Emerald", primaryColor: "#0F3D2E", secondaryColor: "#14532D", accentColor: "#D4AF37", background: "#F0F7F2", surface: "#FFFFFF", textColor: "#1A2E22" },
  "blush-rose": { label: "Blush Rose", primaryColor: "#9D174D", secondaryColor: "#F472B6", accentColor: "#FBCFE8", background: "#FFF1F2", surface: "#FFFFFF", textColor: "#4A1230" },
  "midnight-silver": { label: "Midnight Silver", primaryColor: "#0F172A", secondaryColor: "#334155", accentColor: "#C0C0C0", background: "#F8FAFC", surface: "#FFFFFF", textColor: "#0F172A" }
};
