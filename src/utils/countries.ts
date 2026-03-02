import { getCountries, getCountryCallingCode, type CountryCode } from 'libphonenumber-js';

export interface CountryMetadata {
  iso2: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
}

const NAME_OVERRIDES: Partial<Record<CountryCode, string>> = {
  US: 'United States',
  GB: 'United Kingdom',
  AE: 'United Arab Emirates',
};

const NAME_ALIASES: Record<string, CountryCode> = {
  usa: 'US',
  us: 'US',
  uk: 'GB',
  uae: 'AE',
};

const DIAL_CODE_DEFAULTS: Record<string, CountryCode> = {
  '+1': 'US',
  '+7': 'RU',
  '+44': 'GB',
};

const displayNames =
  typeof Intl !== 'undefined' && typeof Intl.DisplayNames !== 'undefined'
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');

const toFlagEmoji = (iso2: string) =>
  iso2
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');

export const ALL_COUNTRIES: CountryMetadata[] = getCountries()
  .map((iso2) => {
    try {
      const name = NAME_OVERRIDES[iso2] ?? displayNames?.of(iso2) ?? iso2;
      const dialCode = `+${getCountryCallingCode(iso2)}`;

      return {
        iso2,
        name,
        dialCode,
        flag: toFlagEmoji(iso2),
      } satisfies CountryMetadata;
    } catch {
      return null;
    }
  })
  .filter((country): country is CountryMetadata => Boolean(country))
  .sort((a, b) => a.name.localeCompare(b.name));

export const ALL_COUNTRY_NAMES = ALL_COUNTRIES.map((country) => country.name);

const countriesByName = new Map<string, CountryMetadata>(
  ALL_COUNTRIES.map((country) => [normalize(country.name), country])
);

const countriesByDialCode = ALL_COUNTRIES.reduce<Record<string, CountryMetadata[]>>((acc, country) => {
  acc[country.dialCode] = acc[country.dialCode] ?? [];
  acc[country.dialCode].push(country);
  return acc;
}, {});

export const getCountryByName = (name?: string | null): CountryMetadata | undefined => {
  if (!name) return undefined;

  const normalized = normalize(name);
  const aliasIso = NAME_ALIASES[normalized];
  if (aliasIso) {
    return ALL_COUNTRIES.find((country) => country.iso2 === aliasIso);
  }

  return countriesByName.get(normalized);
};

export const getCountryByDialCode = (dialCode?: string | null): CountryMetadata | undefined => {
  if (!dialCode) return undefined;

  const normalizedDialCode = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  const defaultIso = DIAL_CODE_DEFAULTS[normalizedDialCode];

  if (defaultIso) {
    const defaultMatch = ALL_COUNTRIES.find((country) => country.iso2 === defaultIso);
    if (defaultMatch) return defaultMatch;
  }

  return countriesByDialCode[normalizedDialCode]?.[0];
};

export const getDialCodeForCountry = (countryName?: string | null, fallback = '+1'): string => {
  const country = getCountryByName(countryName);
  return country?.dialCode ?? fallback;
};
