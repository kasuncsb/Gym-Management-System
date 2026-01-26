import { mysqlTable, varchar, text, int, decimal, boolean, datetime, date, timestamp, json, mysqlEnum, uniqueIndex } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// --- ENUMS ---
export const roleEnum = mysqlEnum('role', ['admin', 'manager', 'staff', 'trainer', 'member']);
export const statusEnum = mysqlEnum('status', ['active', 'inactive', 'suspended', 'pending', 'archived', 'banned']);
export const genderEnum = mysqlEnum('gender', ['male', 'female', 'other']);
export const paymentMethodEnum = mysqlEnum('payment_method', ['cash', 'card', 'transfer', 'online']);
export const attendanceTypeEnum = mysqlEnum('attendance_type', ['in', 'out']);
export const leadStatusEnum = mysqlEnum('lead_status', ['new', 'contacted', 'converted', 'lost']);
export const equipmentStatusEnum = mysqlEnum('equipment_status', ['operational', 'maintenance', 'retired']);
export const appointmentStatusEnum = mysqlEnum('appointment_status', ['pending', 'confirmed', 'completed', 'cancelled']);
export const appointmentTypeEnum = mysqlEnum('appointment_type', ['consultation', 'training_session', 'assessment', 'other']);

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
    deletedAt: timestamp('deleted_at'),
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

// --- 2. PROFILES & CRM ---

export const branches = mysqlTable('branches', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 20 }).notNull().unique(), // KBT
    address: text('address').notNull(),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 100 }),
    isActive: boolean('is_active').default(true),
});

export const leads = mysqlTable('leads', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 100 }),
    source: varchar('source', { length: 50 }), // e.g. 'walk_in', 'social_media'
    status: leadStatusEnum.default('new'),
    notes: text('notes'),
    followUpDate: date('follow_up_date'),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
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
    qrCode: varchar('qr_code', { length: 100 }).unique(), // Keeping strict backward compat if needed, but qrCodeSecret is preferred
    qrCodeSecret: text('qr_code_secret'), // For generating dynamic TOTP codes
    lastQrGeneratedAt: timestamp('last_qr_generated_at'),
    referralSourceId: varchar('referral_source_id', { length: 36 }), // Could link to another member
    deletedAt: timestamp('deleted_at'),
});

export const memberDocuments = mysqlTable('member_documents', {
    id: varchar('id', { length: 36 }).primaryKey(),
    memberId: varchar('member_id', { length: 36 }).notNull().references(() => members.id),
    type: varchar('type', { length: 50 }).notNull(), // 'waiver', 'contract'
    fileUrl: varchar('file_url', { length: 255 }).notNull(),
    signedAt: timestamp('signed_at').default(sql`CURRENT_TIMESTAMP`),
});

export const memberMetrics = mysqlTable('member_metrics', {
    id: varchar('id', { length: 36 }).primaryKey(),
    memberId: varchar('member_id', { length: 36 }).notNull().references(() => members.id),
    recordedAt: timestamp('recorded_at').default(sql`CURRENT_TIMESTAMP`),
    weight: decimal('weight', { precision: 5, scale: 2 }), // kg
    height: decimal('height', { precision: 5, scale: 2 }), // cm
    bodyFatPercentage: decimal('body_fat_percentage', { precision: 4, scale: 1 }),
    muscleMass: decimal('muscle_mass', { precision: 5, scale: 2 }),
    bmi: decimal('bmi', { precision: 4, scale: 1 }),
    notes: text('notes'),
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
    deletedAt: timestamp('deleted_at'),
});

export const trainers = mysqlTable('trainers', {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id),
    specialization: varchar('specialization', { length: 100 }),
    bio: text('bio'),
    hourlyRate: decimal('hourly_rate', { precision: 8, scale: 2 }),
    rating: decimal('rating', { precision: 3, scale: 2 }).default('5.0'),
    branchId: varchar('branch_id', { length: 36 }).references(() => branches.id),
    deletedAt: timestamp('deleted_at'),
});


// --- 3. OPERATIONS, ASSETS & IOT ---

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
    lastHeartbeat: timestamp('last_heartbeat'),
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

export const equipment = mysqlTable('equipment', {
    id: varchar('id', { length: 36 }).primaryKey(),
    branchId: varchar('branch_id', { length: 36 }).references(() => branches.id),
    name: varchar('name', { length: 100 }).notNull(),
    type: varchar('type', { length: 50 }), // 'Cardio', 'Strength'
    serialNumber: varchar('serial_number', { length: 100 }),
    purchaseDate: date('purchase_date'),
    warrantyExpiry: date('warranty_expiry'),
    status: equipmentStatusEnum.default('operational'),
    lastMaintenanceDate: date('last_maintenance_date'),
});

export const maintenanceLogs = mysqlTable('maintenance_logs', {
    id: varchar('id', { length: 36 }).primaryKey(),
    equipmentId: varchar('equipment_id', { length: 36 }).notNull().references(() => equipment.id),
    description: text('description').notNull(),
    cost: decimal('cost', { precision: 10, scale: 2 }),
    performedBy: varchar('performed_by', { length: 100 }), // Staff or Vendor
    performedAt: timestamp('performed_at').default(sql`CURRENT_TIMESTAMP`),
});

// --- 4. BILLING, INVENTORY & FINANCE ---

export const subscriptionPlans = mysqlTable('subscription_plans', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 50 }).notNull(),
    description: text('description'),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    durationDays: int('duration_days').notNull(), // 30, 90, 365
    features: json('features'), // Access to Pool, Spa etc.
    isActive: boolean('is_active').default(true),
    deletedAt: timestamp('deleted_at'),
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
    deletedAt: timestamp('deleted_at'),
});

export const productCategories = mysqlTable('product_categories', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 50 }).notNull(),
    description: text('description'),
});

export const products = mysqlTable('products', {
    id: varchar('id', { length: 36 }).primaryKey(),
    categoryId: varchar('category_id', { length: 36 }).references(() => productCategories.id),
    name: varchar('name', { length: 100 }).notNull(),
    sku: varchar('sku', { length: 50 }).unique(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
    stockQuantity: int('stock_quantity').default(0),
    reorderLevel: int('reorder_level').default(10),
    isActive: boolean('is_active').default(true),
});

export const inventoryLogs = mysqlTable('inventory_logs', {
    id: varchar('id', { length: 36 }).primaryKey(),
    productId: varchar('product_id', { length: 36 }).notNull().references(() => products.id),
    changeAmount: int('change_amount').notNull(),
    reason: varchar('reason', { length: 100 }), // 'sale', 'restock', 'damage'
    staffId: varchar('staff_id', { length: 36 }).references(() => staff.id),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
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
    productId: varchar('product_id', { length: 36 }).references(() => products.id), // Optional link to physical product
    planId: varchar('plan_id', { length: 36 }).references(() => subscriptionPlans.id), // Optional link to plan
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
    gatewayResponse: json('gateway_response'),
});

// --- 5. ACADEMICS & ENGAGEMENT ---

export const classes = mysqlTable('classes', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    type: varchar('type', { length: 50 }), // Yoga, Zumba
    difficulty: mysqlEnum('difficulty', ['beginner', 'intermediate', 'advanced']),
    capacity: int('capacity'),
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

export const appointments = mysqlTable('appointments', {
    id: varchar('id', { length: 36 }).primaryKey(),
    memberId: varchar('member_id', { length: 36 }).notNull().references(() => members.id),
    trainerId: varchar('trainer_id', { length: 36 }).notNull().references(() => trainers.id),
    startTime: datetime('start_time').notNull(),
    endTime: datetime('end_time').notNull(),
    type: appointmentTypeEnum.default('training_session'),
    status: appointmentStatusEnum.default('pending'),
    notes: text('notes'),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const exercises = mysqlTable('exercises', {
    id: varchar('id', { length: 36 }).primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 50 }),
    videoUrl: varchar('video_url', { length: 255 }),
});

export const workoutRoutines = mysqlTable('workout_routines', {
    id: varchar('id', { length: 36 }).primaryKey(),
    memberId: varchar('member_id', { length: 36 }).references(() => members.id),
    creatorId: varchar('creator_id', { length: 36 }).references(() => trainers.id),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const routineExercises = mysqlTable('routine_exercises', {
    id: varchar('id', { length: 36 }).primaryKey(),
    routineId: varchar('routine_id', { length: 36 }).notNull().references(() => workoutRoutines.id),
    exerciseId: varchar('exercise_id', { length: 36 }).notNull().references(() => exercises.id),
    sets: int('sets'),
    reps: text('reps'), // e.g., "12-10-8" or just "10"
    restTimeSeconds: int('rest_time_seconds'),
    orderIndex: int('order_index').notNull(),
});

export const workoutLogs = mysqlTable('workout_logs', {
    id: varchar('id', { length: 36 }).primaryKey(),
    memberId: varchar('member_id', { length: 36 }).notNull().references(() => members.id),
    routineId: varchar('routine_id', { length: 36 }).references(() => workoutRoutines.id),
    date: datetime('date').notNull(),
    durationMinutes: int('duration_minutes'),
    caloriesBurned: int('calories_burned'),
    notes: text('notes'),
    verifiedBy: varchar('verified_by', { length: 36 }).references(() => staff.id),
});

export const dietPlans = mysqlTable('diet_plans', {
    id: varchar('id', { length: 36 }).primaryKey(),
    memberId: varchar('member_id', { length: 36 }).notNull().references(() => members.id),
    trainerId: varchar('trainer_id', { length: 36 }).references(() => trainers.id),
    dailyCalorieTarget: int('daily_calorie_target'),
    macroRatio: varchar('macro_ratio', { length: 50 }), // e.g. "40P/30C/30F"
    startDate: date('start_date'),
    endDate: date('end_date'),
    isActive: boolean('is_active').default(true),
});

export const workoutPlans = mysqlTable('workout_plans', { // Kept for backwards compat if needed, but workoutRoutines is superior
    id: varchar('id', { length: 36 }).primaryKey(),
    memberId: varchar('member_id', { length: 36 }).references(() => members.id),
    creatorId: varchar('creator_id', { length: 36 }).references(() => trainers.id),
    name: varchar('name', { length: 100 }),
    startDate: date('start_date'),
    endDate: date('end_date'),
    isActive: boolean('is_active').default(true),
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
    type: varchar('type', { length: 50 }), // 'info', 'alert'
    isRead: boolean('is_read').default(false),
    createdAt: timestamp('created_at').default(sql`CURRENT_TIMESTAMP`),
});
