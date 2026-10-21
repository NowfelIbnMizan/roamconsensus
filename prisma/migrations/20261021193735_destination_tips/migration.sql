-- CreateTable
CREATE TABLE "DestinationTip" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DestinationTip_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DestinationTip" ADD CONSTRAINT "DestinationTip_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Bali "Before you go" checklist for existing databases (live data isn't reseeded). Editable in admin.
INSERT INTO "DestinationTip" ("id", "destinationId", "position", "topic", "title", "body", "sourceUrl")
SELECT md5(random()::text || t.position::text), d."id", t.position, t.topic, t.title, t.body, t.source
FROM "Destination" d, (VALUES
  (0, 'Entry', 'Visa on arrival', 'Most nationalities need a visa. Buy the e-VOA online before you fly: IDR 500,000 (about US$31), valid 30 days and extendable once for 30 more. Your passport needs at least 6 months left.', 'https://evisa.imigrasi.go.id'),
  (1, 'Entry', 'All Indonesia arrival card', 'Fill in the free All Indonesia form online within 3 days before landing. It covers immigration, customs and health in one QR code you show at the airport.', 'https://allindonesia.imigrasi.go.id'),
  (2, 'Entry', 'Bali tourist levy', 'Every foreign visitor pays IDR 150,000 (about US$10) once per trip. Pay on the official Love Bali site or app before you fly and keep the receipt QR code.', 'https://lovebali.baliprov.go.id'),
  (3, 'Money', 'Cash and ATMs', 'The currency is the rupiah (IDR). Use ATMs inside banks or malls and authorised money changers. Skip street changers offering better-than-market rates: short-changing is common.', NULL),
  (4, 'Money', 'Tipping', 'Not expected. Many restaurants already add about 15% for service and tax. Round up for drivers, and leave IDR 20,000–50,000 for a good spa therapist or guide.', NULL),
  (5, 'Packing', 'Plugs and power', 'Type C and F sockets (two round pins), 230 V. Bring a universal adapter.', NULL),
  (6, 'Etiquette', 'Temple dress', 'Cover shoulders and knees and wear a sarong and sash. Most temples lend or rent them at the gate. Don''t step on the small offerings (canang) on the ground.', NULL),
  (7, 'Health', 'Bali belly', 'Drink bottled or filtered water only, also for brushing teeth. Pack rehydration salts just in case.', NULL),
  (8, 'Health', 'Rabies and monkeys', 'Bali has rabies. Don''t touch monkeys or stray dogs, and keep food, glasses and phones out of reach at Uluwatu and the Monkey Forest. If bitten or scratched, see a clinic the same day.', NULL),
  (9, 'Health', 'Mosquitoes', 'Dengue occurs year-round, more in the wet season. Use repellent with DEET or picaridin, especially at dawn and dusk.', NULL),
  (10, 'Getting around', 'Taxis and scooters', 'Grab and Gojek apps are the easiest way to get cars and scooter taxis; some areas only allow local drivers. Renting a scooter needs an International Driving Permit that covers motorbikes, or insurance may not pay.', NULL),
  (11, 'Safety', 'Ocean and cliffs', 'Currents are strong on many beaches: swim between the red-and-yellow flags. On Nusa Penida, stay well back from the edges at Angel''s Billabong and Devil''s Tear.', NULL),
  (12, 'Safety', 'Travel insurance', 'Get cover that includes medical evacuation, and scooter accidents if you plan to ride.', NULL)
) AS t(position, topic, title, body, source)
WHERE d."slug" = 'bali' AND NOT EXISTS (SELECT 1 FROM "DestinationTip" x WHERE x."destinationId" = d."id");
