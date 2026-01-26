import { mysqlTable, varchar, text, int, decimal, boolean, datetime, date, timestamp, json, mysqlEnum, uniqueIndex } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// --- ENUMS ---
export const roleEnum = mysqlEnum('role', ['admin', 'manager', 'staff', 'trainer', 'member']);
export const statusEnum = mysqlEnum('status', ['active', 'inactive', 'suspended', 'pending', 'archived']);
export const genderEnum = mysqlEnum('gender', ['male', 'female', 'other']);
export const paymentMethodEnum = mysqlEnum('payment_method', ['cash', 'card', 'transfer', 'online']);
export const attendanceTypeEnum = mysqlEnum('attendance_type', ['in', 'out']);

// --- 1. CORE IDENTITY & AUTH ---

export const users = mysqlTable('users', {
    id: varchar('id', { length: 36 }).primaryKey(), // UUID
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: roleEnum.notNull().default('member'),
    fullName: varchar('full_name', { length: 100 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    avatarUrl: varchar('avatar_url', { length: 255 }),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp('updated_at').onUpdateNow(),
});

export const permissions = mysqlTable('permissions', {
    id: varchar('id', { length: 36 }).primaryKey(),
    code: varchar('code', { length: 50 }).notNull().unique(), // e.g. 'manage_users'
    description: varchar('description', { length: 255 }),
});

export const rolePermissions = mysqlTable('role_permissions', {
    role: roleEnum.notNull(),
    permissionCode: varchar('permission_code', { length: 50 }).notNull(), // FK manually managed
}, (t) => ({
    uidx: uniqueIndex('role_perm_idx').on(t.role, t.permissionCode)
}));

// --- 2. PROFILES ---

export const branches = mysqlTable('branches', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 20 }).notNull().unique(), // KBT
    address: text('address').notNull(),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 100 }),
    isActive: boolean('is_active').default(true),
});

export const members = mysqlTable('members', {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
    memberCode: varchar('member_code', { length: 20 }).notNull().unique(), // MEM001
    dateOfBirth: date('date_of_birth'),
    gender: genderEnum,
    emergencyContactName: varchar('emergency_contact_name', { length: 100 }),
    emergencyContactPhone: varchar('emergency_contact_phone', { length: 20 }),
    medicalConditions: text('medical_conditions'),
    homeBranchId: varchar('home_branch_id', { length: 36 }).references(() => branches.id),
    joinDate: date('join_date').notNull(),
    status: statusEnum.default('active'),
    qrCode: varchar('qr_code', { length: 100 }).unique(),
});

export const staff = mysqlTable('staff', {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
    employeeCode: varchar('employee_code', { length: 20 }).notNull().unique(), // EMP001
    designation: varchar('designation', { length: 100 }),
    branchId: varchar('branch_id', { length: 36 }).references(() => branches.id),
    hireDate: date('hire_date').notNull(),
    baseSalary: decimal('base_salary', { precision: 10, scale: 2 }),
    status: statusEnum.default('active'),
});

export const trainers = mysqlTable('trainers', {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
    specialization: varchar('specialization', { length: 100 }),
    bio: text('bio'),
    hourlyRate: decimal('hourly_rate', { precision: 8, scale: 2 }),
    rating: decimal('rating', { precision: 3, scale: 2 }).default('5.0'),
    branchId: varchar('branch_id', { length: 36 }).references(() => branches.id),
});


// --- 3. OPERATIONS & IOT ---

export const zones = mysqlTable('zones', {
    id: varchar('id', { length: 36 }).primaryKey(),
    branchId: varchar('branch_id', { length: 36 }).notNull().references(() => branches.id),
    name: varchar('name', { length: 50 }).notNull(), // Cardio Area, Pool
    capacity: int('capacity'),
});

export const gates = mysqlTable('gates', {
    id: varchar('id', { length: 36 }).primaryKey(),
    zoneId: varchar('zone_id', { length: 36 }).references(() => zones.id),
    name: varchar('name', { length: 50 }), // Main Entrance Turnstile
    deviceId: varchar('device_id', { length: 50 }).unique(), // Hardware ID
    ipAddress: varchar('ip_address', { length: 50 }),
    status: statusEnum.default('active'),
});

export const accessLogs = mysqlTable('access_logs', {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
    gateId: varchar('gate_id', { length: 36 }).references(() => gates.id),
    timestamp: datetime('timestamp').notNull(),
    direction: attendanceTypeEnum.notNull(),
    isAuthorized: boolean('is_authorized').notNull(),
    denyReason: varchar('deny_reason', { length: 100 }),
    snapshotUrl: varchar('snapshot_url', { length: 255 }), // Camera image
});

// --- 4. BILLING & FINANCE ---

export const subscriptionPlans = mysqlTable('subscription_plans', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 50 }).notNull(),
    description: text('description'),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    durationDays: int('duration_days').notNull(), // 30, 90, 365
    features: json('features'), // Access to Pool, Spa etc.
    isActive: boolean('is_active').default(true),
});

export const subscriptions = mysqlTable('subscriptions', {
    id: varchar('id', { length: 36 }).primaryKey(),
    memberId: varchar('member_id', { length: 36 }).notNull().references(() => members.id),
    planId: varchar('plan_id', { length: 36 }).notNull().references(() => subscriptionPlans.id),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    status: statusEnum.default('active'),
    autoRenew: boolean('auto_renew').default(true),
    notes: text('notes'),
});

export const invoices = mysqlTable('invoices', {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
    invoiceNumber: varchar('invoice_number', { length: 50 }).unique().notNull(),
    issueDate: date('issue_date').notNull(),
    dueDate: date('due_date').notNull(),
    totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
    paidAmount: decimal('paid_amount', { precision: 10, scale: 2 }).default('0.00'),
    status: mysqlEnum('invoice_status', ['draft', 'issued', 'paid', 'void', 'overdue']).default('draft'),
});

export const invoiceItems = mysqlTable('invoice_items', {
    id: varchar('id', { length: 36 }).primaryKey(),
    invoiceId: varchar('invoice_id', { length: 36 }).notNull().references(() => invoices.id),
    description: varchar('description', { length: 255 }).notNull(),
    quantity: int('quantity').notNull().default(1),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
});

export const payments = mysqlTable('payments', {
    id: varchar('id', { length: 36 }).primaryKey(),
    invoiceId: varchar('invoice_id', { length: 36 }).references(() => invoices.id), // Link payment to invoice
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    method: paymentMethodEnum.notNull(),
    transactionId: varchar('transaction_id', { length: 100 }), // Stripe ID
    paymentDate: datetime('payment_date').default(sql`CURRENT_TIMESTAMP`),
    status: mysqlEnum('payment_status', ['success', 'failed', 'pending']).default('success'),
});

// --- 5. ACADEMICS (CLASSES) ---

export const classes = mysqlTable('classes', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 50 }), // Yoga, Zumba
    difficulty: mysqlEnum('difficulty', ['beginner', 'intermediate', 'advanced']),
});

export const classSchedules = mysqlTable('class_schedules', {
    id: varchar('id', { length: 36 }).primaryKey(),
    classId: varchar('class_id', { length: 36 }).notNull().references(() => classes.id),
    trainerId: varchar('trainer_id', { length: 36 }).references(() => trainers.id),
    startTime: datetime('start_time').notNull(),
    endTime: datetime('end_time').notNull(),
    maxCapacity: int('max_capacity').default(20),
    location: varchar('location', { length: 100 }), // Studio 1
});

export const classBookings = mysqlTable('class_bookings', {
    id: varchar('id', { length: 36 }).primaryKey(),
    scheduleId: varchar('schedule_id', { length: 36 }).notNull().references(() => classSchedules.id),
    memberId: varchar('member_id', { length: 36 }).notNull().references(() => members.id),
    bookingDate: datetime('booking_date').default(sql`CURRENT_TIMESTAMP`),
    status: mysqlEnum('booking_status', ['confirmed', 'cancelled', 'attended', 'no_show']).default('confirmed'),
});


// --- 6. WORKOUTS & ENGAGEMENT ---

export const exercises = mysqlTable('exercises', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 50 }),
    videoUrl: varchar('video_url', { length: 255 }),
});

export const workoutPlans = mysqlTable('workout_plans', {
    id: varchar('id', { length: 36 }).primaryKey(),
    memberId: varchar('member_id', { length: 36 }).references(() => members.id),
    creatorId: varchar('creator_id', { length: 36 }).references(() => trainers.id), // Trainer
    name: varchar('name', { length: 100 }),
    startDate: date('start_date'),
    endDate: date('end_date'),
    isActive: boolean('is_active').default(true),
});

export const workoutLogs = mysqlTable('workout_logs', {
    id: varchar('id', { length: 36 }).primaryKey(),
    memberId: varchar('member_id', { length: 36 }).notNull().references(() => members.id),
    date: date('date').notNull(),
    durationMinutes: int('duration_minutes'),
    caloriesBurned: int('calories_burned'),
    notes: text('notes'),
});


// --- 7. HUMAN RESOURCES (HR) ---

export const shifts = mysqlTable('shifts', {
    id: varchar('id', { length: 36 }).primaryKey(),
    staffId: varchar('staff_id', { length: 36 }).notNull().references(() => staff.id),
    startTime: datetime('start_time').notNull(),
    endTime: datetime('end_time').notNull(),
    type: mysqlEnum('shift_type', ['morning', 'evening', 'night', 'cover']),
});


// --- 8. SYSTEM ---

export const auditLogs = mysqlTable('audit_logs', {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }),
    action: varchar('action', { length: 100 }).notNull(), // CREATE_USER
    entity: varchar('entity', { length: 50 }), // USERS
    entityId: varchar('entity_id', { length: 36 }),
    details: json('details'),
    ipAddress: varchar('ip_address', { length: 50 }),
    timestamp: datetime('timestamp').default(sql`CURRENT_TIMESTAMP`),
});

export const notifications = mysqlTable('notifications', {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
    title: varchar('title', { length: 100 }).notNull(),
    message: text('message').notNull(),
    isRead: boolean('is_read').default(false),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});
