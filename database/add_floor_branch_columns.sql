-- ============================================
-- OPTIONAL: Add Floor and Branch Columns to Rooms
-- ============================================
-- This is OPTIONAL - the app currently stores floor/branch in room_number
-- If you want separate columns for better filtering, run this SQL
-- ============================================

-- Add floor and branch columns to rooms table
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS floor INTEGER,
ADD COLUMN IF NOT EXISTS branch TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_rooms_floor ON rooms(floor);
CREATE INDEX IF NOT EXISTS idx_rooms_branch ON rooms(branch);

-- Update existing rooms to extract floor from room_number (optional)
-- This will try to extract floor from existing room numbers
UPDATE rooms 
SET floor = CAST(SUBSTRING(room_number FROM '^(\d+)') AS INTEGER)
WHERE floor IS NULL AND room_number ~ '^\d+';

-- ============================================
-- Note: The app currently works without these columns
-- by storing floor/branch in the room_number format
-- ============================================

