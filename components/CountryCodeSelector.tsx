"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface Country {
  code: string;
  country: string;
  flag: string;
  name: string;
}

export const countries: Country[] = [
  { code: "+1", country: "US", flag: "🇺🇸", name: "United States" },
  { code: "+1", country: "CA", flag: "🇨🇦", name: "Canada" },
  { code: "+20", country: "EG", flag: "🇪🇬", name: "Egypt" },
  { code: "+27", country: "ZA", flag: "🇿🇦", name: "South Africa" },
  { code: "+30", country: "GR", flag: "🇬🇷", name: "Greece" },
  { code: "+31", country: "NL", flag: "🇳🇱", name: "Netherlands" },
  { code: "+32", country: "BE", flag: "🇧🇪", name: "Belgium" },
  { code: "+33", country: "FR", flag: "🇫🇷", name: "France" },
  { code: "+34", country: "ES", flag: "🇪🇸", name: "Spain" },
  { code: "+36", country: "HU", flag: "🇭🇺", name: "Hungary" },
  { code: "+39", country: "IT", flag: "🇮🇹", name: "Italy" },
  { code: "+40", country: "RO", flag: "🇷🇴", name: "Romania" },
  { code: "+41", country: "CH", flag: "🇨🇭", name: "Switzerland" },
  { code: "+43", country: "AT", flag: "🇦🇹", name: "Austria" },
  { code: "+44", country: "GB", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+45", country: "DK", flag: "🇩🇰", name: "Denmark" },
  { code: "+46", country: "SE", flag: "🇸🇪", name: "Sweden" },
  { code: "+47", country: "NO", flag: "🇳🇴", name: "Norway" },
  { code: "+48", country: "PL", flag: "🇵🇱", name: "Poland" },
  { code: "+49", country: "DE", flag: "🇩🇪", name: "Germany" },
  { code: "+51", country: "PE", flag: "🇵🇪", name: "Peru" },
  { code: "+52", country: "MX", flag: "🇲🇽", name: "Mexico" },
  { code: "+53", country: "CU", flag: "🇨🇺", name: "Cuba" },
  { code: "+54", country: "AR", flag: "🇦🇷", name: "Argentina" },
  { code: "+55", country: "BR", flag: "🇧🇷", name: "Brazil" },
  { code: "+56", country: "CL", flag: "🇨🇱", name: "Chile" },
  { code: "+57", country: "CO", flag: "🇨🇴", name: "Colombia" },
  { code: "+58", country: "VE", flag: "🇻🇪", name: "Venezuela" },
  { code: "+60", country: "MY", flag: "🇲🇾", name: "Malaysia" },
  { code: "+61", country: "AU", flag: "🇦🇺", name: "Australia" },
  { code: "+62", country: "ID", flag: "🇮🇩", name: "Indonesia" },
  { code: "+63", country: "PH", flag: "🇵🇭", name: "Philippines" },
  { code: "+64", country: "NZ", flag: "🇳🇿", name: "New Zealand" },
  { code: "+65", country: "SG", flag: "🇸🇬", name: "Singapore" },
  { code: "+66", country: "TH", flag: "🇹🇭", name: "Thailand" },
  { code: "+81", country: "JP", flag: "🇯🇵", name: "Japan" },
  { code: "+82", country: "KR", flag: "🇰🇷", name: "South Korea" },
  { code: "+84", country: "VN", flag: "🇻🇳", name: "Vietnam" },
  { code: "+86", country: "CN", flag: "🇨🇳", name: "China" },
  { code: "+90", country: "TR", flag: "🇹🇷", name: "Turkey" },
  { code: "+91", country: "IN", flag: "🇮🇳", name: "India" },
  { code: "+92", country: "PK", flag: "🇵🇰", name: "Pakistan" },
  { code: "+93", country: "AF", flag: "🇦🇫", name: "Afghanistan" },
  { code: "+94", country: "LK", flag: "🇱🇰", name: "Sri Lanka" },
  { code: "+95", country: "MM", flag: "🇲🇲", name: "Myanmar" },
  { code: "+98", country: "IR", flag: "🇮🇷", name: "Iran" },
  { code: "+212", country: "MA", flag: "🇲🇦", name: "Morocco" },
  { code: "+213", country: "DZ", flag: "🇩🇿", name: "Algeria" },
  { code: "+216", country: "TN", flag: "🇹🇳", name: "Tunisia" },
  { code: "+218", country: "LY", flag: "🇱🇾", name: "Libya" },
  { code: "+220", country: "GM", flag: "🇬🇲", name: "Gambia" },
  { code: "+221", country: "SN", flag: "🇸🇳", name: "Senegal" },
  { code: "+222", country: "MR", flag: "🇲🇷", name: "Mauritania" },
  { code: "+223", country: "ML", flag: "🇲🇱", name: "Mali" },
  { code: "+224", country: "GN", flag: "🇬🇳", name: "Guinea" },
  { code: "+225", country: "CI", flag: "🇨🇮", name: "Ivory Coast" },
  { code: "+226", country: "BF", flag: "🇧🇫", name: "Burkina Faso" },
  { code: "+227", country: "NE", flag: "🇳🇪", name: "Niger" },
  { code: "+228", country: "TG", flag: "🇹🇬", name: "Togo" },
  { code: "+229", country: "BJ", flag: "🇧🇯", name: "Benin" },
  { code: "+230", country: "MU", flag: "🇲🇺", name: "Mauritius" },
  { code: "+231", country: "LR", flag: "🇱🇷", name: "Liberia" },
  { code: "+232", country: "SL", flag: "🇸🇱", name: "Sierra Leone" },
  { code: "+233", country: "GH", flag: "🇬🇭", name: "Ghana" },
  { code: "+234", country: "NG", flag: "🇳🇬", name: "Nigeria" },
  { code: "+235", country: "TD", flag: "🇹🇩", name: "Chad" },
  { code: "+236", country: "CF", flag: "🇨🇫", name: "Central African Republic" },
  { code: "+237", country: "CM", flag: "🇨🇲", name: "Cameroon" },
  { code: "+238", country: "CV", flag: "🇨🇻", name: "Cape Verde" },
  { code: "+239", country: "ST", flag: "🇸🇹", name: "São Tomé and Príncipe" },
  { code: "+240", country: "GQ", flag: "🇬🇶", name: "Equatorial Guinea" },
  { code: "+241", country: "GA", flag: "🇬🇦", name: "Gabon" },
  { code: "+242", country: "CG", flag: "🇨🇬", name: "Republic of the Congo" },
  { code: "+243", country: "CD", flag: "🇨🇩", name: "DR Congo" },
  { code: "+244", country: "AO", flag: "🇦🇴", name: "Angola" },
  { code: "+245", country: "GW", flag: "🇬🇼", name: "Guinea-Bissau" },
  { code: "+246", country: "IO", flag: "🇮🇴", name: "British Indian Ocean Territory" },
  { code: "+248", country: "SC", flag: "🇸🇨", name: "Seychelles" },
  { code: "+249", country: "SD", flag: "🇸🇩", name: "Sudan" },
  { code: "+250", country: "RW", flag: "🇷🇼", name: "Rwanda" },
  { code: "+251", country: "ET", flag: "🇪🇹", name: "Ethiopia" },
  { code: "+252", country: "SO", flag: "🇸🇴", name: "Somalia" },
  { code: "+253", country: "DJ", flag: "🇩🇯", name: "Djibouti" },
  { code: "+254", country: "KE", flag: "🇰🇪", name: "Kenya" },
  { code: "+255", country: "TZ", flag: "🇹🇿", name: "Tanzania" },
  { code: "+256", country: "UG", flag: "🇺🇬", name: "Uganda" },
  { code: "+257", country: "BI", flag: "🇧🇮", name: "Burundi" },
  { code: "+258", country: "MZ", flag: "🇲🇿", name: "Mozambique" },
  { code: "+260", country: "ZM", flag: "🇿🇲", name: "Zambia" },
  { code: "+261", country: "MG", flag: "🇲🇬", name: "Madagascar" },
  { code: "+262", country: "RE", flag: "🇷🇪", name: "Réunion" },
  { code: "+263", country: "ZW", flag: "🇿🇼", name: "Zimbabwe" },
  { code: "+264", country: "NA", flag: "🇳🇦", name: "Namibia" },
  { code: "+265", country: "MW", flag: "🇲🇼", name: "Malawi" },
  { code: "+266", country: "LS", flag: "🇱🇸", name: "Lesotho" },
  { code: "+267", country: "BW", flag: "🇧🇼", name: "Botswana" },
  { code: "+268", country: "SZ", flag: "🇸🇿", name: "Eswatini" },
  { code: "+269", country: "KM", flag: "🇰🇲", name: "Comoros" },
  { code: "+290", country: "SH", flag: "🇸🇭", name: "Saint Helena" },
  { code: "+291", country: "ER", flag: "🇪🇷", name: "Eritrea" },
  { code: "+297", country: "AW", flag: "🇦🇼", name: "Aruba" },
  { code: "+298", country: "FO", flag: "🇫🇴", name: "Faroe Islands" },
  { code: "+299", country: "GL", flag: "🇬🇱", name: "Greenland" },
  { code: "+350", country: "GI", flag: "🇬🇮", name: "Gibraltar" },
  { code: "+351", country: "PT", flag: "🇵🇹", name: "Portugal" },
  { code: "+352", country: "LU", flag: "🇱🇺", name: "Luxembourg" },
  { code: "+353", country: "IE", flag: "🇮🇪", name: "Ireland" },
  { code: "+354", country: "IS", flag: "🇮🇸", name: "Iceland" },
  { code: "+355", country: "AL", flag: "🇦🇱", name: "Albania" },
  { code: "+356", country: "MT", flag: "🇲🇹", name: "Malta" },
  { code: "+357", country: "CY", flag: "🇨🇾", name: "Cyprus" },
  { code: "+358", country: "FI", flag: "🇫🇮", name: "Finland" },
  { code: "+359", country: "BG", flag: "🇧🇬", name: "Bulgaria" },
  { code: "+370", country: "LT", flag: "🇱🇹", name: "Lithuania" },
  { code: "+371", country: "LV", flag: "🇱🇻", name: "Latvia" },
  { code: "+372", country: "EE", flag: "🇪🇪", name: "Estonia" },
  { code: "+373", country: "MD", flag: "🇲🇩", name: "Moldova" },
  { code: "+374", country: "AM", flag: "🇦🇲", name: "Armenia" },
  { code: "+375", country: "BY", flag: "🇧🇾", name: "Belarus" },
  { code: "+376", country: "AD", flag: "🇦🇩", name: "Andorra" },
  { code: "+377", country: "MC", flag: "🇲🇨", name: "Monaco" },
  { code: "+378", country: "SM", flag: "🇸🇲", name: "San Marino" },
  { code: "+380", country: "UA", flag: "🇺🇦", name: "Ukraine" },
  { code: "+381", country: "RS", flag: "🇷🇸", name: "Serbia" },
  { code: "+382", country: "ME", flag: "🇲🇪", name: "Montenegro" },
  { code: "+383", country: "XK", flag: "🇽🇰", name: "Kosovo" },
  { code: "+385", country: "HR", flag: "🇭🇷", name: "Croatia" },
  { code: "+386", country: "SI", flag: "🇸🇮", name: "Slovenia" },
  { code: "+387", country: "BA", flag: "🇧🇦", name: "Bosnia and Herzegovina" },
  { code: "+389", country: "MK", flag: "🇲🇰", name: "North Macedonia" },
  { code: "+420", country: "CZ", flag: "🇨🇿", name: "Czech Republic" },
  { code: "+421", country: "SK", flag: "🇸🇰", name: "Slovakia" },
  { code: "+423", country: "LI", flag: "🇱🇮", name: "Liechtenstein" },
  { code: "+500", country: "FK", flag: "🇫🇰", name: "Falkland Islands" },
  { code: "+501", country: "BZ", flag: "🇧🇿", name: "Belize" },
  { code: "+502", country: "GT", flag: "🇬🇹", name: "Guatemala" },
  { code: "+503", country: "SV", flag: "🇸🇻", name: "El Salvador" },
  { code: "+504", country: "HN", flag: "🇭🇳", name: "Honduras" },
  { code: "+505", country: "NI", flag: "🇳🇮", name: "Nicaragua" },
  { code: "+506", country: "CR", flag: "🇨🇷", name: "Costa Rica" },
  { code: "+507", country: "PA", flag: "🇵🇦", name: "Panama" },
  { code: "+508", country: "PM", flag: "🇵🇲", name: "Saint Pierre and Miquelon" },
  { code: "+509", country: "HT", flag: "🇭🇹", name: "Haiti" },
  { code: "+590", country: "GP", flag: "🇬🇵", name: "Guadeloupe" },
  { code: "+591", country: "BO", flag: "🇧🇴", name: "Bolivia" },
  { code: "+592", country: "GY", flag: "🇬🇾", name: "Guyana" },
  { code: "+593", country: "EC", flag: "🇪🇨", name: "Ecuador" },
  { code: "+594", country: "GF", flag: "🇬🇫", name: "French Guiana" },
  { code: "+595", country: "PY", flag: "🇵🇾", name: "Paraguay" },
  { code: "+596", country: "MQ", flag: "🇲🇶", name: "Martinique" },
  { code: "+597", country: "SR", flag: "🇸🇷", name: "Suriname" },
  { code: "+598", country: "UY", flag: "🇺🇾", name: "Uruguay" },
  { code: "+599", country: "CW", flag: "🇨🇼", name: "Curaçao" },
  { code: "+670", country: "TL", flag: "🇹🇱", name: "Timor-Leste" },
  { code: "+672", country: "NF", flag: "🇳🇫", name: "Norfolk Island" },
  { code: "+673", country: "BN", flag: "🇧🇳", name: "Brunei" },
  { code: "+674", country: "NR", flag: "🇳🇷", name: "Nauru" },
  { code: "+675", country: "PG", flag: "🇵🇬", name: "Papua New Guinea" },
  { code: "+676", country: "TO", flag: "🇹🇴", name: "Tonga" },
  { code: "+677", country: "SB", flag: "🇸🇧", name: "Solomon Islands" },
  { code: "+678", country: "VU", flag: "🇻🇺", name: "Vanuatu" },
  { code: "+679", country: "FJ", flag: "🇫🇯", name: "Fiji" },
  { code: "+680", country: "PW", flag: "🇵🇼", name: "Palau" },
  { code: "+681", country: "WF", flag: "🇼🇫", name: "Wallis and Futuna" },
  { code: "+682", country: "CK", flag: "🇨🇰", name: "Cook Islands" },
  { code: "+683", country: "NU", flag: "🇳🇺", name: "Niue" },
  { code: "+685", country: "WS", flag: "🇼🇸", name: "Samoa" },
  { code: "+686", country: "KI", flag: "🇰🇮", name: "Kiribati" },
  { code: "+687", country: "NC", flag: "🇳🇨", name: "New Caledonia" },
  { code: "+688", country: "TV", flag: "🇹🇻", name: "Tuvalu" },
  { code: "+689", country: "PF", flag: "🇵🇫", name: "French Polynesia" },
  { code: "+690", country: "TK", flag: "🇹🇰", name: "Tokelau" },
  { code: "+850", country: "KP", flag: "🇰🇵", name: "North Korea" },
  { code: "+852", country: "HK", flag: "🇭🇰", name: "Hong Kong" },
  { code: "+853", country: "MO", flag: "🇲🇴", name: "Macau" },
  { code: "+855", country: "KH", flag: "🇰🇭", name: "Cambodia" },
  { code: "+856", country: "LA", flag: "🇱🇦", name: "Laos" },
  { code: "+880", country: "BD", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+886", country: "TW", flag: "🇹🇼", name: "Taiwan" },
  { code: "+960", country: "MV", flag: "🇲🇻", name: "Maldives" },
  { code: "+961", country: "LB", flag: "🇱🇧", name: "Lebanon" },
  { code: "+962", country: "JO", flag: "🇯🇴", name: "Jordan" },
  { code: "+963", country: "SY", flag: "🇸🇾", name: "Syria" },
  { code: "+964", country: "IQ", flag: "🇮🇶", name: "Iraq" },
  { code: "+965", country: "KW", flag: "🇰🇼", name: "Kuwait" },
  { code: "+966", country: "SA", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+967", country: "YE", flag: "🇾🇪", name: "Yemen" },
  { code: "+968", country: "OM", flag: "🇴🇲", name: "Oman" },
  { code: "+970", country: "PS", flag: "🇵🇸", name: "Palestine" },
  { code: "+971", country: "AE", flag: "🇦🇪", name: "United Arab Emirates" },
  { code: "+972", country: "IL", flag: "🇮🇱", name: "Israel" },
  { code: "+973", country: "BH", flag: "🇧🇭", name: "Bahrain" },
  { code: "+974", country: "QA", flag: "🇶🇦", name: "Qatar" },
  { code: "+975", country: "BT", flag: "🇧🇹", name: "Bhutan" },
  { code: "+976", country: "MN", flag: "🇲🇳", name: "Mongolia" },
  { code: "+977", country: "NP", flag: "🇳🇵", name: "Nepal" },
  { code: "+992", country: "TJ", flag: "🇹🇯", name: "Tajikistan" },
  { code: "+993", country: "TM", flag: "🇹🇲", name: "Turkmenistan" },
  { code: "+994", country: "AZ", flag: "🇦🇿", name: "Azerbaijan" },
  { code: "+995", country: "GE", flag: "🇬🇪", name: "Georgia" },
  { code: "+996", country: "KG", flag: "🇰🇬", name: "Kyrgyzstan" },
  { code: "+998", country: "UZ", flag: "🇺🇿", name: "Uzbekistan" },
];

interface CountryCodeSelectorProps {
  value: string;
  onChange: (code: string) => void;
}

export default function CountryCodeSelector({ value, onChange }: CountryCodeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCountry = countries.find((c) => c.code === value) || countries[0];

  const filteredCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search) ||
      c.country.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (country: Country) => {
    onChange(country.code);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-12 w-[120px] rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 flex items-center gap-2 transition-colors duration-200 outline-none cursor-pointer justify-between",
          "hover:bg-white/[0.05] hover:border-white/[0.12]",
          isOpen && "bg-white/[0.05] border-[#e1a8f0]/30"
        )}
      >
        <span className="text-xl">{selectedCountry.flag}</span>
        <span className="text-sm font-medium text-white">{selectedCountry.code}</span>
        <svg
          className={cn(
            "w-4 h-4 text-white/40 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-full mt-2 left-0 w-80 bg-[#121215] border border-white/[0.08] rounded-xl z-50 overflow-hidden"
          >
            {/* Search */}
            <div className="p-3 border-b border-white/[0.06]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search countries..."
                autoFocus
                className="w-full bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:bg-white/[0.05] focus:border-[#e1a8f0]/30 transition-colors duration-200 outline-none"
              />
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto scrollbar-thin">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country, idx) => (
                  <button
                    key={`${country.code}-${country.country}-${idx}`}
                    type="button"
                    onClick={() => handleSelect(country)}
                    className={cn(
                      "w-full px-4 py-3 flex items-center gap-3 hover:bg-white/[0.05] transition-colors duration-200 text-left cursor-pointer",
                      country.code === value && country.country === selectedCountry.country && "bg-white/[0.03]"
                    )}
                  >
                    <span className="text-2xl">{country.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{country.name}</div>
                      <div className="text-xs text-white/40">{country.country}</div>
                    </div>
                    <span className="text-sm text-white/60 font-mono">{country.code}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-sm text-white/30">No countries found</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
