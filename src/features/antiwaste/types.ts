export type FoodItem = {
  id: string;
  couple_id: string;
  name: string;
  category?: string | null;
  location?: 'frigo' | 'placard' | 'congelateur' | string | null;
  expiration_date: string; // ISO date
  quantity?: number | null;
  status?: 'fresh' | 'soon' | 'expired' | null;
  created_at?: string;
  updated_at?: string;
};

export function computeStatus(expirationDateIso: string, soonDays = 3): 'fresh' | 'soon' | 'expired' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expirationDateIso);
  if (isNaN(exp.getTime())) return 'fresh';
  exp.setHours(0, 0, 0, 0);
  if (exp < today) return 'expired';
  const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= soonDays ? 'soon' : 'fresh';
}

export function relativeDaysLabel(expirationDateIso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expirationDateIso);
  if (isNaN(exp.getTime())) return 'Date ?';
  exp.setHours(0, 0, 0, 0);
  const diff = Math.floor((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'Périmé';
  if (diff === 0) return 'J-0';
  return `J-${diff}`;
}

export function formatDateShort(expirationDateIso: string): string {
  const d = new Date(expirationDateIso);
  if (isNaN(d.getTime())) return '';
  try {
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  } catch {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${dd}/${mm}`;
  }
}
