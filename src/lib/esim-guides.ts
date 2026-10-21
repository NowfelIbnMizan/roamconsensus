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
};
