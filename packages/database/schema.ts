import { pgTable, text as pgText, numeric as pgNumeric, integer as pgInteger, timestamp as pgTimestamp, boolean as pgBoolean, index as pgIndex, pgEnum, serial as pgSerial, uuid } from 'drizzle-orm/pg-core';
import { sqliteTable, text as sqText, real as sqReal, integer as sqInteger, index as sqIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// --- Enums (Postgres) ---
export const roleEnum = pgEnum('role', ['admin', 'user']);
export const rideStatusEnum = pgEnum('ride_status', ['PENDING', 'COMPLETED', 'CANCELLED']);
export const paymentStatusEnum = pgEnum('payment_status', ['PENDING', 'PAID']);
export const transactionTypeEnum = pgEnum('transaction_type', ['CREDIT', 'DEBIT']);
export const transactionOriginEnum = pgEnum('transaction_origin', ['PAYMENT_OVERFLOW', 'RIDE_USAGE', 'MANUAL_ADJUSTMENT']);
export const planEnum = pgEnum('plan_type', ['starter', 'premium', 'lifetime']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'inactive', 'canceled', 'trial']);
export const paymentUsedStatusEnum = pgEnum('payment_used_status', ['UNUSED', 'USED']);

// --- Helper for Dialect Check (kept for backward compatibility if needed, but we export both) ---
const isPostgres = process.env.DB_PROVIDER === 'postgres';

// ==========================================
// PostgreSQL Schema
// ==========================================

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
  createdAt: pgTimestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const pgRefreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  token: pgText('token').notNull().unique(),
  userId: uuid('user_id').notNull().references(() => pgUsers.id, { onDelete: 'cascade' }),
  expiresAt: pgTimestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: pgTimestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: pgIndex('refresh_tokens_user_id_idx').on(table.userId),
}));

export const pgClients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  displayId: pgSerial('display_id'),
  userId: uuid('user_id').notNull().references(() => pgUsers.id, { onDelete: 'cascade' }),
  name: pgText('name').notNull(),
  phone: pgText('phone'),
  address: pgText('address'),
  balance: pgNumeric('balance', { precision: 10, scale: 2 }).notNull().default('0'),
  isPinned: pgBoolean('is_pinned').notNull().default(false),
  createdAt: pgTimestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: pgIndex('clients_user_id_idx').on(table.userId),
}));

export const pgBalanceTransactions = pgTable('balance_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => pgClients.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => pgUsers.id, { onDelete: 'cascade' }),
  amount: pgNumeric('amount', { precision: 10, scale: 2 }).notNull(),
  type: transactionTypeEnum('type').notNull(),
  origin: transactionOriginEnum('origin').notNull(),
  description: pgText('description'),
  createdAt: pgTimestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: pgIndex('balance_transactions_user_id_idx').on(table.userId),
  clientIdIdx: pgIndex('balance_transactions_client_id_idx').on(table.clientId),
}));

export const pgRides = pgTable('rides', {
  id: uuid('id').primaryKey().defaultRandom(),
  displayId: pgSerial('display_id'),
  clientId: uuid('client_id').notNull().references(() => pgClients.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => pgUsers.id, { onDelete: 'cascade' }),
  value: pgNumeric('value', { precision: 10, scale: 2 }).notNull(),
  location: pgText('location'),
  notes: pgText('notes'),
  status: rideStatusEnum('status').notNull().default('COMPLETED'),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('PAID'),
  paidWithBalance: pgNumeric('paid_with_balance', { precision: 10, scale: 2 }).notNull().default('0'),
  debtValue: pgNumeric('debt_value', { precision: 10, scale: 2 }).notNull().default('0'),
  rideDate: pgTimestamp('ride_date', { withTimezone: true }),
  photo: pgText('photo'),
  createdAt: pgTimestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userListIdx: pgIndex('rides_user_list_idx').on(table.userId, table.rideDate, table.createdAt, table.id),
  clientListIdx: pgIndex('rides_client_list_idx').on(table.userId, table.clientId, table.rideDate, table.createdAt, table.id),
  userDateStatusIdx: pgIndex('rides_user_date_status_idx').on(table.userId, table.rideDate, table.status),
}));

export const pgRidePresets = pgTable('ride_presets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => pgUsers.id, { onDelete: 'cascade' }),
  label: pgText('label').notNull(),
  value: pgNumeric('value', { precision: 10, scale: 2 }).notNull(),
  location: pgText('location').notNull(),
  createdAt: pgTimestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: pgIndex('ride_presets_user_id_idx').on(table.userId),
}));

export const pgSubscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => pgUsers.id, { onDelete: 'cascade' }),
  plan: planEnum('plan').notNull(),
  status: subscriptionStatusEnum('status').notNull(),
  rideCount: pgInteger('ride_count').notNull().default(0),
  validUntil: pgTimestamp('valid_until', { withTimezone: true }),
  createdAt: pgTimestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: pgIndex('subscriptions_user_id_idx').on(table.userId),
}));

export const pgPricingPlans = pgTable('pricing_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: pgText('name').notNull(),
  price: pgInteger('price').notNull(),
  interval: pgText('interval'),
  description: pgText('description').notNull(),
  features: pgText('features').notNull(), // Change to jsonb later if needed, but textual for now
  cta: pgText('cta').notNull(),
  highlight: pgBoolean('highlight').notNull().default(false),
  updatedAt: pgTimestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const pgSystemConfigs = pgTable('system_configs', {
  key: pgText('key').primaryKey(),
  value: pgText('value').notNull(),
  description: pgText('description'),
  updatedAt: pgTimestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const pgClientPayments = pgTable('client_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => pgClients.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => pgUsers.id, { onDelete: 'cascade' }),
  amount: pgNumeric('amount', { precision: 10, scale: 2 }).notNull(),
  paymentDate: pgTimestamp('payment_date', { withTimezone: true }).notNull().defaultNow(),
  status: paymentUsedStatusEnum('status').notNull().default('UNUSED'),
  notes: pgText('notes'),
  createdAt: pgTimestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: pgIndex('client_payments_user_id_idx').on(table.userId),
  clientIdIdx: pgIndex('client_payments_client_id_idx').on(table.clientId),
  statusIdx: pgIndex('client_payments_status_idx').on(table.status),
}));


// ==========================================
// SQLite Schema
// ==========================================

export const sqUsers = sqliteTable('users', {
  id: sqText('id').primaryKey(),
  displayId: sqInteger('display_id'),
  name: sqText('name').notNull(),
  email: sqText('email').notNull().unique(),
  password: sqText('password').notNull(),
  taxId: sqText('tax_id'),
  cellphone: sqText('cellphone'),
  role: sqText('role', { enum: ['admin', 'user'] }).notNull().default('user'),
  hasSeenTutorial: sqInteger('has_seen_tutorial', { mode: 'boolean' }).default(false),
  createdAt: sqInteger('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const sqRefreshTokens = sqliteTable('refresh_tokens', {
  id: sqText('id').primaryKey(),
  token: sqText('token').notNull().unique(),
  userId: sqText('user_id').notNull().references(() => sqUsers.id, { onDelete: 'cascade' }),
  expiresAt: sqInteger('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: sqInteger('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: sqIndex('refresh_tokens_user_id_idx').on(table.userId),
}));

export const sqClients = sqliteTable('clients', {
  id: sqText('id').primaryKey(),
  displayId: sqInteger('display_id'),
  userId: sqText('user_id').notNull().references(() => sqUsers.id, { onDelete: 'cascade' }),
  name: sqText('name').notNull(),
  phone: sqText('phone'),
  address: sqText('address'),
  balance: sqReal('balance').notNull().default(0),
  isPinned: sqInteger('is_pinned', { mode: 'boolean' }).notNull().default(false),
  createdAt: sqInteger('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: sqIndex('clients_user_id_idx').on(table.userId),
}));

export const sqBalanceTransactions = sqliteTable('balance_transactions', {
  id: sqText('id').primaryKey(),
  clientId: sqText('client_id').notNull().references(() => sqClients.id, { onDelete: 'cascade' }),
  userId: sqText('user_id').notNull().references(() => sqUsers.id, { onDelete: 'cascade' }),
  amount: sqReal('amount').notNull(),
  type: sqText('type', { enum: ['CREDIT', 'DEBIT'] }).notNull(),
  origin: sqText('origin', { enum: ['PAYMENT_OVERFLOW', 'RIDE_USAGE', 'MANUAL_ADJUSTMENT'] }).notNull(),
  description: sqText('description'),
  createdAt: sqInteger('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: sqIndex('balance_transactions_user_id_idx').on(table.userId),
  clientIdIdx: sqIndex('balance_transactions_client_id_idx').on(table.clientId),
}));

export const sqRides = sqliteTable('rides', {
  id: sqText('id').primaryKey(),
  displayId: sqInteger('display_id'),
  clientId: sqText('client_id').notNull().references(() => sqClients.id, { onDelete: 'cascade' }),
  userId: sqText('user_id').notNull().references(() => sqUsers.id, { onDelete: 'cascade' }),
  value: sqReal('value').notNull(),
  location: sqText('location'),
  notes: sqText('notes'),
  status: sqText('status', { enum: ['PENDING', 'COMPLETED', 'CANCELLED'] }).notNull().default('COMPLETED'),
  paymentStatus: sqText('payment_status', { enum: ['PENDING', 'PAID'] }).notNull().default('PAID'),
  paidWithBalance: sqReal('paid_with_balance').notNull().default(0),
  debtValue: sqReal('debt_value').notNull().default(0),
  rideDate: sqInteger('ride_date', { mode: 'timestamp' }),
  photo: sqText('photo'),
  createdAt: sqInteger('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userListIdx: sqIndex('rides_user_list_idx').on(table.userId, table.rideDate, table.createdAt, table.id),
  clientListIdx: sqIndex('rides_client_list_idx').on(table.userId, table.clientId, table.rideDate, table.createdAt, table.id),
  userDateStatusIdx: sqIndex('rides_user_date_status_idx').on(table.userId, table.rideDate, table.status),
}));

export const sqRidePresets = sqliteTable('ride_presets', {
  id: sqText('id').primaryKey(),
  userId: sqText('user_id').notNull().references(() => sqUsers.id, { onDelete: 'cascade' }),
  label: sqText('label').notNull(),
  value: sqReal('value').notNull(),
  location: sqText('location').notNull(),
  createdAt: sqInteger('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: sqIndex('ride_presets_user_id_idx').on(table.userId),
}));

export const sqSubscriptions = sqliteTable('subscriptions', {
  id: sqText('id').primaryKey(),
  userId: sqText('user_id').notNull().references(() => sqUsers.id, { onDelete: 'cascade' }),
  plan: sqText('plan', { enum: ['starter', 'premium', 'lifetime'] }).notNull(),
  status: sqText('status', { enum: ['active', 'inactive', 'canceled', 'trial'] }).notNull(),
  rideCount: sqInteger('ride_count').notNull().default(0),
  validUntil: sqInteger('valid_until', { mode: 'timestamp' }),
  createdAt: sqInteger('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: sqIndex('subscriptions_user_id_idx').on(table.userId),
}));

export const sqPricingPlans = sqliteTable('pricing_plans', {
  id: sqText('id').primaryKey(),
  name: sqText('name').notNull(),
  price: sqInteger('price').notNull(),
  interval: sqText('interval'),
  description: sqText('description').notNull(),
  features: sqText('features').notNull(),
  cta: sqText('cta').notNull(),
  highlight: sqInteger('highlight', { mode: 'boolean' }).notNull().default(false),
  updatedAt: sqInteger('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const sqSystemConfigs = sqliteTable('system_configs', {
  key: sqText('key').primaryKey(),
  value: sqText('value').notNull(),
  description: sqText('description'),
  updatedAt: sqInteger('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const sqClientPayments = sqliteTable('client_payments', {
  id: sqText('id').primaryKey(),
  clientId: sqText('client_id').notNull().references(() => sqClients.id, { onDelete: 'cascade' }),
  userId: sqText('user_id').notNull().references(() => sqUsers.id, { onDelete: 'cascade' }),
  amount: sqReal('amount').notNull(),
  paymentDate: sqInteger('payment_date', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  status: sqText('status', { enum: ['UNUSED', 'USED'] }).notNull().default('UNUSED'),
  notes: sqText('notes'),
  createdAt: sqInteger('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  userIdIdx: sqIndex('client_payments_user_id_idx').on(table.userId),
  clientIdIdx: sqIndex('client_payments_client_id_idx').on(table.clientId),
  statusIdx: sqIndex('client_payments_status_idx').on(table.status),
}));


// ==========================================
// Unified Export
// ==========================================

export const postgresSchema = {
  users: pgUsers,
  refreshTokens: pgRefreshTokens,
  clients: pgClients,
  balanceTransactions: pgBalanceTransactions,
  rides: pgRides,
  ridePresets: pgRidePresets,
  subscriptions: pgSubscriptions,
  pricingPlans: pgPricingPlans,
  systemConfigs: pgSystemConfigs,
  clientPayments: pgClientPayments,
  // Enums
  roleEnum,
  rideStatusEnum,
  paymentStatusEnum,
  transactionTypeEnum,
  transactionOriginEnum,
  planEnum,
  subscriptionStatusEnum,
  paymentUsedStatusEnum,
};

export const sqliteSchema = {
  users: sqUsers,
  refreshTokens: sqRefreshTokens,
  clients: sqClients,
  balanceTransactions: sqBalanceTransactions,
  rides: sqRides,
  ridePresets: sqRidePresets,
  subscriptions: sqSubscriptions,
  pricingPlans: sqPricingPlans,
  systemConfigs: sqSystemConfigs,
  clientPayments: sqClientPayments,
};

// Backward compatibility or default export based on env
export const users = isPostgres ? pgUsers : sqUsers;
export const refreshTokens = isPostgres ? pgRefreshTokens : sqRefreshTokens;
export const clients = isPostgres ? pgClients : sqClients;
export const balanceTransactions = isPostgres ? pgBalanceTransactions : sqBalanceTransactions;
export const rides = isPostgres ? pgRides : sqRides;
export const ridePresets = isPostgres ? pgRidePresets : sqRidePresets;
export const subscriptions = isPostgres ? pgSubscriptions : sqSubscriptions;
export const pricingPlans = isPostgres ? pgPricingPlans : sqPricingPlans;
export const systemConfigs = isPostgres ? pgSystemConfigs : sqSystemConfigs;
export const clientPayments = isPostgres ? pgClientPayments : sqClientPayments;
