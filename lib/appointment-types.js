// Utility functions for appointment types

// Cache for appointment types to avoid repeated API calls
let appointmentTypesCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getAppointmentTypes() {
  // Check if we have a valid cache
  if (appointmentTypesCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return appointmentTypesCache;
  }

  try {
    const response = await fetch('/api/appointment-types');
    if (response.ok) {
      const types = await response.json();
      appointmentTypesCache = types;
      cacheTimestamp = Date.now();
      return types;
    } else {
      console.error('Failed to fetch appointment types');
      return getDefaultAppointmentTypes();
    }
  } catch (error) {
    console.error('Error fetching appointment types:', error);
    return getDefaultAppointmentTypes();
  }
}

// Fallback appointment types if API fails
export function getDefaultAppointmentTypes() {
  return [
    { _id: 'default-1', name: 'New Patient Visit', duration: 60, price: 250, color: '#3B82F6' },
    { _id: 'default-2', name: 'Follow-Up Visit', duration: 30, price: 150, color: '#10B981' },
    { _id: 'default-3', name: 'Annual Physical', duration: 45, price: 300, color: '#F59E0B' },
    { _id: 'default-4', name: 'Consultation', duration: 45, price: 200, color: '#8B5CF6' },
    { _id: 'default-5', name: 'Urgent Care', duration: 20, price: 175, color: '#EF4444' },
    { _id: 'default-6', name: 'Specialty Referral', duration: 30, price: 180, color: '#6366F1' },
  ];
}

// Clear cache (useful when appointment types are updated)
export function clearAppointmentTypesCache() {
  appointmentTypesCache = null;
  cacheTimestamp = null;
}

// Get appointment type by name
export function getAppointmentTypeByName(types, name) {
  return types.find(type => type.name === name);
}

// Get duration for an appointment type
export function getAppointmentTypeDuration(types, typeName) {
  const type = getAppointmentTypeByName(types, typeName);
  return type ? type.duration : 30; // Default to 30 minutes
}

// Get appointment type price by name
export function getAppointmentTypePrice(types, typeName) {
  const type = getAppointmentTypeByName(types, typeName);
  return type ? type.price : 0; // Default to $0
}

// Get appointment type color from hex color to Tailwind class
export function getAppointmentTypeColor(color) {
  if (!color) return 'bg-gray-500';
  
  // Map common hex colors to Tailwind classes
  const colorMap = {
    '#3B82F6': 'bg-blue-500',    // Blue
    '#10B981': 'bg-green-500',   // Green
    '#F59E0B': 'bg-amber-500',   // Amber
    '#8B5CF6': 'bg-purple-500',  // Purple
    '#EF4444': 'bg-red-500',     // Red
    '#6366F1': 'bg-indigo-500',  // Indigo
  };
  
  return colorMap[color] || 'bg-gray-500';
}

// Listen for appointment types updates
if (typeof window !== 'undefined') {
  document.addEventListener('appointmentTypesUpdated', clearAppointmentTypesCache);
} 