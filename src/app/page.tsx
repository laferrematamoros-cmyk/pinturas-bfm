"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import { sanitizeText, isValidHex, isValidPrice, LIMITS } from "@/lib/validation";
import {
  loadInitialData,
  saveColorHex,
  deleteColorHex,
  saveColorDurability,
  saveDurabilityPrices,
  saveDurabilityOnSale,
  saveRoomPreviewEnabled,
  saveCalcButtonEnabled,
  savePwaIconUrl,
  saveColorPageNumber,
  saveRoomButtonLabel,
  saveRendimientoLabel,
  saveCardHeight,
  saveGalonPrices,
  saveGalonOnSale,
  saveSiteName,
  saveSiteLogoUrl,
  saveSiteLogo2Url,
  saveAnnouncementText,
  createLogoUploadUrl,
  addCustomColor,
  updateCustomColor,
  deleteCustomColor,
  saveColorNameOverride,
  saveDeletedColors,
  saveFamilyColors,
  saveFamilyNames,
  saveFamilyBanners,
  saveColorOrder,
  login,
  logout,
  checkAdminSession,
  createOrder,
  loadOrders,
  updateOrderStatus,
  saveImpermeabilizante,
  type CustomColor,
  type OrderRow,
  type ImperConfig,
} from "@/lib/actions";

// Número de WhatsApp de la ferretería (destino de los pedidos).
const FERRETERIA_WA = "528682340531";

// Item del carrito (modo kiosko).
interface CartItem {
  uid: string;
  name: string;
  code: string;
  hex: string;
  years: number;   // 2 | 3 | 4 | 7
  cubetas: number;
  galones: number;
  pageNumber?: string | null;
}

interface Color {
  name: string;
  hex: string;
  code: string;
  id?: string;
  originalCode?: string; // built-in colors with overridden code
  pageNumber?: string | null;
}

interface ColorFamily {
  name: string;
  colors: Color[];
}

const colorFamilies: ColorFamily[] = [
  {
    name: "Rojos/Rosas",
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
];

function ColorSwatch({ color, onClick, selected, onDelete, cardHeight = 52, isFavorite, onToggleFavorite, bulkSelectMode, bulkSelected, reorderMode }: { color: Color; onClick: () => void; selected: boolean; onDelete?: () => void; cardHeight?: number; isFavorite?: boolean; onToggleFavorite?: () => void; bulkSelectMode?: boolean; bulkSelected?: boolean; reorderMode?: boolean }) {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col ${reorderMode ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"} group relative z-0 hover:z-10 hover:-translate-y-1 hover:shadow-xl hover:border-gray-400 transition-all duration-150 rounded-lg overflow-hidden border bg-white shadow-sm ${bulkSelected ? "border-teal-500 ring-2 ring-teal-400" : reorderMode ? "border-orange-200" : "border-gray-200"}`}
    >
      <div
        className="w-full transition-all duration-150 relative"
        style={{ backgroundColor: color.hex, height: `${cardHeight}px` }}
      >
        {reorderMode && (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-5 h-5 rounded-md bg-black/40 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
        )}
        {bulkSelectMode && (
          <div className={`absolute top-1 right-1 w-5 h-5 rounded-md flex items-center justify-center shadow transition-colors ${bulkSelected ? "bg-teal-500" : "bg-black/30 border border-white/60"}`}>
            {bulkSelected && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}
        {!bulkSelectMode && selected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center shadow">
              <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className="absolute top-1 left-1 w-5 h-5 flex items-center justify-center transition-transform hover:scale-125"
            title={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <svg className={`w-4 h-4 drop-shadow ${isFavorite ? "text-red-500 fill-red-500 heart-beat" : "text-white/80 fill-white/30"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
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
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[7px] text-gray-400 leading-tight">{color.code}</p>
          {color.pageNumber != null && (
            <span className="text-[7px] font-semibold text-teal-500 leading-tight">{color.pageNumber}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Representative color for each family (defaults — can be overridden from admin)
const DEFAULT_FAMILY_COLORS = [
  "#C9464F", "#D07040", "#DAA520", "#4CAF50",
  "#00A898", "#1878D8", "#C4B4A4", "#666666",
];

const DURABILITY_OPTIONS: { years: number; yield: string }[] = [
  { years: 2, yield: "4 a 6 m²/L" },
  { years: 3, yield: "6 a 7 m²/L" },
  { years: 4, yield: "7 a 8 m²/L" },
  { years: 7, yield: "7 a 9 m²/L" },
];

// ── Room preview ──────────────────────────────────────────────

const ROOM_TABS = [
  { id: "sala",     label: "Sala",     emoji: "🛋" },
  { id: "recamara", label: "Recámara", emoji: "🛏" },
  { id: "cocina",   label: "Cocina",   emoji: "🍳" },
  { id: "fachada",  label: "Fachada",  emoji: "🏠" },
] as const;
type RoomTab = typeof ROOM_TABS[number]["id"];

function SalaRoom({ hex }: { hex: string }) {
  return (
    <div className="w-full relative" style={{ backgroundColor: hex }}>
      <img src="/sala-sofa.png" alt="Sala" className="w-full block" />
    </div>
  );
}

function RecamaraRoom({ hex }: { hex: string }) {
  return (
    <div className="w-full relative" style={{ backgroundColor: hex }}>
      <img src="/recamara.png" alt="Recámara" className="w-full block" />
    </div>
  );
}

function CocinaRoom({ hex }: { hex: string }) {
  return (
    <div className="w-full relative" style={{ backgroundColor: hex }}>
      <img src="/cocina.png" alt="Cocina" className="w-full block" />
    </div>
  );
}

function FachadaRoom({ hex }: { hex: string }) {
  return (
    <div className="w-full relative" style={{ backgroundColor: hex }}>
      <img src="/fachada.png" alt="Fachada" className="w-full block" />
    </div>
  );
}

function RoomPreviewModal({ color, hex, onClose }: {
  color: { name: string; code: string };
  hex: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<RoomTab>("sala");
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 bg-black/75" style={{ zIndex: 80 }} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col" style={{ maxHeight:"95vh" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-gray-900 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-white/30" style={{ backgroundColor: hex }}/>
            <div>
              <p className="font-bold text-sm leading-tight">{color.name}</p>
              <p className="text-xs text-gray-400 font-mono">{color.code}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>
        {/* Tabs */}
        <div className="flex bg-gray-900 gap-1 p-1.5 flex-shrink-0">
          {ROOM_TABS.map(rt => (
            <button key={rt.id} onClick={() => setTab(rt.id)}
              className={`neon-hover flex-1 py-2 text-xs font-bold transition-all duration-200 flex flex-col items-center gap-1 select-none rounded-lg border ${
                tab === rt.id
                  ? "bg-teal-500/20 text-teal-300 border-teal-400 scale-105"
                  : "bg-transparent text-gray-400 border-transparent hover:text-teal-300 hover:bg-teal-500/10 hover:border-teal-400 hover:scale-110 active:scale-95"
              }`}
              style={{
                boxShadow: tab === rt.id ? "0 0 8px #2dd4bf, 0 0 20px #0d9488, inset 0 0 8px #0d948820" : undefined,
                ["--neon-hover" as string]: "0 0 8px #2dd4bf, 0 0 20px #0d9488, inset 0 0 8px #0d948820",
              } as React.CSSProperties}
            >
              <span className={`transition-all duration-200 ${tab === rt.id ? "text-xl" : "text-base"}`}>{rt.emoji}</span>
              <span>{rt.label}</span>
            </button>
          ))}
        </div>
        {/* Room image */}
        <div className="overflow-y-auto flex-shrink-0">
          {tab === "sala"     && <SalaRoom     hex={hex}/>}
          {tab === "recamara" && <RecamaraRoom hex={hex}/>}
          {tab === "cocina"   && <CocinaRoom   hex={hex}/>}
          {tab === "fachada"  && <FachadaRoom  hex={hex}/>}
        </div>
        {/* Footer */}
        <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex-shrink-0">
          <p className="text-[11px] text-gray-400 text-center">Los colores son aproximados. Consulta nuestro catálogo físico en tienda.</p>
        </div>
      </div>
    </div>
  );
}

// ── Paint yield (conservative lower bound per durability tier) ──
const YIELD_MAP: Record<number, number> = { 2: 4, 3: 6, 4: 7, 7: 7 };

// 1 litro = 0.055 cubetas de 19L, redondeado a 1 decimal
function calcCubetas19(liters: number): number {
  return Math.round(liters * 0.055 * 10) / 10;
}

function parsePrice(priceStr: string): number | null {
  const n = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? null : n;
}

// ── Calculator modal ──────────────────────────────────────────

function PaintCalculator({
  durabilityPrices,
  durabilityOnSale,
  galonPrices,
  galonOnSale,
  onClose,
}: {
  durabilityPrices: Record<string, string>;
  durabilityOnSale: number[];
  galonPrices: Record<string, string>;
  galonOnSale: number[];
  onClose: () => void;
}) {
  const [area, setArea] = useState("");
  const [coats, setCoats] = useState(2);
  const [quality, setQuality] = useState<number | null>(null);

  const availableOptions = DURABILITY_OPTIONS.filter((o) => durabilityPrices[String(o.years)]);

  const areaNum = parseFloat(area.replace(",", "."));
  const validArea = !isNaN(areaNum) && areaNum > 0;
  const totalArea = validArea ? areaNum * coats : 0;
  const yieldPerLiter = quality ? YIELD_MAP[quality] : null;
  const litersNeeded = yieldPerLiter && totalArea > 0 ? Math.ceil(totalArea / yieldPerLiter) : null;
  const hasGalonPrice = quality ? !!galonPrices[String(quality)] : false;

  // 0.055 factor: 1 liter = 0.055 container-units (0.055×19≈1 cubeta, 0.055×4≈1 galón scaled)
  const FACTOR = 0.055;
  const totalUnits = litersNeeded ? litersNeeded * FACTOR : null;
  // Only cubetas
  const onlyCubetas = totalUnits !== null ? Math.ceil(totalUnits) : null;
  // Only galones
  const onlyGalones = litersNeeded ? Math.ceil(litersNeeded * FACTOR / (4 * FACTOR)) : null; // = ceil(liters/4)
  // Combined: full cubetas + galones for remainder
  const fullCubetas = totalUnits !== null ? Math.floor(totalUnits) : null;
  const remainingUnits = (totalUnits !== null && fullCubetas !== null) ? totalUnits - fullCubetas : 0;
  const galonsForRemainder = remainingUnits > 0 ? Math.ceil(remainingUnits / (4 * FACTOR)) : 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90dvh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h2 className="font-bold text-base">Calculadora de Pintura</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="p-4 sm:p-5 flex flex-col gap-4 sm:gap-5 overflow-y-auto">
          {/* Area input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Superficie a pintar
            </label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                placeholder="Ej: 25"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-gray-900 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 pr-14"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">m²</span>
            </div>
          </div>

          {/* Coats */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Número de manos
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setCoats(n)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    coats === n
                      ? "bg-teal-500 border-teal-500 text-white shadow-md"
                      : "bg-white border-gray-200 text-gray-600 hover:border-teal-300"
                  }`}
                >
                  {n} {n === 1 ? "mano" : "manos"}
                  {n === 2 && <span className="block text-[10px] opacity-70">recomendado</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Quality selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Calidad de pintura
            </label>
            <div className="flex flex-wrap gap-2">
              {availableOptions.map((opt) => {
                const cubSale = durabilityOnSale.includes(opt.years);
                const galSale = galonOnSale.includes(opt.years);
                const active = quality === opt.years;
                const price = durabilityPrices[String(opt.years)];
                const galon = galonPrices[String(opt.years)];
                return (
                  <button
                    key={opt.years}
                    onClick={() => setQuality(active ? null : opt.years)}
                    className={`relative flex-1 min-w-[calc(50%-4px)] flex flex-col items-center px-2 py-2 rounded-xl border transition-all ${
                      active
                        ? "bg-teal-500 border-teal-500 text-white shadow-md"
                        : "bg-white border-gray-200 text-gray-700 hover:border-teal-300"
                    }`}
                  >
                    {active && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-white/30">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                    <span className="font-bold text-sm mb-1">{opt.years} años</span>
                    {galon && (
                      <div className="flex flex-wrap justify-center items-center gap-x-1 gap-y-0.5">
                        <img src="/galon.png" alt="galón" className="w-4 h-4 object-contain flex-shrink-0" />
                        <span className={`text-sm font-extrabold leading-tight ${active ? (galSale ? "text-white oferta-pulse" : "text-white") : galSale ? "text-orange-500 oferta-pulse" : "text-teal-700"}`}>{galon}</span>
                        <span className={`text-[10px] font-semibold ${active ? "text-white/80" : "text-gray-500"}`}>Gal. 4L</span>
                        {galSale && <span className={`oferta-pulse text-[9px] font-extrabold px-1.5 py-0.5 rounded-full whitespace-nowrap ${active ? "bg-white text-orange-500" : "bg-orange-500 text-white"}`}>🔥 Oferta</span>}
                      </div>
                    )}
                    {price && (
                      <div className="flex flex-wrap justify-center items-center gap-x-1 gap-y-0.5">
                        <img src="/cubeta.png" alt="cubeta" className="w-4 h-4 object-contain flex-shrink-0" />
                        <span className={`text-sm font-extrabold leading-tight ${active ? (cubSale ? "text-white oferta-pulse" : "text-white") : cubSale ? "text-orange-500 oferta-pulse" : "text-teal-700"}`}>{price}</span>
                        <span className={`text-[10px] font-semibold ${active ? "text-white/80" : "text-gray-500"}`}>Cub. 19L</span>
                        {cubSale && <span className={`oferta-pulse text-[9px] font-extrabold px-1.5 py-0.5 rounded-full whitespace-nowrap ${active ? "bg-white text-orange-500" : "bg-orange-500 text-white"}`}>🔥 Oferta</span>}
                      </div>
                    )}
                    <span className={`text-[10px] leading-tight mt-0.5 ${active ? "text-white/70" : "text-gray-400"}`}>{opt.yield}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Result */}
          {litersNeeded && (
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-500" />
                <p className="text-xs text-teal-700 font-semibold uppercase tracking-wide">
                  Resultado para {areaNum} m² · {coats} {coats === 1 ? "mano" : "manos"}
                </p>
              </div>

              {/* Liters */}
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-3xl sm:text-4xl font-black text-teal-700">{litersNeeded}</span>
                <span className="text-lg font-semibold text-teal-600">litros</span>
                <span className="text-xs text-teal-500">(rend. mín. {yieldPerLiter} m²/L)</span>
              </div>

              {/* Rows: litros / cubetas / galones / combinado */}
              <div className="flex flex-col gap-2">
                {/* Solo cubetas */}
                {onlyCubetas !== null && (
                  <div className="flex items-center justify-between bg-white border border-teal-200 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <img src="/cubeta.png" alt="cubeta" className="w-5 h-5 object-contain flex-shrink-0" />
                      <span className="text-xs text-gray-500">Solo cubetas</span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-gray-800">{onlyCubetas}</span>
                      <span className="text-[10px] text-gray-400 ml-1">cubeta{onlyCubetas !== 1 ? "s" : ""} de 19 L</span>
                      <span className="text-[10px] text-teal-400 ml-1">({onlyCubetas * 19} L)</span>
                    </div>
                  </div>
                )}

                {/* Solo galones */}
                {hasGalonPrice && onlyGalones !== null && (
                  <div className="flex items-center justify-between bg-white border border-teal-200 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <img src="/galon.png" alt="galón" className="w-5 h-5 object-contain flex-shrink-0" />
                      <span className="text-xs text-gray-500">Solo galones</span>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-gray-800">{onlyGalones}</span>
                      <span className="text-[10px] text-gray-400 ml-1">galón{onlyGalones !== 1 ? "es" : ""} de 4 L</span>
                      <span className="text-[10px] text-teal-400 ml-1">({onlyGalones * 4} L)</span>
                    </div>
                  </div>
                )}

                {/* Combinado */}
                {hasGalonPrice && fullCubetas !== null && (fullCubetas > 0 || galonsForRemainder > 0) && (
                  <div className="flex items-center justify-between bg-teal-100 border border-teal-300 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <img src="/cubeta.png" alt="cubeta" className="w-4 h-4 object-contain flex-shrink-0 opacity-60" />
                      <span className="text-xs text-teal-700 font-semibold">Combinado</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-right">
                      {fullCubetas > 0 && (
                        <span className="text-sm font-black text-gray-800">
                          {fullCubetas} <span className="text-[10px] font-normal text-gray-500">cubeta{fullCubetas !== 1 ? "s" : ""} 19L</span>
                        </span>
                      )}
                      {fullCubetas > 0 && galonsForRemainder > 0 && <span className="text-teal-500 font-bold">+</span>}
                      {galonsForRemainder > 0 && (
                        <span className="text-sm font-black text-gray-800">
                          {galonsForRemainder} <span className="text-[10px] font-normal text-gray-500">galón{galonsForRemainder !== 1 ? "es" : ""} 4L</span>
                        </span>
                      )}
                      <span className="text-[10px] text-teal-500 ml-1">({fullCubetas * 19 + galonsForRemainder * 4} L)</span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Empty state */}
          {!litersNeeded && (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-5 text-center text-gray-400 text-sm">
              Ingresa los m², las manos y selecciona la calidad para calcular
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Wall-by-wall calculator (solo modo kiosko) ─────────────────
// El cliente agrega paredes (ancho × alto), se suma el área y se
// muestra el resultado en las 4 calidades a la vez para comparar.

interface Wall { w: string; h: string }

function WallPaintCalculator({
  durabilityPrices,
  durabilityOnSale,
  galonPrices,
  galonOnSale,
  onClose,
}: {
  durabilityPrices: Record<string, string>;
  durabilityOnSale: number[];
  galonPrices: Record<string, string>;
  galonOnSale: number[];
  onClose: () => void;
}) {
  const [walls, setWalls] = useState<Wall[]>([{ w: "", h: "" }]);
  const [coats, setCoats] = useState(2);
  const [inputMode, setInputMode] = useState<"medidas" | "area">("medidas");
  const [directArea, setDirectArea] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const FACTOR = 0.055; // 1 L ≈ 0.055 cubetas de 19 L

  // Área de cada pared (0 si está incompleta o inválida)
  const wallAreas = walls.map((wl) => {
    const w = parseFloat(wl.w.replace(",", "."));
    const h = parseFloat(wl.h.replace(",", "."));
    return !isNaN(w) && !isNaN(h) && w > 0 && h > 0 ? w * h : 0;
  });
  const directAreaNum = parseFloat(directArea.replace(",", "."));
  const baseArea = inputMode === "area"
    ? (!isNaN(directAreaNum) && directAreaNum > 0 ? directAreaNum : 0)
    : wallAreas.reduce((a, b) => a + b, 0);
  const hasArea = baseArea > 0;
  const totalArea = baseArea * coats;

  const availableOptions = DURABILITY_OPTIONS.filter((o) => durabilityPrices[String(o.years)]);

  function computeForYears(years: number) {
    const yieldPerLiter = YIELD_MAP[years];
    const liters = Math.ceil(totalArea / yieldPerLiter);
    const units = liters * FACTOR;
    const hasGalon = !!galonPrices[String(years)];
    let cubetas: number;
    let galones: number;
    if (hasGalon) {
      // Combinado: cubetas completas + galones para el resto
      cubetas = Math.floor(units);
      const remaining = units - cubetas;
      galones = remaining > 0 ? Math.ceil(remaining / (4 * FACTOR)) : 0;
      if (cubetas === 0 && galones === 0) galones = 1; // mínimo 1 envase
    } else {
      // Solo cubetas (redondeo hacia arriba)
      cubetas = Math.max(1, Math.ceil(units));
      galones = 0;
    }
    const cubPrice = parsePrice(durabilityPrices[String(years)] ?? "");
    const galPrice = parsePrice(galonPrices[String(years)] ?? "");
    const total =
      (cubPrice != null ? cubetas * cubPrice : 0) +
      (galPrice != null ? galones * galPrice : 0);
    const cubOnSale = durabilityOnSale.includes(years);
    const galOnSale = galonOnSale.includes(years);
    // Litros que sobran: solo se vende en cubetas (19L) y galones (4L) completos.
    const litrosComprados = cubetas * 19 + galones * 4;
    const litrosSobrantes = Math.max(0, Math.round((litrosComprados - liters) * 10) / 10);
    return { liters, cubetas, galones, hasGalon, total, cubOnSale, galOnSale, litrosSobrantes };
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90dvh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z M4 9h16 M4 14h16 M9 4v16" />
            </svg>
            <h2 className="font-bold text-base">Calcular por paredes</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Selector de modo: por medidas o área directa */}
          <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setInputMode("medidas")}
              className={`py-2 rounded-lg text-sm font-semibold transition-all ${inputMode === "medidas" ? "bg-white text-gray-900 shadow" : "text-gray-500"}`}>Por medidas</button>
            <button onClick={() => setInputMode("area")}
              className={`py-2 rounded-lg text-sm font-semibold transition-all ${inputMode === "area" ? "bg-white text-gray-900 shadow" : "text-gray-500"}`}>Sé el área (m²)</button>
          </div>

          {/* Área directa */}
          {inputMode === "area" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Área total a pintar</label>
              <div className="relative">
                <input type="number" inputMode="decimal" min="0" placeholder="Ej: 45" value={directArea}
                  onChange={(e) => setDirectArea(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-gray-900 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 pr-14" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">m²</span>
              </div>
            </div>
          )}

          {/* Walls list */}
          {inputMode === "medidas" && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Medidas de tus paredes
            </label>
            <div className="flex flex-col gap-2">
              {walls.map((wl, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 w-14 flex-shrink-0">Pared {i + 1}</span>
                  <input
                    type="number" inputMode="decimal" min="0" placeholder="Ancho"
                    value={wl.w}
                    onChange={(e) => setWalls((prev) => prev.map((p, idx) => idx === i ? { ...p, w: e.target.value } : p))}
                    className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                  <span className="text-gray-400 font-bold flex-shrink-0">×</span>
                  <input
                    type="number" inputMode="decimal" min="0" placeholder="Alto"
                    value={wl.h}
                    onChange={(e) => setWalls((prev) => prev.map((p, idx) => idx === i ? { ...p, h: e.target.value } : p))}
                    className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                  <span className="text-[10px] text-gray-400 w-9 flex-shrink-0">{wallAreas[i] > 0 ? `${wallAreas[i].toFixed(1)}m²` : "m"}</span>
                  {walls.length > 1 && (
                    <button
                      onClick={() => setWalls((prev) => prev.filter((_, idx) => idx !== i))}
                      className="w-7 h-7 flex-shrink-0 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors"
                      title="Quitar pared"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={() => setWalls((prev) => [...prev, { w: "", h: "" }])}
              className="mt-2 flex items-center gap-1.5 text-teal-600 hover:text-teal-700 text-sm font-semibold"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Agregar otra pared
            </button>
          </div>
          )}

          {/* Total area (solo en modo medidas; en modo área ya lo escribió) */}
          {inputMode === "medidas" && hasArea && (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Área total</span>
              <span className="text-xl font-black text-gray-800">{baseArea.toFixed(1)} <span className="text-sm font-semibold text-gray-500">m²</span></span>
            </div>
          )}

          {/* Coats */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Número de manos (pasadas)</label>
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setCoats(n)}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                    coats === n ? "bg-teal-500 border-teal-500 text-white shadow-md" : "bg-white border-gray-200 text-gray-600 hover:border-teal-300"
                  }`}
                >
                  {n} {n === 1 ? "mano" : "manos"}
                  {n === 2 && <span className="block text-[10px] opacity-70">recomendado</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Results: all qualities */}
          {hasArea && availableOptions.length > 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide text-center">
                Lo que necesitas según la calidad
              </p>
              {availableOptions.map((opt) => {
                const r = computeForYears(opt.years);
                return (
                  <div key={opt.years} className="bg-teal-50 border border-teal-200 rounded-2xl px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-extrabold text-teal-800">{opt.years} años</span>
                      <span className="text-[11px] text-teal-500">{r.liters} L · {opt.yield}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {r.cubetas > 0 && (
                        <span className="flex items-center gap-1.5">
                          <img src="/cubeta.png" alt="cubeta" className="w-5 h-5 object-contain" />
                          <span className="text-base font-black text-gray-800">{r.cubetas}</span>
                          <span className="text-[10px] text-gray-500">cubeta{r.cubetas !== 1 ? "s" : ""} 19L</span>
                        </span>
                      )}
                      {r.cubetas > 0 && r.galones > 0 && <span className="text-teal-500 font-bold">+</span>}
                      {r.galones > 0 && (
                        <span className="flex items-center gap-1.5">
                          <img src="/galon.png" alt="galón" className="w-5 h-5 object-contain" />
                          <span className="text-base font-black text-gray-800">{r.galones}</span>
                          <span className="text-[10px] text-gray-500">galón{r.galones !== 1 ? "es" : ""} 4L</span>
                        </span>
                      )}
                      {r.total > 0 && (
                        <span className="ml-auto text-right">
                          <span className={`text-base font-black ${r.cubOnSale || r.galOnSale ? "text-orange-500" : "text-teal-700"}`}>
                            ${r.total.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="block text-[9px] text-gray-400 leading-none">aprox.</span>
                        </span>
                      )}
                    </div>
                    {r.litrosSobrantes > 0 && (
                      <p className="text-[10px] text-amber-700 mt-1.5">⚡ Te sobrarán aprox. <span className="font-bold">{r.litrosSobrantes} L</span> (envases completos).</p>
                    )}
                  </div>
                );
              })}
              <p className="text-[10px] text-gray-400 text-center mt-1">
                Cálculo aproximado. Los precios pueden variar; confirma en mostrador.
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-5 text-center text-gray-400 text-sm">
              Ingresa el ancho y alto de al menos una pared para ver cuánta pintura necesitas
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Calculadora de impermeabilizante (solo modo kiosko) ────────
// Suma secciones de azotea (largo × ancho) y calcula cuántas unidades
// se necesitan. 1 unidad cubre `coverageM2` m² a `coats` pasadas.

function ImpermeabilizanteCalculator({ config, onClose }: { config: ImperConfig; onClose: () => void }) {
  const [secciones, setSecciones] = useState<{ l: string; a: string }[]>([{ l: "", a: "" }]);
  const [inputMode, setInputMode] = useState<"medidas" | "area">("medidas");
  const [directArea, setDirectArea] = useState("");
  const coats = config.coats || 2; // pasadas fijas (las que configura el admin)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const areas = secciones.map((s) => {
    const l = parseFloat(s.l.replace(",", "."));
    const a = parseFloat(s.a.replace(",", "."));
    return !isNaN(l) && !isNaN(a) && l > 0 && a > 0 ? l * a : 0;
  });
  const directAreaNum = parseFloat(directArea.replace(",", "."));
  const totalArea = inputMode === "area"
    ? (!isNaN(directAreaNum) && directAreaNum > 0 ? directAreaNum : 0)
    : areas.reduce((x, y) => x + y, 0);
  const hasArea = totalArea > 0;

  // Material total por unidad = m² × pasadas base (ej. 19 × 2 = 38 "m²-pasada").
  const materialPorUnidad = config.coverageM2 * config.coats;
  const coberturaAPasadas = materialPorUnidad / coats; // m² que cubre 1 unidad a las pasadas elegidas
  const unidades = hasArea ? Math.ceil(totalArea / coberturaAPasadas) : 0;
  const precioU = parsePrice(config.price ?? "") ?? 0;
  const totalPrecio = unidades * precioU;
  // Litros que sobran: como solo se vende en unidades enteras (cubetas), casi siempre sobra material.
  const litrosPorUnidad = config.litersPerUnit || 19;
  const litrosNecesarios = hasArea ? (totalArea * litrosPorUnidad) / coberturaAPasadas : 0;
  const litrosSobrantes = Math.max(0, Math.round((unidades * litrosPorUnidad - litrosNecesarios) * 10) / 10);

  return (
    <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60" style={{ zIndex: 95 }} onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[92dvh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7M3 21h18" /></svg>
            <h2 className="font-bold text-base">{config.name || "Impermeabilizante"}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto">
          <p className="text-[11px] text-gray-500 -mb-1">
            Cada {config.unitLabel || "unidad"} cubre <span className="font-semibold text-gray-700">{config.coverageM2} m²</span> a {config.coats} pasadas.
          </p>

          {/* Selector de modo: por medidas o área directa */}
          <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setInputMode("medidas")}
              className={`py-2 rounded-lg text-sm font-semibold transition-all ${inputMode === "medidas" ? "bg-white text-gray-900 shadow" : "text-gray-500"}`}>Por medidas</button>
            <button onClick={() => setInputMode("area")}
              className={`py-2 rounded-lg text-sm font-semibold transition-all ${inputMode === "area" ? "bg-white text-gray-900 shadow" : "text-gray-500"}`}>Sé el área (m²)</button>
          </div>

          {/* Área directa */}
          {inputMode === "area" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Área total a cubrir</label>
              <div className="relative">
                <input type="number" inputMode="decimal" min="0" placeholder="Ej: 60" value={directArea}
                  onChange={(e) => setDirectArea(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-gray-900 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 pr-14" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">m²</span>
              </div>
            </div>
          )}

          {/* Secciones de azotea */}
          {inputMode === "medidas" && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Medidas de la azotea</label>
            <div className="flex flex-col gap-2">
              {secciones.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 w-16 flex-shrink-0">Sección {i + 1}</span>
                  <input type="number" inputMode="decimal" min="0" placeholder="Largo" value={s.l}
                    onChange={(e) => setSecciones((p) => p.map((x, idx) => idx === i ? { ...x, l: e.target.value } : x))}
                    className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
                  <span className="text-gray-400 font-bold flex-shrink-0">×</span>
                  <input type="number" inputMode="decimal" min="0" placeholder="Ancho" value={s.a}
                    onChange={(e) => setSecciones((p) => p.map((x, idx) => idx === i ? { ...x, a: e.target.value } : x))}
                    className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
                  <span className="text-[10px] text-gray-400 w-9 flex-shrink-0">{areas[i] > 0 ? `${areas[i].toFixed(1)}m²` : "m"}</span>
                  {secciones.length > 1 && (
                    <button onClick={() => setSecciones((p) => p.filter((_, idx) => idx !== i))}
                      className="w-7 h-7 flex-shrink-0 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors" title="Quitar sección">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setSecciones((p) => [...p, { l: "", a: "" }])}
              className="mt-2 flex items-center gap-1.5 text-teal-600 hover:text-teal-700 text-sm font-semibold">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Agregar otra sección
            </button>
          </div>
          )}

          {inputMode === "medidas" && hasArea && (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Área total</span>
              <span className="text-xl font-black text-gray-800">{totalArea.toFixed(1)} <span className="text-sm font-semibold text-gray-500">m²</span></span>
            </div>
          )}

          {/* Resultado */}
          {hasArea ? (
            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex flex-col gap-2">
              <p className="text-xs text-teal-700 font-semibold uppercase tracking-wide">Necesitas</p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-3xl font-black text-teal-700">{unidades}</span>
                <span className="text-lg font-semibold text-teal-600">× {config.unitLabel || "unidad"}</span>
              </div>
              <p className="text-[11px] text-teal-600">Cubre {(coberturaAPasadas).toFixed(1)} m² por {config.unitLabel || "unidad"} a {coats} {coats === 1 ? "pasada" : "pasadas"}.</p>
              {litrosSobrantes > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mt-0.5">
                  <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <span className="text-[11px] text-amber-700">Te sobrarán aprox. <span className="font-bold">{litrosSobrantes} L</span> (solo se vende en {config.unitLabel || "unidad"} completa).</span>
                </div>
              )}
              {precioU > 0 && (
                <div className="flex items-center justify-between border-t border-teal-200 pt-2 mt-1">
                  <span className="text-sm text-teal-700 font-semibold">Precio aprox.</span>
                  <span className="text-xl font-black text-teal-700">{money(totalPrecio)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-5 text-center text-gray-400 text-sm">
              Ingresa el largo y ancho de la azotea para calcular cuánto impermeabilizante necesitas
            </div>
          )}
          <p className="text-[10px] text-gray-400 text-center">Cálculo aproximado. Confirma en mostrador.</p>
        </div>
      </div>
    </div>
  );
}

// ── Carrito / Pedidos (modo kiosko) ────────────────────────────

function priceNum(s: string | undefined): number {
  return parsePrice(s ?? "") ?? 0;
}

function lineSubtotal(it: { years: number; cubetas: number; galones: number }, dp: Record<string, string>, gp: Record<string, string>): number {
  return it.cubetas * priceNum(dp[String(it.years)]) + it.galones * priceNum(gp[String(it.years)]);
}

function money(n: number): string {
  return "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const PAYMENT_LABELS: Record<string, string> = {
  efectivo: "Efectivo",
  debito: "Tarjeta débito",
  credito: "Tarjeta crédito",
  transferencia: "Transferencia",
};

function Stepper({ label, value, unit, price, onChange, disabled }: { label: string; value: number; unit: string; price: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${disabled ? "bg-gray-50 border-gray-100 opacity-60" : "bg-white border-gray-200"}`}>
      <div className="flex items-center gap-2 min-w-0">
        <img src={label === "Cubetas" ? "/cubeta.png" : "/galon.png"} alt="" className="w-6 h-6 object-contain flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 leading-tight">{label}</p>
          <p className="text-[10px] text-gray-400 leading-tight">{unit}{price > 0 ? ` · ${money(price)} c/u` : ""}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={disabled || value === 0}
          className="w-8 h-8 rounded-lg border border-gray-200 text-gray-600 font-bold text-lg flex items-center justify-center disabled:opacity-30 hover:bg-gray-50 active:scale-95"
        >−</button>
        <span className="w-7 text-center text-base font-black text-gray-900">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          disabled={disabled}
          className="w-8 h-8 rounded-lg bg-teal-500 text-white font-bold text-lg flex items-center justify-center disabled:opacity-30 hover:bg-teal-600 active:scale-95"
        >+</button>
      </div>
    </div>
  );
}

function AddToCartModal({ color, colorYears, durabilityPrices, galonPrices, onAdd, onClose }: {
  color: { name: string; code: string; hex: string; pageNumber?: string | null };
  colorYears: number[];
  durabilityPrices: Record<string, string>;
  galonPrices: Record<string, string>;
  onAdd: (item: CartItem) => void;
  onClose: () => void;
}) {
  // Solo las calidades en las que ESTE color está disponible (con precio configurado).
  // Si el color no tiene calidades configuradas, se permiten todas las que tengan precio.
  const colorPriced = DURABILITY_OPTIONS.filter((o) => colorYears.includes(o.years) && (durabilityPrices[String(o.years)] || galonPrices[String(o.years)]));
  const allPriced = DURABILITY_OPTIONS.filter((o) => durabilityPrices[String(o.years)] || galonPrices[String(o.years)]);
  const pricedYears = colorPriced.length > 0 ? colorPriced : allPriced;
  const [years, setYears] = useState<number | null>(() => pricedYears[0]?.years ?? null);
  const [cubetas, setCubetas] = useState(0);
  const [galones, setGalones] = useState(0);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  const cubP = years != null ? priceNum(durabilityPrices[String(years)]) : 0;
  const galP = years != null ? priceNum(galonPrices[String(years)]) : 0;
  const hasCub = years != null && !!durabilityPrices[String(years)];
  const hasGal = years != null && !!galonPrices[String(years)];
  const subtotal = cubetas * cubP + galones * galP;
  const canAdd = years != null && cubetas + galones > 0;

  return (
    <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60" style={{ zIndex: 95 }} onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[92dvh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full border-2 border-white/30 flex-shrink-0" style={{ backgroundColor: color.hex }} />
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight truncate">{color.name}</p>
              <p className="text-[11px] text-gray-400 font-mono leading-tight">{color.code}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Calidad */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">¿Qué calidad quieres?</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {pricedYears.map((o) => (
                <button
                  key={o.years}
                  onClick={() => setYears(o.years)}
                  className={`py-2.5 rounded-xl border text-sm font-bold transition-all ${
                    years === o.years ? "bg-teal-500 border-teal-500 text-white shadow-md" : "bg-white border-gray-200 text-gray-600 hover:border-teal-300"
                  }`}
                >{o.years} años</button>
              ))}
            </div>
          </div>

          {/* Presentaciones */}
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-semibold text-gray-700">¿Qué presentaciones?</label>
            <Stepper label="Cubetas" unit="19 L" price={cubP} value={cubetas} onChange={setCubetas} disabled={!hasCub} />
            <Stepper label="Galones" unit="4 L" price={galP} value={galones} onChange={setGalones} disabled={!hasGal} />
          </div>

          {/* Subtotal */}
          {subtotal > 0 && (
            <div className="flex items-center justify-between bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5">
              <span className="text-xs text-teal-700 font-semibold uppercase tracking-wide">Subtotal</span>
              <span className="text-lg font-black text-teal-700">{money(subtotal)}</span>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button
            onClick={() => { if (canAdd && years != null) onAdd({ uid: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: color.name, code: color.code, hex: color.hex, years, cubetas, galones, pageNumber: color.pageNumber ?? null }); }}
            disabled={!canAdd}
            className="flex-[2] py-2.5 rounded-xl bg-teal-500 text-white text-sm font-bold hover:bg-teal-600 disabled:opacity-40 active:scale-95 transition-all"
          >Agregar al carrito</button>
        </div>
      </div>
    </div>
  );
}

function CartModal({ cart, durabilityPrices, galonPrices, onRemove, onCheckout, onContinue, onClose }: {
  cart: CartItem[];
  durabilityPrices: Record<string, string>;
  galonPrices: Record<string, string>;
  onRemove: (uid: string) => void;
  onCheckout: () => void;
  onContinue: () => void;
  onClose: () => void;
}) {
  const total = cart.reduce((a, it) => a + lineSubtotal(it, durabilityPrices, galonPrices), 0);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60" style={{ zIndex: 95 }} onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[92dvh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <h2 className="font-bold text-base">Tu carrito {cart.length > 0 && <span className="text-teal-400">({cart.length})</span>}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="p-4 flex flex-col gap-2 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">
              Tu carrito está vacío. Toca un color y luego “Agregar al carrito”.
            </div>
          ) : cart.map((it) => {
            const sub = lineSubtotal(it, durabilityPrices, galonPrices);
            return (
              <div key={it.uid} className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-3 py-2.5">
                <div className="w-9 h-9 rounded-lg border-2 border-gray-100 flex-shrink-0" style={{ backgroundColor: it.hex }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 leading-tight truncate">{it.name}</p>
                  <p className="text-[10px] text-gray-400 font-mono leading-tight">{it.code}{it.pageNumber ? ` · Pág. ${it.pageNumber}` : ""}</p>
                  <p className="text-[11px] text-teal-600 font-semibold leading-tight mt-0.5">
                    {it.years} años · {it.cubetas > 0 && `${it.cubetas} cub.`}{it.cubetas > 0 && it.galones > 0 && " + "}{it.galones > 0 && `${it.galones} gal.`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-gray-800">{money(sub)}</p>
                  <button onClick={() => onRemove(it.uid)} className="text-[11px] text-red-400 hover:text-red-600">Quitar</button>
                </div>
              </div>
            );
          })}
        </div>

        {cart.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 flex-shrink-0 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total</span>
              <span className="text-2xl font-black text-gray-900">{money(total)}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={onContinue} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Seguir agregando</button>
              <button onClick={onCheckout} className="flex-[2] py-2.5 rounded-xl bg-teal-500 text-white text-sm font-bold hover:bg-teal-600 active:scale-95 transition-all">Realizar pedido</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckoutModal({ cart, durabilityPrices, galonPrices, onClearCart, onClose }: {
  cart: CartItem[];
  durabilityPrices: Record<string, string>;
  galonPrices: Record<string, string>;
  onClearCart: () => void;
  onClose: () => void;
}) {
  const total = cart.reduce((a, it) => a + lineSubtotal(it, durabilityPrices, galonPrices), 0);

  const [step, setStep] = useState<"form" | "review" | "sent">("form");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [cond1, setCond1] = useState(false);
  const [cond2, setCond2] = useState(false);
  const [cond3, setCond3] = useState(false);
  const [method, setMethod] = useState("efectivo");
  const [payFull, setPayFull] = useState(false);
  const [deposit, setDeposit] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ id: number; subtotal: number; deposit: number; balance: number; paidFull: boolean } | null>(null);

  const cardOrTransfer = method === "debito" || method === "credito" || method === "transferencia";
  const cleanPhone = phone.replace(/\D/g, "");
  const depositNum = cardOrTransfer || payFull ? total : (parseFloat(deposit.replace(",", ".")) || 0);
  const balance = Math.max(0, total - depositNum);

  const paymentOk = cardOrTransfer ? total > 0 : depositNum > 0 && depositNum <= total;
  const canGenerate = name.trim().length > 0 && cleanPhone.length === 10 && cond1 && cond2 && cond3 && paymentOk && cart.length > 0;

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && step !== "sent") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose, step]);

  function buildOrderText(folio: number, totals: { subtotal: number; deposit: number; balance: number; paidFull: boolean }): string {
    const d = new Date();
    const fecha = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(-2)}`;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    // Solo símbolos seguros (×, —, ·, viñetas y *negritas* de WhatsApp): se ven bien
    // en todos los WhatsApp, incluido el de Windows que rompe los emojis.
    const lines: string[] = [];
    lines.push(`*PEDIDO #${folio} — Pinturas BFM*`);
    lines.push(`Pedido realizado el ${fecha}`);
    lines.push(`Cliente: ${name.trim()}  ·  WhatsApp: ${cleanPhone}`);
    lines.push("————————————————");
    cart.forEach((it, i) => {
      lines.push(`*${i + 1}) ${it.name}*  [${it.code}]${it.pageNumber ? `  · Pág. ${it.pageNumber}` : ""}`);
      lines.push(`   • Calidad ${it.years} años`);
      if (it.cubetas > 0) lines.push(`   • ${it.cubetas} × Cubeta 19L`);
      if (it.galones > 0) lines.push(`   • ${it.galones} × Galón 4L`);
      lines.push(`   • Ver color: ${origin}/?color=${encodeURIComponent(it.code)}`);
    });
    lines.push("————————————————");
    lines.push(`*Total: ${money(totals.subtotal)}*`);
    lines.push(`Pago (${PAYMENT_LABELS[method]}): ${money(totals.deposit)}`);
    lines.push(totals.paidFull ? `Pagado completo` : `Saldo pendiente: ${money(totals.balance)}`);
    lines.push("————————————————");
    lines.push(`*Confirmado por el cliente:*`);
    lines.push(`• Revisé los colores que quiero en el muestrario físico.`);
    lines.push(`• Entiendo que la luz cálida o blanca puede cambiar el tono de mi pintura.`);
    lines.push(`• Entiendo que el rendimiento es aproximado y puede variar según la superficie (rugosa, lisa o sin sellador de paredes).`);
    lines.push(`• Los colores pueden verse diferentes en cada dispositivo móvil por las distintas pantallas, y bajo iluminación cálida o blanca.`);
    return lines.join("\n");
  }

  async function confirmAndSave() {
    setSaving(true);
    setError("");
    try {
      const res = await createOrder({
        customerName: name.trim(),
        customerPhone: cleanPhone,
        items: cart.map((it) => ({ name: it.name, code: it.code, hex: it.hex, years: it.years, cubetas: it.cubetas, galones: it.galones, pageNumber: it.pageNumber })),
        deposit: depositNum,
        paymentMethod: method,
      });
      setResult(res);
      setStep("sent");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo generar el pedido.");
    } finally {
      setSaving(false);
    }
  }

  function sendWhatsApp(to: string) {
    if (!result) return;
    const text = buildOrderText(result.id, result);
    window.open(`https://wa.me/${to}?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="fixed inset-0 z-[96] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60" style={{ zIndex: 96 }} onClick={() => step !== "sent" && onClose()}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[94dvh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white flex-shrink-0">
          <h2 className="font-bold text-base">
            {step === "form" ? "Datos del pedido" : step === "review" ? "Revisa tu pedido" : "¡Pedido generado!"}
          </h2>
          {step !== "sent" && <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>}
        </div>

        {/* ── Paso FORM ── */}
        {step === "form" && (
          <>
            <div className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto">
              {/* Datos cliente */}
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del cliente *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Nombre completo"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp del cliente *</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 font-semibold">+52</span>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" maxLength={14} placeholder="10 dígitos"
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100" />
                  </div>
                  {cleanPhone.length > 0 && cleanPhone.length !== 10 && <p className="text-[11px] text-red-400 mt-1">Debe tener 10 dígitos</p>}
                </div>
              </div>

              {/* Condiciones */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col gap-2.5">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Confirma antes de pedir</p>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={cond1} onChange={(e) => setCond1(e.target.checked)} className="mt-0.5 w-4 h-4 accent-teal-500 flex-shrink-0" />
                  <span className="text-xs text-gray-700">Revisé los colores que quiero en el muestrario físico.</span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={cond2} onChange={(e) => setCond2(e.target.checked)} className="mt-0.5 w-4 h-4 accent-teal-500 flex-shrink-0" />
                  <span className="text-xs text-gray-700">Entiendo que la luz cálida o blanca puede cambiar el tono de mi pintura.</span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={cond3} onChange={(e) => setCond3(e.target.checked)} className="mt-0.5 w-4 h-4 accent-teal-500 flex-shrink-0" />
                  <span className="text-xs text-gray-700">Entiendo que el rendimiento es aproximado y puede variar según la superficie (rugosa, lisa o sin sellador de paredes).</span>
                </label>
              </div>

              {/* Pago */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Forma de pago</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PAYMENT_LABELS).map(([key, lbl]) => (
                    <button key={key} onClick={() => { setMethod(key); if (key !== "efectivo") setPayFull(true); }}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        method === key ? "bg-teal-500 border-teal-500 text-white shadow-md" : "bg-white border-gray-200 text-gray-600 hover:border-teal-300"
                      }`}>{lbl}</button>
                  ))}
                </div>
                {cardOrTransfer && (
                  <p className="text-[11px] text-gray-500 mt-1.5">Con tarjeta o transferencia el pago debe ser completo (sin abonos).</p>
                )}
              </div>

              {/* Total / abono / saldo */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Total</span>
                  <span className="text-lg font-black text-gray-900">{money(total)}</span>
                </div>
                {!cardOrTransfer && (
                  <>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={payFull} onChange={(e) => setPayFull(e.target.checked)} className="w-4 h-4 accent-teal-500" />
                      <span className="text-xs text-gray-600">Paga el total ahora</span>
                    </label>
                    {!payFull && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-gray-500">Abono</span>
                        <div className="relative w-32">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                          <input value={deposit} onChange={(e) => setDeposit(e.target.value)} inputMode="decimal" placeholder="0.00"
                            className="w-full border border-gray-200 rounded-lg pl-6 pr-3 py-2 text-sm text-right font-semibold focus:outline-none focus:border-teal-400" />
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                  <span className="text-sm font-semibold text-gray-600">Saldo</span>
                  <span className={`text-lg font-black ${balance > 0 ? "text-orange-500" : "text-teal-600"}`}>{money(balance)}</span>
                </div>
              </div>

              {!cardOrTransfer && !payFull && depositNum <= 0 && (
                <p className="text-[11px] text-gray-400 -mt-2">Registra un abono mayor a $0 o marca “Paga el total ahora”.</p>
              )}
            </div>

            <div className="px-4 py-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={() => setStep("review")} disabled={!canGenerate}
                className="flex-[2] py-2.5 rounded-xl bg-teal-500 text-white text-sm font-bold hover:bg-teal-600 disabled:opacity-40 active:scale-95 transition-all">Generar pedido</button>
            </div>
          </>
        )}

        {/* ── Paso REVIEW (ticket) ── */}
        {step === "review" && (
          <>
            <div className="p-4 sm:p-5 overflow-y-auto">
              <div className="border border-dashed border-gray-300 rounded-2xl p-4 font-mono text-xs text-gray-700">
                <p className="text-center font-bold text-sm text-gray-900 mb-1">PINTURAS BFM</p>
                <p className="text-center text-[10px] text-gray-400 mb-3">Ticket de pedido</p>
                <p><span className="text-gray-400">Cliente:</span> {name.trim()}</p>
                <p><span className="text-gray-400">WhatsApp:</span> +52 {cleanPhone}</p>
                <div className="border-t border-dashed border-gray-200 my-2" />
                {cart.map((it, i) => (
                  <div key={it.uid} className="mb-2.5">
                    <p className="font-semibold text-gray-800 flex items-center gap-1.5 flex-wrap">
                      <span>{i + 1}. {it.name}</span>
                      <span className="inline-block w-3.5 h-3.5 rounded-sm border border-gray-300 align-middle" style={{ backgroundColor: it.hex }} />
                      <span className="text-gray-400">[{it.code}]</span>
                      {it.pageNumber && <span className="text-gray-400">· Pág. {it.pageNumber}</span>}
                    </p>
                    <p>Calidad {it.years} años</p>
                    {it.cubetas > 0 && <p>{it.cubetas} × Cubeta 19L</p>}
                    {it.galones > 0 && <p>{it.galones} × Galón 4L</p>}
                    <p className="text-right text-gray-600">{money(lineSubtotal(it, durabilityPrices, galonPrices))}</p>
                  </div>
                ))}
                <div className="border-t border-dashed border-gray-200 my-2" />
                <div className="flex justify-between"><span>Total</span><span className="font-bold">{money(total)}</span></div>
                <div className="flex justify-between"><span>Pago ({PAYMENT_LABELS[method]})</span><span>{money(depositNum)}</span></div>
                <div className="flex justify-between"><span>Saldo</span><span className={balance > 0 ? "text-orange-500 font-bold" : "text-teal-600 font-bold"}>{money(balance)}</span></div>
                <div className="border-t border-dashed border-gray-200 my-2" />
                {/* Condiciones aceptadas + nota de color */}
                <div className="text-[10px] leading-snug text-gray-500 flex flex-col gap-1">
                  <p>✔ Revisé los colores que quiero en el muestrario físico.</p>
                  <p>✔ Entiendo que la luz cálida o blanca puede cambiar el tono de mi pintura.</p>
                  <p>✔ Entiendo que el rendimiento es aproximado y puede variar según la superficie (rugosa, lisa o sin sellador de paredes).</p>
                  <p className="text-gray-400 mt-0.5">Nota: los colores pueden verse diferentes en cada dispositivo móvil por las distintas pantallas, y bajo iluminación cálida o blanca.</p>
                </div>
              </div>
              {error && <p className="text-xs text-red-500 mt-3 text-center">{error}</p>}
            </div>
            <div className="px-4 py-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
              <button onClick={() => setStep("form")} disabled={saving} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">Editar</button>
              <button onClick={confirmAndSave} disabled={saving}
                className="flex-[2] py-2.5 rounded-xl bg-teal-500 text-white text-sm font-bold hover:bg-teal-600 disabled:opacity-50 active:scale-95 transition-all">
                {saving ? "Generando…" : "Confirmar y enviar"}
              </button>
            </div>
          </>
        )}

        {/* ── Paso SENT ── */}
        {step === "sent" && result && (
          <div className="p-5 flex flex-col gap-4 overflow-y-auto">
            <div className="flex flex-col items-center text-center gap-1">
              <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center mb-1">
                <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="font-bold text-gray-900">Pedido #{result.id} guardado</p>
              <p className="text-xs text-gray-500">Envía el pedido por WhatsApp. Toca cada botón y presiona enviar.</p>
            </div>
            <button onClick={() => sendWhatsApp(FERRETERIA_WA)} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 active:scale-95 transition-all">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" /></svg>
              Enviar a la ferretería
            </button>
            <button onClick={() => sendWhatsApp(`52${cleanPhone}`)} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 text-green-700 border border-green-300 text-sm font-bold hover:bg-green-100 active:scale-95 transition-all">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" /></svg>
              Enviar copia al cliente
            </button>
            <button onClick={() => { onClearCart(); onClose(); }} className="mt-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Nuevo pedido</button>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminOrdersModal({ orders, loading, onRefresh, onSetStatus, onClose }: {
  orders: OrderRow[];
  loading: boolean;
  onRefresh: () => void;
  onSetStatus: (id: number, status: string) => void;
  onClose: () => void;
}) {
  const STATUS = ["nuevo", "procesado", "entregado", "cancelado"];
  const STATUS_COLOR: Record<string, string> = {
    nuevo: "bg-blue-100 text-blue-700",
    procesado: "bg-amber-100 text-amber-700",
    entregado: "bg-teal-100 text-teal-700",
    cancelado: "bg-red-100 text-red-600",
  };
  const [detailOrder, setDetailOrder] = useState<OrderRow | null>(null);
  return (
    <>
    <div className="fixed inset-0 z-[97] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60" style={{ zIndex: 97 }} onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92dvh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white flex-shrink-0">
          <h2 className="font-bold text-base">Pedidos {orders.length > 0 && <span className="text-teal-400">({orders.length})</span>}</h2>
          <div className="flex items-center gap-3">
            <button onClick={onRefresh} className="text-gray-300 hover:text-white text-xs">Actualizar</button>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
          </div>
        </div>
        <div className="p-4 flex flex-col gap-3 overflow-y-auto">
          {loading ? (
            <p className="text-center text-gray-400 py-10 text-sm">Cargando…</p>
          ) : orders.length === 0 ? (
            <p className="text-center text-gray-400 py-10 text-sm">Aún no hay pedidos.</p>
          ) : orders.map((o) => (
            <div key={o.id} className="border border-gray-200 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <span className="font-black text-gray-900">#{o.id}</span>
                  <span className="text-[11px] text-gray-400 ml-2">{new Date(o.created_at).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setDetailOrder(o)} className="text-[10px] font-semibold text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    Ver detalle
                  </button>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[o.status] ?? "bg-gray-100 text-gray-600"}`}>{o.status}</span>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-800">{o.customer_name}</p>
              <a href={`https://wa.me/52${o.customer_phone}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-green-600 hover:underline">+52 {o.customer_phone}</a>
              <div className="mt-2 flex flex-col gap-0.5">
                {o.items.map((it, i) => (
                  <p key={i} className="text-[11px] text-gray-600">
                    <span className="inline-block w-2.5 h-2.5 rounded-sm align-middle mr-1" style={{ backgroundColor: it.hex }} />
                    {it.name} <span className="text-gray-400 font-mono">[{it.code}]</span>{it.pageNumber && <span className="mx-1 inline-block bg-yellow-200 text-yellow-800 font-bold rounded px-1.5 py-0.5 text-[10px] align-middle">Pág. {it.pageNumber}</span>} · {it.years} años · {it.cubetas > 0 && `${it.cubetas} cub.`}{it.cubetas > 0 && it.galones > 0 && " + "}{it.galones > 0 && `${it.galones} gal.`}
                  </p>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-500">{PAYMENT_LABELS[o.payment_method] ?? o.payment_method} · {o.paid_full ? "Pagado" : `Abono ${money(o.deposit)}`}</span>
                <span className="font-black text-gray-800">{money(o.subtotal)}{o.balance > 0 && <span className="text-orange-500 font-normal ml-1">(saldo {money(o.balance)})</span>}</span>
              </div>
              <div className="mt-2 flex gap-1 flex-wrap">
                {STATUS.map((s) => (
                  <button key={s} onClick={() => { if (window.confirm(`¿Cambiar el pedido #${o.id} a "${s}"?`)) onSetStatus(o.id, s); }} disabled={o.status === s}
                    className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${o.status === s ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>{s}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Vista grande del detalle de un pedido */}
    {detailOrder && (() => {
      const o = detailOrder;
      return (
        <div className="fixed inset-0 z-[98] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70" style={{ zIndex: 98 }} onClick={() => setDetailOrder(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[94dvh]" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-gray-900 text-white flex-shrink-0">
              <div>
                <h2 className="font-black text-2xl leading-none">Pedido #{o.id}</h2>
                <p className="text-xs text-gray-400 mt-1">{new Date(o.created_at).toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" })}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLOR[o.status] ?? "bg-gray-100 text-gray-700"}`}>{o.status}</span>
                <button onClick={() => setDetailOrder(null)} className="text-gray-300 hover:text-white text-2xl leading-none">✕</button>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-4 overflow-y-auto">
              {/* Cliente */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Cliente</p>
                <p className="text-lg font-bold text-gray-900">{o.customer_name}</p>
                <a href={`https://wa.me/52${o.customer_phone}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-green-600 hover:underline mt-0.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" /></svg>
                  +52 {o.customer_phone}
                </a>
              </div>

              {/* Colores */}
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide font-semibold mb-2">Colores ({o.items.length})</p>
                <div className="flex flex-col gap-2">
                  {o.items.map((it, i) => (
                    <div key={i} className="flex items-center gap-3 border border-gray-200 rounded-xl p-3">
                      <div className="w-12 h-12 rounded-lg border-2 border-gray-100 shadow-inner flex-shrink-0" style={{ backgroundColor: it.hex }} />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-900 leading-tight">{it.name}</p>
                        <p className="text-xs text-gray-400 font-mono flex items-center gap-1.5 flex-wrap">{it.code}{it.pageNumber && <span className="bg-yellow-200 text-yellow-800 font-bold rounded px-1.5 py-0.5 text-[11px]">Pág. {it.pageNumber}</span>}</p>
                        <p className="text-sm text-teal-700 font-semibold mt-1">Calidad {it.years} años</p>
                        {it.cubetas > 0 && <p className="text-sm text-gray-700">{it.cubetas} × Cubeta 19L</p>}
                        {it.galones > 0 && <p className="text-sm text-gray-700">{it.galones} × Galón 4L</p>}
                      </div>
                      {typeof it.subtotal === "number" && it.subtotal > 0 && (
                        <span className="text-sm font-black text-gray-800 flex-shrink-0">{money(it.subtotal)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales */}
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex flex-col gap-1.5">
                <div className="flex justify-between text-base"><span className="text-gray-600">Total</span><span className="font-black text-gray-900">{money(o.subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Pago ({PAYMENT_LABELS[o.payment_method] ?? o.payment_method})</span><span className="font-semibold text-gray-700">{money(o.deposit)}</span></div>
                <div className="flex justify-between text-base border-t border-teal-200 pt-1.5">
                  <span className="font-semibold text-gray-600">Saldo</span>
                  <span className={`font-black ${o.balance > 0 ? "text-orange-500" : "text-teal-600"}`}>{o.balance > 0 ? money(o.balance) : "Pagado completo"}</span>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setDetailOrder(null)} className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800">Cerrar</button>
            </div>
          </div>
        </div>
      );
    })()}
    </>
  );
}

export default function Home() {
  const [selectedFamily, setSelectedFamily] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  // Carga progresiva: cuántos colores mostrar de la familia actual (se renderiza por lotes)
  const COLORS_BATCH = 60;
  const [visibleCount, setVisibleCount] = useState(COLORS_BATCH);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [durability, setDurability] = useState<Record<string, number[]>>({});
  const [durabilityPrices, setDurabilityPrices] = useState<Record<string, string>>({});
  const [editDurabilityPrices, setEditDurabilityPrices] = useState<Record<string, string>>({});
  const [galonPrices, setGalonPrices] = useState<Record<string, string>>({});
  const [editGalonPrices, setEditGalonPrices] = useState<Record<string, string>>({});
  const [galonOnSale, setGalonOnSale] = useState<number[]>([]);
  const [editGalonOnSale, setEditGalonOnSale] = useState<number[]>([]);
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
  const [pageNumbers, setPageNumbers] = useState<Record<string, string>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const toggleFavorite = (code: string) => {
    setFavorites(prev => {
      const next = prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code];
      localStorage.setItem("pinturas-favorites", JSON.stringify(next));
      return next;
    });
  };;
  const [deletedColorCodes, setDeletedColorCodes] = useState<string[]>([]);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editHex, setEditHex] = useState("");
  const [editPageNumber, setEditPageNumber] = useState<string>("");
  const [editTargetFamily, setEditTargetFamily] = useState<number>(0);
  const [movingColor, setMovingColor] = useState(false);
  const [newColorPageNumber, setNewColorPageNumber] = useState<string>("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [eyedropperSupported, setEyedropperSupported] = useState(false);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [bulkSelectedCodes, setBulkSelectedCodes] = useState<Set<string>>(new Set());
  const [bulkTargetFamily, setBulkTargetFamily] = useState<number>(0);
  const [bulkMoving, setBulkMoving] = useState(false);
  const [colorOrders, setColorOrders] = useState<Record<string, string[]>>({});
  const [reorderMode, setReorderMode] = useState(false);
  const [dragSrcIdx, setDragSrcIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Admin auth
  const [isAdmin, setIsAdmin] = useState(false);
  const [kioskMode, setKioskMode] = useState(false); // tablet en tienda: solo logo + catálogo
  const [kioskLinkCopied, setKioskLinkCopied] = useState(false);
  const [pendingColorCode, setPendingColorCode] = useState<string | null>(null); // deep-link ?color=CÓDIGO
  const [newVersionAvailable, setNewVersionAvailable] = useState(false); // hay un deploy nuevo
  const [calcOpen, setCalcOpen] = useState(false);
  const [wallCalcOpen, setWallCalcOpen] = useState(false);
  const [imperCalcOpen, setImperCalcOpen] = useState(false);
  const [imperConfig, setImperConfig] = useState<ImperConfig>({ enabled: false, name: "Impermeabilizante", price: "", coverageM2: 19, coats: 2, unitLabel: "Cubeta 19L", litersPerUnit: 19 });
  const [editImper, setEditImper] = useState<ImperConfig>({ enabled: false, name: "Impermeabilizante", price: "", coverageM2: 19, coats: 2, unitLabel: "Cubeta 19L", litersPerUnit: 19 });
  const [roomPreviewOpen, setRoomPreviewOpen] = useState(false);
  // Carrito / pedidos (solo modo kiosko)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [addToCartColor, setAddToCartColor] = useState<Color | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // Vista admin de pedidos
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
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
  const [announcementText, setAnnouncementText] = useState("");
  const [editAnnouncementText, setEditAnnouncementText] = useState("");
  const [logoSaveError, setLogoSaveError] = useState("");
  const [roomPreviewEnabled, setRoomPreviewEnabled] = useState(true);
  const [editRoomPreviewEnabled, setEditRoomPreviewEnabled] = useState(true);
  const [calcButtonEnabled, setCalcButtonEnabled] = useState(true);
  const [editCalcButtonEnabled, setEditCalcButtonEnabled] = useState(true);
  const [pwaIconUrl, setPwaIconUrl] = useState<string | null>(null);
  const [editPwaIconUrl, setEditPwaIconUrl] = useState<string | null>(null);
  const [rendimientoLabel, setRendimientoLabel] = useState("Rendimiento aproximado");
  const [editRendimientoLabel, setEditRendimientoLabel] = useState("Rendimiento aproximado");
  const [roomButtonLabel, setRoomButtonLabel] = useState("Ver en habitación");
  const [editRoomButtonLabel, setEditRoomButtonLabel] = useState("Ver en habitación");
  const [cardHeight, setCardHeight] = useState(52);
  const [editCardHeight, setEditCardHeight] = useState(52);
  const [familyColors, setFamilyColors] = useState<string[]>(DEFAULT_FAMILY_COLORS);
  const [familyDisplayNames, setFamilyDisplayNames] = useState<string[]>(colorFamilies.map(f => f.name));
  const [editFamilyColors, setEditFamilyColors] = useState<string[]>(DEFAULT_FAMILY_COLORS);
  const [editFamilyNames, setEditFamilyNames] = useState<string[]>(colorFamilies.map(f => f.name));
  const [familyBanners, setFamilyBanners] = useState<Array<[string, string] | null>>([]);
  const [editFamilyBanners, setEditFamilyBanners] = useState<Array<[string, string] | null>>([]);

  // Restore localStorage cache on mount (client-only, runs after hydration)
  React.useEffect(() => {
    try {
      setEyedropperSupported("EyeDropper" in window);
      const dp = localStorage.getItem("pinturas_durabilityPrices"); if (dp) setDurabilityPrices(JSON.parse(dp));
      const gp = localStorage.getItem("pinturas_galonPrices"); if (gp) { const v = JSON.parse(gp); setGalonPrices(v); setEditGalonPrices(v); }
      const gos = localStorage.getItem("pinturas_galonOnSale"); if (gos) { const v = JSON.parse(gos); setGalonOnSale(v); setEditGalonOnSale(v); }
      const dos = localStorage.getItem("pinturas_durabilityOnSale"); if (dos) setDurabilityOnSale(JSON.parse(dos));
      const fav = localStorage.getItem("pinturas-favorites"); if (fav) setFavorites(JSON.parse(fav));
      const sn = localStorage.getItem("pinturas_siteName"); if (sn) setSiteName(sn);
      const lu = localStorage.getItem("pinturas_logoUrl"); if (lu) setLogoUrl(lu);
      const l2u = localStorage.getItem("pinturas_logo2Url"); if (l2u) setLogo2Url(l2u);
      const at = localStorage.getItem("pinturas_announcementText"); if (at !== null) setAnnouncementText(at);
      const rpe = localStorage.getItem("pinturas_roomPreviewEnabled"); if (rpe !== null) setRoomPreviewEnabled(rpe === "true");
      const cbe = localStorage.getItem("pinturas_calcButtonEnabled"); if (cbe !== null) setCalcButtonEnabled(cbe === "true");
      const piu = localStorage.getItem("pinturas_pwaIconUrl"); if (piu) setPwaIconUrl(piu);
      const rl = localStorage.getItem("pinturas_rendimientoLabel"); if (rl) setRendimientoLabel(rl);
      const rbl = localStorage.getItem("pinturas_roomButtonLabel"); if (rbl) setRoomButtonLabel(rbl);
      const ch = localStorage.getItem("pinturas_cardHeight"); if (ch) setCardHeight(Number(ch));
      const fc = localStorage.getItem("pinturas_familyColors"); if (fc) setFamilyColors(JSON.parse(fc));
      const fdn = localStorage.getItem("pinturas_familyDisplayNames"); if (fdn) setFamilyDisplayNames(JSON.parse(fdn));
    } catch {}
  }, []);

  // Load data from Supabase on mount; restore admin session
  React.useEffect(() => {
    // Modo kiosko (tablet en tienda): ?kiosko=1 oculta info bar + admin y bloquea login.
    // Se PERSISTE en el dispositivo (localStorage) para que la app instalada (PWA),
    // que siempre abre en "/", recuerde el modo kiosko. Para salir: ?kiosko=0.
    const params = new URLSearchParams(window.location.search);
    const kioskParam = params.get("kiosko");
    let isKiosk: boolean;
    if (kioskParam === "1") {
      isKiosk = true;
      try { localStorage.setItem("pinturas_kiosko", "1"); } catch {}
    } else if (kioskParam === "0") {
      isKiosk = false;
      try { localStorage.removeItem("pinturas_kiosko"); } catch {}
    } else {
      try { isKiosk = localStorage.getItem("pinturas_kiosko") === "1"; } catch { isKiosk = false; }
    }
    setKioskMode(isKiosk);
    // Deep-link a un color: ?color=CÓDIGO (lo abre cuando carguen los datos).
    const colorParam = params.get("color");
    if (colorParam) setPendingColorCode(colorParam);
    // La sesión real vive en una cookie httpOnly; preguntamos al servidor si sigue activa.
    // En modo kiosko NO se restaura la sesión admin: la tablet queda solo como catálogo.
    if (!isKiosk) {
      checkAdminSession().then((ok) => setIsAdmin(ok)).catch(() => {});
    }
    // Load color overrides + durability from Supabase
    // UNA sola server action trae todo en paralelo (antes eran ~14 llamadas).
    loadInitialData().then((d) => {
      // Overrides de hex + durabilidad por color
      const hexMap: Record<string, string> = {};
      const durMap: Record<string, number[]> = {};
      for (const [code, val] of Object.entries(d.colorSettings)) {
        if (val.hex) hexMap[code] = val.hex;
        if (val.durability_years?.length) durMap[code] = val.durability_years;
      }
      setOverrides(hexMap);
      setDurability(durMap);

      // Branding del sitio
      const { name, logoUrl: logo, logo2Url: logo2, roomPreviewEnabled: rpe, rendimientoLabel: rl, roomButtonLabel: rbl, cardHeight: ch, calcButtonEnabled: cbe, pwaIconUrl: piUrl, announcementText: at } = d.site;
      setSiteName(name); localStorage.setItem("pinturas_siteName", name);
      if (logo) { setLogoUrl(logo); localStorage.setItem("pinturas_logoUrl", logo); }
      if (logo2) { setLogo2Url(logo2); localStorage.setItem("pinturas_logo2Url", logo2); }
      setAnnouncementText(at); localStorage.setItem("pinturas_announcementText", at);
      setRoomPreviewEnabled(rpe); localStorage.setItem("pinturas_roomPreviewEnabled", String(rpe)); setEditRoomPreviewEnabled(rpe);
      setCalcButtonEnabled(cbe); localStorage.setItem("pinturas_calcButtonEnabled", String(cbe)); setEditCalcButtonEnabled(cbe);
      if (piUrl) { setPwaIconUrl(piUrl); localStorage.setItem("pinturas_pwaIconUrl", piUrl); } setEditPwaIconUrl(piUrl);
      setRendimientoLabel(rl); localStorage.setItem("pinturas_rendimientoLabel", rl); setEditRendimientoLabel(rl);
      setRoomButtonLabel(rbl); localStorage.setItem("pinturas_roomButtonLabel", rbl); setEditRoomButtonLabel(rbl);
      setCardHeight(ch); localStorage.setItem("pinturas_cardHeight", String(ch)); setEditCardHeight(ch);

      // Precios y ofertas
      setDurabilityPrices(d.durabilityPrices); localStorage.setItem("pinturas_durabilityPrices", JSON.stringify(d.durabilityPrices));
      setGalonPrices(d.galonPrices); setEditGalonPrices(d.galonPrices); localStorage.setItem("pinturas_galonPrices", JSON.stringify(d.galonPrices));
      setDurabilityOnSale(d.durabilityOnSale); localStorage.setItem("pinturas_durabilityOnSale", JSON.stringify(d.durabilityOnSale));
      setGalonOnSale(d.galonOnSale); setEditGalonOnSale(d.galonOnSale); localStorage.setItem("pinturas_galonOnSale", JSON.stringify(d.galonOnSale));

      // Colores personalizados
      const mapped: Record<string, Color[]> = {};
      for (const [family, colors] of Object.entries(d.customColors)) {
        mapped[family] = colors.map((c) => ({ name: c.name, hex: c.hex, code: c.code, id: c.id, pageNumber: c.page_number != null ? String(c.page_number) : null }));
      }
      setCustomColors(mapped);

      // Overrides de nombre/código, páginas, eliminados
      setNameOverrides(d.nameOverrides);
      setPageNumbers(d.pageNumbers);
      setDeletedColorCodes(d.deletedColors);

      // Familias (colores, nombres, banners) y orden
      if (d.familySettings.colors.length > 0) { setFamilyColors(d.familySettings.colors); setEditFamilyColors(d.familySettings.colors); localStorage.setItem("pinturas_familyColors", JSON.stringify(d.familySettings.colors)); }
      if (d.familySettings.names.length > 0) { setFamilyDisplayNames(d.familySettings.names); setEditFamilyNames(d.familySettings.names); localStorage.setItem("pinturas_familyDisplayNames", JSON.stringify(d.familySettings.names)); }
      setFamilyBanners(d.familyBanners); setEditFamilyBanners(d.familyBanners);
      setColorOrders(d.colorOrders);

      // Impermeabilizante (calculadora kiosko)
      setImperConfig(d.impermeabilizante); setEditImper(d.impermeabilizante);
    }).catch(() => {});
  }, []);

  // Detecta un deploy nuevo y marca para recargar (evita "Server Action not found"
  // en tablets/PWAs que quedan abiertas mucho tiempo). La recarga real ocurre solo
  // cuando la app está libre (ver efecto siguiente).
  React.useEffect(() => {
    let active = true;
    let known: string | null = null;
    const check = async () => {
      try {
        const r = await fetch("/api/version", { cache: "no-store" });
        const { v } = await r.json();
        if (!active || !v) return;
        if (known === null) { known = v; return; }
        if (v !== known) setNewVersionAvailable(true);
      } catch {}
    };
    check();
    const id = setInterval(check, 2 * 60 * 1000); // cada 2 min
    const onVis = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { active = false; clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  // Recarga segura: solo cuando no hay un pedido o edición en curso.
  React.useEffect(() => {
    if (!newVersionAvailable) return;
    const libre =
      cart.length === 0 &&
      !cartOpen && !checkoutOpen && !addToCartColor &&
      !calcOpen && !wallCalcOpen && !imperCalcOpen && !roomPreviewOpen &&
      !ordersOpen && !showSiteSettings && !showLoginModal && !showAddColorModal;
    if (libre) {
      const t = setTimeout(() => window.location.reload(), 400);
      return () => clearTimeout(t);
    }
  }, [newVersionAvailable, cart.length, cartOpen, checkoutOpen, addToCartColor, calcOpen, wallCalcOpen, imperCalcOpen, roomPreviewOpen, ordersOpen, showSiteSettings, showLoginModal, showAddColorModal]);

  // Deep-link ?color=CÓDIGO → busca el color y lo abre (cuando ya cargaron overrides/custom).
  React.useEffect(() => {
    if (!pendingColorCode) return;
    const code = pendingColorCode;
    // Custom colors (por nombre de familia)
    for (const [famName, list] of Object.entries(customColors)) {
      const cm = list.find((c) => c.code === code);
      if (cm) {
        const fi = colorFamilies.findIndex((f) => f.name === famName);
        if (fi >= 0) setSelectedFamily(fi);
        setSearch(code);
        setSelectedColor(cm);
        setPendingColorCode(null);
        return;
      }
    }
    // Colores integrados (considera overrides de código)
    for (let fi = 0; fi < colorFamilies.length; fi++) {
      for (const c of colorFamilies[fi].colors) {
        const ov = nameOverrides[c.code];
        const displayCode = ov ? ov.code : c.code;
        if (displayCode === code || c.code === code) {
          setSelectedFamily(fi);
          setSearch(code);
          setSelectedColor({ ...c, ...(ov ? { name: ov.name, code: ov.code, originalCode: c.code } : {}) });
          setPendingColorCode(null);
          return;
        }
      }
    }
  }, [pendingColorCode, customColors, nameOverrides]);

  function handleUserClick() {
    if (kioskMode) return; // tablet en tienda: sin acceso a admin
    if (isAdmin) {
      setShowAdminMenu((v) => !v);
    } else {
      setLoginPassword("");
      setLoginError(false);
      setShowLoginModal(true);
    }
  }

  // Acceso oculto de administrador: 6 toques al logo. Funciona en cualquier modo
  // (incluido kiosko): si ya es admin abre el menú; si no, el login.
  function handleLogoAccess() {
    if (isAdmin) {
      setShowAdminMenu((v) => !v);
    } else {
      setLoginPassword("");
      setLoginError(false);
      setShowLoginModal(true);
    }
  }

  async function handleLogin() {
    // La validación ocurre en el servidor; si es correcta, abre una cookie de sesión firmada.
    const ok = await login(loginPassword);
    if (ok) {
      setIsAdmin(true);
      setShowLoginModal(false);
      setLoginError(false);
      setLoginPassword("");
      // Si se entró desde el kiosko, salir del kiosko (solo la contraseña permite salir).
      if (kioskMode) {
        setKioskMode(false);
        try { localStorage.removeItem("pinturas_kiosko"); } catch {}
      }
    } else {
      setLoginError(true);
    }
  }

  async function handleLogout() {
    await logout();
    setIsAdmin(false);
    setShowAdminMenu(false);
  }

  async function copyKioskLink() {
    const link = `${window.location.origin}/?kiosko=1`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Fallback para navegadores sin permiso de clipboard
      const ta = document.createElement("textarea");
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(ta);
    }
    setKioskLinkCopied(true);
    setTimeout(() => setKioskLinkCopied(false), 2000);
  }

  async function openOrders() {
    setShowAdminMenu(false);
    setOrdersOpen(true);
    setOrdersLoading(true);
    try {
      const data = await loadOrders();
      setOrders(data);
    } catch {
      setSaveError("No se pudieron cargar los pedidos.");
    } finally {
      setOrdersLoading(false);
    }
  }

  async function handleSetOrderStatus(id: number, status: string) {
    try {
      await updateOrderStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch {
      setSaveError("No se pudo actualizar el estado del pedido.");
    }
  }

  function openAddColorModal(familyName: string) {
    setAddColorFamily(familyName);
    setNewColorName("");
    setNewColorHex("#FF0000");
    setNewColorCode("");
    setShowAddColorModal(true);
  }

  async function handleAddColor() {
    const cleanName = sanitizeText(newColorName, LIMITS.COLOR_NAME);
    const cleanCode = sanitizeText(newColorCode, LIMITS.COLOR_CODE);
    if (!cleanName) { setSaveError("El nombre del color es obligatorio."); return; }
    if (!isValidHex(newColorHex)) { setSaveError("El color debe tener formato #RRGGBB (ej: #FF0000)."); return; }
    setAddColorSaving(true);
    setSaveError("");
    const newPageNum = newColorPageNumber.trim() !== "" ? newColorPageNumber.trim() : null;
    try {
      const saved = await addCustomColor(addColorFamily, cleanName, newColorHex, cleanCode, newPageNum);
      const newColor: Color = { name: saved.name, hex: saved.hex, code: saved.code, id: saved.id, pageNumber: saved.page_number != null ? String(saved.page_number) : null };
      setCustomColors((prev) => ({
        ...prev,
        [addColorFamily]: [newColor, ...(prev[addColorFamily] ?? [])],
      }));
      setNewColorPageNumber("");
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
    setEditAnnouncementText(announcementText);
    setEditDurabilityPrices({ ...durabilityPrices });
    setEditDurabilityOnSale([...durabilityOnSale]);
    setEditCalcButtonEnabled(calcButtonEnabled);
    setEditRoomButtonLabel(roomButtonLabel);
    setEditPwaIconUrl(pwaIconUrl);
    setEditFamilyColors([...familyColors]);
    setEditFamilyNames([...familyDisplayNames]);
    // Pad banners array to match families length so indexes always align
    const paddedBanners: Array<[string, string] | null> = familyDisplayNames.map((_, i) => {
      const b = familyBanners[i];
      return b ? [...b] as [string, string] : null;
    });
    setEditFamilyBanners(paddedBanners);
    setEditImper({ ...imperConfig });
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
    const cleanSiteName = sanitizeText(editSiteName, LIMITS.SITE_NAME);
    if (!cleanSiteName) { setLogoSaveError("El nombre del sitio es obligatorio."); return; }
    for (const [k, v] of Object.entries(editDurabilityPrices)) {
      if (!isValidPrice(v)) { setLogoSaveError(`Precio inválido para ${k} años. Solo se permiten números, $, comas y puntos.`); return; }
    }
    setLogoSaveError("");
    try {
      await saveSiteName(cleanSiteName);
      await saveAnnouncementText(editAnnouncementText);
      await saveDurabilityPrices(editDurabilityPrices);
      await saveDurabilityOnSale(editDurabilityOnSale);
      await saveRoomPreviewEnabled(editRoomPreviewEnabled);
      await saveCalcButtonEnabled(editCalcButtonEnabled);
      if (editPwaIconUrl && editPwaIconUrl.startsWith("data:")) {
        const publicUrl = await uploadLogoData(editPwaIconUrl);
        await savePwaIconUrl(publicUrl);
        setEditPwaIconUrl(publicUrl);
        setPwaIconUrl(publicUrl);
      } else {
        await savePwaIconUrl(editPwaIconUrl);
      }
      await saveRendimientoLabel(editRendimientoLabel);
      await saveRoomButtonLabel(editRoomButtonLabel);
      await saveCardHeight(editCardHeight);
      await saveGalonPrices(editGalonPrices);
      await saveGalonOnSale(editGalonOnSale);
      await saveFamilyColors(editFamilyColors);
      await saveFamilyNames(editFamilyNames);
      await saveFamilyBanners(editFamilyBanners);
      await saveImpermeabilizante(editImper);
      setImperConfig(editImper);

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
    setAnnouncementText(editAnnouncementText);
    setDurabilityPrices(editDurabilityPrices);
    setDurabilityOnSale(editDurabilityOnSale);
    setRoomPreviewEnabled(editRoomPreviewEnabled);
    setCalcButtonEnabled(editCalcButtonEnabled);
    setPwaIconUrl(editPwaIconUrl);
    setRendimientoLabel(editRendimientoLabel);
    setRoomButtonLabel(editRoomButtonLabel);
    setCardHeight(editCardHeight);
    setGalonPrices(editGalonPrices);
    setGalonOnSale(editGalonOnSale);
    setFamilyColors(editFamilyColors);
    setFamilyDisplayNames(editFamilyNames);
    setFamilyBanners(editFamilyBanners);
    setShowSiteSettings(false);
  }

  // Helper: get the DB key for a color (original code before any override)
  function origCode(color: Color) {
    return color.originalCode ?? color.code;
  }

  function exportToCSV() {
    const rows: string[][] = [['Familia', 'Nombre', 'Código', 'Color (Hex)', 'Línea', 'Calidad', 'Página', 'Estado']];
    colorFamilies.forEach((family, idx) => {
      const builtInName = family.name;
      const displayName = familyDisplayNames[idx] ?? builtInName;
      const custom = [
        ...(customColors[builtInName] ?? []),
        ...(displayName !== builtInName ? (customColors[displayName] ?? []) : []),
      ];
      const builtIn: Color[] = family.colors.map((c) => {
        const ov = nameOverrides[c.code];
        const pg = pageNumbers[c.code];
        return { ...c, ...(ov ? { name: ov.name, code: ov.code, originalCode: c.code } : {}), ...(pg != null ? { pageNumber: pg } : {}) };
      });
      for (const color of [...custom, ...builtIn]) {
        const oc = color.originalCode ?? color.code;
        const rawHex = overrides[oc] ?? color.hex ?? '';
        const hex = rawHex ? '#' + rawHex.replace(/^#/, '').toUpperCase() : '';
        const calidad = (durability[oc] ?? []).sort((a, b) => a - b).map(y => `${y} años`).join(', ');
        const page = color.pageNumber ?? pageNumbers[oc] ?? '';
        const status = deletedColorCodes.includes(oc) ? 'Eliminado' : 'Activo';
        rows.push([displayName, color.name, color.code, hex, 'Sayer', calidad, page, status]);
      }
    });
    const csv = rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catalogo-pinturas-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function hexLuminance(hex: string): number {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16) / 255;
    const g = parseInt(h.substring(2, 4), 16) / 255;
    const b = parseInt(h.substring(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // Sync editHex/editName/editCode/editPageNumber when selected color changes
  React.useEffect(() => {
    if (selectedColor) {
      setEditHex(overrides[origCode(selectedColor)] ?? selectedColor.hex);
      setEditName(selectedColor.name);
      setEditCode(selectedColor.code);
      setEditPageNumber(selectedColor.pageNumber != null ? String(selectedColor.pageNumber) : "");
    }
  }, [selectedColor?.code]);

  function applyHex(hex: string) {
    setEditHex(hex);
  }

  async function handleSave() {
    if (!selectedColor) return;
    const oc = origCode(selectedColor);
    const normalized = editHex.startsWith("#") ? editHex : "#" + editHex;
    const cleanName = sanitizeText(editName, LIMITS.COLOR_NAME);
    const cleanCode = sanitizeText(editCode, LIMITS.COLOR_CODE);
    if (!cleanName) { setSaveError("El nombre del color es obligatorio."); return; }
    if (!isValidHex(normalized)) { setSaveError("El color debe tener formato #RRGGBB (ej: #FF0000)."); return; }
    setSaveError("");

    const pageNum = editPageNumber.trim() !== "" ? editPageNumber.trim() : null;

    try {
      // Save to DB first — UI updates only after DB confirms
      const nameChanged = cleanName !== selectedColor.name || cleanCode !== selectedColor.code;
      if (selectedColor.id) {
        // Custom color: single table update (custom_colors)
        await updateCustomColor(selectedColor.id, cleanName, normalized, cleanCode, pageNum);
      } else {
        // Built-in color: save hex override + optional name/code override
        await saveColorHex(oc, normalized);
        if (nameChanged) {
          await saveColorNameOverride(oc, cleanName, cleanCode);
        }
        await saveColorPageNumber(oc, pageNum);
      }

      // DB saves confirmed — now update UI state
      if (selectedColor.id) {
        // Custom color: update customColors list
        setCustomColors((prev) => {
          const family = Object.keys(prev).find((f) => prev[f].some((c) => c.id === selectedColor.id));
          if (!family) return prev;
          return {
            ...prev,
            [family]: prev[family].map((c) =>
              c.id === selectedColor.id ? { ...c, name: cleanName, hex: normalized, code: cleanCode, pageNumber: pageNum } : c
            ),
          };
        });
      } else {
        // Built-in color: update hex overrides + name overrides if changed
        setOverrides((prev) => ({ ...prev, [oc]: normalized }));
        if (nameChanged) {
          setNameOverrides((prev) => ({ ...prev, [oc]: { name: cleanName, code: cleanCode } }));
        }
        setPageNumbers((prev) => {
          const next = { ...prev };
          if (pageNum === null) { delete next[oc]; } else { next[oc] = pageNum; }
          return next;
        });
      }
      setSelectedColor({ ...selectedColor, name: cleanName, code: cleanCode, hex: normalized, pageNumber: pageNum });
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

  async function handleMoveColor() {
    if (!selectedColor) return;
    const targetFamilyName = familyDisplayNames[editTargetFamily];
    if (editTargetFamily === selectedFamily) return;
    setMovingColor(true);
    setSaveError("");
    try {
      const pageNum = editPageNumber.trim() !== "" ? editPageNumber.trim() : null;
      const normalized = editHex.startsWith("#") ? editHex : "#" + editHex;
      // Add to target family
      const saved = await addCustomColor(targetFamilyName, editName, normalized, editCode, pageNum);
      const newColor: Color = { name: saved.name, hex: saved.hex, code: saved.code, id: saved.id, pageNumber: saved.page_number != null ? String(saved.page_number) : null };
      setCustomColors((prev) => ({ ...prev, [targetFamilyName]: [...(prev[targetFamilyName] ?? []), newColor] }));

      // Remove from source family
      if (selectedColor.id) {
        // Custom color: just delete it
        await deleteCustomColor(selectedColor.id);
        setCustomColors((prev) => {
          const family = Object.keys(prev).find((f) => prev[f].some((c) => c.id === selectedColor.id));
          if (!family) return prev;
          return { ...prev, [family]: prev[family].filter((c) => c.id !== selectedColor.id) };
        });
      } else {
        // Built-in color: add to deleted list
        const oc = origCode(selectedColor);
        const next = [...deletedColorCodes, oc];
        setDeletedColorCodes(next);
        await saveDeletedColors(next);
      }

      setSelectedColor(null);
      setSelectedFamily(editTargetFamily);
    } catch (err) {
      setSaveError(String(err instanceof Error ? err.message : err));
    } finally {
      setMovingColor(false);
    }
  }

  async function handleSearchMoveColor() {
    if (!selectedColor) return;
    const targetFamilyName = familyDisplayNames[editTargetFamily];
    setMovingColor(true);
    setSaveError("");
    try {
      const pageNum = editPageNumber.trim() !== "" ? editPageNumber.trim() : null;
      const normalized = editHex.startsWith("#") ? editHex : "#" + editHex;
      const saved = await addCustomColor(targetFamilyName, editName, normalized, editCode, pageNum);
      const newColor: Color = { name: saved.name, hex: saved.hex, code: saved.code, id: saved.id, pageNumber: saved.page_number != null ? String(saved.page_number) : null };
      setCustomColors((prev) => ({ ...prev, [targetFamilyName]: [...(prev[targetFamilyName] ?? []), newColor] }));
      if (selectedColor.id) {
        await deleteCustomColor(selectedColor.id);
        setCustomColors((prev) => {
          const family = Object.keys(prev).find((f) => prev[f].some((c) => c.id === selectedColor.id));
          if (!family) return prev;
          return { ...prev, [family]: prev[family].filter((c) => c.id !== selectedColor.id) };
        });
      } else {
        const oc = origCode(selectedColor);
        const next = [...deletedColorCodes, oc];
        setDeletedColorCodes(next);
        await saveDeletedColors(next);
      }
      setSelectedColor(null);
      setSelectedFamily(editTargetFamily);
    } catch (err) {
      setSaveError(String(err instanceof Error ? err.message : err));
    } finally {
      setMovingColor(false);
    }
  }

  async function handleBulkMoveColors() {
    if (bulkSelectedCodes.size === 0) return;
    const targetFamilyName = familyDisplayNames[bulkTargetFamily];
    setBulkMoving(true);
    setSaveError("");
    const newDeletedCodes = [...deletedColorCodes];
    try {
      for (const code of bulkSelectedCodes) {
        const color = displayedColors.find(c => (c.id ? String(c.id) : c.code) === code) ?? null;
        if (!color) continue;
        const pageNum = color.pageNumber ?? null;
        const effectiveHex = getEffectiveHex(color);
        const normalizedHex = effectiveHex.startsWith("#") ? effectiveHex : "#" + effectiveHex;
        const saved = await addCustomColor(targetFamilyName, color.name, normalizedHex, color.code, pageNum);
        const newColor: Color = { name: saved.name, hex: saved.hex, code: saved.code, id: saved.id, pageNumber: saved.page_number != null ? String(saved.page_number) : null };
        setCustomColors((prev) => ({ ...prev, [targetFamilyName]: [...(prev[targetFamilyName] ?? []), newColor] }));
        if (color.id) {
          await deleteCustomColor(color.id);
          setCustomColors((prev) => {
            const family = Object.keys(prev).find((f) => prev[f].some((c) => c.id === color.id));
            if (!family) return prev;
            return { ...prev, [family]: prev[family].filter((c) => c.id !== color.id) };
          });
        } else {
          const oc = origCode(color);
          if (!newDeletedCodes.includes(oc)) newDeletedCodes.push(oc);
        }
      }
      if (newDeletedCodes.length > deletedColorCodes.length) {
        setDeletedColorCodes(newDeletedCodes);
        await saveDeletedColors(newDeletedCodes);
      }
      setBulkSelectedCodes(new Set());
      setBulkSelectMode(false);
      setSelectedFamily(bulkTargetFamily);
    } catch (err) {
      setSaveError(String(err instanceof Error ? err.message : err));
    } finally {
      setBulkMoving(false);
    }
  }

  async function handleReorderDrop(toIdx: number) {
    if (dragSrcIdx === null || dragSrcIdx === toIdx) return;
    const reordered = [...displayedColors];
    const [moved] = reordered.splice(dragSrcIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const codes = reordered.map(c => c.code);
    const familyKey = familyDisplayNames[selectedFamily] ?? currentFamily.name;
    setColorOrders(prev => ({ ...prev, [familyKey]: codes }));
    setDragSrcIdx(null);
    setDragOverIdx(null);
    await saveColorOrder(familyKey, codes);
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
    } catch (err) {
      setDurability((prev) => ({ ...prev, [code]: current }));
      setSaveError(String(err instanceof Error ? err.message : err));
    }
  }

  function getEffectiveHex(color: Color) {
    return overrides[origCode(color)] ?? color.hex;
  }

  const currentFamily = colorFamilies[selectedFamily] ?? { name: familyDisplayNames[selectedFamily] ?? `Familia ${selectedFamily + 1}`, colors: [] };

  const displayedColors = useMemo(() => {
    const builtInName = currentFamily.name;
    const displayName = familyDisplayNames[selectedFamily];
    const custom = [
      ...(customColors[builtInName] ?? []),
      ...(displayName !== builtInName ? (customColors[displayName] ?? []) : []),
    ];
    const builtIn = currentFamily.colors.filter((c) => !deletedColorCodes.includes(c.code));
    const builtInWithOverrides: Color[] = builtIn.map((c) => {
      const ov = nameOverrides[c.code];
      const pg = pageNumbers[c.code];
      return {
        ...c,
        ...(ov ? { name: ov.name, code: ov.code, originalCode: c.code } : {}),
        ...(pg != null ? { pageNumber: pg } : {}),
      };
    });
    let all = [...custom, ...builtInWithOverrides];
    const familyKey = familyDisplayNames[selectedFamily] ?? currentFamily.name;
    const savedOrder = colorOrders[familyKey];
    if (savedOrder && savedOrder.length > 0) {
      const orderMap = new Map(savedOrder.map((code, i) => [code, i]));
      all.sort((a, b) => {
        const ai = orderMap.get(a.code) ?? orderMap.get(a.originalCode ?? "") ?? 99999;
        const bi = orderMap.get(b.code) ?? orderMap.get(b.originalCode ?? "") ?? 99999;
        return ai !== bi ? ai - bi : hexLuminance(b.hex) - hexLuminance(a.hex);
      });
    } else {
      all.sort((a, b) => hexLuminance(b.hex) - hexLuminance(a.hex));
    }
    if (selectedQuality !== null) {
      all = all.filter((c) => (durability[origCode(c)] ?? []).includes(selectedQuality));
    }
    if (showFavorites) {
      all = all.filter((c) => favorites.includes(origCode(c)));
    }
    if (!search.trim()) return all;
    const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const q = normalize(search);
    return all.filter(
      (c) => normalize(c.name).includes(q) || normalize(c.code).includes(q)
    );
  }, [search, currentFamily, customColors, deletedColorCodes, nameOverrides, pageNumbers, selectedQuality, durability, showFavorites, favorites, colorOrders, familyDisplayNames, selectedFamily]);

  // Reiniciar la carga progresiva al cambiar de familia o filtro
  useEffect(() => {
    setVisibleCount(COLORS_BATCH);
  }, [selectedFamily, selectedQuality, showFavorites, search]);

  // Cargar más colores automáticamente al hacer scroll hasta el centinela
  useEffect(() => {
    if (visibleCount >= displayedColors.length) return;
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + COLORS_BATCH, displayedColors.length));
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, displayedColors.length]);

  // Subconjunto visible de la familia actual (carga progresiva)
  const visibleFamilyColors = useMemo(
    () => displayedColors.slice(0, visibleCount),
    [displayedColors, visibleCount]
  );

  const allSearchResults = useMemo(() => {
    if (!search.trim()) return [];
    const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const q = normalize(search);

    const builtInResults = colorFamilies.flatMap((f) =>
      f.colors
        .filter((c) => !deletedColorCodes.includes(c.code))
        .map((c) => {
          const ov = nameOverrides[c.code];
          return ov ? { ...c, name: ov.name, code: ov.code, originalCode: c.code } : c;
        })
        .filter((c) => {
          if (selectedQuality !== null && !(durability[origCode(c)] ?? []).includes(selectedQuality)) return false;
          return normalize(c.name).includes(q) || normalize(c.code).includes(q);
        })
    );

    const customResults = Object.values(customColors).flat().filter((c) => {
      if (selectedQuality !== null && !(durability[c.code] ?? []).includes(selectedQuality)) return false;
      return normalize(c.name).includes(q) || normalize(c.code).includes(q);
    });

    return [...customResults, ...builtInResults];
  }, [search, selectedQuality, durability, deletedColorCodes, nameOverrides, customColors]);

  const allFavoriteColors = useMemo(() => {
    if (!showFavorites || favorites.length === 0) return [];
    const builtIn = colorFamilies.flatMap((f) =>
      f.colors
        .filter((c) => !deletedColorCodes.includes(c.code))
        .map((c) => {
          const ov = nameOverrides[c.code];
          return ov ? { ...c, name: ov.name, code: ov.code, originalCode: c.code } : c;
        })
        .filter((c) => favorites.includes(origCode(c)))
    );
    const custom = Object.values(customColors).flat().filter((c) => favorites.includes(c.code));
    return [...custom, ...builtIn];
  }, [showFavorites, favorites, colorFamilies, deletedColorCodes, nameOverrides, customColors]);

  // Banner gradient — custom if set, otherwise auto from first 5 colors
  const customBanner = familyBanners[selectedFamily];
  const bannerGradient = customBanner
    ? `${customBanner[0]}, ${customBanner[1]}`
    : currentFamily.colors.length > 0
      ? currentFamily.colors.slice(0, 5).map((c) => c.hex).join(", ")
      : (familyColors[selectedFamily] ?? "#888888");

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Navbar isAdmin={isAdmin} onUserClick={handleUserClick} siteName={siteName} logoUrl={logoUrl} logo2Url={logo2Url} announcementText={announcementText} kioskMode={kioskMode} cartCount={cart.length} onCartClick={() => setCartOpen(true)} onSecretAccess={handleLogoAccess} onOrdersClick={openOrders} />

      {/* Room preview modal */}
      {roomPreviewOpen && selectedColor && (
        <RoomPreviewModal
          color={selectedColor}
          hex={editHex}
          onClose={() => setRoomPreviewOpen(false)}
        />
      )}

      {/* Paint calculator modal */}
      {calcOpen && (
        <PaintCalculator
          durabilityPrices={durabilityPrices}
          durabilityOnSale={durabilityOnSale}
          galonPrices={galonPrices}
          galonOnSale={galonOnSale}
          onClose={() => setCalcOpen(false)}
        />
      )}

      {/* Wall-by-wall calculator (solo modo kiosko) */}
      {wallCalcOpen && (
        <WallPaintCalculator
          durabilityPrices={durabilityPrices}
          durabilityOnSale={durabilityOnSale}
          galonPrices={galonPrices}
          galonOnSale={galonOnSale}
          onClose={() => setWallCalcOpen(false)}
        />
      )}

      {/* Calculadora de impermeabilizante (solo modo kiosko) */}
      {imperCalcOpen && (
        <ImpermeabilizanteCalculator config={imperConfig} onClose={() => setImperCalcOpen(false)} />
      )}

      {/* Agregar al carrito (solo modo kiosko) */}
      {addToCartColor && (
        <AddToCartModal
          color={addToCartColor}
          colorYears={durability[origCode(addToCartColor)] ?? []}
          durabilityPrices={durabilityPrices}
          galonPrices={galonPrices}
          onAdd={(item) => { setCart((prev) => [...prev, item]); setAddToCartColor(null); setCartOpen(true); }}
          onClose={() => setAddToCartColor(null)}
        />
      )}

      {/* Carrito (solo modo kiosko) */}
      {cartOpen && (
        <CartModal
          cart={cart}
          durabilityPrices={durabilityPrices}
          galonPrices={galonPrices}
          onRemove={(uid) => setCart((prev) => prev.filter((it) => it.uid !== uid))}
          onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}
          onContinue={() => setCartOpen(false)}
          onClose={() => setCartOpen(false)}
        />
      )}

      {/* Checkout / ticket / envío (solo modo kiosko) */}
      {checkoutOpen && (
        <CheckoutModal
          cart={cart}
          durabilityPrices={durabilityPrices}
          galonPrices={galonPrices}
          onClearCart={() => setCart([])}
          onClose={() => setCheckoutOpen(false)}
        />
      )}

      {/* Pedidos (admin) */}
      {ordersOpen && (
        <AdminOrdersModal
          orders={orders}
          loading={ordersLoading}
          onRefresh={openOrders}
          onSetStatus={handleSetOrderStatus}
          onClose={() => setOrdersOpen(false)}
        />
      )}


      {/* Error toast */}
      {saveError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-red-500 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg flex items-center gap-3" style={{ zIndex: 200 }}>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" style={{ zIndex: 100 }}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">Acceso administrador</h2>
            <p className="text-xs text-gray-400 mb-5">Ingresa la contraseña para editar la paleta</p>

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
          style={{ zIndex: 90 }}
          onClick={() => setShowAdminMenu(false)}
        >
          <div
            className="fixed right-4 top-16 sm:top-24 bg-white rounded-xl shadow-xl border border-gray-100 py-1 w-48 sm:w-52 z-[91]"
            style={{ zIndex: 91 }}
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
            <button
              onClick={() => {
                if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
                  navigator.serviceWorker.controller.postMessage({ type: "FORCE_UPDATE" });
                }
                setTimeout(() => window.location.reload(), 300);
                setShowAdminMenu(false);
              }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-teal-600 hover:bg-teal-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar página en todos
            </button>
            <button
              onClick={copyKioskLink}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {kioskLinkCopied ? (
                <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
              )}
              {kioskLinkCopied ? "¡Enlace copiado!" : "Copiar enlace de tablet"}
            </button>
            <button
              onClick={() => { setShowAdminMenu(false); window.location.href = `${window.location.origin}/?kiosko=1`; }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-teal-600 hover:bg-teal-50 transition-colors"
            >
              <svg className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Entrar al modo kiosko
            </button>
            <button
              onClick={openOrders}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Pedidos
            </button>
            <button
              onClick={() => { exportToCSV(); setShowAdminMenu(false); }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar catálogo CSV
            </button>
            <hr className="my-1 border-gray-100" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      {/* Site settings modal */}
      {showSiteSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-3" style={{ zIndex: 100 }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto flex flex-col" style={{ maxHeight: "92vh" }}>
            {/* Fixed header */}
            <div className="px-6 pt-6 pb-3 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-800 mb-0.5">Configuración del sitio</h2>
              <p className="text-xs text-gray-400">Los cambios se verán en la página pública</p>
            </div>
            {/* Scrollable body */}
            <div className="overflow-y-auto overflow-x-hidden flex-1 px-6 pb-2">

            {/* Logo upload */}
            <p className="text-xs font-semibold text-gray-600 mb-2">Logo</p>
            <div className="flex flex-col gap-2 mb-4">
              {/* Preview — matches exactly how it looks in navbar */}
              <div className="h-24 sm:h-32 w-full flex items-center justify-start flex-shrink-0 border border-gray-100 rounded-lg bg-gray-50 px-2">
                {editLogoUrl ? (
                  <img src={editLogoUrl} alt="logo" className="h-28 w-auto max-w-full object-contain" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 via-yellow-400 to-green-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs">BFM</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
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
            <div className="flex flex-col gap-2 mb-4">
              <div className="h-24 sm:h-32 w-full flex items-center justify-start flex-shrink-0 border border-gray-100 rounded-lg bg-gray-50 px-2">
                {editLogo2Url ? (
                  <img src={editLogo2Url} alt="logo2" className="h-20 sm:h-28 w-auto max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-gray-400">Sin logo secundario</span>
                )}
              </div>
              <div className="flex items-center gap-2">
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
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 mb-4"
              placeholder="Pinturas BFM"
            />

            {/* Announcement text */}
            <p className="text-xs font-semibold text-gray-600 mb-2">Texto de anuncio (barra inferior del navbar)</p>
            <input
              type="text"
              value={editAnnouncementText}
              onChange={(e) => setEditAnnouncementText(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 mb-6"
              placeholder="Ej: ¡Nuevos colores disponibles! Visítanos en tienda."
              maxLength={120}
            />

            {/* Precios por cubeta 19L */}
            <p className="text-xs font-semibold text-gray-600 mb-2">Precios por cubeta (19 L)</p>
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
                      className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
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

            {/* Precios por galón 4L */}
            <p className="text-xs font-semibold text-gray-600 mb-2">Precios por galón (4 L)</p>
            <div className="flex flex-col gap-2 mb-4">
              {DURABILITY_OPTIONS.map((opt) => {
                const isOnSale = editGalonOnSale.includes(opt.years);
                return (
                  <div key={opt.years} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-16 flex-shrink-0">{opt.years} años</span>
                    <input
                      type="text"
                      value={editGalonPrices[String(opt.years)] ?? ""}
                      onChange={(e) => setEditGalonPrices((prev) => ({ ...prev, [String(opt.years)]: e.target.value }))}
                      placeholder="ej: $120"
                      className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400"
                    />
                    <label className={`flex items-center gap-1.5 cursor-pointer px-2.5 py-2 rounded-lg border text-xs font-medium transition-colors flex-shrink-0 ${
                      isOnSale ? "bg-orange-50 border-orange-400 text-orange-600" : "bg-white border-gray-200 text-gray-400 hover:border-orange-300"
                    }`}>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isOnSale}
                        onChange={() => setEditGalonOnSale((prev) =>
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

            {/* Card height */}
            <div className="py-3 border-t border-gray-100 mt-2">
              <p className="text-sm font-medium text-gray-700 mb-1">Altura de las tarjetas de color</p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={36} max={120} step={4}
                  value={editCardHeight}
                  onChange={e => setEditCardHeight(Number(e.target.value))}
                  className="flex-1 accent-teal-500"
                />
                <span className="text-sm font-bold text-teal-600 w-14 text-right">{editCardHeight}px</span>
              </div>
              <div className="mt-2 rounded-lg overflow-hidden border border-gray-200" style={{ height: `${editCardHeight}px`, backgroundColor: "#c4849a" }} />
            </div>

            {/* Rendimiento label */}
            <div className="py-3 border-t border-gray-100 mt-2">
              <p className="text-sm font-medium text-gray-700 mb-1">Texto “Rendimiento aproximado”</p>
              <p className="text-xs text-gray-400 mb-2">Etiqueta que aparece en el panel de detalle del color</p>
              <input
                type="text"
                value={editRendimientoLabel}
                onChange={e => setEditRendimientoLabel(e.target.value)}
                maxLength={60}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                placeholder="Rendimiento aproximado"
              />
            </div>

            {/* Room button label */}
            <div className="py-3 border-t border-gray-100 mt-2">
              <p className="text-sm font-medium text-gray-700 mb-1">Texto del botón “Ver en habitación”</p>
              <p className="text-xs text-gray-400 mb-2">Texto que aparece en el botón de vista previa de habitación</p>
              <input
                type="text"
                value={editRoomButtonLabel}
                onChange={e => setEditRoomButtonLabel(e.target.value)}
                maxLength={40}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                placeholder="Ver en habitación"
              />
            </div>

            {/* Room preview toggle */}
            <div className="flex items-center justify-between py-3 border-t border-gray-100 mt-2">
              <div>
                <p className="text-sm font-medium text-gray-700">Vista previa en habitación</p>
                <p className="text-xs text-gray-400">Permite ver colores en habitaciones simuladas</p>
              </div>
              <button
                onClick={() => setEditRoomPreviewEnabled((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${editRoomPreviewEnabled ? "bg-teal-500" : "bg-gray-300"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editRoomPreviewEnabled ? "translate-x-5" : ""}`} />
              </button>
            </div>

            {/* PWA icon upload */}
            <div className="py-3 border-t border-gray-100 mt-2">
              <p className="text-sm font-medium text-gray-700 mb-0.5">Ícono de pantalla de inicio</p>
              <p className="text-xs text-gray-400 mb-2">Imagen que aparece al agregar a inicio en celulares/tabletas. Usa imagen cuadrada.</p>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {editPwaIconUrl ? (
                    <img src={editPwaIconUrl} alt="pwa icon" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 via-yellow-400 to-green-500 rounded-xl">
                      <span className="text-white font-bold text-xs">BFM</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors text-center">
                    Cargar imagen
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => setEditPwaIconUrl(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }} />
                  </label>
                  {editPwaIconUrl && (
                    <button onClick={() => setEditPwaIconUrl(null)} className="text-[11px] text-red-400 hover:text-red-500 transition-colors text-left">
                      Quitar ícono
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Calc button toggle */}
            <div className="flex items-center justify-between py-3 border-t border-gray-100 mt-2">
              <div>
                <p className="text-sm font-medium text-gray-700">Botón “Calcular pintura”</p>
                <p className="text-xs text-gray-400">Muestra u oculta el botón de calculadora</p>
              </div>
              <button
                onClick={() => setEditCalcButtonEnabled((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${editCalcButtonEnabled ? "bg-teal-500" : "bg-gray-300"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editCalcButtonEnabled ? "translate-x-5" : ""}`} />
              </button>
            </div>

            {/* Impermeabilizante (calculadora kiosko) */}
            <div className="py-3 border-t border-gray-100 mt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Calculadora de impermeabilizante</p>
                  <p className="text-xs text-gray-400">Solo en modo kiosko (tablet)</p>
                </div>
                <button
                  onClick={() => setEditImper((p) => ({ ...p, enabled: !p.enabled }))}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${editImper.enabled ? "bg-teal-500" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${editImper.enabled ? "translate-x-5" : ""}`} />
                </button>
              </div>
              {editImper.enabled && (
                <div className="mt-3 flex flex-col gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Nombre</label>
                    <input value={editImper.name} maxLength={60} onChange={(e) => setEditImper((p) => ({ ...p, name: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" placeholder="Impermeabilizante" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Precio por unidad</label>
                      <input value={editImper.price} maxLength={20} onChange={(e) => setEditImper((p) => ({ ...p, price: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" placeholder="$1,200.00" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Presentación</label>
                      <input value={editImper.unitLabel} maxLength={40} onChange={(e) => setEditImper((p) => ({ ...p, unitLabel: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" placeholder="Cubeta 19L" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Cobertura (m²)</label>
                      <input type="number" inputMode="decimal" min="1" value={editImper.coverageM2} onChange={(e) => setEditImper((p) => ({ ...p, coverageM2: Number(e.target.value) }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">A cuántas pasadas</label>
                      <input type="number" inputMode="numeric" min="1" max="5" value={editImper.coats} onChange={(e) => setEditImper((p) => ({ ...p, coats: Number(e.target.value) }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
                    </div>
                  </div>
                  <div className="w-1/2 pr-1">
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Litros por unidad</label>
                    <input type="number" inputMode="decimal" min="1" value={editImper.litersPerUnit} onChange={(e) => setEditImper((p) => ({ ...p, litersPerUnit: Number(e.target.value) }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-400" />
                  </div>
                  <p className="text-[11px] text-gray-400">Una {editImper.unitLabel || "unidad"} ({editImper.litersPerUnit || 0} L) cubre {editImper.coverageM2 || 0} m² a {editImper.coats || 0} pasadas.</p>
                </div>
              )}
            </div>

            {/* Family colors & names */}
            <div className="py-3 border-t border-gray-100 mt-2">
              <p className="text-sm font-medium text-gray-700 mb-0.5">Familias de colores</p>
              <p className="text-xs text-gray-400 mb-3">Color del botón selector, nombre y degradado del banner de cada familia</p>
              <div className="flex flex-col gap-3">
                {editFamilyNames.map((name, i) => (
                  <div key={i} className="flex flex-col gap-1.5 border border-gray-100 rounded-xl p-2">
                    <div className="flex items-center gap-2">
                      {/* Color botón */}
                      <label className="cursor-pointer relative flex-shrink-0">
                        <div className="w-8 h-8 rounded-lg border-2 border-gray-200 shadow-sm" style={{ backgroundColor: editFamilyColors[i] ?? "#888888" }} />
                        <input
                          type="color"
                          value={editFamilyColors[i] ?? "#888888"}
                          onChange={(e) => setEditFamilyColors(prev => prev.map((c, j) => j === i ? e.target.value : c))}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                      </label>
                      {/* Name */}
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setEditFamilyNames(prev => prev.map((n, j) => j === i ? e.target.value : n))}
                        maxLength={40}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-teal-400"
                      />
                    </div>
                    {/* Banner gradient pickers */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 w-12 flex-shrink-0">Banner:</span>
                      {/* Preview */}
                      <div
                        className="flex-1 h-5 rounded-md border border-gray-200"
                        style={{ background: editFamilyBanners[i]
                          ? `linear-gradient(to right, ${editFamilyBanners[i]![0]}, ${editFamilyBanners[i]![1]})`
                          : "linear-gradient(to right, #cccccc, #eeeeee)" }}
                      />
                      {/* Color intenso */}
                      <label className="cursor-pointer relative flex-shrink-0" title="Color intenso (izquierda)">
                        <div className="w-6 h-6 rounded-md border-2 border-gray-300" style={{ backgroundColor: editFamilyBanners[i]?.[0] ?? "#cccccc" }} />
                        <input
                          type="color"
                          value={editFamilyBanners[i]?.[0] ?? "#cccccc"}
                          onChange={(e) => setEditFamilyBanners(prev => {
                            const next = [...prev];
                            next[i] = [e.target.value, next[i]?.[1] ?? "#eeeeee"];
                            return next;
                          })}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                      </label>
                      <span className="text-[10px] text-gray-300">→</span>
                      {/* Color claro */}
                      <label className="cursor-pointer relative flex-shrink-0" title="Color claro (derecha)">
                        <div className="w-6 h-6 rounded-md border-2 border-gray-300" style={{ backgroundColor: editFamilyBanners[i]?.[1] ?? "#eeeeee" }} />
                        <input
                          type="color"
                          value={editFamilyBanners[i]?.[1] ?? "#eeeeee"}
                          onChange={(e) => setEditFamilyBanners(prev => {
                            const next = [...prev];
                            next[i] = [next[i]?.[0] ?? "#cccccc", e.target.value];
                            return next;
                          })}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        />
                      </label>
                      {/* Reset */}
                      {editFamilyBanners[i] && (
                        <button
                          onClick={() => setEditFamilyBanners(prev => { const next = [...prev]; next[i] = null; return next; })}
                          className="text-[10px] text-gray-400 hover:text-red-400"
                          title="Usar degradado automático"
                        >✕</button>
                      )}
                    </div>
                    {/* Delete — only for extra families beyond original hardcoded */}
                    {i >= colorFamilies.length && (
                      <button
                        onClick={() => {
                          setEditFamilyNames(prev => prev.filter((_, j) => j !== i));
                          setEditFamilyColors(prev => prev.filter((_, j) => j !== i));
                          setEditFamilyBanners(prev => prev.filter((_, j) => j !== i));
                        }}
                        className="self-end text-[10px] text-red-400 hover:text-red-600 flex items-center gap-0.5"
                        title="Eliminar familia"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Eliminar
                      </button>
                    )}
                  </div>
                ))}
                {/* Add new family button */}
                <button
                  onClick={() => {
                    setEditFamilyNames(prev => [...prev, "Nueva familia"]);
                    setEditFamilyColors(prev => [...prev, "#888888"]);
                    setEditFamilyBanners(prev => [...prev, null]);
                  }}
                  className="flex items-center justify-center gap-1.5 mt-1 py-2 rounded-lg border border-dashed border-teal-300 text-teal-500 text-xs font-semibold hover:bg-teal-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Nueva familia
                </button>
              </div>
            </div>

            </div>{/* end scrollable body */}

            {/* Fixed footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
              {logoSaveError && (
                <p className="text-[11px] text-red-400 mb-2">{logoSaveError}</p>
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
        </div>
      )}

      {/* Add color modal */}
      {showAddColorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" style={{ zIndex: 100 }}>
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
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-teal-400"
            />
            <input
              type="text"
              value={newColorPageNumber}
              onChange={(e) => setNewColorPageNumber(e.target.value)}
              placeholder="Número de página (opcional)"
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
            <h1 className="text-center text-2xl sm:text-3xl font-light text-gray-800 mb-4 px-4">
              Elige tu color favorito
            </h1>

            {/* Family selector dots */}
            <div className="flex justify-center gap-1.5 mb-5 flex-wrap px-4">
              {familyDisplayNames.map((name, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedFamily(i); setSelectedColor(null); setSearch(""); }}
                  title={name}
                  className={`relative h-8 min-w-14 px-2.5 rounded-md transition-all border border-black/15 shadow-sm flex items-center justify-center gap-1 ${
                    selectedFamily === i
                      ? "ring-2 ring-offset-1 ring-gray-400 scale-110"
                      : "hover:scale-110"
                  }`}
                  style={{ background: familyDisplayNames[i] === "Rojos/Rosas"
                    ? `linear-gradient(135deg, ${familyColors[i] ?? "#C9464F"} 50%, #e87ca0 50%)`
                    : (familyColors[i] ?? DEFAULT_FAMILY_COLORS[i] ?? "#888888") }}
                >
                  {selectedFamily === i && (
                    <svg className="w-3 h-3 text-white drop-shadow shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span className="text-[10px] font-semibold text-white leading-none whitespace-nowrap" style={{ textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000" }}>{name}</span>
                </button>
              ))}
            </div>

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
            {DURABILITY_OPTIONS.some((opt) => durabilityPrices[String(opt.years)] || galonPrices[String(opt.years)]) && (
              <div className="px-4 mb-6">
                <p className="text-center text-base text-gray-900 mb-3 uppercase tracking-widest font-bold">
                  Filtra por calidad y precio
                </p>

                {/* Todos los colores + Mis favoritos */}
                <div className="flex justify-center gap-3 mb-4 flex-wrap">
                  <button
                    onClick={() => { setSelectedQuality(null); setSelectedColor(null); setShowFavorites(false); }}
                    className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                      selectedQuality === null && !showFavorites
                        ? "bg-gray-800 text-white border-gray-800 shadow-lg scale-105"
                        : "bg-white text-gray-500 border-gray-200 hover:scale-110 hover:border-gray-600 hover:text-gray-800"
                    }`}
                    style={selectedQuality !== null || showFavorites ? undefined : { boxShadow: "0 0 8px #6b7280, 0 0 18px #4b556380" }}
                  >
                    {selectedQuality === null && !showFavorites && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    Todos los colores
                  </button>
                  <button
                    onClick={() => { setShowFavorites(!showFavorites); setSelectedQuality(null); setSelectedColor(null); }}
                    className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                      showFavorites
                        ? "bg-red-500 text-white border-red-500 shadow-lg scale-105"
                        : "bg-white text-gray-500 border-gray-200 hover:scale-110 hover:border-red-400 hover:text-red-500"
                    }`}
                    style={showFavorites ? { boxShadow: "0 0 8px #ef4444, 0 0 18px #ef444480" } : undefined}
                  >
                    {showFavorites ? (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 fill-red-100 text-red-400" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                    Mis favoritos {favorites.length > 0 && <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${showFavorites ? "bg-white/30" : "bg-red-100 text-red-500"}`}>{favorites.length}</span>}
                  </button>
                </div>

                {/* Combined quality grid */}
                <div className="mb-1">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {DURABILITY_OPTIONS.filter((opt) => durabilityPrices[String(opt.years)] || galonPrices[String(opt.years)]).map((opt) => {
                      const price = durabilityPrices[String(opt.years)];
                      const galon = galonPrices[String(opt.years)];
                      const active = selectedQuality === opt.years;
                      const onSale = durabilityOnSale.includes(opt.years) || galonOnSale.includes(opt.years);
                      const neonColor = onSale ? "#f97316" : "#2dd4bf";
                      const neonShadow = `0 0 8px ${neonColor}, 0 0 20px ${neonColor}80`;
                      return (
                        <button
                          key={opt.years}
                          onClick={() => { setSelectedQuality(active ? null : opt.years); setSelectedColor(null); }}
                          className={`neon-hover relative flex flex-col items-center py-2.5 px-2 rounded-2xl border transition-all duration-200 shadow-sm ${
                            active
                              ? "bg-teal-500 border-teal-400 text-white shadow-md scale-105"
                              : "bg-white text-gray-700 border-gray-200 hover:scale-105 hover:border-teal-400"
                          }`}
                          style={{ boxShadow: active ? neonShadow : undefined, ["--neon-hover" as string]: neonShadow } as React.CSSProperties}
                        >
                          {active && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-white/30">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          )}
                          <span className="font-bold text-sm mb-1">{opt.years} años</span>
                          {galon && (
                            <div className="flex flex-wrap justify-center items-center gap-x-1 gap-y-0.5">
                              <img src="/galon.png" alt="galón" className="w-4 h-4 object-contain flex-shrink-0" />
                              <span className={`text-sm font-extrabold leading-tight ${active ? (galonOnSale.includes(opt.years) ? "text-white oferta-pulse" : "text-white") : galonOnSale.includes(opt.years) ? "text-orange-500 oferta-pulse" : "text-teal-700"}`}>{galon}</span>
                              <span className={`text-[10px] font-semibold ${active ? "text-white/80" : "text-gray-500"}`}>Gal. 4L</span>
                              {galonOnSale.includes(opt.years) && <span className={`oferta-pulse text-[9px] font-extrabold px-1.5 py-0.5 rounded-full whitespace-nowrap ${active ? "bg-white text-orange-500" : "bg-orange-500 text-white"}`}>🔥 Oferta</span>}
                            </div>
                          )}
                          {price && (
                            <div className="flex flex-wrap justify-center items-center gap-x-1 gap-y-0.5">
                              <img src="/cubeta.png" alt="cubeta" className="w-4 h-4 object-contain flex-shrink-0" />
                              <span className={`text-sm font-extrabold leading-tight ${active ? (durabilityOnSale.includes(opt.years) ? "text-white oferta-pulse" : "text-white") : durabilityOnSale.includes(opt.years) ? "text-orange-500 oferta-pulse" : "text-teal-700"}`}>{price}</span>
                              <span className={`text-[10px] font-semibold ${active ? "text-white/80" : "text-gray-500"}`}>Cub. 19L</span>
                              {durabilityOnSale.includes(opt.years) && <span className={`oferta-pulse text-[9px] font-extrabold px-1.5 py-0.5 rounded-full whitespace-nowrap ${active ? "bg-white text-orange-500" : "bg-orange-500 text-white"}`}>🔥 Oferta</span>}
                            </div>
                          )}
                          <span className={`text-[10px] leading-tight mt-0.5 ${active ? "text-white/70" : "text-gray-400"}`}>{opt.yield}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price clarification note */}
                <p className="mt-2 text-center text-[11px] text-gray-400">
                  * Precios por galón de 4 L y cubeta de 19 L
                </p>

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

                {/* Calculator button */}
                {calcButtonEnabled && <div className="mt-4 flex justify-center">
                  <button
                    onClick={() => setCalcOpen(true)}
                    className="neon-hover flex items-center gap-2 bg-teal-500 text-white font-semibold px-5 py-2.5 rounded-full shadow transition-all duration-200 active:scale-95 text-sm hover:scale-110 hover:bg-teal-400"
                    style={{ ["--neon-hover" as string]: "0 0 10px #2dd4bf, 0 0 25px #0d948880" } as React.CSSProperties}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Calcular cuánta pintura necesito
                  </button>
                </div>}

                {/* Wall calculator button — solo modo kiosko (tablet en tienda) */}
                {kioskMode && <div className="mt-3 flex justify-center">
                  <button
                    onClick={() => setWallCalcOpen(true)}
                    className="neon-hover flex items-center gap-2 bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-full shadow transition-all duration-200 active:scale-95 text-sm hover:scale-110 hover:bg-gray-800"
                    style={{ ["--neon-hover" as string]: "0 0 10px #2dd4bf, 0 0 25px #0d948880" } as React.CSSProperties}
                  >
                    <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z M4 9h16 M4 14h16 M9 4v16" />
                    </svg>
                    Calcular por paredes
                  </button>
                </div>}

                {/* Calculadora de impermeabilizante — solo kiosko, si está activada */}
                {kioskMode && imperConfig.enabled && <div className="mt-3 flex justify-center">
                  <button
                    onClick={() => setImperCalcOpen(true)}
                    className="neon-hover flex items-center gap-2 bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-full shadow transition-all duration-200 active:scale-95 text-sm hover:scale-110 hover:bg-gray-800"
                    style={{ ["--neon-hover" as string]: "0 0 10px #2dd4bf, 0 0 25px #0d948880" } as React.CSSProperties}
                  >
                    <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7M3 21h18" /></svg>
                    Calcular {imperConfig.name || "impermeabilizante"}
                  </button>
                </div>}
              </div>
            )}

            {(search.trim() || showFavorites) ? (
              /* Search results or favorites - show all matching colors across families */
              (() => {
                const globalList = showFavorites && !search.trim() ? allFavoriteColors : allSearchResults;
                const emptyMsg = showFavorites && !search.trim()
                  ? "Aún no tienes favoritos. Toca el ❤️ en cualquier color para guardarlo."
                  : `No se encontraron colores para "${search}"`;
                const countMsg = showFavorites && !search.trim()
                  ? `${globalList.length} color${globalList.length !== 1 ? "es" : ""} favorito${globalList.length !== 1 ? "s" : ""}`
                  : `${globalList.length} colores encontrados`;
                return (
              <div className="px-4 pb-10">
                {globalList.length === 0 ? (
                    <p className="text-center text-gray-400 py-20">{emptyMsg}</p>
                  ) : (
                  <>
                    <p className="text-sm text-gray-500 mb-4 text-center">{countMsg}</p>
                    {(() => {
                      const rows: Color[][] = [];
                      for (let i = 0; i < globalList.length; i += 3) rows.push(globalList.slice(i, i + 3));
                      const selectedRowIdx = selectedColor ? Math.floor(globalList.findIndex(c => c.code === selectedColor.code) / 3) : -1;
                      return rows.map((rowColors, rowIndex) => (
                        <React.Fragment key={rowIndex}>
                          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3">
                            {rowColors.map((color) => (
                              <ColorSwatch
                                key={color.id ?? color.code}
                                color={{ ...color, hex: getEffectiveHex(color) }}
                                onClick={() => { setSelectedColor(selectedColor?.code === color.code ? null : color); setRoomPreviewOpen(false); }}
                                selected={selectedColor?.code === color.code}
                                cardHeight={cardHeight}
                                isFavorite={favorites.includes(color.code)}
                                onToggleFavorite={() => toggleFavorite(color.code)}
                              />
                            ))}
                          </div>
                          {selectedRowIdx === rowIndex && selectedColor && (
                            <div className="flex flex-col sm:flex-row w-full mb-3">
                              <div className="relative w-full sm:w-2/5 flex-shrink-0 flex flex-col justify-between p-4 transition-colors duration-200" style={{ backgroundColor: editHex, minHeight: "80px" }}>
                                <div>
                                  <p className="text-white text-xs font-semibold drop-shadow leading-tight">{selectedColor.name}</p>
                                  <p className="text-white/80 text-[10px] drop-shadow mt-0.5">{selectedColor.code}</p>
                                </div>
                              </div>
                              <div className="relative flex-1 bg-white flex flex-col justify-center gap-3 px-5 py-4 border-t sm:border-t-0 sm:border-l border-gray-100">
                                <button onClick={() => setSelectedColor(null)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                                {isAdmin ? (
                                  /* ── ADMIN: edit panel ── */
                                  <>
                                    <p className="text-[11px] font-semibold text-gray-700">Editar color</p>
                                    <div className="flex flex-col gap-1.5">
                                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-teal-400" placeholder="Nombre del color" />
                                      <input type="text" value={editCode} onChange={(e) => setEditCode(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs font-mono text-gray-500 focus:outline-none focus:border-teal-400" placeholder="Código" />
                                      <input type="text" value={editPageNumber} onChange={(e) => setEditPageNumber(e.target.value)} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-500 focus:outline-none focus:border-teal-400" placeholder="Página (opcional)" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <label className="cursor-pointer relative flex-shrink-0">
                                        <div className="w-10 h-10 rounded-lg border-2 border-gray-200 shadow-sm" style={{ backgroundColor: editHex }} />
                                        <input type="color" value={editHex.length === 7 ? editHex : "#000000"} onChange={(e) => applyHex(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                                      </label>
                                      <input type="text" value={editHex} onChange={(e) => applyHex(e.target.value)} maxLength={7} className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-xs font-mono text-gray-700 focus:outline-none focus:border-teal-400" placeholder="#000000" />
                                    </div>
                                    <button onClick={handleSave} className={`w-full py-1.5 rounded text-xs font-semibold transition-colors ${savedFlash ? "bg-green-500 text-white" : "bg-teal-500 hover:bg-teal-600 text-white"}`}>
                                      {savedFlash ? "Guardado" : "Guardar color"}
                                    </button>
                                    {(() => {
                                      const actualFamilyIdx = selectedColor.id
                                        ? (() => { const fn = Object.keys(customColors).find(f => customColors[f].some(c => c.id === selectedColor.id)); return fn ? familyDisplayNames.indexOf(fn) : -1; })()
                                        : colorFamilies.findIndex(f => f.colors.some(c => c.code === origCode(selectedColor)));
                                      return (
                                        <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
                                          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Mover a otra familia</p>
                                          <select value={editTargetFamily} onChange={(e) => setEditTargetFamily(Number(e.target.value))} className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-teal-400">
                                            {familyDisplayNames.map((name, idx) => (
                                              <option key={idx} value={idx} disabled={idx === actualFamilyIdx}>
                                                {name}{idx === actualFamilyIdx ? " (actual)" : ""}
                                              </option>
                                            ))}
                                          </select>
                                          <button onClick={handleSearchMoveColor} disabled={movingColor || editTargetFamily === actualFamilyIdx} className="w-full py-1.5 rounded text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white transition-colors">
                                            {movingColor ? "Moviendo…" : "Mover a esta familia"}
                                          </button>
                                        </div>
                                      );
                                    })()}
                                    {saveError && <p className="text-[10px] text-red-400">{saveError}</p>}
                                    <button onClick={() => { if (window.confirm(`¿Eliminar "${selectedColor.name}"? Esta acción no se puede deshacer.`)) { handleDeleteColor(selectedColor); } }} className="text-[10px] text-red-400 hover:text-red-500 transition-colors text-center">
                                      Eliminar color
                                    </button>
                                    <hr className="w-full border-gray-100" />
                                    <div>
                                      <p className="text-base font-extrabold text-gray-800 mb-1">{rendimientoLabel}</p>
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
                                              <div className="flex items-center gap-2 flex-wrap justify-end">
                                                {price && <span className={checked ? "text-white font-bold" : "text-teal-700 font-bold"}>{price}<span className="font-normal opacity-70 ml-0.5 text-[9px]">/19L</span></span>}
                                                {galonPrices[String(opt.years)] && <span className={checked ? "text-white/90 font-bold" : "text-teal-500 font-bold"}>{galonPrices[String(opt.years)]}<span className="font-normal opacity-70 ml-0.5 text-[9px]">/4L</span></span>}
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
                                      <p className="text-xl font-extrabold text-gray-800 leading-tight">{selectedColor.name}</p>
                                      <p className="text-sm text-gray-400 mt-0.5 font-mono">
                                        {selectedColor.code}
                                        {selectedColor.pageNumber != null && (
                                          <span className="ml-2 text-xs font-semibold bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">{selectedColor.pageNumber}</span>
                                        )}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <div className="w-12 h-12 rounded-full border-4 border-gray-100 shadow-inner flex-shrink-0" style={{ backgroundColor: editHex }} />
                                      {roomPreviewEnabled && (
                                        <button onClick={() => setRoomPreviewOpen(true)} className="neon-hover flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-300 bg-teal-50 text-teal-700 text-xs font-semibold transition-all duration-200 hover:scale-110 hover:bg-teal-100 hover:border-teal-400 active:scale-95"
                                          style={{ ["--neon-hover" as string]: "0 0 8px #2dd4bf, 0 0 20px #0d948880" } as React.CSSProperties}>
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                          {roomButtonLabel}
                                        </button>
                                      )}
                                      <button
                                        onClick={() => toggleFavorite(origCode(selectedColor))}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 hover:scale-110 active:scale-95 ${
                                          favorites.includes(origCode(selectedColor))
                                            ? "bg-red-50 border-red-300 text-red-500"
                                            : "bg-white border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400"
                                        }`}
                                      >
                                        <svg className={`w-3.5 h-3.5 ${favorites.includes(origCode(selectedColor)) ? "fill-red-500 text-red-500 heart-beat" : "fill-none text-gray-400"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                        Favorito
                                      </button>
                                      {/* Agregar al carrito — solo modo kiosko (tablet en tienda) */}
                                      {kioskMode && (
                                        <button
                                          onClick={() => setAddToCartColor({ ...selectedColor, hex: editHex })}
                                          className="neon-hover flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 text-white text-xs font-bold transition-all duration-200 hover:scale-110 hover:bg-teal-600 active:scale-95"
                                          style={{ ["--neon-hover" as string]: "0 0 8px #2dd4bf, 0 0 20px #0d948880" } as React.CSSProperties}
                                        >
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                          Agregar al carrito
                                        </button>
                                      )}
                                    </div>
                                    {(() => {
                                      const sel = DURABILITY_OPTIONS.filter((opt) => (durability[origCode(selectedColor)] ?? []).includes(opt.years));
                                      return sel.length > 0 ? (
                                        <div className="flex flex-col gap-3">
                                          <p className="text-base font-extrabold text-gray-800 mb-0">{rendimientoLabel}</p>
                                          <div>
                                            {/* Header */}
                                            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-3 mb-1">
                                              <span />
                                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1 w-24 justify-end"><img src="/galon.png" alt="" className="w-3 h-3 object-contain" />Gal. 4L</span>
                                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1 w-24 justify-end"><img src="/cubeta.png" alt="" className="w-3 h-3 object-contain" />Cub. 19L</span>
                                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide w-20 text-right">Rendimiento</span>
                                            </div>
                                            {/* Rows */}
                                            <div className="flex flex-col gap-1.5">
                                              {sel.map((opt) => {
                                                const price = durabilityPrices[String(opt.years)];
                                                const galon = galonPrices[String(opt.years)];
                                                const cubSale = durabilityOnSale.includes(opt.years);
                                                const galSale = galonOnSale.includes(opt.years);
                                                if (!price && !galon) return null;
                                                return (
                                                  <div key={opt.years} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-2 px-3 py-2 rounded-lg text-[11px] bg-teal-50 border border-teal-200">
                                                    <span className="font-semibold text-teal-700">{opt.years} años</span>
                                                    <div className="flex flex-col items-end w-20 sm:w-24">
                                                      {galSale && <span className="oferta-pulse text-[9px] font-extrabold bg-orange-500 text-white px-1.5 py-0.5 rounded-full leading-none mb-1 whitespace-nowrap">🔥 OFERTA</span>}
                                                      <span className={`font-extrabold ${galon ? (galSale ? "text-orange-500 text-sm oferta-pulse" : "text-teal-700 text-xs") : "text-gray-300 text-xs"}`}>{galon ?? "—"}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end w-20 sm:w-24">
                                                      {cubSale && <span className="oferta-pulse text-[9px] font-extrabold bg-orange-500 text-white px-1.5 py-0.5 rounded-full leading-none mb-1 whitespace-nowrap">🔥 OFERTA</span>}
                                                      <span className={`font-extrabold ${price ? (cubSale ? "text-orange-500 text-sm oferta-pulse" : "text-teal-700 text-xs") : "text-gray-300 text-xs"}`}>{price ?? "—"}</span>
                                                    </div>
                                                    <span className="text-xs text-right w-16 sm:w-20 text-teal-500">{opt.yield}</span>
                                                  </div>
                                                );
                                              })}
                                            </div>
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
                      ));
                    })()}
                  </>
                  )}
              </div>
                );
              })()
            ) : (
              <>
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
                  {familyDisplayNames[selectedFamily] ?? currentFamily.name}
                </p>

                {/* Add color button + bulk select toggle — admin only */}
                {isAdmin && (
                  <div className="flex justify-start gap-2 px-3 mb-3 flex-wrap">
                    <button
                      onClick={() => openAddColorModal(familyDisplayNames[selectedFamily])}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-teal-400 text-teal-500 text-xs font-semibold hover:bg-teal-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Agregar color
                    </button>
                    <button
                      onClick={() => {
                        const entering = !bulkSelectMode;
                        setBulkSelectMode(entering);
                        setBulkSelectedCodes(new Set());
                        setSelectedColor(null);
                        if (entering) {
                          setReorderMode(false);
                          const firstOther = familyDisplayNames.findIndex((_, i) => i !== selectedFamily);
                          setBulkTargetFamily(firstOther >= 0 ? firstOther : 0);
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${bulkSelectMode ? "bg-teal-500 border-teal-500 text-white" : "border-dashed border-purple-400 text-purple-500 hover:bg-purple-50"}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      {bulkSelectMode ? `Seleccionando (${bulkSelectedCodes.size})` : "Selección múltiple"}
                    </button>
                    <button
                      onClick={() => {
                        const entering = !reorderMode;
                        setReorderMode(entering);
                        setSelectedColor(null);
                        if (entering) setBulkSelectMode(false);
                        setDragSrcIdx(null);
                        setDragOverIdx(null);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${reorderMode ? "bg-orange-500 border-orange-500 text-white" : "border-dashed border-orange-400 text-orange-500 hover:bg-orange-50"}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      {reorderMode ? "Listo" : "Mover colores"}
                    </button>
                    <button
                      onClick={async () => {
                        const lightness = (hex: string) => {
                          const h = (hex || '#808080').replace('#', '').padEnd(6, '0');
                          const r = parseInt(h.slice(0, 2), 16) / 255;
                          const g = parseInt(h.slice(2, 4), 16) / 255;
                          const b = parseInt(h.slice(4, 6), 16) / 255;
                          return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
                        };
                        const sorted = [...displayedColors].sort((a, b) =>
                          lightness(getEffectiveHex(b)) - lightness(getEffectiveHex(a))
                        );
                        const codes = sorted.map(c => c.code);
                        const familyKey = familyDisplayNames[selectedFamily] ?? currentFamily.name;
                        setColorOrders(prev => ({ ...prev, [familyKey]: codes }));
                        await saveColorOrder(familyKey, codes);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-indigo-400 text-indigo-500 text-xs font-semibold hover:bg-indigo-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364-.707.707M6.343 17.657l-.707.707m12.728 0-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7z" />
                      </svg>
                      Ordenar por brillo
                    </button>
                  </div>
                )}

                {/* Color swatches grid */}
                {reorderMode ? (
                  <div className="pb-10 px-3">
                    <p className="text-xs text-orange-500 font-medium mb-3 text-center">Arrastra los colores para reorganizarlos — se guarda automáticamente</p>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {displayedColors.map((color, idx) => (
                        <div
                          key={color.id ?? color.code}
                          draggable
                          onDragStart={() => setDragSrcIdx(idx)}
                          onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
                          onDrop={() => handleReorderDrop(idx)}
                          onDragEnd={() => { setDragSrcIdx(null); setDragOverIdx(null); }}
                          className={`transition-all duration-100 ${dragSrcIdx === idx ? "opacity-30 scale-95" : ""} ${dragOverIdx === idx && dragSrcIdx !== idx ? "ring-2 ring-orange-400 rounded-lg scale-105" : ""}`}
                        >
                          <ColorSwatch
                            color={{ ...color, hex: getEffectiveHex(color) }}
                            onClick={() => {}}
                            selected={false}
                            cardHeight={cardHeight}
                            isFavorite={favorites.includes(color.code)}
                            reorderMode={true}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                <div key={selectedFamily} className="pb-10 px-3">
                  {Array.from({ length: Math.ceil(visibleFamilyColors.length / 3) }, (_, rowIndex) => {
                    const rowColors = visibleFamilyColors.slice(rowIndex * 3, rowIndex * 3 + 3);
                    const selectedRowIndex = selectedColor
                      ? Math.floor(visibleFamilyColors.findIndex(c => c.code === selectedColor.code) / 3)
                      : -1;
                    return (
                      <React.Fragment key={rowIndex}>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3">
                          {rowColors.map((color) => {
                            const swatchKey = color.id ? String(color.id) : color.code;
                            return (
                              <ColorSwatch
                                key={color.id ?? color.code}
                                color={{ ...color, hex: getEffectiveHex(color) }}
                                onClick={() => {
                                  if (bulkSelectMode) {
                                    setBulkSelectedCodes(prev => {
                                      const next = new Set(prev);
                                      if (next.has(swatchKey)) next.delete(swatchKey); else next.add(swatchKey);
                                      return next;
                                    });
                                  } else {
                                    setSelectedColor(selectedColor?.code === color.code ? null : color);
                                    setRoomPreviewOpen(false);
                                  }
                                }}
                                selected={!bulkSelectMode && selectedColor?.code === color.code}
                                bulkSelectMode={bulkSelectMode}
                                bulkSelected={bulkSelectedCodes.has(swatchKey)}
                                cardHeight={cardHeight}
                                isFavorite={favorites.includes(color.code)}
                                onToggleFavorite={bulkSelectMode ? undefined : () => toggleFavorite(color.code)}
                                onDelete={isAdmin && !bulkSelectMode ? () => {
                                  if (window.confirm(`¿Eliminar "${color.name}"? Esta acción no se puede deshacer.`)) {
                                    handleDeleteColor(color);
                                  }
                                } : undefined}
                              />
                            );
                          })}
                        </div>
                        {selectedRowIndex === rowIndex && selectedColor && (
                          <div className="flex flex-col sm:flex-row w-full mb-1.5">
                            {/* Top/Left: flat color block */}
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

                                  {/* Name + code + page */}
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
                                    <input
                                      type="text"
                                      value={editPageNumber}
                                      onChange={(e) => setEditPageNumber(e.target.value)}
                                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-500 focus:outline-none focus:border-teal-400"
                                      placeholder="Página (opcional)"
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

                                  {/* Mover a otra familia */}
                                  <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
                                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Mover a otra familia</p>
                                    <select
                                      value={editTargetFamily}
                                      onChange={(e) => setEditTargetFamily(Number(e.target.value))}
                                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-teal-400"
                                    >
                                      {familyDisplayNames.map((name, idx) => (
                                        <option key={idx} value={idx} disabled={idx === selectedFamily}>
                                          {name}{idx === selectedFamily ? " (actual)" : ""}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={handleMoveColor}
                                      disabled={movingColor || editTargetFamily === selectedFamily}
                                      className="w-full py-1.5 rounded text-xs font-semibold bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white transition-colors"
                                    >
                                      {movingColor ? "Moviendo…" : "Mover a esta familia"}
                                    </button>
                                  </div>

                                  {overrides[origCode(selectedColor)] && (
                                    <button
                                      onClick={async () => {
                                        const oc = origCode(selectedColor);
                                        try {
                                          await deleteColorHex(oc);
                                          setOverrides((prev) => {
                                            const next = { ...prev };
                                            delete next[oc];
                                            return next;
                                          });
                                          applyHex(selectedColor.hex);
                                        } catch {
                                          setSaveError("No se pudo restablecer. Verificá tu conexión e intentá de nuevo.");
                                        }
                                      }}
                                      className="text-[10px] text-gray-400 hover:text-red-400 transition-colors text-center"
                                    >
                                      Restablecer color original
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      if (window.confirm(`¿Eliminar "${selectedColor.name}"? Esta acción no se puede deshacer.`)) {
                                        handleDeleteColor(selectedColor);
                                      }
                                    }}
                                    className="text-[10px] text-red-400 hover:text-red-500 transition-colors text-center"
                                  >
                                    Eliminar color
                                  </button>

                                  <hr className="w-full border-gray-100" />

                                  <div>
                                    <p className="text-base font-extrabold text-gray-800 mb-1">{rendimientoLabel}</p>
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
                                            <div className="flex items-center gap-2 flex-wrap justify-end">
                                              {price && <span className={checked ? "text-white font-bold" : "text-teal-700 font-bold"}>{price}<span className="font-normal opacity-70 ml-0.5 text-[9px]">/19L</span></span>}
                                              {galonPrices[String(opt.years)] && <span className={checked ? "text-white/90 font-bold" : "text-teal-500 font-bold"}>{galonPrices[String(opt.years)]}<span className="font-normal opacity-70 ml-0.5 text-[9px]">/4L</span></span>}
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
                                    <p className="text-xl font-extrabold text-gray-800 leading-tight">{selectedColor.name}</p>
                                    <p className="text-sm text-gray-400 mt-0.5 font-mono">
                                      {selectedColor.code}
                                      {selectedColor.pageNumber != null && (
                                        <span className="ml-2 text-xs font-semibold bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">{selectedColor.pageNumber}</span>
                                      )}
                                    </p>
                                  </div>

                                  {/* Color circle + room preview + favorite */}
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <div className="w-12 h-12 rounded-full border-4 border-gray-100 shadow-inner flex-shrink-0" style={{ backgroundColor: editHex }} />
                                    {roomPreviewEnabled && (
                                      <button
                                        onClick={() => setRoomPreviewOpen(true)}
                                        className="neon-hover flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-300 bg-teal-50 text-teal-700 text-xs font-semibold transition-all duration-200 hover:scale-110 hover:bg-teal-100 hover:border-teal-400 active:scale-95"
                                        style={{ ["--neon-hover" as string]: "0 0 8px #2dd4bf, 0 0 20px #0d948880" } as React.CSSProperties}
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                        {roomButtonLabel}
                                      </button>
                                    )}
                                    <button
                                      onClick={() => toggleFavorite(origCode(selectedColor))}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 hover:scale-110 active:scale-95 ${
                                        favorites.includes(origCode(selectedColor))
                                          ? "bg-red-50 border-red-300 text-red-500"
                                          : "bg-white border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400"
                                      }`}
                                    >
                                      <svg className={`w-3.5 h-3.5 ${favorites.includes(origCode(selectedColor)) ? "fill-red-500 text-red-500" : "fill-none text-gray-400"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                      </svg>
                                      {favorites.includes(origCode(selectedColor)) ? "Favorito" : "Favorito"}
                                    </button>
                                    {/* Agregar al carrito — solo modo kiosko (tablet en tienda) */}
                                    {kioskMode && (
                                      <button
                                        onClick={() => setAddToCartColor({ ...selectedColor, hex: editHex })}
                                        className="neon-hover flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500 text-white text-xs font-bold transition-all duration-200 hover:scale-110 hover:bg-teal-600 active:scale-95"
                                        style={{ ["--neon-hover" as string]: "0 0 8px #2dd4bf, 0 0 20px #0d948880" } as React.CSSProperties}
                                      >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                        Agregar al carrito
                                      </button>
                                    )}
                                  </div>

                                  {(() => {
                                    const selected = DURABILITY_OPTIONS.filter((opt) =>
                                      (durability[origCode(selectedColor)] ?? []).includes(opt.years)
                                    );
                                    return selected.length > 0 ? (
                                      <div className="flex flex-col gap-3">
                                        <p className="text-base font-extrabold text-gray-800 mb-0">{rendimientoLabel}</p>
                                        <div>
                                          {/* Header */}
                                          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 px-3 mb-1">
                                            <span />
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1 w-20 sm:w-24 justify-end"><img src="/galon.png" alt="" className="w-3 h-3 object-contain" />Gal. 4L</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1 w-20 sm:w-24 justify-end"><img src="/cubeta.png" alt="" className="w-3 h-3 object-contain" />Cub. 19L</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide w-16 sm:w-20 text-right">Rend.</span>
                                          </div>
                                          {/* Rows */}
                                          <div className="flex flex-col gap-1.5">
                                            {selected.map((opt) => {
                                              const price = durabilityPrices[String(opt.years)];
                                              const galon = galonPrices[String(opt.years)];
                                              const cubSale = durabilityOnSale.includes(opt.years);
                                              const galSale = galonOnSale.includes(opt.years);
                                              if (!price && !galon) return null;
                                              return (
                                                <div key={opt.years} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-2 px-3 py-2 rounded-lg text-[11px] bg-teal-50 border border-teal-200">
                                                  <span className="font-semibold text-teal-700">{opt.years} años</span>
                                                  {/* Galón price */}
                                                  <div className="flex flex-col items-end w-20 sm:w-24">
                                                    {galSale && <span className="oferta-pulse text-[9px] font-extrabold bg-orange-500 text-white px-1.5 py-0.5 rounded-full leading-none mb-1 whitespace-nowrap">🔥 OFERTA</span>}
                                                    <span className={`font-extrabold ${galon ? (galSale ? "text-orange-500 text-sm oferta-pulse" : "text-teal-700 text-xs") : "text-gray-300 text-xs"}`}>{galon ?? "—"}</span>
                                                  </div>
                                                  {/* Cubeta price */}
                                                  <div className="flex flex-col items-end w-20 sm:w-24">
                                                    {cubSale && <span className="oferta-pulse text-[9px] font-extrabold bg-orange-500 text-white px-1.5 py-0.5 rounded-full leading-none mb-1 whitespace-nowrap">🔥 OFERTA</span>}
                                                    <span className={`font-extrabold ${price ? (cubSale ? "text-orange-500 text-sm oferta-pulse" : "text-teal-700 text-xs") : "text-gray-300 text-xs"}`}>{price ?? "—"}</span>
                                                  </div>
                                                  <span className="text-xs text-right w-20 text-teal-500">{opt.yield}</span>
                                                </div>
                                              );
                                            })}
                                          </div>
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
                  {visibleFamilyColors.length < displayedColors.length && (
                    <div ref={loadMoreRef} className="flex flex-col items-center gap-2 py-6">
                      <div className="w-6 h-6 border-2 border-teal-300 border-t-teal-600 rounded-full animate-spin" />
                      <span className="text-xs text-gray-400">Mostrando {visibleFamilyColors.length} de {displayedColors.length} colores…</span>
                    </div>
                  )}
                </div>
                )}
              </>
            )}
          </>
      </main>

      {/* Bulk move action bar */}
      {isAdmin && bulkSelectMode && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl px-4 py-3 flex flex-col sm:flex-row items-center gap-3">
          <span className="text-sm font-semibold text-gray-700 flex-shrink-0">
            {bulkSelectedCodes.size === 0 ? "Toca colores para seleccionar" : `${bulkSelectedCodes.size} color${bulkSelectedCodes.size !== 1 ? "es" : ""} seleccionado${bulkSelectedCodes.size !== 1 ? "s" : ""}`}
          </span>
          <div className="flex items-center gap-2 flex-1 flex-wrap justify-center sm:justify-start">
            <label className="text-xs text-gray-500 font-medium flex-shrink-0">Mover a:</label>
            <select
              value={bulkTargetFamily}
              onChange={(e) => setBulkTargetFamily(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-teal-400 bg-white"
            >
              {familyDisplayNames.map((name, idx) => (
                <option key={idx} value={idx} disabled={idx === selectedFamily}>{name}{idx === selectedFamily ? " (actual)" : ""}</option>
              ))}
            </select>
            <button
              onClick={handleBulkMoveColors}
              disabled={bulkSelectedCodes.size === 0 || bulkTargetFamily === selectedFamily || bulkMoving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-teal-500 text-white text-xs font-bold hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {bulkMoving ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              )}
              {bulkMoving ? "Moviendo..." : "Mover"}
            </button>
          </div>
          <button
            onClick={() => { setBulkSelectMode(false); setBulkSelectedCodes(new Set()); }}
            className="px-4 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
