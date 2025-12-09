// Currency utility functions for super admin (client-side safe)

// Currency symbols mapping
const CURRENCY_SYMBOLS = {
  // Major World Currencies
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'Fr',
  CNY: '¥',
  
  // Asian Currencies
  INR: '₹',
  KRW: '₩',
  SGD: 'S$',
  HKD: 'HK$',
  TWD: 'NT$',
  THB: '฿',
  MYR: 'RM',
  IDR: 'Rp',
  PHP: '₱',
  VND: '₫',
  PKR: '₨',
  BDT: '৳',
  LKR: 'Rs',
  
  // Middle East & Africa
  AED: 'د.إ',
  SAR: '﷼',
  QAR: '﷼',
  KWD: 'د.ك',
  BHD: '.د.ب',
  OMR: '﷼',
  JOD: 'د.ا',
  ILS: '₪',
  TRY: '₺',
  EGP: 'E£',
  ZAR: 'R',
  NGN: '₦',
  KES: 'KSh',
  GHS: '₵',
  
  // European Currencies
  NOK: 'kr',
  SEK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  CZK: 'Kč',
  HUF: 'Ft',
  RON: 'lei',
  BGN: 'лв',
  RUB: '₽',
  UAH: '₴',
  
  // Americas
  MXN: '$',
  BRL: 'R$',
  ARS: '$',
  CLP: '$',
  COP: '$',
  PEN: 'S/',
  UYU: '$',
  
  // Oceania
  NZD: 'NZ$',
  FJD: 'FJ$',
  
  // Cryptocurrency (Popular)
  BTC: '₿',
  ETH: 'Ξ',
  USDT: '₮',
  USDC: '◉'
};

// Note: getGlobalCurrency moved to server-side API route
// This file only contains client-side utility functions

// Get currency symbol for a currency code
export function getCurrencySymbol(currencyCode) {
  return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
}

// Format amount with currency symbol
export function formatCurrency(amount, currencyCode = 'USD') {
  const numericAmount = Number(amount) || 0;
  const symbol = getCurrencySymbol(currencyCode);
  
  // For currencies that typically show symbol after amount
  const symbolAfterCurrencies = ['EUR', 'PLN', 'CZK', 'HUF', 'NOK', 'SEK', 'DKK', 'RON', 'BGN', 'CHF'];
  
  if (symbolAfterCurrencies.includes(currencyCode)) {
    return `${numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
  }
  
  // For most currencies, show symbol before amount
  return `${symbol}${numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Format currency using Intl.NumberFormat for proper localization
export function formatCurrencyIntl(amount, currencyCode = 'USD', locale = 'en-US') {
  const numericAmount = Number(amount) || 0;
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericAmount);
  } catch (error) {
    // Fallback to simple formatting if currency code is not supported
    console.warn(`Unsupported currency code: ${currencyCode}, using fallback formatting`);
    return formatCurrency(amount, currencyCode);
  }
}

// Simple formatting for display (without decimals for whole numbers)
export function formatCurrencyDisplay(amount, currencyCode = 'USD') {
  const numericAmount = Number(amount) || 0;
  const symbol = getCurrencySymbol(currencyCode);
  
  // Check if amount is a whole number
  const isWholeNumber = numericAmount % 1 === 0;
  const decimals = isWholeNumber ? 0 : 2;
  
  // For currencies that typically show symbol after amount
  const symbolAfterCurrencies = ['EUR', 'PLN', 'CZK', 'HUF', 'NOK', 'SEK', 'DKK', 'RON', 'BGN', 'CHF'];
  
  if (symbolAfterCurrencies.includes(currencyCode)) {
    return `${numericAmount.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} ${symbol}`;
  }
  
  // For most currencies, show symbol before amount
  return `${symbol}${numericAmount.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

// Get all supported currencies for dropdown
export function getSupportedCurrencies() {
  return Object.keys(CURRENCY_SYMBOLS).map(code => ({
    code,
    symbol: CURRENCY_SYMBOLS[code],
    name: getCurrencyName(code)
  }));
}

// Get currency name (can be expanded with more detailed names)
function getCurrencyName(currencyCode) {
  const names = {
    // Major World Currencies
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    JPY: 'Japanese Yen',
    CAD: 'Canadian Dollar',
    AUD: 'Australian Dollar',
    CHF: 'Swiss Franc',
    CNY: 'Chinese Yuan',
    
    // Asian Currencies
    INR: 'Indian Rupee',
    KRW: 'South Korean Won',
    SGD: 'Singapore Dollar',
    HKD: 'Hong Kong Dollar',
    TWD: 'Taiwan Dollar',
    THB: 'Thai Baht',
    MYR: 'Malaysian Ringgit',
    IDR: 'Indonesian Rupiah',
    PHP: 'Philippine Peso',
    VND: 'Vietnamese Dong',
    PKR: 'Pakistani Rupee',
    BDT: 'Bangladeshi Taka',
    LKR: 'Sri Lankan Rupee',
    
    // Middle East & Africa
    AED: 'UAE Dirham',
    SAR: 'Saudi Riyal',
    QAR: 'Qatari Riyal',
    KWD: 'Kuwaiti Dinar',
    BHD: 'Bahraini Dinar',
    OMR: 'Omani Rial',
    JOD: 'Jordanian Dinar',
    ILS: 'Israeli Shekel',
    TRY: 'Turkish Lira',
    EGP: 'Egyptian Pound',
    ZAR: 'South African Rand',
    NGN: 'Nigerian Naira',
    KES: 'Kenyan Shilling',
    GHS: 'Ghanaian Cedi',
    
    // European Currencies
    NOK: 'Norwegian Krone',
    SEK: 'Swedish Krona',
    DKK: 'Danish Krone',
    PLN: 'Polish Zloty',
    CZK: 'Czech Koruna',
    HUF: 'Hungarian Forint',
    RON: 'Romanian Leu',
    BGN: 'Bulgarian Lev',
    RUB: 'Russian Ruble',
    UAH: 'Ukrainian Hryvnia',
    
    // Americas
    MXN: 'Mexican Peso',
    BRL: 'Brazilian Real',
    ARS: 'Argentine Peso',
    CLP: 'Chilean Peso',
    COP: 'Colombian Peso',
    PEN: 'Peruvian Sol',
    UYU: 'Uruguayan Peso',
    
    // Oceania
    NZD: 'New Zealand Dollar',
    FJD: 'Fijian Dollar',
    
    // Cryptocurrency (Popular)
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    USDT: 'Tether',
    USDC: 'USD Coin'
  };
  
  return names[currencyCode] || currencyCode;
}
