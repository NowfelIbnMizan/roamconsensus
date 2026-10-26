-- Owner asked for a rewrite of the bio's last paragraph (2026-10-26). Replaces only that paragraph.
UPDATE "Editor"
SET "bio" = replace("bio", 'Off the clock it''s Muay Thai, kickboxing and MMA, soccer, swimming and DJ-ing. On the road it''s temples and old landmarks by day, a good party by night.', 'Off the clock it''s Muay Thai and DJ-ing. On the road it''s temples and old towns by day, a good night out after, and street food in between. My rule for that last one: follow the queue of locals, not the ad. Creatour runs on the same rule. When several creators who went all point to the same place, it''s probably worth your afternoon.'),
    "updatedAt" = NOW()
WHERE "id" = 'me';
