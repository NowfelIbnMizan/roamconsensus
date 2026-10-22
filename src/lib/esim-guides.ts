/**
 * Local connectivity notes shown under a country's eSIM table. Keyed by destination country; a country without an
 * entry just shows the table. Facts come from the linked sources; recheck them when plan prices are rechecked.
 */
export type EsimGuide = {
  checked: string;
  imei: { title: string; body: string[]; sources: string[] };
  coverage: { intro: string; areas: { name: string; note: string }[]; sources: string[] };
  faq: { q: string; a: string }[];
};

export const esimGuides: Record<string, EsimGuide> = {
  Indonesia: {
    checked: "October 2026",
    imei: {
      title: "Travel eSIM? No IMEI registration needed",
      body: [
        "Travel eSIMs like Airalo, Holafly or Saily roam on Indonesian networks, so your phone needs no registration at the airport or with an operator.",
        "Buying a local Telkomsel, XL or Indosat SIM instead? The seller registers your phone's IMEI with your passport for free, and it works for 90 days.",
        "Staying longer than 90 days means registering with customs (Bea Cukai). Phones worth up to USD 500 are duty free if you declare them on arrival.",
      ],
      sources: [
        "https://news.ddtc.co.id/berita/nasional/44667/turis-asing-tinggal-di-indonesia-kurang-90-hari-perlu-daftar-imei",
        "https://bcngurahrai.beacukai.go.id/?p=20540",
      ],
    },
    coverage: {
      intro:
        "Bali runs on three networks: Telkomsel, Indosat and XL. In the busy areas all three are fine, so pick on price. Telkomsel reaches furthest into remote spots, so an eSIM on Telkomsel is the safer choice for Nusa Penida and the mountains.",
      areas: [
        { name: "Canggu & Seminyak", note: "Strong 4G on all three networks. XL is often the fastest here." },
        { name: "Ubud", note: "Solid in town on all networks. Signal can dip at the edges of the rice terraces." },
        {
          name: "Uluwatu & the Bukit",
          note: "Good in town and at beach clubs; patchy on the beaches below the cliffs. Telkomsel holds up best.",
        },
        {
          name: "Nusa Penida & Lembongan",
          note: "Weak around cliff viewpoints and coastal roads. Use a Telkomsel-based eSIM and download offline maps.",
        },
        { name: "Kintamani & Mount Batur", note: "Telkomsel is the most reliable; others can drop on the hike." },
      ],
      sources: [
        "https://islaguru.com/articles/mobile-internet-bali",
        "https://travelsimasia.com/blogs/indonesia-guides/best-esim-for-bali",
        "https://insights.opensignal.com/reports/2026/07/indonesia/mobile-network-experience",
      ],
    },
    faq: [
      {
        q: "Do I need to register my phone's IMEI to use a travel eSIM in Bali?",
        a: "No. Travel eSIMs roam on Indonesian networks, so no IMEI registration is needed. Registration only applies to local Indonesian SIM cards (free at the shop, valid 90 days) or stays longer than 90 days.",
      },
      {
        q: "Which network is best in Bali?",
        a: "In Canggu, Seminyak, Ubud and Uluwatu all three networks work well. Telkomsel has the widest coverage, so it is the safest pick for Nusa Penida, Kintamani and remote beaches.",
      },
      {
        q: "Will my phone work with an eSIM?",
        a: "Your phone must support eSIM and be carrier-unlocked. Most iPhones from the XS onward and recent Pixel and Samsung Galaxy phones do. Check your phone's settings for an option to add an eSIM.",
      },
      {
        q: "When should I install the eSIM?",
        a: "Install it at home on Wi-Fi before you fly. Most plans only start counting days when they first connect in Indonesia. Don't delete it after installing: most eSIMs can only be installed once.",
      },
      {
        q: "Do I get a phone number?",
        a: "Usually not. Most travel eSIMs are data only. Keep your home SIM on for texts like bank codes, and use WhatsApp for calls.",
      },
      {
        q: "Can I use my phone as a hotspot?",
        a: "Most plans allow it. Some unlimited plans cap hotspot use, for example Holafly at about 500 MB a day.",
      },
      {
        q: "How much data do I need?",
        a: "Maps and messaging use very little. An hour of Instagram or TikTok uses about 0.5 to 1 GB, a video call about 350 MB, and HD streaming about 3 GB. Light users often manage on 5 GB a week; heavy social or video users want 10 GB or more. Use the estimator above for your trip.",
      },
    ],
  },
  Thailand: {
    checked: "October 2026",
    imei: {
      title: "Travel eSIM? No registration needed",
      body: [
        "Travel eSIMs like Airalo, Saily or Holafly roam on Thai networks, so there's nothing to register. They are data only, with no Thai number.",
        "Thai tourist SIMs and eSIMs (AIS, True, dtac) give you a +66 number but must be registered with your passport. Since 16 May 2026 foreigners register in person at a shop or dealer, tourist packages last up to 60 days, and you can hold 3 SIMs per operator.",
      ],
      sources: [
        "https://www.yozzo.com/mvno-news/thailand-nbtc-sim-card-registration-kyc-measures/",
        "https://littlebigreddot.com/thailand-tourist-sim-passport-60-day-rule/",
        "https://www.roamiapp.com/blog/thailand-esim-comparison/",
      ],
    },
    coverage: {
      intro:
        "Thailand now has two big networks: AIS, and True (TrueMove H and dtac merged). In Bangkok both are excellent, so pick on price. AIS reaches further outside the cities, which matters more if you head on to the islands or national parks.",
      areas: [
        {
          name: "Sukhumvit, Silom & Siam",
          note: "Excellent on both. AIS is the most consistent; dtac has the fastest 5G downloads.",
        },
        { name: "Old Town & Chinatown", note: "Strong on both networks, like the rest of inner Bangkok." },
        { name: "BTS & MRT", note: "Signal holds in tunnels and basement food courts, with 5G on both networks." },
        { name: "Chatuchak", note: "Excellent on both, even on busy weekend market days." },
        { name: "Ayutthaya & floating markets", note: "Fine on both; AIS has a slight edge outside the city." },
        { name: "The islands", note: "AIS is the safer pick. Expect no data on ferry crossings." },
      ],
      sources: [
        "https://www.roamiapp.com/blog/thailand-esim-comparison/",
        "https://insights.opensignal.com/reports/2026/08/thailand/mobile-network-experience",
        "https://matrix.in/blogs/news/best-esim-for-thailand-in-2026-ais-vs-truemove-vs-dtac-compared",
      ],
    },
    faq: [
      {
        q: "Travel eSIM or Thai tourist SIM?",
        a: "A Thai tourist SIM or eSIM (AIS, dtac) gives you a +66 number and cheap unlimited data, but needs passport registration in person. A travel eSIM installs before you fly, needs no registration, and is data only.",
      },
      {
        q: "Is unlimited really unlimited?",
        a: "Usually not. Airalo and Saily slow to 1 Mbps after 5 GB a day, Maya to 3 Mbps, and Holafly caps hotspot use at 1 GB a day.",
      },
      {
        q: "AIS or True for a Bangkok-only trip?",
        a: "Either works well in Bangkok. AIS is better if you'll also visit small islands, the northern mountains or national parks.",
      },
      {
        q: "When should I install the eSIM?",
        a: "Install it at home on Wi-Fi before you fly. Some plans start counting days at installation, so check the plan's activation rule. Most eSIMs can only be installed once.",
      },
      {
        q: "How much data do I need?",
        a: "Maps and messaging use very little. An hour of Instagram or TikTok uses about 0.5 to 1 GB and HD streaming about 3 GB. Light users manage on 5 GB a week; heavy social or video users want 10 GB or more. Use the estimator above for your trip.",
      },
    ],
  },
  Japan: {
    checked: "October 2026",
    imei: {
      title: "Travel eSIM? No registration needed",
      body: [
        "Japan has no IMEI or handset registration for visitors. Your phone just needs to be unlocked and support eSIM.",
        "Data-only travel eSIMs (Airalo, Saily, Holafly, Mobal data) install by QR code with no Japanese ID check.",
        "Want a Japanese 070/080/090 number? Voice plans like Mobal Voice or Sakura Mobile need passport ID checks. A 2026 law change may extend ID checks to data SIMs too, with no start date yet, so carry your passport.",
      ],
      sources: [
        "https://simology.io/blog/japan-esim-tourists-identity-requirements-app-calling-network-notes-2026",
        "https://selectra.jp/en/sim/best-esim-japan-tourists",
        "https://tokyointernationalmeetup.com/japan-sim-card-id-verification-law-2026-guide/",
      ],
    },
    coverage: {
      intro:
        "Japan has three big networks, Docomo, KDDI (au) and SoftBank, plus newcomer Rakuten. Most travel eSIMs ride on au or SoftBank; Mobal and Sakura Mobile use Docomo. In Tokyo all three are excellent. Docomo pulls ahead underground, in the mountains and in the countryside.",
      areas: [
        {
          name: "Central Tokyo",
          note: "Effectively tied above ground on all three. 5G is strongest in the city centers.",
        },
        { name: "Tokyo subway", note: "Docomo and au are best underground. SoftBank works but is weaker." },
        { name: "Shibuya & Shinjuku crowds", note: "Rush-hour crowds slow every network the same way." },
        { name: "Hakone & Mt Fuji", note: "Docomo and au are the most reliable. SoftBank and Rakuten are patchier." },
        { name: "Nikko", note: "Docomo is the most dependable, au a close second." },
        { name: "Kyoto & Osaka by Shinkansen", note: "Fine on all three, with brief drops in tunnels." },
      ],
      sources: [
        "https://www.sakuramobile.jp/blog/japan-sim/data-roaming-in-japan-choosing-a-network-provider-for-your-next-trip/",
        "https://www.esimpass.com/en/blog/softbank-vs-docomo-japan",
        "https://simology.io/blog/japan-esim-tourists-identity-requirements-app-calling-network-notes-2026",
      ],
    },
    faq: [
      {
        q: "Do I need to register my phone or show a passport?",
        a: "Not for a data-only travel eSIM. A plan with a Japanese phone number needs an ID check. Rules for data SIMs may tighten in 2026, so keep your passport handy.",
      },
      {
        q: "Is unlimited really unlimited?",
        a: "Usually not. Saily and Maya slow down after 5 GB a day, Jetpac and aloSIM after 3 GB, Nomad after 2 GB. Holafly caps hotspot use at 1 GB a day.",
      },
      {
        q: "Which network if I'm leaving Tokyo?",
        a: "For mountains, onsen towns, Nikko or hiking, a Docomo plan (Mobal, Sakura Mobile) or au is safest. For city trips, au or SoftBank plans are fine.",
      },
      {
        q: "Can I tether a laptop?",
        a: "Most providers allow hotspot (Saily, Nomad, Jetpac, GigSky, Yesim, Mobal, Ubigi). Holafly caps it at 1 GB a day.",
      },
      {
        q: "When should I install the eSIM?",
        a: "Install it at home on Wi-Fi before you fly. Some plans start counting days at installation, so check the plan's activation rule. Most eSIMs can only be installed once.",
      },
    ],
  },
  Singapore: {
    checked: "October 2026",
    imei: {
      title: "Check your phone is eSIM-ready and unlocked",
      body: [
        "Travel eSIMs for Singapore are data-only and need no passport registration. Your phone must support eSIM and be carrier-unlocked.",
        "Install the eSIM before you fly, but switch on data roaming for it only after you land.",
      ],
      sources: ["https://travelsimasia.com/blogs/singapore-guides/singapore-esim-prices-2026"],
    },
    coverage: {
      intro:
        "All four networks (Singtel, StarHub, M1, Simba) have strong 4G/5G across the island, so any plan works in normal tourist areas.",
      areas: [
        { name: "Changi Airport & Jewel", note: "Full coverage from arrival." },
        { name: "CBD & Marina Bay", note: "Strong 4G/5G." },
        { name: "MRT network", note: "Coverage continues inside the tunnels." },
        { name: "Sentosa", note: "Covered by all providers." },
        { name: "Orchard & Chinatown", note: "Dense urban coverage; free Wi-Fi in malls is common." },
      ],
      sources: ["https://travelsimasia.com/blogs/singapore-guides/singapore-esim-prices-2026"],
    },
    faq: [
      {
        q: "Do I need to register my passport for a travel eSIM?",
        a: "No. Travel eSIMs for Singapore need no passport registration.",
      },
      {
        q: "Which network is best?",
        a: "Singtel, StarHub and M1 all give island-wide coverage. Airalo uses Singtel/M1, Holafly uses Singtel, Nomad uses Singtel/StarHub, and Ubigi uses StarHub/Simba.",
      },
      {
        q: "Is unlimited worth it?",
        a: "Unlimited plans have daily high-speed caps (fair use). For a typical 5–7 day trip, a 5–10 GB plan for $9–16 is usually enough.",
      },
      {
        q: "Can I pay for the MRT with my phone?",
        a: "Yes. Foreign contactless cards and mobile wallets work at fare gates, though admin fees apply to foreign cards.",
      },
    ],
  },
  "South Korea": {
    checked: "October 2026",
    imei: {
      title: "Do you need to register your phone or ID?",
      body: [
        "A travel eSIM from Airalo, Holafly, Nomad, Saily or Ubigi is set up in the provider's app or by QR code. No ID registration is needed.",
        "Local prepaid SIMs and eSIMs from KT, SKT and LG U+ are usually sold to tourists against a passport, often collected at the airport. Check the seller's terms.",
        "Korea's three carriers are SK Telecom, KT and LG U+. Network matters more than paperwork: SK Telecom is recommended for Jeju, the mountains and rural Gangwon.",
      ],
      sources: [
        "https://travelsimasia.com/blogs/south-korea-guides/south-korea-esim-prices-2026",
        "https://seoultravelpass.com/en/products/1431-esim-kt-4g-lte-unlimited-data-local-esim",
      ],
    },
    coverage: {
      intro:
        "Every major travel eSIM runs on SK Telecom, LG U+ or KT, all with 5G in the cities. Nomad's Korea plans use all three carriers.",
      areas: [
        { name: "Seoul", note: "Dense 5G/LTE on all three carriers, including the subway." },
        { name: "Busan", note: "Named as having strong coverage on Airalo's SK Telecom network." },
        {
          name: "Jeju Island",
          note: "Coverage is good, but SK Telecom is recommended for rural and coastal parts of Jeju.",
        },
        {
          name: "Gangwon (Seoraksan, Gangneung)",
          note: "For mountains and rural Gangwon, pick an SK Telecom-based eSIM.",
        },
        { name: "Gyeongju", note: "A heritage city where LTE/5G is well covered." },
        { name: "Incheon Airport", note: "Install the eSIM before you fly and activate it on landing." },
      ],
      sources: ["https://travelsimasia.com/blogs/south-korea-guides/south-korea-esim-prices-2026"],
    },
    faq: [
      {
        q: "Can I use Google Maps for directions in Korea?",
        a: "Not fully. Google Maps does not give full turn-by-turn navigation in Korea, so travellers use Naver Map or KakaoMap. Both need mobile data and use more of it than Google Maps.",
      },
      {
        q: "How much data do I need for a week?",
        a: "Budget at least 3–5 GB for a one-week trip that relies on maps and translation apps.",
      },
      {
        q: "Which network is best?",
        a: "SK Telecom has the widest rural reach. For a city-only trip, LG U+ and KT are fine.",
      },
      {
        q: "Unlimited or fixed data?",
        a: "Unlimited 7-day plans cost about $25–$29 against $9–$12 for 3–10 GB fixed plans. Fixed plans are better value unless you stream or hotspot heavily. Unlimited plans usually have daily high-speed caps.",
      },
    ],
  },
  Vietnam: {
    checked: "October 2026",
    imei: {
      title: "Registration and ID",
      body: [
        "Travel eSIMs are roaming profiles and need no Vietnamese ID registration. Most must be activated within a set window after purchase.",
        "Local Viettel, Vinaphone and Mobifone SIMs must be registered to the buyer's passport at the point of sale; airport kiosks do this for you.",
        "Viettel has the widest rural reach. Vinaphone covers the cities and the main tourist route.",
      ],
      sources: ["https://travelsimasia.com/blogs/vietnam-guides/vietnam-esim-prices-2026"],
    },
    coverage: {
      intro:
        "Most travel eSIMs, including Airalo, Holafly and Ubigi, run on Vinaphone, which is strong on the main tourist route. Viettel reaches further into rural areas.",
      areas: [
        { name: "Hanoi", note: "Strong coverage on every network." },
        { name: "Ha Long Bay", note: "On the main tourist route and covered by Vinaphone." },
        { name: "Hue / Da Nang / Hoi An", note: "Central coast tourist route with good city coverage." },
        { name: "Ho Chi Minh City", note: "Strong coverage on every network." },
        { name: "Phu Quoc", note: "Named on the tourist route." },
        {
          name: "Ha Giang / Sapa / Mekong Delta",
          note: "Rural. Airalo (Vinaphone only) does not cover these well, so choose a Viettel-capable eSIM.",
        },
      ],
      sources: ["https://travelsimasia.com/blogs/vietnam-guides/vietnam-esim-prices-2026"],
    },
    faq: [
      {
        q: "Which eSIM for the Ha Giang Loop or Sapa?",
        a: "Choose one that includes Viettel, which has the widest rural reach. Vinaphone-only plans are weaker there.",
      },
      {
        q: "Do I need unlimited data?",
        a: "Usually not. 5 GB for 30 days costs about $9.50–$11. Unlimited plans start around $24–$27.50 per week and have daily caps.",
      },
      {
        q: "Do Grab and Google Maps work in Vietnam?",
        a: "Yes, and both need mobile data. Install your eSIM before you fly.",
      },
      {
        q: "When should I activate it?",
        a: "Most plans must be activated within a set window after purchase, so buy it shortly before your trip and activate it on landing.",
      },
    ],
  },
  Malaysia: {
    checked: "October 2026",
    imei: {
      title: "New SIM registration rules (2026)",
      body: [
        "Since February 2026, a Malaysian prepaid SIM from Maxis, CelcomDigi or U Mobile must be registered in person with your passport and visa.",
        "Tourist lines are cut off after three months.",
        "These rules do not apply to a roaming travel eSIM, which is not a local SIM and is installed by QR code or app.",
      ],
      sources: ["https://travelsimasia.com/blogs/malaysia-guides/malaysia-esim-prices-2026"],
    },
    coverage: {
      intro: "Every listed network works well in Peninsular cities. For Sabah and Sarawak, pick a Maxis-based eSIM.",
      areas: [
        { name: "Kuala Lumpur", note: "Every listed network works well." },
        { name: "Penang", note: "Every listed network works well. You can set up at Penang airport." },
        { name: "Melaka", note: "Every listed network works well." },
        { name: "Peninsular Malaysia (general)", note: "CelcomDigi is strong across the peninsula." },
        { name: "Sabah (Kota Kinabalu)", note: "Maxis has the reach in East Malaysia. Choose Airalo, Nomad or Ubigi." },
        {
          name: "Sarawak (Kuching)",
          note: "Maxis is recommended. Saily's coverage there is uncertain because it does not name its network.",
        },
      ],
      sources: ["https://travelsimasia.com/blogs/malaysia-guides/malaysia-esim-prices-2026"],
    },
    faq: [
      {
        q: "Do I need to show my passport for an eSIM?",
        a: "Not for a travel eSIM. Only local prepaid SIMs need in-person registration with passport and visa (since February 2026).",
      },
      {
        q: "Which eSIM for Borneo?",
        a: "Choose a Maxis-based eSIM such as Airalo, Nomad or Ubigi. Holafly runs on CelcomDigi.",
      },
      { q: "Cheapest option for a week?", a: "1GB/7 days costs from $3.99 (Saily). 3GB/15 days from Ubigi costs $6." },
      {
        q: "Is unlimited worth it?",
        a: "Ubigi's 7-day unlimited is $19 and Holafly's is $27.50. Unlimited plans often have daily fair-use caps.",
      },
    ],
  },
};
