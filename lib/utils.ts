import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Legacy formatDate function - kept for backward compatibility
export function formatDate(dateString: string) {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), 'MM/dd/yyyy');
  } catch {
    return dateString;
  }
}

// Create date formatter that uses settings
export function createDateFormatter(dateFormat: string) {
  return (date: string | Date): string => {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return '';
      
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      
      // Month names for MMM format
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      
      switch (dateFormat) {
        case 'DD/MM/YYYY':
          return `${day}/${month}/${year}`;
        case 'YYYY-MM-DD':
          return `${year}-${month}-${day}`;
        case 'MMM DD, YYYY':
          return `${monthNames[dateObj.getMonth()]} ${day}, ${year}`;
        case 'MM/DD/YYYY':
        default:
          return `${month}/${day}/${year}`;
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };
}

// Create currency formatter that uses settings
export function createCurrencyFormatter(currency: string) {
  return (amount: number): string => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback to simple formatting if currency is not supported
      const currencySymbols: { [key: string]: string } = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'CAD': 'C$',
        'AUD': 'A$',
        'INR': '₹'
      };
      const symbol = currencySymbols[currency] || '$';
      return `${symbol}${amount.toFixed(2)}`;
    }
  };
}

// Convert 12-hour AM/PM time to 24-hour time format (HH:MM) for HTML time input
export function convertTo24HourFormat(time12h: string): string {
  if (!time12h) return '';
  
  try {
    // Parse the time, e.g. "09:30 AM" or "02:15 PM"
    const [timePart, modifier] = time12h.split(' ');
    if (!timePart || !modifier) return '';
    
    let [hours, minutes] = timePart.split(':');
    if (!hours || !minutes) return '';
    
    // Convert hours to 24-hour format
    let hoursNum = parseInt(hours, 10);
    
    if (modifier === 'PM' && hoursNum < 12) {
      hoursNum += 12;
    }
    if (modifier === 'AM' && hoursNum === 12) {
      hoursNum = 0;
    }
    
    // Format as HH:MM
    return `${hoursNum.toString().padStart(2, '0')}:${minutes}`;
  } catch (error) {
    console.error('Error converting time format:', error, time12h);
    return '';
  }
}

export function formatDateTime(dateString: string, timeString: string) {
  if (!dateString || !timeString) return '';
  try {
    return `${format(parseISO(dateString), 'MM/dd/yyyy')} ${timeString}`;
  } catch {
    return `${dateString} ${timeString}`;
  }
}

// Legacy formatCurrency function - kept for backward compatibility
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function formatTime(timeString: string) {
  if (!timeString) return '';
  return timeString;
} 