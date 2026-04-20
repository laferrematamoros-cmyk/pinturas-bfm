-- Add page_number to custom_colors and site_settings support for built-in colors
ALTER TABLE custom_colors ADD COLUMN IF NOT EXISTS page_number integer;
