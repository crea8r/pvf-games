// Room expiration utilities

export const ROOM_EXPIRY_MINUTES = 2;
export const ROOM_EXPIRY_SECONDS = ROOM_EXPIRY_MINUTES * 60;

// Check if room is expired (2+ minutes old)
export function isRoomExpired(timestamp) {
  if (!timestamp) return false;
  const currentTime = Math.floor(Date.now() / 1000);
  const timeDiff = currentTime - timestamp;
  return timeDiff >= ROOM_EXPIRY_SECONDS;
}

// Get time remaining until room expires
export function getTimeUntilExpiry(timestamp) {
  if (!timestamp) return 0;
  const currentTime = Math.floor(Date.now() / 1000);
  const timeDiff = currentTime - timestamp;
  const remaining = ROOM_EXPIRY_SECONDS - timeDiff;
  return Math.max(0, remaining);
}

// Format time remaining in a readable format
export function formatTimeRemaining(seconds) {
  if (seconds <= 0) return 'Expired';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}

// Get room expiration status with color coding
export function getRoomExpirationStatus(timestamp) {
  if (!timestamp) {
    return { status: 'Never used', color: 'text-gray-400' };
  }
  
  const timeRemaining = getTimeUntilExpiry(timestamp);
  
  if (timeRemaining <= 0) {
    return { status: 'Expired', color: 'text-yellow-400' };
  } else if (timeRemaining <= 30) {
    return { status: `Expires in ${formatTimeRemaining(timeRemaining)}`, color: 'text-orange-400' };
  } else {
    return { status: `Expires in ${formatTimeRemaining(timeRemaining)}`, color: 'text-green-400' };
  }
}