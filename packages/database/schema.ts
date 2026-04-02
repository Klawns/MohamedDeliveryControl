import {
  boolean as pgBoolean,
  index as pgIndex,
  integer as pgInteger,
  numeric as pgNumeric,
  pgEnum,
  pgTable,
  serial as pgSerial,
  text as pgText,
  timestamp as pgTimestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['admin', 'user']);
export const rideStatusEnum = pgEnum('ride_status', [
  'PENDING',
  'COMPLETED',
  'CANCELLED',
]);
export const paymentStatusEnum = pgEnum('payment_status', ['PENDING', 'PAID']);
export const transactionTypeEnum = pgEnum('transaction_type', [
  'CREDIT',
  'DEBIT',
]);
export const transactionOriginEnum = pgEnum('transaction_origin', [
  'PAYMENT_OVERFLOW',
  'RIDE_USAGE',
  'MANUAL_ADJUSTMENT',
]);
export const planEnum = pgEnum('plan_type', ['starter', 'premium', 'lifetime']);
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'inactive',
  'canceled',
  'trial',
]);
export const paymentUsedStatusEnum = pgEnum('payment_used_status', [
  'UNUSED',
  'USED',
]);
export const backupJobKindEnum = pgEnum('backup_job_kind', [
  'functional_user',
  'technical_full',
  'pre_import',
]);
export const backupJobTriggerEnum = pgEnum('backup_job_trigger', [
  'manual',
  'scheduled',
  'pre_import',
]);
export const backupJobStatusEnum = pgEnum('backup_job_status', [
  'pending',
  'running',
  'success',
  'failed',
]);
export const backupImportJobStatusEnum = pgEnum('backup_import_job_status', [
  'validated',
  'running',
  'success',
  'failed',
]);
export const backupImportJobPhaseEnum = pgEnum('backup_import_job_phase', [
  'validated',
  'backing_up',
  'importing',
  'completed',
  'failed',
]);

export const pgUsers = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  displayId: pgSerial('display_id'),
  name: pgText('name').notNull(),
  email: pgText('email').notNull().unique(),
  password: pgText('password').notNull(),
  taxId: pgText('tax_id'),
  cellphone: pgText('cellphone'),
  role: roleEnum('role').notNull().default('user'),
  hasSeenTutorial: pgBoolean('has_seen_tutorial').default(false),
  createdAt: pgTimestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const pgClients = pgTable(
  'clients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    displayId: pgSerial('display_id'),
    userId: uuid('user_id')
      .notNull()
      .references(() => pgUsers.id, { onDelete: 'cascade' }),
    name: pgText('name').notNull(),
    phone: pgText('phone'),
    address: pgText('address'),
    balance: pgNumeric('balance', { precision: 10, scale: 2, mode: 'number' })
      .notNull()
      .default(0),
    isPinned: pgBoolean('is_pinned').notNull().default(false),
    createdAt: pgTimestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: pgIndex('clients_user_id_idx').on(table.userId),
  }),
);

export const pgBalanceTransactions = pgTable(
  'balance_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => pgClients.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => pgUsers.id, { onDelete: 'cascade' }),
    amount: pgNumeric('amount', {
      precision: 10,
      scale: 2,
      mode: 'number',
    }).notNull(),
    type: transactionTypeEnum('type').notNull(),
    origin: transactionOriginEnum('origin').notNull(),
    description: pgText('description'),
    createdAt: pgTimestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: pgIndex('balance_transactions_user_id_idx').on(table.userId),
    clientIdIdx: pgIndex('balance_transactions_client_id_idx').on(
      table.clientId,
    ),
  }),
);

export const pgRides = pgTable(
  'rides',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    displayId: pgSerial('display_id'),
    clientId: uuid('client_id')
      .notNull()
      .references(() => pgClients.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => pgUsers.id, { onDelete: 'cascade' }),
    value: pgNumeric('value', { precision: 10, scale: 2, mode: 'number' })
      .notNull(),
    location: pgText('location'),
    notes: pgText('notes'),
    status: rideStatusEnum('status').notNull().default('COMPLETED'),
    paymentStatus: paymentStatusEnum('payment_status').notNull().default('PAID'),
    paidWithBalance: pgNumeric('paid_with_balance', {
      precision: 10,
      scale: 2,
      mode: 'number',
    })
      .notNull()
      .default(0),
    debtValue: pgNumeric('debt_value', {
      precision: 10,
      scale: 2,
      mode: 'number',
    })
      .notNull()
      .default(0),
    rideDate: pgTimestamp('ride_date', { withTimezone: true }),
    photo: pgText('photo'),
    createdAt: pgTimestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userListIdx: pgIndex('rides_user_list_idx').on(
      table.userId,
      table.rideDate,
      table.createdAt,
      table.id,
    ),
    clientListIdx: pgIndex('rides_client_list_idx').on(
      table.userId,
      table.clientId,
      table.rideDate,
      table.createdAt,
      table.id,
    ),
    userDateStatusIdx: pgIndex('rides_user_date_status_idx').on(
      table.userId,
      table.rideDate,
      table.status,
    ),
  }),
);

export const pgRidePresets = pgTable(
  'ride_presets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => pgUsers.id, { onDelete: 'cascade' }),
    label: pgText('label').notNull(),
    value: pgNumeric('value', { precision: 10, scale: 2, mode: 'number' })
      .notNull(),
    location: pgText('location').notNull(),
    createdAt: pgTimestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: pgIndex('ride_presets_user_id_idx').on(table.userId),
  }),
);

export const pgSubscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => pgUsers.id, { onDelete: 'cascade' }),
    plan: planEnum('plan').notNull(),
    status: subscriptionStatusEnum('status').notNull(),
    rideCount: pgInteger('ride_count').notNull().default(0),
    trialStartedAt: pgTimestamp('trial_started_at', { withTimezone: true }),
    validUntil: pgTimestamp('valid_until', { withTimezone: true }),
    createdAt: pgTimestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: pgIndex('subscriptions_user_id_idx').on(table.userId),
  }),
);

export const pgPricingPlans = pgTable('pricing_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: pgText('name').notNull(),
  price: pgInteger('price').notNull(),
  interval: pgText('interval'),
  description: pgText('description').notNull(),
  features: pgText('features').notNull(),
  cta: pgText('cta').notNull(),
  highlight: pgBoolean('highlight').notNull().default(false),
  updatedAt: pgTimestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const pgSystemConfigs = pgTable('system_configs', {
  key: pgText('key').primaryKey(),
  value: pgText('value').notNull(),
  description: pgText('description'),
  updatedAt: pgTimestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const pgClientPayments = pgTable(
  'client_payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientId: uuid('client_id')
      .notNull()
      .references(() => pgClients.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => pgUsers.id, { onDelete: 'cascade' }),
    amount: pgNumeric('amount', {
      precision: 10,
      scale: 2,
      mode: 'number',
    }).notNull(),
    paymentDate: pgTimestamp('payment_date', { withTimezone: true })
      .notNull()
      .defaultNow(),
    status: paymentUsedStatusEnum('status').notNull().default('UNUSED'),
    notes: pgText('notes'),
    createdAt: pgTimestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: pgIndex('client_payments_user_id_idx').on(table.userId),
    clientIdIdx: pgIndex('client_payments_client_id_idx').on(table.clientId),
    statusIdx: pgIndex('client_payments_status_idx').on(table.status),
  }),
);

export const pgBackupJobs = pgTable(
  'backup_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kind: backupJobKindEnum('kind').notNull().default('functional_user'),
    trigger: backupJobTriggerEnum('trigger').notNull().default('manual'),
    scopeUserId: uuid('scope_user_id').references(() => pgUsers.id, {
      onDelete: 'cascade',
    }),
    actorUserId: uuid('actor_user_id').references(() => pgUsers.id, {
      onDelete: 'cascade',
    }),
    status: backupJobStatusEnum('status').notNull().default('pending'),
    storageKey: pgText('storage_key'),
    checksum: pgText('checksum'),
    sizeBytes: pgInteger('size_bytes'),
    manifestVersion: pgInteger('manifest_version').notNull().default(1),
    metadataJson: pgText('metadata_json'),
    errorMessage: pgText('error_message'),
    startedAt: pgTimestamp('started_at', { withTimezone: true }),
    finishedAt: pgTimestamp('finished_at', { withTimezone: true }),
    createdAt: pgTimestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    scopeUserIdIdx: pgIndex('backup_jobs_scope_user_id_idx').on(
      table.scopeUserId,
      table.createdAt,
    ),
    actorUserIdIdx: pgIndex('backup_jobs_actor_user_id_idx').on(
      table.actorUserId,
    ),
    statusIdx: pgIndex('backup_jobs_status_idx').on(table.status),
  }),
);

export const pgBackupImportJobs = pgTable(
  'backup_import_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    scopeUserId: uuid('scope_user_id')
      .notNull()
      .references(() => pgUsers.id, { onDelete: 'cascade' }),
    actorUserId: uuid('actor_user_id')
      .notNull()
      .references(() => pgUsers.id, { onDelete: 'cascade' }),
    status: backupImportJobStatusEnum('status').notNull().default('validated'),
    phase: backupImportJobPhaseEnum('phase').notNull().default('validated'),
    uploadedStorageKey: pgText('uploaded_storage_key').notNull(),
    archiveChecksum: pgText('archive_checksum'),
    sizeBytes: pgInteger('size_bytes'),
    manifestVersion: pgInteger('manifest_version').notNull().default(1),
    previewJson: pgText('preview_json').notNull(),
    errorMessage: pgText('error_message'),
    startedAt: pgTimestamp('started_at', { withTimezone: true }),
    finishedAt: pgTimestamp('finished_at', { withTimezone: true }),
    createdAt: pgTimestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    scopeUserIdIdx: pgIndex('backup_import_jobs_scope_user_id_idx').on(
      table.scopeUserId,
      table.createdAt,
    ),
    actorUserIdIdx: pgIndex('backup_import_jobs_actor_user_id_idx').on(
      table.actorUserId,
    ),
    statusIdx: pgIndex('backup_import_jobs_status_idx').on(table.status),
  }),
);

export const postgresSchema = {
  users: pgUsers,
  clients: pgClients,
  balanceTransactions: pgBalanceTransactions,
  rides: pgRides,
  ridePresets: pgRidePresets,
  subscriptions: pgSubscriptions,
  pricingPlans: pgPricingPlans,
  systemConfigs: pgSystemConfigs,
  clientPayments: pgClientPayments,
  backupJobs: pgBackupJobs,
  backupImportJobs: pgBackupImportJobs,
  roleEnum,
  rideStatusEnum,
  paymentStatusEnum,
  transactionTypeEnum,
  transactionOriginEnum,
  planEnum,
  subscriptionStatusEnum,
  paymentUsedStatusEnum,
  backupJobKindEnum,
  backupJobTriggerEnum,
  backupJobStatusEnum,
  backupImportJobStatusEnum,
  backupImportJobPhaseEnum,
};

export const users = pgUsers;
export const clients = pgClients;
export const balanceTransactions = pgBalanceTransactions;
export const rides = pgRides;
export const ridePresets = pgRidePresets;
export const subscriptions = pgSubscriptions;
export const pricingPlans = pgPricingPlans;
export const systemConfigs = pgSystemConfigs;
export const clientPayments = pgClientPayments;
export const backupJobs = pgBackupJobs;
export const backupImportJobs = pgBackupImportJobs;
