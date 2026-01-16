# Migration: IP Address and Device Tracking

## Overview
This migration adds IP address and device tracking capabilities to the users table, allowing the system to track user sessions with detailed information.

## What This Migration Does

1. **Adds `last_ip_address` column** - Stores the last IP address used by the user
2. **Adds `last_device_info` column** - Stores device information (Mobile, Desktop, Windows, Mac, etc.)
3. **Adds `session_start` column** - Tracks when the current session started (login time)
4. **Creates indexes** - For faster queries on IP and session data

## How to Run

1. Open pgAdmin4
2. Connect to your database
3. Open Query Tool
4. Copy and paste the contents of `add_ip_device_tracking.sql`
5. Execute the query

## SQL File Location
`personal_task/backend/migrations/add_ip_device_tracking.sql`

## What Happens After Migration

- **On Login**: System will capture and store:
  - IP address (from request headers)
  - Device info (from User-Agent header)
  - Session start time (current timestamp)

- **On Activity Tracking**: System will update:
  - IP address (if changed)
  - Device info (if changed)
  - Last active timestamp

## Frontend Display

- **Login Time**: Shows full date + time in Vietnam timezone (UTC+7)
- **Last Activity**: Shows date + time + "ago" format (e.g., "2 hours ago")
- **IP Address**: Masked by default (e.g., "192.168.xxx.xxx"), click to reveal full IP
- **Device Info**: Shows device type next to IP address

## Notes

- IP addresses are masked by default for privacy
- Full IP is shown when clicked (for audit purposes)
- All times are stored in UTC and converted to Vietnam time (UTC+7) in the UI
- Device info is automatically detected from User-Agent header
