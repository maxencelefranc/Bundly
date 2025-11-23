import { supabase } from 'src/lib/supabase';
import { getOrCreateProfile } from 'src/features/profile/profileApi';
import { TABLES } from 'src/lib/dbTables';

export type ShoppingList = {
  id: string;
  couple_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type ShoppingItem = {
  id: string;
  couple_id: string;
  list_id: string | null;
  name: string;
  category: string | null;
  quantity: number;
  picked: boolean;
  created_at: string;
  updated_at: string;
};

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function inferShoppingCategory(name: string): string {
  const n = normalizeName(name);
  const match = (re: RegExp) => re.test(n);
  // Fromagerie
  if (match(/\b(fromage(?!\s*blanc)|comte|emmental|gruyere|gruyère|mozzarella|cheddar|parmesan|feta|raclette|camembert|brie|roquefort|tomme|reblochon|cantal|bleu\s*d'auvergne|chevre|chèvre)\b/)) return 'Fromagerie';
  // Crèmerie
  if (match(/\b(lait|yaourt|yogourt|skyr|fromage\s*blanc|petit\s*suisse|beurre|creme|crème|creme\s*fraiche|crème\s*fraiche|mascarpone|oeuf|oeufs)\b/)) return 'Crèmerie';
  // Petit-déjeuner (avant sucrée)
  if (match(/\b(cereales?|céréales?|muesli|granola|biscottes?|pain\s*de\s*mie|confiture|miel|pate\s*a\s*tartiner|pâte\s*à\s*tartiner|nutella|sirop\s*d(erable|’érable)|pancakes?|crepes?|crêpes?)\b/)) return 'Petit-déjeuner';
  // Fruits/Légumes
  if (match(/\b(pomme|poire|banane|fraise|framboise|myrtille|raisin|orange|citron|clementine|kiwi|mangue|ananas|melon|pasteque|tomate|salade|laitue|carotte|oignon|echalote|ail|avocat|poivron|concombre|courgette|aubergine|brocoli|chou|chou\s*fleur|epinard|champignon|pomme\s*de\s*terre|patate\s*douce|persil|coriandre|basilic|fraiche\s*decoupe|fraîche\s*découpe)\b/)) return 'Fruits/Légumes';
  // Boulangerie
  if (match(/\b(pain|baguette|brioche|croissant|pain\s*de\s*mie|wrap|tortilla|pita|naan)\b/)) return 'Boulangerie';
  // Charcuterie
  if (match(/\b(charcuterie|jambon|saucisson|rosette|chorizo|mortadelle|rillettes?|p(â|a)t(é|e)|boudin|pastrami)\b/)) return 'Charcuterie';
  // Traiteur (frais)
  if (match(/\b(traiteur|plats?\s*préparés?|salades?\s*composées?|houmous|tapenade|tzatziki|tabou(l|leh)|wraps?|sandwich(es)?|sushis?|makis?|nems?|samoussas?|falafels?|quiches?|pizzas?\s*(fraiches|fraîches)|lasagnes?\s*(fraiches|fraîches)|poulet\s*r(ô|o)ti)\b/)) return 'Traiteur';
  // Épicerie salée
  if (match(/\b(pates|pâtes|spaghetti|penne|fusilli|farfalle|riz|basmati|thai|thaï|semoule|quinoa|couscous|lentilles|pois\s*chiches|haricots?\s*(rouges|blancs)?|mais|maïs|tomates?\s*(pelées|concassees|concassées)?|coulis|sauce\s*tomate|pesto|bouillon|cube|sel|poivre|epices|épices|curry|paprika|huile(\s*d'olive|\s*de\s*tournesol|\s*de\s*colza)?|huile|vinaigre|moutarde|mayonnaise|ketchup|cornichons|olives|thon\s*(en\s*conserve)?|conserve)\b/)) return 'Épicerie salée';
  // Poissonnerie
  if (match(/\b(thon|saumon|cabillaud|colin|dorade|lotte|maquereau|sardine|truite|crevettes?|moules?|huitres?|huîtres?|calamars?)\b/)) return 'Poissonnerie';
  // Boucherie
  if (match(/\b(steak|steack|poulet|dinde|boeuf|bœuf|veau|porc|saucisses?|merguez|bacon|lardons|viande\s*hach(ee|ée)|kefta|steak\s*hach(é|e)|escalope|roti|rôti)\b/)) return 'Boucherie';
  // Jus frais
  if (match(/\b(jus\s*(frais|press(é|e)\s*a\s*froid|press(é|e)\s*à\s*froid)|cold-?pressed)\b/)) return 'Jus frais';
  // Boissons
  if (match(/\b(eau|soda|jus(?!\s*frais)|biere|bière|vin|cafe|café|the|thé|infusion|limonade|energy\s*drink|boisson\s*energetique|boisson\s*énergétique)\b/)) return 'Boissons';
  // Surgelés
  if (match(/\b(surgele|surgelé|surgeles|surgelés|congele|congelé|frites?\s*surgelées?|legumes?\s*surgelés?|légumes?\s*surgelés?|fruits?\s*surgelés?|poisson\s*pan(e|é)|nuggets?|pizza\s*surgelée|glaces?|esquimaux|sorbets?|lasagnes?\s*surgelées?)\b/)) return 'Surgelés';
  // Épicerie sucrée
  if (match(/\b(biscuits?|gateau(x)?|gâteau(x)?|chocolat|sucre(\s*blond|\s*roux)?|farine|confiture|miel|pate\s*a\s*tartiner|pâte\s*à\s*tartiner|cereales|céréales|compote|sirop|preparation\s*dessert|préparation\s*dessert|levure\s*chimique|levure\s*boulang(ere|ère)|sucre\s*vanill(é|e)|pepites?\s*de\s*chocolat|noisettes?|amandes?|fruits\s*secs|raisins?\s*secs|noix|pralin(é|e))\b/)) return 'Épicerie sucrée';
  // Droguerie
  if (match(/\b(produits?\s*menagers?|ménagers?|nettoyant(s)?|detergent(s)?|détergent(s)?|lessive|adoucissant|liquide\s*vaisselle|pastilles?\s*lave-vaisselle|eponge(s)?|éponge(s)?|serpilli(ere|ère)|balais?|brosses?|sacs?\s*poubelle|alu|minium|film\s*etirable|film\s*étirable|papier\s*cuisson|cirage)\b/)) return 'Droguerie';
  // Parfumerie
  if (match(/\b(cosmetiques?|cosmétiques?|maquillage|fond\s*de\s*teint|mascara|rouge\s*a\s*levres|rouge\s*à\s*lèvres|parfum(s)?|eau\s*de\s*toilette|lotion|creme\s*visage|crème\s*visage|soins?\s*du\s*corps|shampoing|shampooing|apres\s*shampoing|après\s*shampoing|teinture|coloration|gel\s*coiffant|deodorant|déodorant)\b/)) return 'Parfumerie';
  // Hygiène
  if (match(/\b(savon|gel\s*douche|dentifrice|brosse\s*a\s*dents|fil\s*dentaire|bain\s*de\s*bouche|papier\s*toilette|essuie-?tout|sopalin|mouchoirs?|rasoirs?|lames?\s*de\s*rasoir|coton-?tiges?|cotons?|serviettes?\s*hygieniques?|tampons?)\b/)) return 'Hygiène';
  // Bébé
  if (match(/\b(couches?|pampers|lingettes?\s*b(ebe|ébé)|petits?\s*pots?|lait\s*infantile|lait\s*1er\s*age|lait\s*2e\s*age|compotes?\s*b(ebe|ébé)|céréales?\s*b(ebe|ébé)|biberons?|tetines?|tétines?|liniment)\b/)) return 'Bébé';
  // Animaux
  if (match(/\b(croquettes?|patee|pâtée|friandises?\s*(chien|chat)s?|litiere|litière|bac\s*a\s*litiere|sacs?\s*litiere|boites?\s*(chien|chat)s?)\b/)) return 'Animaux';
  // Vrac
  if (match(/\b(vrac|en\s*vrac|graines?\s*en\s*vrac|cereales?\s*en\s*vrac|céréales?\s*en\s*vrac|fruits\s*secs?\s*en\s*vrac|pates?\s*en\s*vrac|pâtes?\s*en\s*vrac)\b/)) return 'Vrac';
  // Textile
  if (match(/\b(vetements?|vêtements?|t-?shirt|pantalons?|chaussettes?|chaussures?|chaussons?|lingerie|culottes?|soutiens?-?gorge|linge\s*de\s*maison|draps?|serviettes?|torchons?)\b/)) return 'Textile';
  // Bazar
  if (match(/\b(quincaillerie|bricolage|vis|marteau|tournevis|adhesif|adhésif|ruban|accessoires?\s*auto|huile\s*moteur|lave-?glace|essuie-?glace|electromenager|électroménager|jouets?|papeterie|librairie|decoration|décoration|vaisselle\s*jetable|jardinage|loisirs|bagagerie|valise(s)?)\b/)) return 'Bazar';
  return 'Autre';
}

export async function ensureDefaultShoppingList(): Promise<ShoppingList> {
  const profile = await getOrCreateProfile();
  if (!profile.couple_id) throw new Error('Aucun couple');
  const couple_id = profile.couple_id as string;
  const { data: existing, error: e1 } = await supabase
    .from(TABLES.shoppingLists)
    .select('id, couple_id, name, created_at, updated_at')
    .eq('couple_id', couple_id)
    .order('created_at', { ascending: true })
    .limit(1);
  if (e1) throw e1;
  if (existing && existing.length > 0) return existing[0] as ShoppingList;
  const { data, error } = await supabase
    .from(TABLES.shoppingLists)
    .insert({ couple_id, name: 'Courses' })
    .select('id, couple_id, name, created_at, updated_at')
    .single();
  if (error) throw error;
  return data as ShoppingList;
}

export async function fetchShoppingItems(listId: string): Promise<ShoppingItem[]> {
  const { data, error } = await supabase
    .from(TABLES.shoppingItems)
    .select('id, couple_id, list_id, name, category, quantity, picked, created_at, updated_at')
    .eq('list_id', listId)
    .order('picked', { ascending: true })
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data || []) as ShoppingItem[];
}

export async function addOrIncrementItem(listId: string, name: string, category?: string | null): Promise<ShoppingItem> {
  const profile = await getOrCreateProfile();
  if (!profile.couple_id) throw new Error('Aucun couple');
  const couple_id = profile.couple_id as string;
  const n = name.trim();
  // Try to find existing unpicked item with same name
  const { data: exist, error: e1 } = await supabase
    .from(TABLES.shoppingItems)
    .select('id, quantity')
    .eq('list_id', listId)
    .eq('picked', false)
    .ilike('name', n);
  if (e1) throw e1;
  if (exist && exist.length > 0) {
    const row = exist[0];
    const { data, error } = await supabase
      .from(TABLES.shoppingItems)
      .update({ quantity: row.quantity + 1, updated_at: new Date().toISOString() })
      .eq('id', row.id)
      .select('id, couple_id, list_id, name, category, quantity, picked, created_at, updated_at')
      .single();
    if (error) throw error;
    return data as ShoppingItem;
  }
  const insert: any = { couple_id, list_id: listId, name: n };
  const inferred = inferShoppingCategory(n);
  insert.category = category ?? inferred;
  const { data, error } = await supabase
    .from(TABLES.shoppingItems)
    .insert(insert)
    .select('id, couple_id, list_id, name, category, quantity, picked, created_at, updated_at')
    .single();
  if (error) throw error;
  return data as ShoppingItem;
}

export async function updateItemPicked(id: string, picked: boolean): Promise<void> {
  const { error } = await supabase
    .from(TABLES.shoppingItems)
    .update({ picked, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function updateItemQuantity(id: string, quantity: number): Promise<void> {
  const q = Math.max(1, Math.floor(quantity));
  const { error } = await supabase.from(TABLES.shoppingItems).update({ quantity: q, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function updateItemName(id: string, name: string): Promise<void> {
  const n = name.trim();
  const { error } = await supabase.from(TABLES.shoppingItems).update({ name: n, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function updateItemCategory(id: string, category: string | null): Promise<void> {
  const { error } = await supabase.from(TABLES.shoppingItems).update({ category, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function removeItem(id: string): Promise<void> {
  const { error } = await supabase.from(TABLES.shoppingItems).delete().eq('id', id);
  if (error) throw error;
}

export async function clearPicked(listId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.shoppingItems)
    .delete()
    .eq('list_id', listId)
    .eq('picked', true);
  if (error) throw error;
}
