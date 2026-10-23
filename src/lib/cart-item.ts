import type { CartItem } from "@/lib/cart-store";
import type { getItinerary } from "@/lib/data";

type Itinerary = NonNullable<Awaited<ReturnType<typeof getItinerary>>>;
type ScheduleItem = Itinerary["schedule"][number]["items"][number];

export function toCartItem(i: ScheduleItem, itinerary: Pick<Itinerary, "slug" | "title" | "destination">): CartItem {
  return {
    id: i.id,
    name: i.name,
    category: i.category,
    priceCents: i.priceCents,
    priceNote: i.priceNote,
    currency: i.currency,
    unit: i.unit,
    quantity: i.quantity,
    vendor: i.vendor,
    bookUrl: i.bookUrl,
    website: i.website,
    photoUrl: i.photoUrl,
    lat: i.lat,
    lng: i.lng,
    day: i.day,
    couponCode: i.couponCode,
    itinerary: { slug: itinerary.slug, title: itinerary.title },
    destination: { slug: itinerary.destination.slug, name: itinerary.destination.name },
  };
}
