export type Schedule = {
  id: string;
  couple_id: string;
  person_id: string | null;
  at_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  location: string | null;
  role: string | null;
  notes: string | null;
  created_at: string;
};

export type ScheduleImport = {
  id: string;
  couple_id: string;
  raw_text: string;
  parsed_at: string | null;
  status: 'pending' | 'parsed' | 'error';
  created_at: string;
};

export type ParsedShift = {
  date: string;
  start: string;
  end: string;
  location?: string;
  role?: string;
};

export function parseShiftsFromText(raw: string): ParsedShift[] {
  // Very naive parser: lines like "2025-11-06 09:00-17:00 Location"
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const out: ParsedShift[] = [];
  for (const l of lines) {
    const m = l.match(/(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})(?:\s+(.*))?/);
    if (m) {
      out.push({ date: m[1], start: m[2], end: m[3], location: m[4] });
      continue;
    }
    // Another format: Mon 9:00-17:00
    const m2 = l.match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})(?:\s+(.*))?$/i);
    if (m2) {
      // Without year, fallback to current week start; left as-is for manual adjust
      out.push({ date: m2[1], start: m2[2], end: m2[3], location: m2[4] });
    }
  }
  return out;
}
