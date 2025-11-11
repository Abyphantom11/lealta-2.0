import { pgTable, text, timestamp, boolean, uuid } from 'drizzle-orm/pg-core';

/**
 * 💳 Tabla de Suscripciones de Paddle
 * 
 * Almacena el estado de las suscripciones de cada negocio
 */
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: text('business_id').notNull(), // FK a tu tabla de businesses
  paddleSubscriptionId: text('paddle_subscription_id').notNull().unique(),
  paddleCustomerId: text('paddle_customer_id').notNull(),
  
  // Estado de la suscripción
  status: text('status').notNull(), // active, past_due, canceled, paused
  planId: text('plan_id').notNull(), // El price_id de Paddle
  
  // Periodos de facturación
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  
  // Control de cancelación
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  canceledAt: timestamp('canceled_at'),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * 💰 Tabla de Transacciones/Pagos
 * 
 * Historial de pagos recibidos
 */
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
  paddleTransactionId: text('paddle_transaction_id').notNull().unique(),
  
  // Datos del pago
  amount: text('amount').notNull(), // Guardar como string para precisión
  currency: text('currency').notNull(),
  status: text('status').notNull(), // completed, failed, refunded
  
  // Datos del cliente
  customerEmail: text('customer_email'),
  customerName: text('customer_name'),
  
  // Fechas
  billedAt: timestamp('billed_at'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Tipos TypeScript inferidos
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
