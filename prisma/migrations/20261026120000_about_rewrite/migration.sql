-- Owner-approved rewrite of the About tagline and bio (2026-10-26). Only touches the text, keeps photo and links.
UPDATE "Editor"
SET "tagline" = 'Street-food hunter, Muay Thai fan, weekend DJ. I read the travel guides so you can plan faster.',
    "bio" = E'Born and raised in Riyadh, now based in Dhaka, and happiest wherever there''s a night market. So far: Thailand, Vietnam, Nepal and Sri Lanka. Bangkok is my favourite city, and I''ll happily argue that over a plate of street food.\n\nBy day I''m a digital marketer working remotely. That means two things: I can plan trips from anywhere, and I can spot a sponsored "top 10" list from across the street. Creatour skips all that. It lines up itineraries that travel creators shared publicly, so you can see where they actually agree.\n\nOff the clock it''s Muay Thai, kickboxing and MMA, soccer, swimming and DJ-ing. On the road it''s temples and old landmarks by day, a good party by night.',
    "updatedAt" = NOW()
WHERE "id" = 'me';
