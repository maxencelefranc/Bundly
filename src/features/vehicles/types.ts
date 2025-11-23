export type Vehicle = {
  id: string;
  couple_id: string;
  name: string | null;
  brand: string | null;
  model: string | null;
  plate: string | null;
  year: number | null;
  mileage: number | null;
  insurance_expiry: string | null; // ISO date
  tech_control_date: string | null; // ISO date
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type VehicleMaintenance = {
  id: string;
  vehicle_id: string;
  title: string;
  type: 'oil' | 'tire' | 'brake' | 'inspection' | 'battery' | 'custom';
  due_date: string | null; // ISO date
  due_mileage: number | null;
  recurrence_months: number | null;
  completed: boolean;
  completed_at: string | null;
  cost: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type VehicleLog = {
  id: string;
  vehicle_id: string;
  at_date: string; // ISO date
  mileage: number | null;
  kind: 'refuel' | 'service' | 'repair' | 'check';
  cost: number | null;
  notes: string | null;
  created_at: string;
};
