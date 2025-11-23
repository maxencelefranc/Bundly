export const TABLES = {
  // Core
  profiles: 'profiles',
  couples: 'couples',

  // Features
  taskLists: 'task_lists',
  tasks: 'tasks',
  foodItems: 'food_items',
  shoppingLists: 'shopping_lists',
  shoppingItems: 'shopping_items',
  vehicles: 'vehicles',
  vehicleMaintenances: 'vehicle_maintenances',
  vehicleLogs: 'vehicle_logs',
  schedules: 'schedules',
  scheduleImports: 'schedule_imports',
  menstruationPeriods: 'menstruation_periods',
  menstruationPeriodSymptoms: 'menstruation_period_symptoms',
  emotions: 'emotions',

  // Views
  tasksView: 'v_tasks',
} as const;

export type TableName = typeof TABLES[keyof typeof TABLES];

export const BUCKETS = {
  avatars: 'avatars',
} as const;

export type BucketName = typeof BUCKETS[keyof typeof BUCKETS];
