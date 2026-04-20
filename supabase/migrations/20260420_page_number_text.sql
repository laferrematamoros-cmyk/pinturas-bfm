-- Change page_number from integer to text to support letters and symbols
ALTER TABLE custom_colors ALTER COLUMN page_number TYPE text USING page_number::text;
