-- ============================================
-- REQUIRED: Add Floor and Branch Columns to Rooms
-- ============================================
-- Run this SQL in Supabase SQL Editor
-- This adds floor and branch as separate columns
-- ============================================

-- Add floor and branch columns to rooms table
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS floor INTEGER,
ADD COLUMN IF NOT EXISTS branch TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_rooms_floor ON rooms(floor);
CREATE INDEX IF NOT EXISTS idx_rooms_branch ON rooms(branch);
CREATE INDEX IF NOT EXISTS idx_rooms_floor_branch ON rooms(floor, branch);

-- Update unique constraint to include floor and branch
-- This allows same room number on different floors/branches
ALTER TABLE rooms 
DROP CONSTRAINT IF EXISTS rooms_hostel_id_room_number_key;

CREATE UNIQUE INDEX IF NOT EXISTS rooms_hostel_floor_branch_number_unique 
ON rooms(hostel_id, floor, COALESCE(branch, ''), room_number);

-- ============================================
-- After running this, rooms will have:
-- - room_number: The room number (e.g., "01", "10")
-- - floor: Floor number (e.g., 1, 2, 3)
-- - branch: Branch/wing (e.g., "A", "B", null)
-- ============================================

