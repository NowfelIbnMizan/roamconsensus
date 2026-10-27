export type AboutPhoto = {
  src: string;
  alt: string;
  caption: string;
  /** Landscape (wider than tall). */
  wide?: boolean;
  /** Where to anchor the crop when the slot shape cuts the photo, e.g. "50% 85%" to keep the bottom. */
  focus?: string;
};

// The owner's own travel photos (public/about), location data stripped, other people's faces blurred. Places come
// from each photo's location data or from the owner.
// wide: true = landscape (wider than tall); it only ever shows in a landscape slot. src/lib/about-photos.test.ts checks
// this against the files, so a new photo with the wrong flag fails `npm test`.
export const PHOTOS: AboutPhoto[] = [
  { src: "/about/party.jpg", alt: "Nowfel at the Full Moon Party, other faces blurred", caption: "Full Moon Party · Koh Phangan, Thailand" },
  { src: "/about/thali.jpg", alt: "A thali spread with drinks in Pokhara, Nepal", caption: "Thali time · Pokhara, Nepal", wide: true },
  { src: "/about/fish.jpg", alt: "Whole grilled fish on a banana leaf in Pokhara, Nepal", caption: "Grilled fish · Pokhara, Nepal", wide: true },
  { src: "/about/ferry.jpg", alt: "Nowfel on a ferry deck at sunset near Koh Phangan", caption: "Ferry at sunset · Koh Phangan, Thailand", wide: true },
  { src: "/about/safari.jpg", alt: "Nowfel in a safari jeep in Wilpattu", caption: "Safari jeep · Wilpattu, Sri Lanka" },
  { src: "/about/monkey-temple.jpg", alt: "Nowfel with a monkey at the Monkey Temple, other faces blurred", caption: "Monkey Temple · Kathmandu, Nepal" },
  { src: "/about/kite.jpg", alt: "Nowfel walking out of the lagoon with kitesurf gear", caption: "Kitesurf day · Kalpitiya, Sri Lanka" },
  { src: "/about/python.jpg", alt: "Nowfel with a python around his neck, other faces blurred", caption: "Made a friend · Galle Fort, Sri Lanka" },
  { src: "/about/golden-statue.jpg", alt: "Nowfel in front of a giant golden statue", caption: "Golden giant · Pokhara, Nepal" },
  { src: "/about/pokhara-view.jpg", alt: "View over Pokhara and its lake from a hilltop temple", caption: "View over Pokhara, Nepal", wide: true },
  { src: "/about/cliff.jpg", alt: "Nowfel resting on a rock below a forest cliff, other face blurred", caption: "Cliffside break · Nuwara Eliya, Sri Lanka" },
  { src: "/about/waterfall.jpg", alt: "A waterfall in green hills", caption: "Waterfall hike · Nuwara Eliya, Sri Lanka" },
  { src: "/about/waves.jpg", alt: "Nowfel on rocks as a wave breaks", caption: "Chasing waves · Kalpitiya, Sri Lanka", wide: true },
  { src: "/about/beach.jpg", alt: "Nowfel on a quiet beach", caption: "Beach walk · Kalpitiya, Sri Lanka", wide: true },
  { src: "/about/galle-night.jpg", alt: "Galle Fort clock tower at night", caption: "Clock tower · Galle Fort, Sri Lanka" },
  { src: "/about/waterfall-shower.jpg", alt: "Nowfel sitting under a small waterfall", caption: "Waterfall shower · Pokhara, Nepal" },
  { src: "/about/halong-deck.jpg", alt: "Nowfel on a cruise deck below a limestone cliff", caption: "Cruise deck · Ha Long Bay, Vietnam" },
  { src: "/about/phewa-beers.jpg", alt: "Beers on a table above Phewa Lake", caption: "Beers over Phewa Lake · Pokhara, Nepal" },
  { src: "/about/chandragiri.jpg", alt: "Nowfel at the Chandragiri hilltop under big clouds", caption: "Chandragiri Hills · Kathmandu, Nepal" },
  { src: "/about/halong-boat.jpg", alt: "Nowfel cheering on a rowing boat with friends, other faces blurred", caption: "Boat crew · Ha Long Bay, Vietnam", wide: true },
  { src: "/about/hanoi-ramen.jpg", alt: "A bowl of ramen with nori", caption: "Ramen stop · Hanoi, Vietnam" },
  { src: "/about/puppies.jpg", alt: "Nowfel holding two puppies", caption: "Puppy break · Cox's Bazar, Bangladesh" },
  { src: "/about/kathmandu-view.jpg", alt: "Nowfel with arms out above the Kathmandu valley", caption: "View over Kathmandu, Nepal", wide: true },
  { src: "/about/halong-cave.jpg", alt: "Nowfel sitting on a rock at a cave mouth", caption: "Cave stop · Ha Long Bay, Vietnam" },
  { src: "/about/hoi-an-sunset.jpg", alt: "Nowfel on the riverside at sunset, other faces blurred", caption: "Riverside sunset · Hoi An, Vietnam", wide: true },
  { src: "/about/durbar-lion.jpg", alt: "Nowfel leaning on a stone lion, other faces blurred", caption: "Durbar Square · Kathmandu, Nepal" },
  { src: "/about/coxs-sunset.jpg", alt: "Nowfel in silhouette on a wet beach at sunset", caption: "Sunset walk · Cox's Bazar, Bangladesh", wide: true },
  { src: "/about/pitha.jpg", alt: "Pitha rice cakes with a dipping sauce", caption: "Pitha night · Cox's Bazar, Bangladesh" },
  { src: "/about/phewa-boats.jpg", alt: "Colourful rowing boats on Phewa Lake", caption: "Phewa Lake boats · Pokhara, Nepal", wide: true },
  { src: "/about/pine-forest.jpg", alt: "Nowfel with a friend in a pine forest, friend's face blurred", caption: "Pine forest · Cox's Bazar, Bangladesh" },
  { src: "/about/poolside-drink.jpg", alt: "A cocktail by a pool", caption: "Poolside drink · Pokhara, Nepal" },
  { src: "/about/durbar-bhairav.jpg", alt: "A golden Bhairav mask behind a carved wooden screen", caption: "Golden Bhairav · Kathmandu, Nepal", wide: true },
  { src: "/about/garden-of-dreams.jpg", alt: "The neoclassical Garden of Dreams", caption: "Garden of Dreams · Kathmandu, Nepal", wide: true },
  { src: "/about/thamel-breakfast.jpg", alt: "A plate of eggs, veg and roti on a terrace", caption: "Terrace breakfast · Thamel, Kathmandu" },
  { src: "/about/kathmandu-sunrise.jpg", alt: "Rooftops of Kathmandu at sunrise", caption: "Sunrise over Kathmandu, Nepal", wide: true },
  { src: "/about/kathmandu-lunch.jpg", alt: "Club sandwiches, burgers and a board game", caption: "Lunch and a board game · Kathmandu, Nepal", wide: true },
];
