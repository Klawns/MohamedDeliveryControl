import { sqliteTable, text, real, integer, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    password: text('password').notNull(),
    taxId: text('tax_id'), // CPF/CNPJ
    cellphone: text('cellphone'), // Celular
    role: text('role', { enum: ['admin', 'user'] }).notNull().default('user'),
    hasSeenTutorial: integer('has_seen_tutorial', { mode: 'boolean' }).default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const refreshTokens = sqliteTable('refresh_tokens', {
    id: text('id').primaryKey(),
    token: text('token').notNull().unique(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    userIdIdx: index('refresh_tokens_user_id_idx').on(table.userId),
}));

export const clients = sqliteTable('clients', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    phone: text('phone'),
    address: text('address'),
    isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    userIdIdx: index('clients_user_id_idx').on(table.userId),
}));

export const rides = sqliteTable('rides', {
    id: text('id').primaryKey(),
    clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    value: real('value').notNull(),
    location: text('location'),
    notes: text('notes'),
    status: text('status', { enum: ['PENDING', 'COMPLETED', 'CANCELLED'] }).notNull().default('COMPLETED'),
    paymentStatus: text('payment_status', { enum: ['PENDING', 'PAID'] }).notNull().default('PAID'),
    rideDate: integer('ride_date', { mode: 'timestamp' }),
    photo: text('photo'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    userListIdx: index('rides_user_list_idx').on(table.userId, table.rideDate, table.createdAt, table.id),
    clientListIdx: index('rides_client_list_idx').on(table.userId, table.clientId, table.rideDate, table.createdAt, table.id),
    userDateStatusIdx: index('rides_user_date_status_idx').on(table.userId, table.rideDate, table.status),
}));

export const ridePresets = sqliteTable('ride_presets', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    label: text('label').notNull(), // Ex: "Centro"
    value: real('value').notNull(), // Ex: 5.00
    location: text('location').notNull(), // Ex: "Terminal Central"
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    userIdIdx: index('ride_presets_user_id_idx').on(table.userId),
}));

export const subscriptions = sqliteTable('subscriptions', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    plan: text('plan', { enum: ['starter', 'premium', 'lifetime'] }).notNull(),
    status: text('status', { enum: ['active', 'inactive', 'canceled', 'trial'] }).notNull(),
    rideCount: integer('ride_count').notNull().default(0),
    validUntil: integer('valid_until', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    userIdIdx: index('subscriptions_user_id_idx').on(table.userId),
}));

export const pricingPlans = sqliteTable('pricing_plans', {
    id: text('id').primaryKey(), // starter, premium, lifetime
    name: text('name').notNull(),
    price: integer('price').notNull(), // Em centavos
    interval: text('interval'), // Ex: "/mês"
    description: text('description').notNull(),
    features: text('features').notNull(), // JSON string array
    cta: text('cta').notNull(),
    highlight: integer('highlight', { mode: 'boolean' }).notNull().default(false),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const systemConfigs = sqliteTable('system_configs', {
    key: text('key').primaryKey(),
    value: text('value').notNull(),
    description: text('description'),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const clientPayments = sqliteTable('client_payments', {
    id: text('id').primaryKey(),
    clientId: text('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    amount: real('amount').notNull(), // Em reais, ex: 100.50
    paymentDate: integer('payment_date', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
    status: text('status', { enum: ['UNUSED', 'USED'] }).notNull().default('UNUSED'),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
    userIdIdx: index('client_payments_user_id_idx').on(table.userId),
    clientIdIdx: index('client_payments_client_id_idx').on(table.clientId),
    statusIdx: index('client_payments_status_idx').on(table.status),
}));
