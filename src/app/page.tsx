"use client";

import React, { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import {
  loadColorSettings,
  saveColorHex,
  deleteColorHex,
  saveColorDurability,
  loadDurabilityPrices,
  saveDurabilityPrices,
  loadDurabilityOnSale,
  saveDurabilityOnSale,
  loadSiteSettings,
  saveSiteName,
  saveSiteLogoUrl,
  saveSiteLogo2Url,
  createLogoUploadUrl,
  loadCustomColors,
  addCustomColor,
  updateCustomColor,
  deleteCustomColor,
  loadColorNameOverrides,
  saveColorNameOverride,
  loadDeletedColors,
  saveDeletedColors,
  type CustomColor,
} from "@/lib/actions";

interface Color {
  name: string;
  hex: string;
  code: string;
  id?: string;
  originalCode?: string; // built-in colors with overridden code
}

interface ColorFamily {
  name: string;
  colors: Color[];
}

const colorFamilies: ColorFamily[] = [
  {
    name: "Rojos y Rosas",
    colors: [
      { name: "Mimos de Frutos Rojos", hex: "#863B67", code: "14RR 12/349" },
      { name: "Carmesí Intenso", hex: "#9E3147", code: "80RR 12/430" },
      { name: "Rojo Matiz", hex: "#A32E39", code: "99RR 12/469" },
      { name: "Luz Deslumbrante", hex: "#AD588F", code: "06RR 20/418" },
      { name: "Rosa Osado", hex: "#AB4357", code: "16RR 16/420" },
      { name: "Pasión Coral", hex: "#C9464F", code: "02YR 26/493" },
      { name: "Clavel Intenso", hex: "#BF7AA4", code: "07RR 30/337" },
      { name: "Rosa Espléndido", hex: "#C95D73", code: "71RR 23/421" },
      { name: "Tañido Cítrico", hex: "#D86165", code: "00YR 26/493" },
      { name: "Lazo Rosado", hex: "#D699B9", code: "16RR 49/277" },
      { name: "Rosa Silvestre", hex: "#DD939C", code: "76RR 40/254" },
      { name: "Florecer Osado", hex: "#E88683", code: "04YR 38/398" },
      { name: "Rosado Intenso", hex: "#E0C0DA", code: "84RR 60/175" },
      { name: "Rosa Fantástico", hex: "#ECB8BE", code: "71RR 58/199" },
      { name: "Durazno Calmo", hex: "#F3A9A4", code: "06YR 52/291" },
      { name: "Frutilla Sensacional", hex: "#E5D1E0", code: "84RR 69/108" },
      { name: "Morado Suave", hex: "#EDC9CC", code: "79RR 66/131" },
      { name: "Pink à la mode", hex: "#F4D3CB", code: "25YR 71/129" },
      { name: "Sensación Rosada", hex: "#E8DAE5", code: "81RR 79/040" },
      { name: "Sensación de Rosas", hex: "#EFDFDF", code: "80RR 77/083" },
      { name: "Ballerinas", hex: "#F1DAD2", code: "43YR 75/089" },
      { name: "Mousse Rosado", hex: "#EAE2E6", code: "81RR 80/038" },
      { name: "Nube Rosa", hex: "#EBD5DC", code: "72RR 73/058" },
      { name: "Brisa Chic", hex: "#F3E7DE", code: "82YR 83/056" },
      { name: "Rosa Sedosa", hex: "#E5DCDC", code: "85RR 75/032" },
      { name: "Exótica Sensación", hex: "#F0E0D9", code: "50YR 78/064" },
      { name: "Toques Rosados", hex: "#EBDED4", code: "79YR 76/064" },
      { name: "Helado de Champagne", hex: "#DEC7CB", code: "60RR 82/086" },
      { name: "Helado Suave", hex: "#E4C5C1", code: "09RR 61/117" },
      { name: "Jarrón de Cerámica", hex: "#DAB6AB", code: "40YR 53/149" },
      { name: "Delicada Gamuza", hex: "#C199A3", code: "49RR 39/161" },
      { name: "Elementos Rústicos", hex: "#D49C9B", code: "99RR 42/216" },
      { name: "Sahara Soleado", hex: "#D89683", code: "40YR 48/290" },
      { name: "Rosa Emoción", hex: "#A77987", code: "43RR 38/161" },
      { name: "Romance Rústico", hex: "#B97A77", code: "04YR 27/258" },
      { name: "Abundante Rubor", hex: "#C57463", code: "29YR 27/355" },
      { name: "Jalea de Ciruela Claro", hex: "#915165", code: "15RR 15/266" },
      { name: "Cereza Masticable", hex: "#A85958", code: "04YR 18/324" },
      { name: "Vasija de Terracota", hex: "#B05446", code: "26YR 18/404" },
      { name: "Sangre de Dragón", hex: "#6B3C50", code: "32RR 09/203" },
      { name: "Baño Oriental", hex: "#9B3D3F", code: "05YR 13/387" },
      { name: "Caoba Imponente", hex: "#973E34", code: "21YR 13/383" },
      { name: "Ciruela Osado", hex: "#5E2248", code: "49RR 06/146" },
      { name: "Sensación Española", hex: "#7A1822", code: "01YR 09/386" },
      { name: "Marrón Intenso", hex: "#652010", code: "05YR 08/272" },
      { name: "Casis Jugoso", hex: "#4A1A30", code: "52RR 06/105" },
      { name: "Pájaro de Fuego", hex: "#7D1E12", code: "02YR 09/373" },
      { name: "Chocolate con Chili", hex: "#4E1808", code: "01YR 07/180" },
    ],
  },
  {
    name: "Naranjas y Terracota",
    colors: [
      { name: "Teatro de Títeres", hex: "#8B2C00", code: "17YR 13/463" },
      { name: "Sol Ardiente", hex: "#C04E00", code: "49YR 27/627" },
      { name: "Naranja Explosivo", hex: "#D07500", code: "85YR 38/700" },
      { name: "Sensación Cereza", hex: "#A03500", code: "30YR 18/356" },
      { name: "Mandarina", hex: "#D56800", code: "82YR 44/540" },
      { name: "Pez Naranja", hex: "#E07200", code: "46YR 46/632" },
      { name: "Atardecer Asombroso", hex: "#B04500", code: "40YR 28/363" },
      { name: "Citrus", hex: "#D08C00", code: "12YY 55/518" },
      { name: "Sensación de Melón", hex: "#D8A200", code: "67YY 54/510" },
      { name: "Durazno Vital", hex: "#E06A2E", code: "68YR 50/429" },
      { name: "Villa Toscana", hex: "#E08A38", code: "99YR 62/459" },
      { name: "Sensación de Azafrán", hex: "#DCA818", code: "19YY 64/412" },
      { name: "Paisaje Sabrosa", hex: "#F08255", code: "73YR 61/343" },
      { name: "Jengibre Cristalizado", hex: "#F0AE58", code: "11YY 74/263" },
      { name: "Amanecer de Otoño", hex: "#F0BD55", code: "22YY 75/247" },
      { name: "Durazno Especial", hex: "#F4A07A", code: "81YR 67/247" },
      { name: "Crepe de Naranja", hex: "#F5C07A", code: "11YY 79/170" },
      { name: "Dilución de Azafrán", hex: "#F5D058", code: "22YY 80/211" },
      { name: "Durazno Intenso", hex: "#F8BA98", code: "76YR 74/155" },
      { name: "Torta de Melaza", hex: "#F7D09A", code: "08YY 83/117" },
      { name: "Fulgor de Luz", hex: "#F8E090", code: "21YY 84/128" },
      { name: "Talco de Bebé", hex: "#FAD8B5", code: "90YR 84/076" },
      { name: "Mañana Exuberante", hex: "#F8DFB8", code: "14YY 83/075" },
      { name: "Chispazo de Marfil", hex: "#FAE8CC", code: "23YY 86/081" },
      { name: "Seda Suculenta", hex: "#FAEADE", code: "11YY 85/042" },
      { name: "Blanco Cal", hex: "#FBF0E0", code: "01YY 86/034" },
      { name: "Bruma Tranquila", hex: "#F8EED5", code: "30YY 82/039" },
      { name: "Marca Blanca", hex: "#F5E4BE", code: "08YY 78/069" },
      { name: "Toque de Azúcar", hex: "#F5E8A0", code: "17YY 79/105" },
      { name: "Naturalista Vivo", hex: "#F0E7A5", code: "35YY 77/087" },
      { name: "Mañana Luminosa", hex: "#EDDB8C", code: "01YY 75/115" },
      { name: "Mousse de Galletta", hex: "#E8C468", code: "17YY 68/203" },
      { name: "Toque de Crema", hex: "#EDD880", code: "23YY 69/134" },
      { name: "Terrapién", hex: "#CF8E52", code: "99YR 61/205" },
      { name: "Dolce Nougat", hex: "#CC9022", code: "02YY 52/318" },
      { name: "Nuez Moscada Tenue", hex: "#E8CA80", code: "24YY 69/103" },
      { name: "Polvo de Marte", hex: "#BE6E28", code: "82YR 38/316" },
      { name: "Miel de Crème Brûlée", hex: "#C88020", code: "98YR 41/326" },
      { name: "Jengibre Amarronado", hex: "#BB8D28", code: "15YY 49/288" },
      { name: "Macchiato Matutino", hex: "#9E4E15", code: "77YR 26/391" },
      { name: "Árbol Otoñal", hex: "#9E6C18", code: "96YR 33/309" },
      { name: "Sucio Luminoso", hex: "#A28418", code: "15YY 37/276" },
      { name: "Caramelo Picante", hex: "#882E08", code: "62YR 18/397" },
      { name: "Deleite de Caramelo", hex: "#8C5C10", code: "59YR 22/305" },
      { name: "Aroma a Chocolate", hex: "#886018", code: "12YY 28/226" },
      { name: "Bosque en Llamas", hex: "#6A2805", code: "64YR 14/300" },
      { name: "Fango del Mississippi", hex: "#583508", code: "89YR 12/197" },
      { name: "Licor de Coñac", hex: "#563E10", code: "09YY 16/224" },
    ],
  },
  {
    name: "Amarillos y Dorados",
    colors: [
      { name: "Pastura Glamorosa", hex: "#8C7224", code: "25YY 55/802" },
      { name: "Césped Mostaza", hex: "#9EAA18", code: "51YY 61/792" },
      { name: "Banana Verde", hex: "#9CA820", code: "53YY 55/710" },
      { name: "Arenas de Barbados", hex: "#B89030", code: "22YY 57/627" },
      { name: "Limón Verde", hex: "#C2CC14", code: "54YY 69/747" },
      { name: "Futurista", hex: "#C8C820", code: "66YY 61/648" },
      { name: "Popurrí Veranero", hex: "#C8A032", code: "25YY 61/452" },
      { name: "Estallido Estelar", hex: "#D8D420", code: "48YY 73/573" },
      { name: "Sabor Limón", hex: "#E0DC2A", code: "62YY 78/618" },
      { name: "Sensación Estival", hex: "#D4AE40", code: "39YY 71/413" },
      { name: "Corriente Estival", hex: "#EAD845", code: "48YY 80/346" },
      { name: "Luz Astral", hex: "#ECDE50", code: "62YY 83/382" },
      { name: "Sentimiento de Verano", hex: "#E2C858", code: "39YY 78/329" },
      { name: "Jugo de Limón", hex: "#F0E462", code: "52YY 83/223" },
      { name: "Flash Fotográfico", hex: "#F2EE68", code: "62YY 86/253" },
      { name: "Amarillo Luminaria", hex: "#ECDA70", code: "34YY 81/209" },
      { name: "Sensación Cremosa", hex: "#F0EC80", code: "59YY 82/133" },
      { name: "Blanco Exaltación", hex: "#F6F48C", code: "61YY 86/159" },
      { name: "Sensación Espacial", hex: "#F0EA8C", code: "39YY 86/135" },
      { name: "Crema Chic", hex: "#F4EE98", code: "56YY 85/109" },
      { name: "Fantasía Lunar", hex: "#F8F4A4", code: "53YY 88/112" },
      { name: "Pura Luz", hex: "#F4EEA0", code: "51YY 84/121" },
      { name: "Dejo de Vainilla", hex: "#F8F6B8", code: "53YY 89/081" },
      { name: "Alturas Polares", hex: "#FAFCC0", code: "65YY 90/062" },
      { name: "Tutú Blanco", hex: "#FAF6C8", code: "35YY 88/050" },
      { name: "Alegría de Bebé", hex: "#FDFAD4", code: "67YY 88/044" },
      { name: "Escarcha Pura", hex: "#FDFDE8", code: "71YY 93/027" },
      { name: "Bruma Mística", hex: "#F6F2CC", code: "41YY 82/071" },
      { name: "Blanco Maíz", hex: "#F8F4C4", code: "65YY 79/118" },
      { name: "Blanco Inocente", hex: "#FAFAD0", code: "67YY 82/072" },
      { name: "Cielo Mostaza", hex: "#EEE494", code: "35YY 76/110" },
      { name: "Sensación de Duna", hex: "#F0ECA0", code: "54YY 71/171" },
      { name: "Mañana Urbana", hex: "#F0EC98", code: "51YY 76/109" },
      { name: "Nougat de Caramelo", hex: "#D4B86A", code: "36YY 70/208" },
      { name: "Verde Italiano", hex: "#C8C068", code: "45YY 63/251" },
      { name: "Blanco Lana", hex: "#ECE8A8", code: "57YY 72/138" },
      { name: "Mostaza Tenue", hex: "#C29844", code: "28YY 62/321" },
      { name: "Verde Mañana", hex: "#AAAA45", code: "41YY 53/306" },
      { name: "Efecto Pardo", hex: "#C4AE68", code: "46YY 61/201" },
      { name: "Cosecha de Heno", hex: "#A68035", code: "36YY 52/359" },
      { name: "Verde Extracto", hex: "#9A9838", code: "45YY 51/365" },
      { name: "Fango Mostaza", hex: "#A8A045", code: "47YY 40/227" },
      { name: "Caramelo Crocante", hex: "#8C6228", code: "21YY 45/405" },
      { name: "Aceite de Mostaza", hex: "#7C7830", code: "37YY 39/443" },
      { name: "Tierra Viva", hex: "#7A7430", code: "40YY 33/350" },
      { name: "Suave Heno", hex: "#705030", code: "22YY 38/423" },
      { name: "Fantasía Oliva", hex: "#686020", code: "34YY 31/502" },
      { name: "Orilla del Lago", hex: "#4A4418", code: "35YY 18/180" },
    ],
  },
  {
    name: "Verdes",
    colors: [
      { name: "Locura de Mojito", hex: "#7DC818", code: "92YY 59/547" },
      { name: "Menta Matinal", hex: "#1A4022", code: "40GY 18/372" },
      { name: "Lluvia en el Bosque", hex: "#0C2C18", code: "80GY 11/195" },
      { name: "Jugo de Melón", hex: "#90D025", code: "92YY 69/547" },
      { name: "Fantasía de Elfo", hex: "#226C2C", code: "33GY 33/545" },
      { name: "Árbol Alpino", hex: "#0E3C20", code: "84GY 13/321" },
      { name: "Uva Verde", hex: "#A2CC38", code: "88YY 66/447" },
      { name: "Hierba Primaveral", hex: "#348840", code: "33GY 46/469" },
      { name: "Isla Esmeralda", hex: "#107038", code: "70GY 22/546" },
      { name: "Florecer de Septiembre", hex: "#B8E058", code: "90YY 78/334" },
      { name: "Toque de Kiwi", hex: "#50A838", code: "10GY 61/449" },
      { name: "Fiesta del Jardín", hex: "#287A42", code: "67GY 40/437" },
      { name: "Nuevo Rocío", hex: "#CEEC72", code: "91YY 82/235" },
      { name: "Jardín Paradisíaco", hex: "#64CC52", code: "09GY 80/324" },
      { name: "Licor de Pistacho", hex: "#3E9850", code: "54GY 54/405" },
      { name: "Toque de Cardamomo", hex: "#D4E888", code: "83YY 80/186" },
      { name: "Praderas Brumosas", hex: "#82C870", code: "17GY 81/205" },
      { name: "Jardinera", hex: "#56B868", code: "50GY 69/306" },
      { name: "Crema Sedosa", hex: "#DEF0A0", code: "79YY 84/126" },
      { name: "Verde Langosta Suave", hex: "#A8DC98", code: "10GY 86/138" },
      { name: "Fresca Experiencia", hex: "#7CCE88", code: "39GY 77/179" },
      { name: "Toque de Helechos", hex: "#EAF5B8", code: "85YY 89/109" },
      { name: "Toque Eggshell", hex: "#C8ECBE", code: "21GY 88/066" },
      { name: "Gota de Menta", hex: "#ACDFB0", code: "56GY 85/095" },
      { name: "Fantasía de Algodón", hex: "#F0FAC8", code: "83YY 89/053" },
      { name: "Algodón Distinguido", hex: "#E0F5D8", code: "04GY 87/028" },
      { name: "Casquete Polar", hex: "#D8F8DC", code: "45GY 89/039" },
      { name: "Sensación Eggshell", hex: "#F2FAC8", code: "91YY 88/072" },
      { name: "Césped Creciente", hex: "#BAEAB0", code: "00GY 80/069" },
      { name: "Susurro Chino", hex: "#C8EED4", code: "80GY 85/051" },
      { name: "Sauce Llorón", hex: "#E8F0A0", code: "97YY 83/090" },
      { name: "Verde Parque", hex: "#A4D890", code: "16GY 76/078" },
      { name: "Salto de Langosta", hex: "#8AD0A0", code: "82GY 75/111" },
      { name: "Fantasía Caqui", hex: "#D4E068", code: "83YY 72/164" },
      { name: "Brote de Trébol", hex: "#688E58", code: "13GY 52/120" },
      { name: "Tinte Botella", hex: "#508870", code: "79GY 57/120" },
      { name: "Pera Jugosa", hex: "#C0D850", code: "94YY 67/164" },
      { name: "Bosque Melancólico", hex: "#3A6030", code: "08GY 36/175" },
      { name: "Canto de Pavo Real", hex: "#1E5840", code: "83GY 33/173" },
      { name: "Chucrut", hex: "#AABF38", code: "90YY 54/254" },
      { name: "Verde Cabaña", hex: "#284828", code: "08GY 26/190" },
      { name: "Pino Espinoso", hex: "#103228", code: "82GY 19/152" },
      { name: "Verde Vertiginoso", hex: "#6A8028", code: "87YY 27/274" },
      { name: "Selva Brasileña", hex: "#1C3A1E", code: "18GY 19/160" },
      { name: "Verde Elegante", hex: "#082018", code: "80GY 08/134" },
      { name: "Sensación Camuflaje", hex: "#3E4818", code: "87YY 13/208" },
      { name: "Selva Magnífica", hex: "#142818", code: "14GY 12/129" },
      { name: "Anochecer en el Bosque", hex: "#0E1A10", code: "01GG 07/070" },
    ],
  },
  {
    name: "Turquesas y Celestes",
    colors: [
      { name: "Arbusto Feliz", hex: "#083520", code: "44GG 12/299" },
      { name: "Sentimiento Fabuloso", hex: "#0F1E90", code: "11BB 15/359" },
      { name: "Alas de Colibrí", hex: "#0C1E80", code: "32BB 10/296" },
      { name: "Sensación de Algas", hex: "#0A4835", code: "47GG 19/396" },
      { name: "Calma Mediterránea", hex: "#0A2AB0", code: "96BB 20/413" },
      { name: "Tormenta Eléctrica", hex: "#102898", code: "36BB 15/398" },
      { name: "Desfile de Luz", hex: "#0C6848", code: "44GG 27/468" },
      { name: "Azul Dicha", hex: "#1040B0", code: "79BB 27/391" },
      { name: "Azul Cabalgata", hex: "#1638A8", code: "27BB 21/366" },
      { name: "Sensación Esmeralda", hex: "#188060", code: "49GG 39/313" },
      { name: "Azul Pim", hex: "#1858C0", code: "80BB 39/364" },
      { name: "Aguas Limpias", hex: "#2058B8", code: "27BB 33/310" },
      { name: "Melón Jugoso", hex: "#30A880", code: "47GG 57/246" },
      { name: "Día de Spa", hex: "#3888D0", code: "54BB 56/236" },
      { name: "Horizonte Azul", hex: "#3070C0", code: "24BB 43/232" },
      { name: "Juguete Verde", hex: "#70CEB5", code: "42GG 79/155" },
      { name: "Azul Burbujeante", hex: "#60A8DC", code: "40BB 65/171" },
      { name: "Vasto Océano", hex: "#4888C8", code: "21BB 52/181" },
      { name: "Hoja de Saúco", hex: "#A8E0D0", code: "38GG 80/077" },
      { name: "Fantasía Denim", hex: "#8CC4EC", code: "34BB 75/107" },
      { name: "Azul Liláceo", hex: "#6898D0", code: "11BB 58/133" },
      { name: "Hielo Sedoso", hex: "#C0EEE0", code: "36GG 87/138" },
      { name: "Hielo Fluvial", hex: "#B8D8F4", code: "64BB 78/058" },
      { name: "Estallido de Lavandas", hex: "#88B5E2", code: "23BB 68/102" },
      { name: "Diamante Pálido", hex: "#E0F5F2", code: "45GG 83/023" },
      { name: "Atmósfera del Ártico", hex: "#C8E4F8", code: "34BB 79/053" },
      { name: "Bruma de Escarcha", hex: "#C8D8F2", code: "17BB 79/028" },
      { name: "Cristalino", hex: "#A0D5DC", code: "73GG 77/066" },
      { name: "Reflejo de Cielo", hex: "#B0CCEC", code: "33BB 72/072" },
      { name: "Toque Matinal", hex: "#ACCCDE", code: "89BB 72/060" },
      { name: "Suave Caudal", hex: "#80BCC8", code: "81GG 67/099" },
      { name: "Cielo de Ángeles", hex: "#88B0E0", code: "33BB 64/121" },
      { name: "Sensación Feliz", hex: "#5090C8", code: "01BB 59/109" },
      { name: "Aguamarina Medio", hex: "#2890B0", code: "79GG 53/220" },
      { name: "Reposo en la Laguna", hex: "#2870C8", code: "23BB 43/240" },
      { name: "Limpia Armonía", hex: "#3870B8", code: "00BB 48/152" },
      { name: "Sensación Cristal", hex: "#1870A0", code: "80GG 39/220" },
      { name: "Mar Caribeño", hex: "#2268C0", code: "33BB 43/240" },
      { name: "Caramelo de Niño", hex: "#2868A8", code: "06BB 39/179" },
      { name: "Pavo Real", hex: "#0A4870", code: "80GG 19/231" },
      { name: "Cataratas de Padrín", hex: "#1040A0", code: "29BB 26/253" },
      { name: "Aguas de Islandia", hex: "#103470", code: "15BB 19/227" },
      { name: "Verde Libertad", hex: "#063050", code: "82GG 12/289" },
      { name: "Caribe Intenso", hex: "#0A2070", code: "16BB 13/252" },
      { name: "Neptuno Arándano", hex: "#0A1D58", code: "27BB 10/138" },
      { name: "Sueños Persas", hex: "#041830", code: "87GG 08/151" },
      { name: "Abismo Profundo", hex: "#081550", code: "31BB 10/240" },
      { name: "Pozo Profundo", hex: "#081448", code: "17BB 08/104" },
    ],
  },
  {
    name: "Azules y Violetas",
    colors: [
      { name: "Festival de Ópera", hex: "#1E0E8C", code: "69BB 17/324" },
      { name: "Fuerte Presencia", hex: "#100570", code: "77BB 07/344" },
      { name: "Tulipán Negro", hex: "#18042A", code: "30RB 07/107" },
      { name: "Efecto Amatista", hex: "#2C1098", code: "67BB 22/374" },
      { name: "Decreto Real", hex: "#120878", code: "81BB 12/269" },
      { name: "Púrpura de Windsor", hex: "#20062C", code: "15RB 07/217" },
      { name: "Bouquet de Lavanda", hex: "#3A1CAA", code: "58BB 29/332" },
      { name: "Rebelión Real", hex: "#2818B8", code: "83BB 27/352" },
      { name: "Palacio Persa", hex: "#3C0850", code: "16RB 13/349" },
      { name: "Orquídea Sublime", hex: "#6048C0", code: "56BB 45/240" },
      { name: "Lavanda Imperial", hex: "#4022C0", code: "82BB 38/251" },
      { name: "Pimpollo de Berenjenas", hex: "#682060", code: "15RB 28/271" },
      { name: "Mermelada de Ciruela", hex: "#7A62C8", code: "58BB 51/183" },
      { name: "Brote en Flor", hex: "#6042C8", code: "80BB 49/174" },
      { name: "Motriz Púrpura", hex: "#884878", code: "16RB 38/235" },
      { name: "Uva Magnífica", hex: "#9880CC", code: "53BB 62/119" },
      { name: "Toque de Amatista", hex: "#7C5ACC", code: "89BB 55/122" },
      { name: "Malva de Carnaval", hex: "#A878A0", code: "17RB 57/141" },
      { name: "Lavanda Matinal", hex: "#B0A4D8", code: "53BB 69/079" },
      { name: "Sensación Lavanda", hex: "#9878D0", code: "81BB 61/071" },
      { name: "Sonrisa Púrpura", hex: "#C498B8", code: "15RB 66/112" },
      { name: "Aroma a Violeta", hex: "#C8C2E8", code: "52BB 75/036" },
      { name: "Sensación Violeta", hex: "#B098D8", code: "83BB 71/082" },
      { name: "Toque de Pensamiento", hex: "#D4C0DC", code: "16RB 73/058" },
      { name: "Suspiro de Lavanda", hex: "#CCC8EC", code: "66BB 77/035" },
      { name: "Susurro de Brezos", hex: "#D0C4D8", code: "23RB 76/036" },
      { name: "Papel Valioso", hex: "#F0E8F0", code: "99RR 80/020" },
      { name: "Encaje Lavanda", hex: "#DAD5F0", code: "40BB 83/056" },
      { name: "Mañana Violeta", hex: "#C0A8CC", code: "24RB 66/037" },
      { name: "Rocío Matinal", hex: "#DEC0CC", code: "26RR 73/037" },
      { name: "Cielo Eléctrico", hex: "#485AB8", code: "54BB 39/103" },
      { name: "Deleite Malva", hex: "#8870A0", code: "14RB 48/045" },
      { name: "Toque de Armonía", hex: "#C4A0B0", code: "40RR 57/045" },
      { name: "Azul Camante", hex: "#1A22A0", code: "49BB 19/182" },
      { name: "Violeta Fantasista", hex: "#5C4070", code: "13RB 32/077" },
      { name: "Diseño Brumoso", hex: "#A07888", code: "11RR 43/050" },
      { name: "Deleite Denim", hex: "#1C209A", code: "49BB 19/162" },
      { name: "Púrpura del Pacífico", hex: "#2A1448", code: "38RB 15/086" },
      { name: "Dejo de Arcilla", hex: "#784858", code: "11RR 29/068" },
      { name: "Capa Real", hex: "#0E1090", code: "67BB 14/216" },
      { name: "Fúlgor de Medianoche", hex: "#180838", code: "09RB 12/102" },
      { name: "Arcilla Purpúrea", hex: "#583848", code: "09RR 21/078" },
      { name: "Oscuridad Profunda", hex: "#080A60", code: "67BB 09/166" },
      { name: "Cóctel de Uva", hex: "#160830", code: "23RB 10/134" },
      { name: "Berenjeno Medio", hex: "#3C1828", code: "04RR 14/085" },
      { name: "Profundidad del Océano", hex: "#060840", code: "66BB 06/077" },
      { name: "Torta Selva Negra", hex: "#0E0618", code: "07RB 07/079" },
      { name: "Arcilla Relajante", hex: "#200810", code: "21RR 07/060" },
    ],
  },
  {
    name: "Grises y Beiges",
    colors: [
      { name: "Carbón Ardiente", hex: "#181414", code: "62RR 09/009" },
      { name: "Ave de la Tormenta", hex: "#1E1C18", code: "20YY 11/017" },
      { name: "Chocolate Delicioso", hex: "#1E1005", code: "00YY 09/069" },
      { name: "Sombras de Acero", hex: "#221E18", code: "16YR 12/037" },
      { name: "Gamuza Gris", hex: "#3A3428", code: "24YY 22/048" },
      { name: "Café", hex: "#301A08", code: "11YY 14/105" },
      { name: "Artilugio Gris", hex: "#2C2820", code: "22YR 17/023" },
      { name: "Camino Urbano", hex: "#504A3C", code: "15YY 33/043" },
      { name: "Rama de Invierno", hex: "#5C3C15", code: "22YY 32/156" },
      { name: "Piedra Sofisticada", hex: "#38302A", code: "62YR 22/051" },
      { name: "Rocas en Movimiento", hex: "#726450", code: "21YY 45/068" },
      { name: "Sabor a Té", hex: "#7E5822", code: "29YY 46/170" },
      { name: "Molde de Arcilla", hex: "#464034", code: "73YR 26/063" },
      { name: "Pluma Gris", hex: "#887C65", code: "39YY 53/067" },
      { name: "Muros de Olivo", hex: "#906C40", code: "30YY 53/124" },
      { name: "Turrón de Almendra", hex: "#907868", code: "67YR 56/055" },
      { name: "Sensación de Piedra", hex: "#A09880", code: "19YY 61/057" },
      { name: "Sendero en el Sahara", hex: "#B09060", code: "33YY 65/106" },
      { name: "Sabiduría Blanca", hex: "#BCB4AA", code: "81YR 73/022" },
      { name: "Beige Pálido", hex: "#C8C0A8", code: "27YY 77/042" },
      { name: "Nube de Arena", hex: "#C8AC78", code: "43YY 73/081" },
      { name: "Sensación Diáfana", hex: "#D5D0CC", code: "04YR 82/018" },
      { name: "Domingo Nublado", hex: "#D8D4C2", code: "30YY 83/026" },
      { name: "Espejismo Vigoroso", hex: "#CEBC88", code: "41YY 77/065" },
      { name: "Mariposa Nocturna", hex: "#D8D0B8", code: "21YY 82/053" },
      { name: "Resplandor de Mármol", hex: "#C0B490", code: "08YY 72/077" },
      { name: "Elección Natural", hex: "#D4CC90", code: "64YY 83/058" },
      { name: "Pliegues de Chifón", hex: "#D2CCBF", code: "92YR 80/033" },
      { name: "Ritual Blanco", hex: "#B0A278", code: "10YY 65/095" },
      { name: "Adorable Primavera", hex: "#CBBA82", code: "53YY 77/064" },
      { name: "Beige Osado", hex: "#A89875", code: "00YY 62/067" },
      { name: "Castillo de Arena Claro", hex: "#A8905C", code: "15YY 57/150" },
      { name: "Suelo Dorado", hex: "#C2A855", code: "58YY 72/095" },
      { name: "Amanecer Fogoso", hex: "#766556", code: "96YR 43/054" },
      { name: "Granero del Campo", hex: "#8C7840", code: "12YY 47/163" },
      { name: "Neutro Clásico", hex: "#B29040", code: "46YY 63/147" },
      { name: "Torre de Tierra", hex: "#3C3020", code: "02YY 23/054" },
      { name: "Burbuja de Campo", hex: "#684E28", code: "10YY 33/163" },
      { name: "Salón Neutral", hex: "#9A8035", code: "52YY 55/131" },
      { name: "Horno de Arcilla", hex: "#38291B", code: "02YY 22/055" },
      { name: "Magdalena de Café", hex: "#472E18", code: "08YY 21/130" },
      { name: "Thumo del Atardecer", hex: "#7A5C28", code: "48YY 38/109" },
      { name: "Embarcadero de Piedra", hex: "#282018", code: "95YR 16/038" },
      { name: "Magdalena de Chocolate", hex: "#261808", code: "07YY 12/071" },
      { name: "Tierra Urbana", hex: "#5C4418", code: "50YY 27/105" },
      { name: "Humo Espeso", hex: "#171210", code: "96YR 09/033" },
      { name: "Roble Magnífico", hex: "#160E05", code: "06YY 08/052" },
      { name: "Oscura Melodía", hex: "#1C1505", code: "59YY 09/077" },
    ],
  },
  {
    name: "Grises y Neutros",
    colors: [
      { name: "Marrón Camuflaje", hex: "#181614", code: "26YY 09/028" },
      { name: "Sueño de Lejas", hex: "#1A1A18", code: "29GY 10/029" },
      { name: "Oscuridad Celeste", hex: "#101214", code: "09BB 07/008" },
      { name: "Tormenta de Noviembre", hex: "#272420", code: "53YY 15/038" },
      { name: "Sensación Invernal", hex: "#262624", code: "16GY 15/037" },
      { name: "Plomizo Intenso", hex: "#1A1C1E", code: "90BG 11/016" },
      { name: "Pelaje Gris", hex: "#383430", code: "54YY 22/044" },
      { name: "Gris Irónico", hex: "#3D3A36", code: "97YY 24/045" },
      { name: "Gris Cable", hex: "#2A2C2E", code: "03BB 17/015" },
      { name: "Cola de Elefante", hex: "#4E4A44", code: "46YY 30/057" },
      { name: "Momento de Gris", hex: "#504C48", code: "81YY 31/059" },
      { name: "Adoquín", hex: "#565860", code: "12BB 35/025" },
      { name: "Sensación Romana", hex: "#757068", code: "54YY 46/065" },
      { name: "Calma Gris", hex: "#726E68", code: "83YY 45/055" },
      { name: "Gris Plata", hex: "#7A7C7E", code: "95BG 49/025" },
      { name: "Revolución Fluvial", hex: "#A09888", code: "54YY 63/072" },
      { name: "Cría de Nutria", hex: "#8D8880", code: "99YY 55/056" },
      { name: "Espíritu Osado", hex: "#A4A6A8", code: "84BG 66/028" },
      { name: "Mañana de Setas", hex: "#B8B0A0", code: "69YY 71/071" },
      { name: "Gris Chic", hex: "#A8A5A0", code: "96YY 66/036" },
      { name: "Gris Ballena", hex: "#BCBCBC", code: "59BG 74/020" },
      { name: "Blanco Quirúrgico", hex: "#E0DDD8", code: "83YY 88/033" },
      { name: "Dunas Grises", hex: "#BABAB0", code: "81YY 73/041" },
      { name: "Lluvia de Telescopio", hex: "#BEBEC0", code: "06BB 75/016" },
      { name: "Copo de Nieve Eterno", hex: "#CECAC4", code: "89YY 80/039" },
      { name: "Sombra de Gaviota", hex: "#C0C2BF", code: "43BG 75/043" },
      { name: "Toque de Humo", hex: "#D8D6D4", code: "81YR 85/004" },
      { name: "Reflejo de Lago", hex: "#C0BFB8", code: "39GY 75/033" },
      { name: "Mar Silencioso", hex: "#ACACB0", code: "61BG 68/049" },
      { name: "Nubes Grises", hex: "#B6B6B4", code: "08GY 72/006" },
      { name: "Gris Borroso", hex: "#A8A8A4", code: "94GY 66/038" },
      { name: "Melancolía", hex: "#9898A0", code: "85BG 59/064" },
      { name: "Carbonilla Claro", hex: "#9E9E9E", code: "88BG 62/005" },
      { name: "Jeans Grises", hex: "#848480", code: "45GY 52/046" },
      { name: "Gris Azulado", hex: "#6E7078", code: "90BG 44/049" },
      { name: "Costura Gris", hex: "#606264", code: "33BB 38/004" },
      { name: "Caqui Luminoso", hex: "#757570", code: "20GY 46/067" },
      { name: "Tormenta Melancólica", hex: "#404450", code: "87BG 27/077" },
      { name: "Clareza Tormenta", hex: "#3E4040", code: "16BB 25/001" },
      { name: "Guijarro Matinal", hex: "#606060", code: "37GY 38/050" },
      { name: "Noches Sombrías", hex: "#2C3038", code: "93BG 19/066" },
      { name: "Peltre Aterciopelado", hex: "#222222", code: "36RR 14/002" },
      { name: "Gris Hamster", hex: "#3C3C3A", code: "51GY 24/050" },
      { name: "Anochecer en el Lago", hex: "#1C2028", code: "81BG 12/055" },
      { name: "Espacio de Fantasía", hex: "#111112", code: "60RR 07/002" },
      { name: "Gris Vigoroso", hex: "#232324", code: "64GY 14/039" },
      { name: "Explosión de Gris", hex: "#141820", code: "89BG 09/087" },
      { name: "Suave Hollín", hex: "#0F0F0E", code: "90YR 06/001" },
    ],
  },
];

function ColorSwatch({ color, onClick, selected, onDelete }: { color: Color; onClick: () => void; selected: boolean; onDelete?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex flex-col cursor-pointer group relative z-0 hover:z-10 hover:-translate-y-1 hover:shadow-xl hover:border-gray-400 transition-all duration-150 rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm"
    >
      <div
        className="w-full transition-all duration-150 relative"
        style={{ backgroundColor: color.hex, height: "52px" }}
      >
        {selected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center shadow">
              <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/40 hover:bg-red-500 flex items-center justify-center transition-colors"
            title="Eliminar color"
          >
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div className="bg-white px-2 py-1.5 group-hover:bg-gray-50 transition-colors duration-150" style={{ minHeight: "38px" }}>
        <p className="text-[8px] font-semibold text-gray-800 leading-tight line-clamp-2">
          {color.name}
        </p>
        <p className="text-[7px] text-gray-400 leading-tight mt-0.5">
          {color.code}
        </p>
      </div>
    </div>
  );
}

// Representative color for each family (used in selector dots)
const familyMainColors = [
  "#C9464F", "#D07040", "#DAA520", "#4CAF50",
  "#00A898", "#1878D8", "#C4B4A4", "#666666",
];

const DURABILITY_OPTIONS: { years: number; yield: string }[] = [
  { years: 2, yield: "4 a 6 m²/L" },
  { years: 3, yield: "6 a 7 m²/L" },
  { years: 4, yield: "7 a 8 m²/L" },
  { years: 7, yield: "7 a 9 m²/L" },
];

const ADMIN_PASSWORD = "bfm2024";

export default function Home() {
  const [selectedFamily, setSelectedFamily] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [durability, setDurability] = useState<Record<string, number[]>>({});
  const [durabilityPrices, setDurabilityPrices] = useState<Record<string, string>>({});
  const [editDurabilityPrices, setEditDurabilityPrices] = useState<Record<string, string>>({});
  const [durabilityOnSale, setDurabilityOnSale] = useState<number[]>([]);
  const [editDurabilityOnSale, setEditDurabilityOnSale] = useState<number[]>([]);
  const [customColors, setCustomColors] = useState<Record<string, Color[]>>({});
  const [showAddColorModal, setShowAddColorModal] = useState(false);
  const [addColorFamily, setAddColorFamily] = useState("");
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#FF0000");
  const [newColorCode, setNewColorCode] = useState("");
  const [addColorSaving, setAddColorSaving] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<number | null>(null);
  const [nameOverrides, setNameOverrides] = useState<Record<string, { name: string; code: string }>>({});
  const [deletedColorCodes, setDeletedColorCodes] = useState<string[]>([]);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editHex, setEditHex] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [eyedropperSupported] = useState(() => typeof window !== "undefined" && "EyeDropper" in window);

  // Admin auth
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showSiteSettings, setShowSiteSettings] = useState(false);

  // Site branding (editable by admin, persisted in localStorage)
  const [siteName, setSiteName] = useState("Pinturas BFM");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logo2Url, setLogo2Url] = useState<string | null>(null);
  const [editSiteName, setEditSiteName] = useState("Pinturas BFM");
  const [editLogoUrl, setEditLogoUrl] = useState<string | null>(null);
  const [editLogo2Url, setEditLogo2Url] = useState<string | null>(null);
  const [logoSaveError, setLogoSaveError] = useState("");

  // Load data from Supabase on mount; restore admin session
  React.useEffect(() => {
    if (sessionStorage.getItem("pinturas-admin") === "1") setIsAdmin(true);
    // Load color overrides + durability from Supabase
    loadColorSettings().then((data) => {
      const hexMap: Record<string, string> = {};
      const durMap: Record<string, number[]> = {};
      for (const [code, val] of Object.entries(data)) {
        if (val.hex) hexMap[code] = val.hex;
        if (val.durability_years?.length) durMap[code] = val.durability_years;
      }
      setOverrides(hexMap);
      setDurability(durMap);
    });
    // Restore logos from cache immediately (before Supabase responds)
    const cachedLogo = localStorage.getItem("pinturas_logoUrl");
    const cachedLogo2 = localStorage.getItem("pinturas_logo2Url");
    if (cachedLogo) setLogoUrl(cachedLogo);
    if (cachedLogo2) setLogo2Url(cachedLogo2);
    // Load site branding from Supabase
    loadSiteSettings().then(({ name, logoUrl: logo, logo2Url: logo2 }) => {
      setSiteName(name);
      if (logo) { setLogoUrl(logo); localStorage.setItem("pinturas_logoUrl", logo); }
      if (logo2) { setLogo2Url(logo2); localStorage.setItem("pinturas_logo2Url", logo2); }
    });
    // Load global durability prices and on-sale flags
    loadDurabilityPrices().then((p) => setDurabilityPrices(p));
    loadDurabilityOnSale().then((s) => setDurabilityOnSale(s));
    // Load custom colors
    loadCustomColors().then((data) => {
      const mapped: Record<string, Color[]> = {};
      for (const [family, colors] of Object.entries(data)) {
        mapped[family] = colors.map((c) => ({ name: c.name, hex: c.hex, code: c.code, id: c.id }));
      }
      setCustomColors(mapped);
    });
    // Load built-in color overrides and deleted list
    loadColorNameOverrides().then(setNameOverrides);
    loadDeletedColors().then(setDeletedColorCodes);
  }, []);

  function handleUserClick() {
    if (isAdmin) {
      setShowAdminMenu((v) => !v);
    } else {
      setLoginPassword("");
      setLoginError(false);
      setShowLoginModal(true);
    }
  }

  function handleLogin() {
    if (loginPassword === ADMIN_PASSWORD) {
      sessionStorage.setItem("pinturas-admin", "1");
      setIsAdmin(true);
      setShowLoginModal(false);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("pinturas-admin");
    setIsAdmin(false);
    setShowAdminMenu(false);
  }

  function openAddColorModal(familyName: string) {
    setAddColorFamily(familyName);
    setNewColorName("");
    setNewColorHex("#FF0000");
    setNewColorCode("");
    setShowAddColorModal(true);
  }

  async function handleAddColor() {
    if (!newColorName.trim()) return;
    setAddColorSaving(true);
    setSaveError("");
    try {
      const saved = await addCustomColor(addColorFamily, newColorName.trim(), newColorHex, newColorCode.trim());
      const newColor: Color = { name: saved.name, hex: saved.hex, code: saved.code, id: saved.id };
      setCustomColors((prev) => ({
        ...prev,
        [addColorFamily]: [newColor, ...(prev[addColorFamily] ?? [])],
      }));
      setShowAddColorModal(false);
    } catch {
      setSaveError("No se pudo guardar el color. Verificá tu conexión e intentá de nuevo.");
    } finally {
      setAddColorSaving(false);
    }
  }

  async function handleDeleteColor(color: Color) {
    setSaveError("");
    try {
      if (color.id) {
        // Custom color — remove from DB and state
        await deleteCustomColor(color.id);
        setCustomColors((prev) => {
          const family = Object.keys(prev).find((f) => prev[f].some((c) => c.id === color.id));
          if (!family) return prev;
          return { ...prev, [family]: prev[family].filter((c) => c.id !== color.id) };
        });
      } else {
        // Built-in color — save to DB first, then update UI
        const oc = origCode(color);
        const next = [...deletedColorCodes, oc];
        await saveDeletedColors(next);
        setDeletedColorCodes(next);
      }
      if (selectedColor && origCode(selectedColor) === origCode(color)) {
        setSelectedColor(null);
      }
    } catch {
      setSaveError("No se pudo eliminar el color. Verificá tu conexión e intentá de nuevo.");
    }
  }

  function openSiteSettings() {
    setEditSiteName(siteName);
    setEditLogoUrl(logoUrl);
    setEditLogo2Url(logo2Url);
    setEditDurabilityPrices({ ...durabilityPrices });
    setEditDurabilityOnSale([...durabilityOnSale]);
    setShowSiteSettings(true);
    setShowAdminMenu(false);
  }

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEditLogoUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function uploadLogoData(dataUrl: string): Promise<string> {
    const mime = dataUrl.split(";")[0].replace("data:", "");
    const ext = mime.split("/")[1] ?? "png";
    const { signedUrl, publicUrl } = await createLogoUploadUrl(ext);
    const blob = await fetch(dataUrl).then((r) => r.blob());
    const uploadRes = await fetch(signedUrl, { method: "PUT", body: blob, headers: { "Content-Type": mime } });
    if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
    return publicUrl;
  }

  async function saveSiteSettings() {
    setLogoSaveError("");
    try {
      await saveSiteName(editSiteName);
      await saveDurabilityPrices(editDurabilityPrices);
      await saveDurabilityOnSale(editDurabilityOnSale);

      // Logo 1
      if (editLogoUrl && editLogoUrl.startsWith("data:")) {
        const publicUrl = await uploadLogoData(editLogoUrl);
        await saveSiteLogoUrl(publicUrl);
        setLogoUrl(publicUrl);
        localStorage.setItem("pinturas_logoUrl", publicUrl);
      } else {
        await saveSiteLogoUrl(editLogoUrl);
        setLogoUrl(editLogoUrl);
        if (editLogoUrl) localStorage.setItem("pinturas_logoUrl", editLogoUrl);
      }

      // Logo 2
      if (editLogo2Url && editLogo2Url.startsWith("data:")) {
        const publicUrl = await uploadLogoData(editLogo2Url);
        await saveSiteLogo2Url(publicUrl);
        setLogo2Url(publicUrl);
        localStorage.setItem("pinturas_logo2Url", publicUrl);
      } else {
        await saveSiteLogo2Url(editLogo2Url);
        setLogo2Url(editLogo2Url);
        if (editLogo2Url) localStorage.setItem("pinturas_logo2Url", editLogo2Url);
      }
    } catch (err) {
      console.error("Error al guardar configuración:", err);
      setLogoSaveError("No se pudo guardar. Verificá tu conexión e intentá de nuevo.");
      return;
    }
    setSiteName(editSiteName);
    setDurabilityPrices(editDurabilityPrices);
    setDurabilityOnSale(editDurabilityOnSale);
    setShowSiteSettings(false);
  }

  // Helper: get the DB key for a color (original code before any override)
  function origCode(color: Color) {
    return color.originalCode ?? color.code;
  }

  // Sync editHex/editName/editCode when selected color changes
  React.useEffect(() => {
    if (selectedColor) {
      setEditHex(overrides[origCode(selectedColor)] ?? selectedColor.hex);
      setEditName(selectedColor.name);
      setEditCode(selectedColor.code);
    }
  }, [selectedColor?.code]);

  function applyHex(hex: string) {
    setEditHex(hex);
  }

  async function handleSave() {
    if (!selectedColor) return;
    const oc = origCode(selectedColor);
    const normalized = editHex.startsWith("#") ? editHex : "#" + editHex;
    setSaveError("");

    try {
      // Save to DB first — UI updates only after DB confirms
      await saveColorHex(oc, normalized);

      // Save name/code if changed
      const nameChanged = editName.trim() !== selectedColor.name || editCode.trim() !== selectedColor.code;
      if (nameChanged) {
        if (selectedColor.id) {
          await updateCustomColor(selectedColor.id, editName.trim(), normalized, editCode.trim());
        } else {
          await saveColorNameOverride(oc, editName.trim(), editCode.trim());
        }
      }

      // DB saves confirmed — now update UI state
      setOverrides((prev) => ({ ...prev, [oc]: normalized }));
      if (nameChanged) {
        if (selectedColor.id) {
          setCustomColors((prev) => {
            const family = Object.keys(prev).find((f) => prev[f].some((c) => c.id === selectedColor.id));
            if (!family) return prev;
            return {
              ...prev,
              [family]: prev[family].map((c) =>
                c.id === selectedColor.id ? { ...c, name: editName.trim(), hex: normalized, code: editCode.trim() } : c
              ),
            };
          });
        } else {
          setNameOverrides((prev) => ({ ...prev, [oc]: { name: editName.trim(), code: editCode.trim() } }));
        }
      }
      setSelectedColor({ ...selectedColor, name: editName.trim(), code: editCode.trim(), hex: normalized });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } catch {
      setSaveError("No se pudo guardar. Verificá tu conexión e intentá de nuevo.");
    }
  }

  async function handleEyedropper() {
    if (!eyedropperSupported) return;
    try {
      // @ts-expect-error EyeDropper not yet in TS lib
      const dropper = new EyeDropper();
      const result = await dropper.open();
      applyHex(result.sRGBHex);
    } catch {
      // user cancelled
    }
  }

  async function toggleDurability(code: string, years: number) {
    const current = durability[code] ?? [];
    const next = current.includes(years)
      ? current.filter((y) => y !== years)
      : [...current, years];
    setDurability((prev) => ({ ...prev, [code]: next }));
    setSaveError("");
    try {
      await saveColorDurability(code, next);
    } catch {
      // Revert state if save fails
      setDurability((prev) => ({ ...prev, [code]: current }));
      setSaveError("No se pudo guardar la durabilidad. Verificá tu conexión e intentá de nuevo.");
    }
  }

  function getEffectiveHex(color: Color) {
    return overrides[origCode(color)] ?? color.hex;
  }

  const currentFamily = colorFamilies[selectedFamily];

  const displayedColors = useMemo(() => {
    const custom = customColors[currentFamily.name] ?? [];
    const builtIn = currentFamily.colors.filter((c) => !deletedColorCodes.includes(c.code));
    const builtInWithOverrides: Color[] = builtIn.map((c) => {
      const ov = nameOverrides[c.code];
      if (!ov) return c;
      return { ...c, name: ov.name, code: ov.code, originalCode: c.code };
    });
    let all = [...custom, ...builtInWithOverrides];
    if (selectedQuality !== null) {
      all = all.filter((c) => (durability[origCode(c)] ?? []).includes(selectedQuality));
    }
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [search, currentFamily, customColors, deletedColorCodes, nameOverrides, selectedQuality, durability]);

  const allSearchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();

    // Built-in colors with name/code overrides applied
    const builtInResults = colorFamilies.flatMap((f) =>
      f.colors
        .filter((c) => !deletedColorCodes.includes(c.code))
        .map((c) => {
          const ov = nameOverrides[c.code];
          return ov ? { ...c, name: ov.name, code: ov.code, originalCode: c.code } : c;
        })
        .filter((c) => {
          if (selectedQuality !== null && !(durability[origCode(c)] ?? []).includes(selectedQuality)) return false;
          return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
        })
    );

    // Custom colors across all families
    const customResults = Object.values(customColors).flat().filter((c) => {
      if (selectedQuality !== null && !(durability[c.code] ?? []).includes(selectedQuality)) return false;
      return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
    });

    return [...customResults, ...builtInResults];
  }, [search, selectedQuality, durability, deletedColorCodes, nameOverrides, customColors]);

  // Banner gradient from first 5 colors of the family
  const bannerGradient = currentFamily.colors
    .slice(0, 5)
    .map((c) => c.hex)
    .join(", ");

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar isAdmin={isAdmin} onUserClick={handleUserClick} siteName={siteName} logoUrl={logoUrl} logo2Url={logo2Url} />

      {/* Error toast */}
      {saveError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-red-500 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg flex items-center gap-3">
          <span>{saveError}</span>
          <button onClick={() => setSaveError("")} className="text-white/80 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Login modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Acceso administrador</h2>
            <p className="text-xs text-gray-400 mb-5">Ingresá la contraseña para editar la paleta</p>

            <input
              type="password"
              value={loginPassword}
              onChange={(e) => { setLoginPassword(e.target.value); setLoginError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="Contraseña"
              autoFocus
              className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 mb-1 ${
                loginError ? "border-red-400" : "border-gray-200"
              }`}
            />
            {loginError && (
              <p className="text-[11px] text-red-400 mb-3">Contraseña incorrecta</p>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowLoginModal(false)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogin}
                className="flex-1 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors"
              >
                Ingresar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin dropdown menu */}
      {isAdmin && showAdminMenu && (
        <div
          className="fixed inset-0 z-[90]"
          onClick={() => setShowAdminMenu(false)}
        >
          <div
            className="absolute right-4 top-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-52"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={openSiteSettings}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configuración del sitio
            </button>
            <hr className="my-1 border-gray-100" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* Site settings modal */}
      {showSiteSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Configuración del sitio</h2>
            <p className="text-xs text-gray-400 mb-6">Los cambios se verán en la página pública</p>

            {/* Logo upload */}
            <p className="text-xs font-semibold text-gray-600 mb-2">Logo</p>
            <div className="flex items-center gap-4 mb-5">
              {/* Preview — matches exactly how it looks in navbar */}
              <div className="h-32 w-72 flex items-center justify-start flex-shrink-0 border border-gray-100 rounded-lg bg-gray-50 px-2">
                {editLogoUrl ? (
                  <img src={editLogoUrl} alt="logo" className="h-28 w-auto max-w-full object-contain" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 via-yellow-400 to-green-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs">BFM</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors text-center">
                  Cargar imagen
                  <input type="file" accept="image/*" className="sr-only" onChange={handleLogoFile} />
                </label>
                {editLogoUrl && (
                  <button
                    onClick={() => setEditLogoUrl(null)}
                    className="text-[11px] text-red-400 hover:text-red-500 transition-colors"
                  >
                    Quitar logo
                  </button>
                )}
              </div>
            </div>

            {/* Logo 2 upload */}
            <p className="text-xs font-semibold text-gray-600 mb-2">Logo secundario</p>
            <div className="flex items-center gap-4 mb-5">
              <div className="h-32 w-72 flex items-center justify-start flex-shrink-0 border border-gray-100 rounded-lg bg-gray-50 px-2">
                {editLogo2Url ? (
                  <img src={editLogo2Url} alt="logo2" className="h-28 w-auto max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-gray-400">Sin logo secundario</span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors text-center">
                  Cargar imagen
                  <input type="file" accept="image/*" className="sr-only" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => setEditLogo2Url(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }} />
                </label>
                {editLogo2Url && (
                  <button onClick={() => setEditLogo2Url(null)} className="text-[11px] text-red-400 hover:text-red-500 transition-colors">
                    Quitar logo
                  </button>
                )}
              </div>
            </div>

            {/* Site name */}
            <p className="text-xs font-semibold text-gray-600 mb-2">Nombre del sitio</p>
            <input
              type="text"
              value={editSiteName}
              onChange={(e) => setEditSiteName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 mb-6"
              placeholder="Pinturas BFM"
            />

            {/* Precios por durabilidad */}
            <p className="text-xs font-semibold text-gray-600 mb-2">Precios por durabilidad</p>
            <div className="flex flex-col gap-2 mb-6">
              {DURABILITY_OPTIONS.map((opt) => {
                const isOnSale = editDurabilityOnSale.includes(opt.years);
                return (
                  <div key={opt.years} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-16 flex-shrink-0">{opt.years} años</span>
                    <input
                      type="text"
                      value={editDurabilityPrices[String(opt.years)] ?? ""}
                      onChange={(e) => setEditDurabilityPrices((prev) => ({ ...prev, [String(opt.years)]: e.target.value }))}
                      placeholder="ej: $350"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                    />
                    <label className={`flex items-center gap-1.5 cursor-pointer px-2.5 py-2 rounded-lg border text-xs font-medium transition-colors flex-shrink-0 ${
                      isOnSale ? "bg-orange-50 border-orange-400 text-orange-600" : "bg-white border-gray-200 text-gray-400 hover:border-orange-300"
                    }`}>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isOnSale}
                        onChange={() => setEditDurabilityOnSale((prev) =>
                          prev.includes(opt.years) ? prev.filter((y) => y !== opt.years) : [...prev, opt.years]
                        )}
                      />
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Oferta
                    </label>
                  </div>
                );
              })}
            </div>

            {logoSaveError && (
              <p className="text-[11px] text-red-400 mb-3">{logoSaveError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowSiteSettings(false)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={saveSiteSettings}
                className="flex-1 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add color modal */}
      {showAddColorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-xs mx-4">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Agregar color — {addColorFamily}</h2>

            {/* Color picker */}
            <div className="flex items-center gap-3 mb-4">
              <label className="cursor-pointer relative flex-shrink-0">
                <div className="w-10 h-10 rounded-lg border-2 border-gray-200 shadow-sm" style={{ backgroundColor: newColorHex }} />
                <input
                  type="color"
                  value={newColorHex}
                  onChange={(e) => setNewColorHex(e.target.value)}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
              </label>
              <input
                type="text"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                maxLength={7}
                className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-xs font-mono text-gray-700 focus:outline-none focus:border-teal-400"
                placeholder="#000000"
              />
            </div>

            <input
              type="text"
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              placeholder="Nombre del color *"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-teal-400"
            />
            <input
              type="text"
              value={newColorCode}
              onChange={(e) => setNewColorCode(e.target.value)}
              placeholder="Código (opcional, ej: 14RR 12/349)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-5 focus:outline-none focus:border-teal-400"
            />

            {saveError && (
              <p className="text-[11px] text-red-400 mb-3">{saveError}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { setShowAddColorModal(false); setSaveError(""); }}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddColor}
                disabled={!newColorName.trim() || addColorSaving}
                className="flex-1 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {addColorSaving ? "Guardando..." : "Agregar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 pt-6">
        <>
            {/* Title */}
            <h1 className="text-center text-2xl sm:text-3xl font-light text-gray-800 mb-5 px-4">
              Elige tu color favorito
            </h1>

            {/* Search */}
            <div className="flex justify-center mb-6 px-4">
              <div className="relative w-full max-w-lg">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar color"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-gray-400 text-gray-700"
                />
              </div>
            </div>

            {/* Quality / price selector */}
            {DURABILITY_OPTIONS.some((opt) => durabilityPrices[String(opt.years)]) && (
              <div className="px-4 mb-6">
                <p className="text-center text-base text-gray-900 mb-3 uppercase tracking-widest font-bold">
                  Filtrá por calidad y precio
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {/* "Todos" chip */}
                  <button
                    onClick={() => { setSelectedQuality(null); setSelectedColor(null); }}
                    className={`px-5 py-2 rounded-full text-sm font-medium border transition-all ${
                      selectedQuality === null
                        ? "bg-gray-800 text-white border-gray-800 shadow"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    Todos los colores
                  </button>

                  {DURABILITY_OPTIONS.filter((opt) => durabilityPrices[String(opt.years)]).map((opt) => {
                    const price = durabilityPrices[String(opt.years)];
                    const active = selectedQuality === opt.years;
                    const onSale = durabilityOnSale.includes(opt.years);
                    return (
                      <button
                        key={opt.years}
                        onClick={() => { setSelectedQuality(active ? null : opt.years); setSelectedColor(null); }}
                        className={`relative flex flex-col items-center px-5 py-2.5 rounded-2xl border transition-all shadow-sm ${
                          active
                            ? "bg-teal-500 border-teal-500 text-white shadow-md scale-105"
                            : onSale
                            ? "bg-orange-50 border-orange-400 text-gray-700 hover:shadow"
                            : "bg-white text-gray-700 border-gray-200 hover:border-teal-300 hover:shadow"
                        }`}
                      >
                        {onSale && (
                          <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            active ? "bg-white text-orange-500" : "bg-orange-500 text-white"
                          }`}>
                            EN OFERTA
                          </span>
                        )}
                        <span className="font-bold text-sm">{opt.years} años</span>
                        <span className={`text-base font-extrabold leading-tight ${active ? "text-white" : onSale ? "text-orange-500" : "text-teal-600"}`}>
                          {price}
                        </span>
                        <span className={`text-[10px] leading-tight ${active ? "text-white/70" : "text-gray-400"}`}>
                          {opt.yield}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Active filter banner */}
                {selectedQuality !== null && (
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <span className="text-xs text-teal-600 font-medium">
                      Mostrando solo colores disponibles en pintura de {selectedQuality} años
                    </span>
                    <button
                      onClick={() => { setSelectedQuality(null); setSelectedColor(null); }}
                      className="text-xs text-gray-400 hover:text-gray-600 underline"
                    >
                      Limpiar
                    </button>
                  </div>
                )}
              </div>
            )}

            {search.trim() ? (
              /* Search results - show all matching colors */
              <div className="px-4 pb-10">
                {allSearchResults.length === 0 ? (
                  <p className="text-center text-gray-400 py-20">
                    No se encontraron colores para &quot;{search}&quot;
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 mb-4 text-center">
                      {allSearchResults.length} colores encontrados
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-12 gap-0">
                      {allSearchResults.map((color) => (
                        <ColorSwatch key={color.code} color={color} onClick={() => setSelectedColor(color)} selected={selectedColor?.code === color.code} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Family selector dots */}
                <div className="flex justify-center gap-1.5 mb-4">
                  {colorFamilies.map((family, i) => (
                    <button
                      key={family.name}
                      onClick={() => { setSelectedFamily(i); setSelectedColor(null); }}
                      title={family.name}
                      className={`w-8 h-8 rounded-md transition-all ${
                        selectedFamily === i
                          ? "ring-2 ring-offset-1 ring-gray-400 scale-110"
                          : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: familyMainColors[i] }}
                    />
                  ))}
                </div>

                {/* Disclaimer */}
                <div className="mx-auto max-w-xl px-4 mb-5 text-center">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Los colores mostrados son aproximados. Para apreciar el tono más real, te invitamos a consultar nuestro catálogo físico en tienda.
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed mt-1">
                    💡 <span className="font-medium">Tip:</span> La iluminación de tu espacio —ya sea amarilla o blanca— puede influir en la percepción del tono final.
                  </p>
                </div>

                {/* Banner */}
                <div
                  className="w-full h-14 mb-1"
                  style={{
                    background: `linear-gradient(to right, ${bannerGradient})`,
                  }}
                />

                {/* Family name */}
                <p className="text-center text-sm font-medium text-gray-600 mb-4">
                  {currentFamily.name}
                </p>

                {/* Add color button — admin only */}
                {isAdmin && (
                  <div className="flex justify-start px-3 mb-3">
                    <button
                      onClick={() => openAddColorModal(currentFamily.name)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-teal-400 text-teal-500 text-xs font-semibold hover:bg-teal-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Agregar color
                    </button>
                  </div>
                )}

                {/* Color swatches grid — row-by-row so panel opens below selected row */}
                <div key={selectedFamily} className="pb-10 px-3">
                  {Array.from({ length: Math.ceil(displayedColors.length / 3) }, (_, rowIndex) => {
                    const rowColors = displayedColors.slice(rowIndex * 3, rowIndex * 3 + 3);
                    const selectedRowIndex = selectedColor
                      ? Math.floor(displayedColors.findIndex(c => c.code === selectedColor.code) / 3)
                      : -1;
                    return (
                      <React.Fragment key={rowIndex}>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          {rowColors.map((color) => (
                            <ColorSwatch
                              key={color.id ?? color.code}
                              color={{ ...color, hex: getEffectiveHex(color) }}
                              onClick={() => setSelectedColor(selectedColor?.code === color.code ? null : color)}
                              selected={selectedColor?.code === color.code}
                              onDelete={isAdmin ? () => handleDeleteColor(color) : undefined}
                            />
                          ))}
                        </div>
                        {selectedRowIndex === rowIndex && selectedColor && (
                          <div className="flex flex-col sm:flex-row w-full mb-1.5">
                            {/* Top/Left: color preview (live, updates with editHex) */}
                            <div className="relative w-full sm:w-2/5 flex-shrink-0 flex flex-col justify-between p-4 transition-colors duration-200" style={{ backgroundColor: editHex, minHeight: "80px" }}>
                              <div>
                                <p className="text-white text-xs font-semibold drop-shadow leading-tight">{selectedColor.name}</p>
                                <p className="text-white/80 text-[10px] drop-shadow mt-0.5">{selectedColor.code}</p>
                              </div>
                            </div>

                            {/* Bottom/Right: admin editor OR public read-only */}
                            <div className="relative flex-1 bg-white flex flex-col justify-center gap-3 px-5 py-4 border-t sm:border-t-0 sm:border-l border-gray-100">
                              {/* Close button — always visible */}
                              <button
                                onClick={() => setSelectedColor(null)}
                                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>

                              {isAdmin ? (
                                /* ── ADMIN: edit panel ── */
                                <>
                                  <p className="text-[11px] font-semibold text-gray-700">Editar color</p>

                                  {/* Name + code */}
                                  <div className="flex flex-col gap-1.5">
                                    <input
                                      type="text"
                                      value={editName}
                                      onChange={(e) => setEditName(e.target.value)}
                                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-teal-400"
                                      placeholder="Nombre del color"
                                    />
                                    <input
                                      type="text"
                                      value={editCode}
                                      onChange={(e) => setEditCode(e.target.value)}
                                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs font-mono text-gray-500 focus:outline-none focus:border-teal-400"
                                      placeholder="Código"
                                    />
                                  </div>

                                  {/* Color picker row */}
                                  <div className="flex items-center gap-3">
                                    <label className="cursor-pointer relative flex-shrink-0">
                                      <div className="w-10 h-10 rounded-lg border-2 border-gray-200 shadow-sm" style={{ backgroundColor: editHex }} />
                                      <input
                                        type="color"
                                        value={editHex.length === 7 ? editHex : "#000000"}
                                        onChange={(e) => applyHex(e.target.value)}
                                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                      />
                                    </label>
                                    <input
                                      type="text"
                                      value={editHex}
                                      onChange={(e) => applyHex(e.target.value)}
                                      maxLength={7}
                                      className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-xs font-mono text-gray-700 focus:outline-none focus:border-teal-400"
                                      placeholder="#000000"
                                    />
                                    {eyedropperSupported && (
                                      <button
                                        onClick={handleEyedropper}
                                        title="Tomar color de pantalla"
                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:border-teal-400 hover:bg-teal-50 transition-colors flex-shrink-0"
                                      >
                                        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21l3-3" />
                                        </svg>
                                      </button>
                                    )}
                                  </div>

                                  <button
                                    onClick={handleSave}
                                    className={`w-full py-1.5 rounded text-xs font-semibold transition-colors ${
                                      savedFlash ? "bg-green-500 text-white" : "bg-teal-500 hover:bg-teal-600 text-white"
                                    }`}
                                  >
                                    {savedFlash ? "Guardado" : "Guardar color"}
                                  </button>

                                  {overrides[origCode(selectedColor)] && (
                                    <button
                                      onClick={async () => {
                                        const oc = origCode(selectedColor);
                                        setOverrides((prev) => {
                                          const next = { ...prev };
                                          delete next[oc];
                                          return next;
                                        });
                                        applyHex(selectedColor.hex);
                                        await deleteColorHex(oc);
                                      }}
                                      className="text-[10px] text-gray-400 hover:text-red-400 transition-colors text-center"
                                    >
                                      Restablecer color original
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleDeleteColor(selectedColor)}
                                    className="text-[10px] text-red-400 hover:text-red-500 transition-colors text-center"
                                  >
                                    Eliminar color
                                  </button>

                                  <hr className="w-full border-gray-100" />

                                  <div>
                                    <p className="text-[11px] font-semibold text-gray-700 mb-1">Rendimiento aproximado</p>
                                    <div className="flex flex-col gap-1.5">
                                      {DURABILITY_OPTIONS.map((opt) => {
                                        const checked = (durability[origCode(selectedColor)] ?? []).includes(opt.years);
                                        const price = durabilityPrices[String(opt.years)];
                                        return (
                                          <label
                                            key={opt.years}
                                            className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-[11px] cursor-pointer select-none transition-colors ${
                                              checked ? "bg-teal-500 border-teal-500 text-white" : "bg-white border-gray-200 text-gray-600 hover:border-teal-300"
                                            }`}
                                          >
                                            <div className="flex items-center gap-2">
                                              <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleDurability(origCode(selectedColor), opt.years)} />
                                              <span className="font-semibold">{opt.years} años</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {price && <span className={checked ? "text-white font-bold" : "text-teal-600 font-bold"}>{price}</span>}
                                              <span className={checked ? "text-white/80" : "text-gray-400"}>{opt.yield}</span>
                                            </div>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                /* ── PÚBLICO: solo lectura ── */
                                <>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800 leading-tight">{selectedColor.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5 font-mono">{selectedColor.code}</p>
                                  </div>

                                  {/* Color circle */}
                                  <div className="w-14 h-14 rounded-full border-4 border-gray-100 shadow-inner" style={{ backgroundColor: editHex }} />

                                  {(() => {
                                    const selected = DURABILITY_OPTIONS.filter((opt) =>
                                      (durability[origCode(selectedColor)] ?? []).includes(opt.years)
                                    );
                                    return selected.length > 0 ? (
                                      <div>
                                        <p className="text-[11px] font-semibold text-gray-500 mb-1.5">Rendimiento aproximado</p>
                                        <div className="flex flex-col gap-1.5">
                                          {selected.map((opt) => {
                                            const price = durabilityPrices[String(opt.years)];
                                            return (
                                              <div
                                                key={opt.years}
                                                className={`relative flex items-center justify-between px-3 py-1.5 rounded-lg text-[11px] ${
                                                  durabilityOnSale.includes(opt.years)
                                                    ? "bg-orange-50 border border-orange-400"
                                                    : "bg-teal-50 border border-teal-200"
                                                }`}
                                              >
                                                {durabilityOnSale.includes(opt.years) && (
                                                  <span className="absolute -top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500 text-white whitespace-nowrap leading-none">
                                                    EN OFERTA
                                                  </span>
                                                )}
                                                <span className={`font-semibold ${durabilityOnSale.includes(opt.years) ? "text-orange-700" : "text-teal-700"}`}>{opt.years} años</span>
                                                <div className="flex items-center gap-3">
                                                  {price && <span className={`font-bold ${durabilityOnSale.includes(opt.years) ? "text-orange-500" : "text-teal-700"}`}>{price}</span>}
                                                  <span className={durabilityOnSale.includes(opt.years) ? "text-orange-400" : "text-teal-500"}>{opt.yield}</span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ) : null;
                                  })()}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </>
            )}
          </>
      </main>
    </div>
  );
}
