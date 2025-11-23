-- Auto-categorize shopping items based on name
create or replace function public.infer_shopping_category(p_name text)
returns text as $$
declare
  n text := lower(coalesce(p_name,''));
begin
  -- Fromagerie (fromages affinés)
  if n ~* '\m(fromage(?!\s*blanc)|comte|emmental|gruyere|gruyère|mozzarella|cheddar|parmesan|feta|raclette|camembert|brie|roquefort|tomme|reblochon|cantal|bleu d''auvergne|chèvre|chevre)\M' then
    return 'Fromagerie';

  -- Crèmerie (lait, oeufs, yaourts, beurre, crèmes, fromage blanc)
  elsif n ~* '\m(lait|yaourt|yogourt|skyr|fromage blanc|petit suisse|beurre|creme|crème|creme fraiche|crème fraiche|mascarpone)\M'
    or n ~* '\m(oeuf|oeufs)\M' then
    return 'Crèmerie';

  -- Petit-déjeuner (placer avant épicerie sucrée pour capter céréales/confitures)
  elsif n ~* '\m(cereales?|céréales?|muesli|granola|biscottes?|pain de mie|confiture|miel|pate a tartiner|pâte à tartiner|nutella|sirop d''erable|sirop d’érable|pancakes?|crepes?|crêpes?)\M' then
    return 'Petit-déjeuner';

  -- Fruits/Légumes (incl. fraîche découpe)
  elsif n ~* '\m(pomme|poire|banane|fraise|framboise|myrtille|raisin|orange|citron|clementine|clémentine|kiwi|mangue|ananas|melon|pasteque|pastèque|tomate|salade|laitue|carotte|oignon|echalote|échalote|ail|avocat|poivron|concombre|courgette|aubergine|brocoli|chou|chou-fleur|epinard|épinard|champignon|pomme de terre|patate douce|persil|coriandre|basilic|fraiche decoupe|fraîche découpe)\M' then
    return 'Fruits/Légumes';
  -- Charcuterie (libre service)
  elsif n ~* '\m(charcuterie|jambon|saucisson|rosette|chorizo|mortadelle|rillettes?|p(â|a)t(é|e)|boudin|pastrami)\M' then
    return 'Charcuterie';

  -- Traiteur / Plats préparés (frais)
  elsif n ~* '\m(traiteur|plat(s)? préparés?|salade(s)? composée(s)?|houmous|tapenade|tzatziki|tabou(l|leh)|wraps?|sandwich(es)?|sushis?|makis?|nems?|samoussas?|falafels?|quiches?|pizzas? (fraiches|fraîches)|lasagnes? (fraiches|fraîches)|poulet r(ô|o)ti)\M' then
    return 'Traiteur';


  -- Boulangerie
  elsif n ~* '\m(pain|baguette|brioche|croissant|pain de mie|wrap|tortilla|pita|naan)\M' then
    return 'Boulangerie';

  -- Épicerie salée
  elsif n ~* '\m(pates|pâtes|spaghetti|penne|fusilli|farfalle|riz|basmati|thai|thaï|semoule|quinoa|couscous|lentilles|pois chiches|haricots (rouges|blancs)|mais|maïs|tomates? (pelées|concassees|concassées)?|coulis|sauce tomate|pesto|bouillon|cube|sel|poivre|epices|épices|curry|paprika|huile (d''olive|de tournesol|de colza)?|huile|vinaigre|moutarde|mayonnaise|ketchup|cornichons|olives|thon (en conserve)?|conserve)\M' then
    return 'Épicerie salée';

  -- Poissonnerie
  elsif n ~* '\m(thon|saumon|cabillaud|colin|dorade|lotte|maquereau|sardine|truite|crevettes?|moules?|huitres?|huîtres?|calamars?)\M' then
    return 'Poissonnerie';

  -- Boucherie
  elsif n ~* '\m(steak|steack|poulet|dinde|boeuf|bœuf|veau|porc|jambon|charcuterie|saucisses?|merguez|bacon|lardons|viande hach(ee|ée)|kefta|steak hach(é|e)|escalope|roti|rôti)\M' then
    return 'Boucherie';

  -- Jus de fruits frais
  elsif n ~* '\m(jus (frais|press(é|e) a froid|press(é|e)\s*à\s*froid)|cold-?pressed)\M' then
    return 'Jus frais';

  -- Boissons
  elsif n ~* '\m(eau|soda|jus(?!\s*frais)|biere|bière|vin|cafe|café|the|thé|infusion|limonade|energy drink|boisson energ(etique|étique))\M' then
    return 'Boissons';

  -- Surgelés
  elsif n ~* '\m(surgele|surgelé|surgeles|surgelés|congele|congelé|frites? surgelées?|legumes? surgelés?|légumes? surgelés?|fruits? surgelés?|poisson pan(e|é)|nuggets?|pizza surgelée|glaces?|esquimaux|sorbets?|lasagnes? surgelées?)\M' then
    return 'Surgelés';

  -- Épicerie sucrée (confiserie, fruits secs, aide pâtisserie)
  elsif n ~* '\m(biscuits?|gateau(x)?|gâteau(x)?|chocolat|sucre( blond| roux)?|farine|confiture|miel|pate a tartiner|pâte à tartiner|cereales|céréales|compote|sirop|preparation dessert|préparation dessert|levure chimique|levure boulang(ere|ère)|sucre vanill(é|e)|pepites? de chocolat|noisettes?|amandes?|fruits secs|raisins? secs|noix|pralin(é|e))\M' then
    return 'Épicerie sucrée';

  -- Droguerie (ménage, entretien maison)
  elsif n ~* '\m(produits? menagers?|ménagers?|nettoyant(s)?|detergent(s)?|détergent(s)?|lessive|adoucissant|liquide vaisselle|pastilles? lave-vaisselle|eponge(s)?|éponge(s)?|serpilli(ere|ère)|balais?|brosses?|sacs? poubelle|alu|minium|film etirable|film étirable|papier cuisson|cirage)\M' then
    return 'Droguerie';

  -- Parfumerie (beauté, soins corps/cheveux)
  elsif n ~* '\m(cosmetiques?|cosmétiques?|maquillage|fond de teint|mascara|rouge a levres|rouge à lèvres|parfum(s)?|eau de toilette|lotion|creme visage|crème visage|soin(s)? du corps|shampoing|shampooing|apres-shampoing|après-shampoing|teinture|coloration|gel coiffant|deodorant|déodorant)\M' then
    return 'Parfumerie';

  -- Hygiène (personnelle et papiers)
  elsif n ~* '\m(savon|gel douche|dentifrice|brosse a dents|brosse à dents|fil dentaire|bain de bouche|papier toilette|essuie-?tout|sopalin|mouchoirs?|rasoirs?|lames? de rasoir|coton-?tiges?|cotons?|serviettes? hygieniques?|tampons?)\M' then
    return 'Hygiène';

  -- Bébé
  elsif n ~* '\m(couches?|pampers|lingettes? bébé|bebe|bébé|petits? pots?|lait infantile|lait 1er age|lait 2e age|compotes? bébé|céréales? bébé|biberons?|tetines?|tétines?|liniment)\M' then
    return 'Bébé';

  -- Animaux
  elsif n ~* '\m(croquettes?|patee|pâtée|friandises? (chien|chat)s?|litiere|litière|bac a litiere|sacs? litiere|boites? (chien|chat)s?)\M' then
    return 'Animaux';

  -- Vrac
  elsif n ~* '\m(vrac|en vrac|graines? en vrac|cereales? en vrac|céréales? en vrac|fruits secs? en vrac|pates? en vrac|pâtes? en vrac)\M' then
    return 'Vrac';

  -- Textile
  elsif n ~* '\m(vetements?|vêtements?|t-?shirt|pantalons?|chaussettes?|chaussures?|chaussons?|lingerie|culottes?|soutiens?-?gorge|linge de maison|draps?|serviettes?|torchons?)\M' then
    return 'Textile';

  -- Bazar
  elsif n ~* '\m(quincaillerie|bricolage|vis|marteau|tournevis|adhesif|adhésif|ruban|accessoires? auto|huile moteur|lave-?glace|essuie-?glace|electromenager|électroménager|jouets?|papeterie|librairie|decoration|décoration|vaisselle jetable|jardinage|loisirs|bagagerie|valise(s)?)\M' then
    return 'Bazar';

  else
    return 'Autre';
  end if;
end;
$$ language plpgsql immutable;

-- Trigger to set category when null
create or replace function public.trg_shopping_items_autocategorize()
returns trigger as $$
begin
  if new.category is null or length(coalesce(new.category,''))=0 then
    new.category = public.infer_shopping_category(new.name);
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_shopping_items_autocategorize on public.shopping_items;
create trigger trg_shopping_items_autocategorize
before insert or update of name on public.shopping_items
for each row execute function public.trg_shopping_items_autocategorize();

-- Backfill
update public.shopping_items set category = public.infer_shopping_category(name)
where category is null or length(coalesce(category,''))=0;
