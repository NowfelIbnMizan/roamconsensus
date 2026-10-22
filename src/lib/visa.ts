export type VisaStatus = "VISA_FREE" | "VISA_ON_ARRIVAL" | "E_VISA" | "VISA_REQUIRED" | "HOME";

export type VisaRule = { status: VisaStatus; days: number | null; note?: string };

/** Entry rules for one destination country, keyed by passport. */
export type CountryVisa = {
  checked: string;
  /** What every visitor needs, whatever their passport. */
  common: string[];
  sources: string[];
  passports: Record<string, VisaRule>;
};

export const PASSPORTS = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "New Zealand",
  "Germany",
  "Ireland",
  "India",
  "Bangladesh",
  "Pakistan",
  "Philippines",
  "Malaysia",
  "Indonesia",
  "China",
  "Japan",
  "South Korea",
  "Singapore",
  "United Arab Emirates",
  "Saudi Arabia",
  "Nigeria",
  "Brazil",
  "Mexico",
  "South Africa",
] as const;

export const visaStatusLabel: Record<VisaStatus, string> = {
  VISA_FREE: "No visa needed",
  VISA_ON_ARRIVAL: "Visa on arrival",
  E_VISA: "Apply online first",
  VISA_REQUIRED: "Visa needed",
  HOME: "Your own country",
};

/** Keyed by destination country, as stored on Destination.country. */
export const visaRules: Record<string, CountryVisa> = {
  Indonesia: {
    checked: "October 2026",
    common: [
      "All Indonesia arrival card (allindonesia.imigrasi.go.id): one free online form with a QR code that replaces the old immigration, customs (e-CD) and health forms. Submit it within about 72 hours before arrival.",
      "Bali Tourist Levy IDR 150,000 per person per visit, paid at lovebali.baliprov.go.id (QR code checked on arrival)",
      "Passport valid at least 6 months from arrival, with blank pages",
      "Return or onward ticket required; officers may ask for proof of accommodation or funds",
      "e-VOA / VoA: IDR 500,000, 30 days, extendable once for 30 more days (60 days total). Apply online at evisa.imigrasi.go.id at least 48 hours before travel.",
    ],
    sources: [
      "https://evisa.imigrasi.go.id",
      "https://www.legit.ng/people/1719473-indonesia-officially-names-9-african-countries-eligible-electronic-visa-arrival-2026/",
      "https://www.letsmoveindonesia.com/updated-list-of-countries-for-indonesia-visa-on-arrival-voa-2026/",
      "https://en.wikipedia.org/wiki/Visa_policy_of_Indonesia",
      "https://blog.orbitremit.com/indonesia-travel-guide-2026/",
      "https://lovebali.baliprov.go.id",
    ],
    passports: {
      "United States": {
        status: "VISA_ON_ARRIVAL",
        days: 30,
        note: "e-VOA or VoA IDR 500,000; extendable once to 60 days.",
      },
      "United Kingdom": {
        status: "VISA_ON_ARRIVAL",
        days: 30,
        note: "e-VOA or VoA IDR 500,000; extendable once.",
      },
      Canada: {
        status: "VISA_ON_ARRIVAL",
        days: 30,
        note: "e-VOA or VoA IDR 500,000; extendable once.",
      },
      Australia: {
        status: "VISA_ON_ARRIVAL",
        days: 30,
        note: "e-VOA or VoA IDR 500,000; extendable once.",
      },
      "New Zealand": {
        status: "VISA_ON_ARRIVAL",
        days: 30,
        note: "e-VOA or VoA IDR 500,000; extendable once.",
      },
      Germany: {
        status: "VISA_ON_ARRIVAL",
        days: 30,
        note: "e-VOA or VoA IDR 500,000; extendable once.",
      },
      Ireland: {
        status: "VISA_ON_ARRIVAL",
        days: 30,
        note: "e-VOA or VoA IDR 500,000; extendable once.",
      },
      India: {
        status: "VISA_ON_ARRIVAL",
        days: 30,
        note: "e-VOA or VoA IDR 500,000; extendable once.",
      },
      Bangladesh: {
        status: "E_VISA",
        days: null,
        note: "Not on the visa-on-arrival list. Apply for a tourist e-visa (C1) at evisa.imigrasi.go.id.",
      },
      Pakistan: {
        status: "E_VISA",
        days: null,
        note: "Not on the visa-on-arrival list. Apply for a tourist e-visa (C1) at evisa.imigrasi.go.id.",
      },
      Philippines: {
        status: "VISA_FREE",
        days: 30,
        note: "ASEAN visa-free entry, 30 days. Check whether it can be extended before you rely on it.",
      },
      Malaysia: {
        status: "VISA_FREE",
        days: 30,
        note: "ASEAN visa-free entry, 30 days. Check whether it can be extended before you rely on it.",
      },
      Indonesia: {
        status: "HOME",
        days: null,
      },
      China: {
        status: "VISA_ON_ARRIVAL",
        days: 30,
        note: "e-VOA or VoA IDR 500,000; extendable once.",
      },
      Japan: {
        status: "VISA_ON_ARRIVAL",
        days: 30,
        note: "e-VOA or VoA IDR 500,000; extendable once.",
      },
      "South Korea": {
        status: "VISA_ON_ARRIVAL",
        days: 30,
        note: "e-VOA or VoA IDR 500,000; extendable once.",
      },
      Singapore: {
        status: "VISA_FREE",
        days: 30,
        note: "ASEAN visa-free entry, 30 days. Check whether it can be extended before you rely on it.",
      },
      "United Arab Emirates": {
        status: "VISA_ON_ARRIVAL",
        days: 30,
        note: "e-VOA or VoA IDR 500,000; extendable once.",
      },
      "Saudi Arabia": {
        status: "VISA_ON_ARRIVAL",
        days: 30,
        note: "e-VOA or VoA IDR 500,000; extendable once.",
      },
      Nigeria: {
        status: "VISA_REQUIRED",
        days: null,
        note: "Not eligible for e-VOA. A sponsored 'calling visa' is needed; check with an Indonesian embassy.",
      },
      Brazil: {
        status: "VISA_FREE",
        days: 30,
        note: "Visa-free entry restored 3 July 2025, 30 days.",
      },
      Mexico: {
        status: "VISA_ON_ARRIVAL",
        days: 30,
        note: "e-VOA or VoA IDR 500,000; extendable once.",
      },
      "South Africa": {
        status: "VISA_ON_ARRIVAL",
        days: 30,
        note: "On the 2026 list of African countries eligible for e-VOA; IDR 500,000.",
      },
    },
  },
  Thailand: {
    checked: "October 2026",
    common: [
      "TDAC (Thailand Digital Arrival Card): free at tdac.immigration.go.th, submit within 3 days before arrival; mandatory since 1 May 2025.",
      "Passport valid at least 6 months",
      "Onward or return ticket within the permitted stay; may be asked for funds (about THB 20,000 per person, checked at random)",
      "Since 15 Sep 2026: the 60-day exemption is repealed and 60 countries or territories get 30 days, for tourism only.",
      "30-day-exemption travellers entering by land are limited to 2 entries per calendar year (Malaysia, Brunei, Indonesia and Singapore are exempt from this limit).",
    ],
    sources: [
      "https://www.tatnews.org/2026/09/thailand-introduces-new-30-day-and-15-day-visa-exemption-rules-from-15-september/",
      "https://ratchakitcha.soc.go.th/documents/128703.pdf",
      "https://ratchakitcha.soc.go.th/documents/128702.pdf",
      "https://ratchakitcha.soc.go.th/documents/128704.pdf",
      "https://image.mfa.go.th/mfa/0/zE6021nSnu/0303/Bilat_Ordinary.pdf",
      "https://www.thaievisa.go.th",
      "https://tdac.immigration.go.th",
      "https://www.envoyglobal.com/news-alert/thailand-reduces-visa-exempt-stay-periods-starting-september-2026/",
      "https://dtvthaivisa.com/blog/thailand-visa-exemption-30-days-15-september-2026",
    ],
    passports: {
      "United States": {
        status: "VISA_FREE",
        days: 30,
        note: "On the 30-day list since 15 Sep 2026 (was 60).",
      },
      "United Kingdom": {
        status: "VISA_FREE",
        days: 30,
        note: "On the 30-day list since 15 Sep 2026.",
      },
      Canada: {
        status: "VISA_FREE",
        days: 30,
        note: "On the 30-day list since 15 Sep 2026.",
      },
      Australia: {
        status: "VISA_FREE",
        days: 30,
        note: "On the 30-day list since 15 Sep 2026.",
      },
      "New Zealand": {
        status: "VISA_FREE",
        days: 30,
        note: "On the 30-day list since 15 Sep 2026.",
      },
      Germany: {
        status: "VISA_FREE",
        days: 30,
        note: "On the 30-day list since 15 Sep 2026.",
      },
      Ireland: {
        status: "VISA_FREE",
        days: 30,
        note: "On the 30-day list since 15 Sep 2026.",
      },
      India: {
        status: "VISA_FREE",
        days: 30,
        note: "On the 30-day list since 15 Sep 2026.",
      },
      Bangladesh: {
        status: "E_VISA",
        days: null,
        note: "Not on any exemption list; Thai e-Visa (thaievisa.go.th) needed. A tourist visa usually allows 60 days.",
      },
      Pakistan: {
        status: "E_VISA",
        days: null,
        note: "Not on any exemption list; Thai e-Visa needed.",
      },
      Philippines: {
        status: "VISA_FREE",
        days: 30,
        note: "On the 30-day list since 15 Sep 2026.",
      },
      Malaysia: {
        status: "VISA_FREE",
        days: 30,
        note: "30-day list; exempt from the land-border entry limit.",
      },
      Indonesia: {
        status: "VISA_FREE",
        days: 30,
        note: "30-day list; exempt from the land-border entry limit.",
      },
      China: {
        status: "VISA_FREE",
        days: 30,
        note: "Bilateral mutual visa exemption, 30 days (practical change from 60 to 30).",
      },
      Japan: {
        status: "VISA_FREE",
        days: 30,
        note: "On the 30-day list since 15 Sep 2026.",
      },
      "South Korea": {
        status: "VISA_FREE",
        days: 90,
        note: "Bilateral agreement, 90 days, unchanged.",
      },
      Singapore: {
        status: "VISA_FREE",
        days: 30,
        note: "30-day list; exempt from the land-border entry limit.",
      },
      "United Arab Emirates": {
        status: "VISA_FREE",
        days: 30,
        note: "On the 30-day list since 15 Sep 2026.",
      },
      "Saudi Arabia": {
        status: "VISA_FREE",
        days: 30,
        note: "On the 30-day list since 15 Sep 2026.",
      },
      Nigeria: {
        status: "E_VISA",
        days: null,
        note: "Not on any exemption list; Thai e-Visa needed.",
      },
      Brazil: {
        status: "VISA_FREE",
        days: 90,
        note: "Bilateral agreement, 90 days, unchanged.",
      },
      Mexico: {
        status: "E_VISA",
        days: null,
        note: "Not on the 30-day exemption list from 15 Sep 2026, so apply for a Thai e-Visa. Confirm with a Thai embassy.",
      },
      "South Africa": {
        status: "VISA_FREE",
        days: 30,
        note: "On the 30-day list since 15 Sep 2026.",
      },
    },
  },
  Japan: {
    checked: "October 2026",
    common: [
      "Visit Japan Web (vjw-lp.digital.go.jp) for immigration and customs QR codes; paper forms still accepted",
      "Passport valid for the whole stay (MOFA states no 6-month rule); some nationalities need an ICAO ePassport",
      "Return or onward ticket and proof of funds may be requested",
      "International Tourist Tax JPY 1,000 on departure, already in the ticket price.",
      "JESTA (Japan's planned electronic travel authorisation) is not yet in force.",
    ],
    sources: [
      "https://www.mofa.go.jp/j_info/visit/visa/short/novisa.html",
      "https://www.mofa.go.jp/j_info/visit/visa/visaonline.html",
      "https://www.evisa.mofa.go.jp",
    ],
    passports: {
      "United States": {
        status: "VISA_FREE",
        days: 90,
        note: "Visa exemption, 90 days.",
      },
      "United Kingdom": {
        status: "VISA_FREE",
        days: 90,
        note: "90 days; can extend in Japan up to 6 months.",
      },
      Canada: {
        status: "VISA_FREE",
        days: 90,
        note: "Visa exemption, 90 days.",
      },
      Australia: {
        status: "VISA_FREE",
        days: 90,
        note: "Visa exemption, 90 days.",
      },
      "New Zealand": {
        status: "VISA_FREE",
        days: 90,
        note: "Visa exemption, 90 days.",
      },
      Germany: {
        status: "VISA_FREE",
        days: 90,
        note: "90 days; can extend in Japan up to 6 months.",
      },
      Ireland: {
        status: "VISA_FREE",
        days: 90,
        note: "90 days; can extend in Japan up to 6 months.",
      },
      India: {
        status: "E_VISA",
        days: 90,
        note: "JAPAN eVISA through an accredited agency (for residents of India); single-entry tourist visa, normally up to 90 days.",
      },
      Bangladesh: {
        status: "VISA_REQUIRED",
        days: null,
        note: "Not eligible for eVISA; apply at a Japanese embassy.",
      },
      Pakistan: {
        status: "VISA_REQUIRED",
        days: null,
        note: "Not eligible for eVISA; apply at a Japanese embassy.",
      },
      Philippines: {
        status: "VISA_REQUIRED",
        days: null,
        note: "Embassy visa through an accredited agency; eVISA only for designated package tours (15 days).",
      },
      Malaysia: {
        status: "VISA_FREE",
        days: 90,
        note: "90 days, ICAO ePassport only.",
      },
      Indonesia: {
        status: "VISA_FREE",
        days: 15,
        note: "15 days only with an ePassport pre-registered at a Japanese mission (valid 3 years); otherwise a visa is needed.",
      },
      China: {
        status: "E_VISA",
        days: 30,
        note: "eVISA for residents of China through an accredited agency, 15 or 30 days.",
      },
      Japan: {
        status: "HOME",
        days: null,
      },
      "South Korea": {
        status: "VISA_FREE",
        days: 90,
        note: "Visa exemption, 90 days.",
      },
      Singapore: {
        status: "VISA_FREE",
        days: 90,
        note: "Visa exemption, 90 days.",
      },
      "United Arab Emirates": {
        status: "VISA_FREE",
        days: 90,
        note: "90 days, ICAO ePassport only.",
      },
      "Saudi Arabia": {
        status: "E_VISA",
        days: 90,
        note: "JAPAN eVISA, apply online directly.",
      },
      Nigeria: {
        status: "VISA_REQUIRED",
        days: null,
        note: "Not eligible for eVISA; apply at a Japanese embassy.",
      },
      Brazil: {
        status: "VISA_FREE",
        days: 90,
        note: "Visa-free, 90 days, ePassport only. This began as a trial, so check it is still running.",
      },
      Mexico: {
        status: "VISA_FREE",
        days: 90,
        note: "90 days; can extend up to 6 months.",
      },
      "South Africa": {
        status: "E_VISA",
        days: 90,
        note: "JAPAN eVISA, apply online directly.",
      },
    },
  },
  Singapore: {
    checked: "October 2026",
    common: [
      "SG Arrival Card: free online at ICA or the MyICA app, within 3 days before arrival. It is not a visa; beware of paid look-alike sites.",
      "Passport valid at least 6 months",
      "Onward or return ticket, enough funds, and a yellow fever certificate if arriving from affected countries",
      "Length of stay is set by the Visit Pass (e-Pass) issued at the checkpoint, usually 30 days, 90 days for some nationalities",
    ],
    sources: [
      "https://www.ica.gov.sg/enter-transit-depart/entering-singapore/visa_requirements",
      "https://www.ica.gov.sg/enter-transit-depart/entering-singapore/sg-arrival-card",
      "https://www.ica.gov.sg/enter-transit-depart/entering-singapore/visa_requirements/visa-detail-page/india",
      "https://www.lonelyplanet.com/articles/visa-requirements-for-singapore",
    ],
    passports: {
      "United States": {
        status: "VISA_FREE",
        days: 90,
        note: "Visa-free; up to 90 days.",
      },
      "United Kingdom": {
        status: "VISA_FREE",
        days: 90,
        note: "Visa-free, up to 90 days.",
      },
      Canada: {
        status: "VISA_FREE",
        days: null,
        note: "Visa-free. Your length of stay is stamped on arrival.",
      },
      Australia: {
        status: "VISA_FREE",
        days: 90,
        note: "Visa-free; up to 90 days.",
      },
      "New Zealand": {
        status: "VISA_FREE",
        days: 90,
        note: "Visa-free; up to 90 days.",
      },
      Germany: {
        status: "VISA_FREE",
        days: 90,
        note: "EU nationals up to 90 days.",
      },
      Ireland: {
        status: "VISA_FREE",
        days: 90,
        note: "EU nationals up to 90 days.",
      },
      India: {
        status: "VISA_REQUIRED",
        days: 30,
        note: "Visa required; e-Visa through an ICA-authorised agent. Stay is set on arrival, typically 30 days.",
      },
      Bangladesh: {
        status: "VISA_REQUIRED",
        days: null,
        note: "Visa required. Apply for an e-Visa through an ICA-authorised agent or a local contact.",
      },
      Pakistan: {
        status: "VISA_REQUIRED",
        days: null,
        note: "Visa required. Apply for an e-Visa through an ICA-authorised agent or a local contact.",
      },
      Philippines: {
        status: "VISA_FREE",
        days: 30,
        note: "Visa-free, 30 days.",
      },
      Malaysia: {
        status: "VISA_FREE",
        days: 30,
        note: "Visa-free, typically 30 days.",
      },
      Indonesia: {
        status: "VISA_FREE",
        days: 30,
        note: "Visa-free, 30 days.",
      },
      China: {
        status: "VISA_FREE",
        days: 30,
        note: "Mutual 30-day visa exemption since 9 Feb 2024.",
      },
      Japan: {
        status: "VISA_FREE",
        days: 90,
        note: "Visa-free, up to 90 days.",
      },
      "South Korea": {
        status: "VISA_FREE",
        days: 90,
        note: "Visa-free; up to 90 days.",
      },
      Singapore: {
        status: "HOME",
        days: null,
      },
      "United Arab Emirates": {
        status: "VISA_FREE",
        days: null,
        note: "Visa-free. Your length of stay is stamped on arrival.",
      },
      "Saudi Arabia": {
        status: "VISA_FREE",
        days: null,
        note: "Visa-free. Your length of stay is stamped on arrival.",
      },
      Nigeria: {
        status: "VISA_REQUIRED",
        days: null,
        note: "Visa required. Apply for an e-Visa through an ICA-authorised agent or a local contact.",
      },
      Brazil: {
        status: "VISA_FREE",
        days: null,
        note: "Visa-free. Your length of stay is stamped on arrival.",
      },
      Mexico: {
        status: "VISA_FREE",
        days: null,
        note: "Visa-free. Your length of stay is stamped on arrival.",
      },
      "South Africa": {
        status: "VISA_FREE",
        days: null,
        note: "Visa-free. Your length of stay is stamped on arrival.",
      },
    },
  },
  "South Korea": {
    checked: "October 2026",
    common: [
      "K-ETA (k-eta.go.kr) for visa-free nationals: about KRW 10,000, valid 3 years, apply at least 72 hours before boarding. 22 countries are exempt until 31 Dec 2026.",
      "Korea e-Arrival Card (e-arrivalcard.go.kr), free, within 3 days before arrival. Travellers with an approved K-ETA are exempt; K-ETA-exempt travellers must file it.",
      "Passport valid for the stay; 6 months recommended",
      "Onward or return ticket may be requested",
    ],
    sources: [
      "https://www.k-eta.go.kr",
      "https://www.e-arrivalcard.go.kr",
      "https://www.hikorea.go.kr",
      "https://www.fragomen.com/insights/south-korea-visit-korea-year-temporarily-exempts-22-countries-from-k-eta.html",
      "https://loyaltylobby.com/2026/01/02/south-korea-extends-k-eta-waiver-through-december-2026-for-select-nationals-of-22-countries/",
    ],
    passports: {
      "United States": {
        status: "VISA_FREE",
        days: 90,
        note: "K-ETA exempt until 31 Dec 2026; e-Arrival Card required.",
      },
      "United Kingdom": {
        status: "VISA_FREE",
        days: 90,
        note: "K-ETA exempt until 31 Dec 2026.",
      },
      Canada: {
        status: "VISA_FREE",
        days: 180,
        note: "6 months visa-free; K-ETA exempt until 31 Dec 2026.",
      },
      Australia: {
        status: "VISA_FREE",
        days: 90,
        note: "K-ETA exempt until 31 Dec 2026.",
      },
      "New Zealand": {
        status: "VISA_FREE",
        days: 90,
        note: "K-ETA exempt until 31 Dec 2026.",
      },
      Germany: {
        status: "VISA_FREE",
        days: 90,
        note: "K-ETA exempt until 31 Dec 2026.",
      },
      Ireland: {
        status: "VISA_FREE",
        days: 90,
        note: "Visa-free, but you need a K-ETA before you fly. Check k-eta.go.kr: Ireland may be on the exemption list.",
      },
      India: {
        status: "VISA_REQUIRED",
        days: null,
        note: "Visa required (C-3-9).",
      },
      Bangladesh: {
        status: "VISA_REQUIRED",
        days: null,
        note: "Visa required.",
      },
      Pakistan: {
        status: "VISA_REQUIRED",
        days: null,
        note: "Visa required.",
      },
      Philippines: {
        status: "VISA_REQUIRED",
        days: null,
        note: "Visa required (Jeju-only visa-free entry exists).",
      },
      Malaysia: {
        status: "VISA_FREE",
        days: 90,
        note: "K-ETA required.",
      },
      Indonesia: {
        status: "VISA_REQUIRED",
        days: null,
        note: "Visa required (Jeju-only visa-free entry exists).",
      },
      China: {
        status: "VISA_REQUIRED",
        days: null,
        note: "Visa required for Seoul. Jeju Island is visa-free for 30 days.",
      },
      Japan: {
        status: "VISA_FREE",
        days: 90,
        note: "K-ETA exempt until 31 Dec 2026.",
      },
      "South Korea": {
        status: "HOME",
        days: null,
      },
      Singapore: {
        status: "VISA_FREE",
        days: 90,
        note: "K-ETA exempt until 31 Dec 2026.",
      },
      "United Arab Emirates": {
        status: "VISA_FREE",
        days: null,
        note: "Visa-free with a K-ETA approved before you fly. Check your allowed stay on k-eta.go.kr.",
      },
      "Saudi Arabia": {
        status: "VISA_FREE",
        days: 30,
        note: "K-ETA required.",
      },
      Nigeria: {
        status: "VISA_REQUIRED",
        days: null,
        note: "Visa required.",
      },
      Brazil: {
        status: "VISA_FREE",
        days: 90,
        note: "K-ETA required.",
      },
      Mexico: {
        status: "VISA_FREE",
        days: 90,
        note: "K-ETA required.",
      },
      "South Africa": {
        status: "VISA_FREE",
        days: 30,
        note: "K-ETA required.",
      },
    },
  },
};
