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
      lead: "What creators agree on",
      text: "Places ranked by how many creators recommend them. Use the chips to show only food, stays and so on.",
    },
    {
      lead: "Save as you go",
      text: "Tap + on any place to put it in your trip cart. You can plan the days later.",
    },
    {
      lead: "Other tabs",
      text: "Top picks, when to go, budget, eSIM and more are in the row above.",
    },
  ],
  "city-best": [
    {
      lead: "The short list",
      text: "The places most creators agree on, grouped by type.",
    },
    {
      lead: "Save the ones you like",
      text: "Tap + to add a pick to your trip cart.",
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
      text: "Nearby counts the other spots creators recommend in that area.",
    },
    {
      lead: "Save a stay",
      text: "Tap + on a hotel to add it to your trip cart.",
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
      text: "Sort the routes by agreement, cost a day or length.",
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
      text: "Every stop, day by day, in the order the creator did it.",
    },
    {
      lead: "Take what you like",
      text: "Add the whole route to your trip cart, or tap + on single stops.",
    },
    {
      lead: "Book and save",
      text: "Book buttons open the booking site. Copy any coupon codes first.",
    },
  ],
  place: [
    {
      lead: "Who recommends it",
      text: "See which creators include this place and in which of their routes.",
    },
    {
      lead: "Swipe the photos",
      text: "More shots of the place sit in the gallery.",
    },
    {
      lead: "Next step",
      text: "Add it to your trip cart, or open directions in Google Maps.",
    },
  ],
  cart: [
    {
      lead: "Everything you saved",
      text: "Places from any city and any creator land here.",
    },
    {
      lead: "Plan the days",
      text: "Set your trip length, then put each item on a day in Day by day.",
    },
    {
      lead: "Share it",
      text: "Share my trip makes a link friends can open and copy into their own cart.",
    },
    {
      lead: "On the road",
      text: "Trip mode shows just today's stops. It also works offline.",
    },
    {
      lead: "Every device",
      text: "Sign in with Google to see this cart on your phone and laptop.",
    },
  ],
  "my-trips": [
    {
      lead: "Same cart everywhere",
      text: "Signed in, your trip cart follows you to your phone, laptop and tablet.",
    },
    {
      lead: "Keep a copy",
      text: "Save the cart as a named trip, then start a new one. Open it again any time.",
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
      text: "When rain is forecast, indoor spots creators like show up here.",
    },
  ],
  finder: [
    {
      lead: "Find a route",
      text: "Pick the kind of trip, then a destination, length and budget style.",
    },
    {
      lead: "Set a budget",
      text: "Routes over your budget, or with unpriced stays, are hidden.",
    },
  ],
  creators: [
    {
      lead: "Who we follow",
      text: "The travel creators whose itineraries we compare. Most routes first.",
    },
    {
      lead: "Pick a city",
      text: "Tap a city to see only the creators with a route there.",
    },
    {
      lead: "Dig in",
      text: "Open a creator to see all their routes and find them on social media.",
    },
  ],
} satisfies Record<string, Tip[]>;

export type GuideId = keyof typeof guides;
