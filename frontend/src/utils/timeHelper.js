// Utility functions for time formatting in Vietnam timezone (UTC+7)

/**
 * Format date and time in Vietnam locale
 * @param {string|Date} utcTime - UTC time string or Date object
 * @returns {string} - Formatted date and time
 */
export const formatVietnamDateTime = (utcTime) => {
  if (!utcTime) return '---';
  const date = new Date(utcTime);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh'
  });
};

/**
 * Format time as "X ago" (e.g., "2 hours ago", "5 minutes ago")
 * @param {string|Date} utcTime - UTC time string or Date object
 * @returns {string} - Formatted "ago" string
 */
export const formatTimeAgo = (utcTime) => {
  if (!utcTime) return '---';
  
  const now = new Date();
  const date = new Date(utcTime);
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) {
    return 'Vừa xong';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  } else if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  } else if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  } else {
    const weeks = Math.floor(diffDays / 7);
    if (weeks < 4) {
      return `${weeks} tuần trước`;
    }
    return `${Math.floor(diffDays / 30)} tháng trước`;
  }
};

/**
 * Format login time (current session) - shows full date + time
 * @param {string|Date} utcTime - UTC time string or Date object
 * @returns {string} - Formatted date and time
 */
export const formatLoginTime = (utcTime) => {
  return formatVietnamDateTime(utcTime);
};

/**
 * Format last activity - shows date + time + ago
 * @param {string|Date} utcTime - UTC time string or Date object
 * @returns {string} - Formatted string with date, time, and "ago"
 */
export const formatLastActivity = (utcTime) => {
  if (!utcTime) return '---';
  const dateTime = formatVietnamDateTime(utcTime);
  const ago = formatTimeAgo(utcTime);
  return `${dateTime} (${ago})`;
};

/**
 * Mask IP address (show only first 2 octets)
 * @param {string} ip - IP address
 * @returns {string} - Masked IP address
 */
export const maskIP = (ip) => {
  if (!ip) return '---';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  return ip; // Return as-is if not IPv4
};
