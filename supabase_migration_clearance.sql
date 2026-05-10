-- Migration: Add Clearance Dispensation to Students Table
-- Copy and run this script in your Supabase SQL Editor to add the required columns for the Clearance feature.

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS dispensation_status BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS dispensation_reason TEXT DEFAULT '';
