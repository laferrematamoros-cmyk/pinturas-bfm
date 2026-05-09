-- Mueve los 28 colores rosas de "Rojos y Rosas" a la familia "Rosas"
-- Ejecuta esto en el SQL Editor de Supabase

-- 1) Inserta los colores en custom_colors bajo la familia "Rosas"
insert into custom_colors (family_name, name, hex, code, page_number) values
  ('Rosas', 'Mimos de Frutos Rojos',  '#863B67', '14RR 12/349', null),
  ('Rosas', 'Luz Deslumbrante',        '#AD588F', '06RR 20/418', null),
  ('Rosas', 'Rosa Osado',              '#AB4357', '16RR 16/420', null),
  ('Rosas', 'Clavel Intenso',          '#BF7AA4', '07RR 30/337', null),
  ('Rosas', 'Rosa Espléndido',         '#C95D73', '71RR 23/421', null),
  ('Rosas', 'Lazo Rosado',             '#D699B9', '16RR 49/277', null),
  ('Rosas', 'Rosa Silvestre',          '#DD939C', '76RR 40/254', null),
  ('Rosas', 'Rosado Intenso',          '#E0C0DA', '84RR 60/175', null),
  ('Rosas', 'Rosa Fantástico',         '#ECB8BE', '71RR 58/199', null),
  ('Rosas', 'Durazno Calmo',           '#F3A9A4', '06YR 52/291', null),
  ('Rosas', 'Frutilla Sensacional',    '#E5D1E0', '84RR 69/108', null),
  ('Rosas', 'Morado Suave',            '#EDC9CC', '79RR 66/131', null),
  ('Rosas', 'Pink à la mode',          '#F4D3CB', '25YR 71/129', null),
  ('Rosas', 'Sensación Rosada',        '#E8DAE5', '81RR 79/040', null),
  ('Rosas', 'Sensación de Rosas',      '#EFDFDF', '80RR 77/083', null),
  ('Rosas', 'Ballerinas',              '#F1DAD2', '43YR 75/089', null),
  ('Rosas', 'Mousse Rosado',           '#EAE2E6', '81RR 80/038', null),
  ('Rosas', 'Nube Rosa',               '#EBD5DC', '72RR 73/058', null),
  ('Rosas', 'Brisa Chic',              '#F3E7DE', '82YR 83/056', null),
  ('Rosas', 'Rosa Sedosa',             '#E5DCDC', '85RR 75/032', null),
  ('Rosas', 'Exótica Sensación',       '#F0E0D9', '50YR 78/064', null),
  ('Rosas', 'Toques Rosados',          '#EBDED4', '79YR 76/064', null),
  ('Rosas', 'Helado de Champagne',     '#DEC7CB', '60RR 82/086', null),
  ('Rosas', 'Helado Suave',            '#E4C5C1', '09RR 61/117', null),
  ('Rosas', 'Delicada Gamuza',         '#C199A3', '49RR 39/161', null),
  ('Rosas', 'Elementos Rústicos',      '#D49C9B', '99RR 42/216', null),
  ('Rosas', 'Rosa Emoción',            '#A77987', '43RR 38/161', null),
  ('Rosas', 'Jalea de Ciruela Claro',  '#915165', '15RR 15/266', null);

-- 2) Oculta esos mismos colores en la familia "Rojos y Rosas" (equivale a lo que hace "mover color")
--    Agrega sus códigos al array deleted_colors en site_settings
do $$
declare
  current_val text;
  codes jsonb;
  new_codes jsonb;
begin
  select value into current_val from site_settings where key = 'deleted_colors';

  if current_val is null then
    codes := '[]'::jsonb;
  else
    codes := current_val::jsonb;
  end if;

  new_codes := codes
    || '["14RR 12/349","06RR 20/418","16RR 16/420","07RR 30/337","71RR 23/421",
         "16RR 49/277","76RR 40/254","84RR 60/175","71RR 58/199","06YR 52/291",
         "84RR 69/108","79RR 66/131","25YR 71/129","81RR 79/040","80RR 77/083",
         "43YR 75/089","81RR 80/038","72RR 73/058","82YR 83/056","85RR 75/032",
         "50YR 78/064","79YR 76/064","60RR 82/086","09RR 61/117","49RR 39/161",
         "99RR 42/216","43RR 38/161","15RR 15/266"]'::jsonb;

  -- Elimina duplicados
  new_codes := (select jsonb_agg(distinct val) from jsonb_array_elements(new_codes) as t(val));

  insert into site_settings (key, value)
    values ('deleted_colors', new_codes::text)
    on conflict (key) do update set value = new_codes::text;
end $$;
