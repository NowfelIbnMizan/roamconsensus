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
};
