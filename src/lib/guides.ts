// Short "how this page works" notes for first-time visitors, one per tab or tool page. Each tip is a bold lead plus
// one plain sentence. They start folded away; see components/page-guide.tsx.

export type Tip = { lead: string; text: string };

export const guides = {
  "city-itineraries": [
    {
      lead: "Pick your route",
      text: "Each card is one creator's full day-by-day plan. Open one to see every stop.",
    },
    {
      lead: "What creators don't miss",
      text: "The Top 5 and the photo grid put the places most creators recommend first. Hover or tap a photo for a quick look.",
    },
    {
      lead: "Filter and see all",
      text: "Chips show only food, stays and so on. See all opens every place in the city on one page.",
    },
    {
      lead: "Add as you go",
      text: "Tap + on any place to put it in your trip. Plan the days later.",
    },
  ],
  "city-best": [
    {
      lead: "The short list",
      text: "The places most creators picked, grouped by type.",
    },
    {
      lead: "Add the ones you like",
      text: "Tap + to add a pick to your trip.",
    },
    {
      lead: "Keep it for later",
      text: "Save to Pinterest pins this list to your board.",
    },
  ],
  "city-stay": [
    {
      lead: "Areas, not just hotels",
      text: "Each area is one creators slept in, most-picked first. Numbers match the pins on the map.",
    },
    {
      lead: "What's nearby",
      text: "Nearby counts the other places creators recommend in that area.",
    },
    {
      lead: "Add a stay",
      text: "Tap + on a hotel to add it to your trip.",
    },
  ],
  "city-when": [
    {
      lead: "Month by month",
      text: "Rain, heat and crowds for each month, with the best months marked.",
    },
    {
      lead: "Plan around it",
      text: "Pick dates in the best months for drier days and fairer prices.",
    },
  ],
  "city-before": [
    {
      lead: "Before you fly",
      text: "Visa, arrival forms, money, phone and local rules, in one list.",
    },
    {
      lead: "Tick as you go",
      text: "Ticks stay saved on this device, so you can come back to the list.",
    },
  ],
  "city-compare": [
    {
      lead: "Every route at a glance",
      text: "Sort the routes by most shared places, cost a day or length.",
    },
    {
      lead: "Spot the overlap",
      text: "Tick two routes to see which places both include and which only one does.",
    },
  ],
  "city-budget": [
    {
      lead: "Estimate your trip",
      text: "Set days, travellers and travel style to see a cost per person.",
    },
    {
      lead: "Choose where you stay",
      text: "Pick a creator's hotel to swap in its real nightly price.",
    },
    {
      lead: "Rough guide only",
      text: "Food, transport and sights use typical daily spends, so leave some spare.",
    },
  ],
  "city-esim": [
    {
      lead: "Mobile data on arrival",
      text: "Pick your trip length and how much you use your phone. You get the cheapest plan, the best value and an unlimited option.",
    },
    {
      lead: "Want to compare?",
      text: "Open the full list to see every plan that fits.",
    },
    {
      lead: "Check your phone first",
      text: "Your phone must support eSIM and be unlocked.",
    },
  ],
  itinerary: [
    {
      lead: "One creator's plan",
      text: "Every stop, day by day, in the order the creator did it. Tap a day to fold it open or shut.",
    },
    {
      lead: "Take what you like",
      text: "Add the whole route to your trip, or tap + on single stops.",
    },
    {
      lead: "Skip it?",
      text: "Stops marked Skip it are the creator's warning. They stay out of the whole route, but you can still add one.",
    },
    {
      lead: "Photos and map",
      text: "Hover or tap a photo for the place's details. Pick a day above the map to see just its stops.",
    },
  ],
  place: [
    {
      lead: "Who recommends it",
      text: "The count shows how many creators include it. Open What creators say for their tips.",
    },
    {
      lead: "Swipe the photos",
      text: "Arrows or a swipe show more shots. The camera icon credits the photographer.",
    },
    {
      lead: "Build a day around it",
      text: "The map and list show places creators visit nearby, with drive times. Tap + to add one.",
    },
    {
      lead: "Next step",
      text: "Add it to your trip, or open directions in Google Maps.",
    },
  ],
  cart: [
    {
      lead: "Everything you added",
      text: "Places from any city and any creator land here.",
    },
    {
      lead: "Plan the days",
      text: "Set your trip length, then put each stop on a day in Day by day.",
    },
    {
      lead: "Share it",
      text: "Share trip makes a short link friends can open and copy into their own trip.",
    },
    {
      lead: "On the road",
      text: "Trip mode shows just today's stops. It also works offline.",
    },
    {
      lead: "Every device",
      text: "Sign in with Google to see this trip on your phone and laptop.",
    },
  ],
  "my-trips": [
    {
      lead: "Same trip everywhere",
      text: "Signed in, your trip plan follows you to your phone, laptop and tablet.",
    },
    {
      lead: "Keep a copy",
      text: "Save your trip under a name, then start a new one. Open it again any time.",
    },
    {
      lead: "Plan with friends",
      text: "Start a group trip and share the link. Everyone adds stops and votes on them.",
    },
  ],
  today: [
    {
      lead: "Today's plan",
      text: "Set your start date and this page opens on today's stops by itself.",
    },
    {
      lead: "Tick them off",
      text: "Mark stops as done and Next shows where to head after.",
    },
    {
      lead: "Rainy day?",
      text: "When rain is forecast, indoor places creators like show up here.",
    },
  ],
  finder: [
    {
      lead: "Narrow it down",
      text: "Pick where, how long, your budget and the kind of trip. The list updates as you choose.",
    },
    {
      lead: "Set a budget",
      text: "Routes over your budget, or with hotels that have no price, are hidden.",
    },
    {
      lead: "Not sure where?",
      text: "Find your match asks four quick questions and suggests a route.",
    },
  ],
  creators: [
    {
      lead: "Who we follow",
      text: "The travel creators whose routes we compare. Most routes first.",
    },
    {
      lead: "Pick a city",
      text: "Tap a city to see only the creators with a route there.",
    },
    {
      lead: "Their style",
      text: "Tags show each creator's travel style and trip lengths, so you can find one who travels like you.",
    },
  ],
  quiz: [
    {
      lead: "Tap what fits",
      text: "Where, how long, your budget style and what you love. Tap again to undo.",
    },
    {
      lead: "Live matches",
      text: "Your best route updates as you tap, with why it fits. On a phone, the bar at the bottom jumps to it.",
    },
    {
      lead: "Places made for you",
      text: "Places that match what you love, ready to mix into any route.",
    },
  ],
  visa: [
    {
      lead: "Pick your passport",
      text: "Each country shows whether you need a visa and for how long. Countries in your trip come first.",
    },
    {
      lead: "Before you fly",
      text: "Tap a country for its checklist. Ticks stay saved on this device.",
    },
    {
      lead: "Rules change",
      text: "Always confirm on the official links before you book.",
    },
  ],
  "city-places": [
    {
      lead: "Every place in one list",
      text: "All the places creators recommend in this city, most-picked first.",
    },
    {
      lead: "Filter and add",
      text: "Chips show one type at a time. Tap + to add a place to your trip.",
    },
  ],
} satisfies Record<string, Tip[]>;

export type GuideId = keyof typeof guides;
