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
];
