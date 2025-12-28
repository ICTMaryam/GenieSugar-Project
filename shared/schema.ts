import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles
export type UserRole = "patient" | "physician" | "dietitian" | "admin";

// Users table
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").$type<UserRole>().notNull().default("patient"),
  diabetesType: text("diabetes_type"),
  phone: text("phone"),
  profileImage: text("profile_image"),
  emailVerified: boolean("email_verified").default(false),
  // Physician/Dietitian verification fields
  licenseNumber: text("license_number"),
  specialization: text("specialization"),
  hospitalClinic: text("hospital_clinic"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true }).extend({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  role: z.enum(["patient", "physician", "dietitian", "admin"]),
});

export const registerSchema = insertUserSchema.extend({
  consent: z.boolean().refine(val => val === true, "You must agree to the terms"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type RegisterData = z.infer<typeof registerSchema>;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Glucose readings
export const glucoseReadings = pgTable("glucose_readings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  value: integer("value").notNull(), // mg/dL
  timestamp: timestamp("timestamp").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGlucoseSchema = createInsertSchema(glucoseReadings).omit({ id: true, createdAt: true, userId: true }).extend({
  value: z.number().min(20, "Value must be at least 20 mg/dL").max(600, "Value must be at most 600 mg/dL"),
  timestamp: z.string().or(z.date()),
  note: z.string().optional(),
});

export type InsertGlucose = z.infer<typeof insertGlucoseSchema>;
export type GlucoseReading = typeof glucoseReadings.$inferSelect;

// Food logs with nutrition data
export const foodLogs = pgTable("food_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  mealType: text("meal_type").notNull(), // breakfast, lunch, dinner, snack
  foodName: text("food_name").notNull(),
  portion: text("portion"),
  calories: integer("calories"),
  carbs: integer("carbs"),
  protein: integer("protein"),
  fat: integer("fat"),
  fiber: integer("fiber"),
  glycemicIndex: integer("glycemic_index"),
  glycemicLoad: integer("glycemic_load"),
  isDangerous: boolean("is_dangerous").default(false),
  notes: text("notes"),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFoodLogSchema = createInsertSchema(foodLogs).omit({ id: true, createdAt: true, userId: true }).extend({
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  foodName: z.string().min(1, "Food name is required"),
  portion: z.string().optional(),
  calories: z.number().optional(),
  carbs: z.number().optional(),
  protein: z.number().optional(),
  fat: z.number().optional(),
  fiber: z.number().optional(),
  glycemicIndex: z.number().optional(),
  glycemicLoad: z.number().optional(),
  isDangerous: z.boolean().optional(),
  notes: z.string().optional(),
  timestamp: z.string().or(z.date()),
});

export type InsertFoodLog = z.infer<typeof insertFoodLogSchema>;
export type FoodLog = typeof foodLogs.$inferSelect;

// Activity logs
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  activityType: text("activity_type").notNull(),
  duration: integer("duration").notNull(), // minutes
  intensity: text("intensity").notNull(), // low, moderate, high
  timestamp: timestamp("timestamp").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true, userId: true }).extend({
  activityType: z.string().min(1, "Activity type is required"),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  intensity: z.enum(["low", "moderate", "high"]),
  timestamp: z.string().or(z.date()),
  notes: z.string().optional(),
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Hospital and Doctor Directory (from Bahrain hospitals)
export const hospitalDirectory = [
  { id: "H001", name: "Salmaniya Medical Complex", city: "Manama" },
  { id: "H002", name: "King Hamad University Hospital", city: "Busaiteen" },
  { id: "H003", name: "Bahrain Defence Force Hospital", city: "Riffa" },
  { id: "H004", name: "Ibn Al-Nafees Hospital", city: "Manama" },
  { id: "H005", name: "American Mission Hospital", city: "Manama" },
] as const;

export const doctorDirectory = [
  // Salmaniya Medical Complex (H001)
  { id: "DIA001", name: "Dr. Hassan Abdulrahman", hospitalId: "H001", specialization: "Endocrinology (Diabetes)" },
  { id: "DIA002", name: "Dr. Fatima Al-Khalifa", hospitalId: "H001", specialization: "Internal Medicine & Diabetes" },
  { id: "DIA003", name: "Dr. Mohammed Al-Doseri", hospitalId: "H001", specialization: "Pediatric Diabetes" },
  // King Hamad University Hospital (H002)
  { id: "DIA004", name: "Dr. Noor Al-Sayed", hospitalId: "H002", specialization: "Diabetes & Metabolism" },
  { id: "DIA005", name: "Dr. Ahmed Al-Mannai", hospitalId: "H002", specialization: "Endocrinology" },
  { id: "DIA006", name: "Dr. Sara Al-Zayani", hospitalId: "H002", specialization: "Diabetic Complications" },
  // Bahrain Defence Force Hospital (H003)
  { id: "DIA007", name: "Dr. Abdulaziz Al-Mutawa", hospitalId: "H003", specialization: "Endocrinology (Diabetes Care)" },
  { id: "DIA008", name: "Dr. Khalid Al-Rumaihi", hospitalId: "H003", specialization: "Diabetes Management" },
  // Ibn Al-Nafees Hospital (H004)
  { id: "DIA009", name: "Dr. Lulwa Al-Binali", hospitalId: "H004", specialization: "Adult Diabetes Management" },
  { id: "DIA010", name: "Dr. Huda Al-Ansari", hospitalId: "H004", specialization: "Endocrinology" },
  { id: "DIA011", name: "Dr. Yusuf Al-Jassim", hospitalId: "H004", specialization: "Diabetes & Nutrition" },
  // American Mission Hospital (H005)
  { id: "DIA012", name: "Dr. Salman Al-Kooheji", hospitalId: "H005", specialization: "Endocrinology & Diabetes" },
  { id: "DIA013", name: "Dr. Mariam Al-Hashimi", hospitalId: "H005", specialization: "Gestational Diabetes" },
  { id: "DIA014", name: "Dr. Ali Al-Awadhi", hospitalId: "H005", specialization: "Type 2 Diabetes Care" },
] as const;

export type Hospital = typeof hospitalDirectory[number];
export type DoctorEntry = typeof doctorDirectory[number];

// Bahraini Food Database with nutritional information and GI/GL
export const bahrainiFood = [
  { id: "BF001", name: "Machboos (Chicken)", nameAr: "مجبوس دجاج", calories: 450, carbs: 55, protein: 28, fat: 15, fiber: 3, gi: 65, serving: "1 plate (300g)", category: "main" },
  { id: "BF002", name: "Machboos (Lamb)", nameAr: "مجبوس لحم", calories: 520, carbs: 55, protein: 32, fat: 20, fiber: 3, gi: 65, serving: "1 plate (300g)", category: "main" },
  { id: "BF003", name: "Machboos (Fish)", nameAr: "مجبوس سمك", calories: 380, carbs: 50, protein: 30, fat: 8, fiber: 2, gi: 60, serving: "1 plate (300g)", category: "main" },
  { id: "BF004", name: "Harees", nameAr: "هريس", calories: 380, carbs: 45, protein: 22, fat: 12, fiber: 4, gi: 60, serving: "1 bowl (250g)", category: "main" },
  { id: "BF005", name: "Balaleet", nameAr: "بلاليط", calories: 320, carbs: 48, protein: 10, fat: 10, fiber: 1, gi: 70, serving: "1 serving (200g)", category: "breakfast" },
  { id: "BF006", name: "Muhammar (Sweet Rice)", nameAr: "محمر", calories: 280, carbs: 50, protein: 5, fat: 6, fiber: 1, gi: 72, serving: "1 cup (180g)", category: "main" },
  { id: "BF007", name: "Thareed", nameAr: "ثريد", calories: 420, carbs: 52, protein: 25, fat: 12, fiber: 3, gi: 65, serving: "1 bowl (300g)", category: "main" },
  { id: "BF008", name: "Samboosa (Meat)", nameAr: "سمبوسة لحم", calories: 180, carbs: 15, protein: 8, fat: 10, fiber: 1, gi: 55, serving: "2 pieces", category: "snack" },
  { id: "BF009", name: "Samboosa (Vegetable)", nameAr: "سمبوسة خضار", calories: 150, carbs: 18, protein: 4, fat: 7, fiber: 2, gi: 50, serving: "2 pieces", category: "snack" },
  { id: "BF010", name: "Luqaimat", nameAr: "لقيمات", calories: 150, carbs: 22, protein: 2, fat: 6, fiber: 0, gi: 75, serving: "5 pieces", category: "dessert" },
  { id: "BF011", name: "Khanfaroosh", nameAr: "خنفروش", calories: 120, carbs: 18, protein: 2, fat: 5, fiber: 0, gi: 70, serving: "2 pieces", category: "dessert" },
  { id: "BF012", name: "Dates (Khudri)", nameAr: "تمر خضري", calories: 66, carbs: 18, protein: 0, fat: 0, fiber: 2, gi: 42, serving: "2 dates (20g)", category: "snack" },
  { id: "BF013", name: "Dates (Medjool)", nameAr: "تمر مجدول", calories: 133, carbs: 36, protein: 1, fat: 0, fiber: 3, gi: 45, serving: "2 dates (40g)", category: "snack" },
  { id: "BF014", name: "Gahwa (Arabic Coffee)", nameAr: "قهوة عربية", calories: 5, carbs: 1, protein: 0, fat: 0, fiber: 0, gi: 0, serving: "1 cup (60ml)", category: "beverage" },
  { id: "BF015", name: "Karak Chai", nameAr: "شاي كرك", calories: 120, carbs: 18, protein: 3, fat: 4, fiber: 0, gi: 65, serving: "1 cup (150ml)", category: "beverage" },
  { id: "BF016", name: "Khubz (Arabic Bread)", nameAr: "خبز عربي", calories: 80, carbs: 16, protein: 3, fat: 1, fiber: 1, gi: 70, serving: "1 piece", category: "bread" },
  { id: "BF017", name: "Hummus", nameAr: "حمص", calories: 166, carbs: 14, protein: 8, fat: 10, fiber: 6, gi: 6, serving: "100g", category: "side" },
  { id: "BF018", name: "Falafel", nameAr: "فلافل", calories: 333, carbs: 32, protein: 13, fat: 18, fiber: 5, gi: 40, serving: "6 pieces", category: "side" },
  { id: "BF019", name: "Tabbouleh", nameAr: "تبولة", calories: 90, carbs: 10, protein: 2, fat: 5, fiber: 3, gi: 15, serving: "1 cup (150g)", category: "side" },
  { id: "BF020", name: "Fattoush", nameAr: "فتوش", calories: 120, carbs: 12, protein: 3, fat: 7, fiber: 3, gi: 20, serving: "1 bowl (200g)", category: "side" },
  { id: "BF021", name: "White Rice", nameAr: "أرز أبيض", calories: 206, carbs: 45, protein: 4, fat: 0, fiber: 1, gi: 73, serving: "1 cup (158g)", category: "main" },
  { id: "BF022", name: "Basmati Rice", nameAr: "أرز بسمتي", calories: 191, carbs: 43, protein: 4, fat: 1, fiber: 1, gi: 58, serving: "1 cup (158g)", category: "main" },
  { id: "BF023", name: "Chicken Shawarma", nameAr: "شاورما دجاج", calories: 350, carbs: 20, protein: 28, fat: 18, fiber: 2, gi: 50, serving: "1 wrap", category: "main" },
  { id: "BF024", name: "Grilled Hammour", nameAr: "هامور مشوي", calories: 180, carbs: 0, protein: 35, fat: 4, fiber: 0, gi: 0, serving: "150g fillet", category: "main" },
  { id: "BF025", name: "Laban (Buttermilk)", nameAr: "لبن", calories: 62, carbs: 5, protein: 3, fat: 4, fiber: 0, gi: 32, serving: "1 cup (240ml)", category: "beverage" },
] as const;

export type BahrainiFood = typeof bahrainiFood[number];

// Helper function to calculate glycemic load and danger level
export function calculateGlycemicLoad(gi: number, carbs: number, fiber: number = 0): number {
  const netCarbs = carbs - fiber;
  return Math.round((gi * netCarbs) / 100);
}

export function isDangerousForDiabetes(gi: number, gl: number): boolean {
  return gi >= 70 || gl >= 20;
}

// Care team request status
export type CareTeamStatus = "pending" | "approved" | "rejected";

// Care team relationships
export const careTeam = pgTable("care_team", {
  id: varchar("id", { length: 36 }).primaryKey(),
  patientId: varchar("patient_id", { length: 36 }).notNull(),
  providerId: varchar("provider_id", { length: 36 }).notNull(),
  permissions: text("permissions").notNull(), // "glucose" or "all"
  status: text("status").$type<CareTeamStatus>().notNull().default("approved"),
  hospitalId: text("hospital_id"),
  doctorDirectoryId: text("doctor_directory_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCareTeamSchema = createInsertSchema(careTeam).omit({ id: true, createdAt: true }).extend({
  patientId: z.string(),
  providerId: z.string(),
  permissions: z.enum(["glucose", "all"]),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  hospitalId: z.string().optional(),
  doctorDirectoryId: z.string().optional(),
});

export type InsertCareTeam = z.infer<typeof insertCareTeamSchema>;
export type CareTeamRelation = typeof careTeam.$inferSelect;

// Provider notes
export const providerNotes = pgTable("provider_notes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  patientId: varchar("patient_id", { length: 36 }).notNull(),
  providerId: varchar("provider_id", { length: 36 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProviderNoteSchema = createInsertSchema(providerNotes).omit({ id: true, createdAt: true });

export type InsertProviderNote = z.infer<typeof insertProviderNoteSchema>;
export type ProviderNote = typeof providerNotes.$inferSelect;

// Audit logs
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  action: text("action").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export type AuditLog = typeof auditLogs.$inferSelect;

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;

// Chat messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id", { length: 36 }).primaryKey(),
  senderId: varchar("sender_id", { length: 36 }).notNull(),
  receiverId: varchar("receiver_id", { length: 36 }).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, createdAt: true, isRead: true });

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Alert settings
export const alertSettings = pgTable("alert_settings", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().unique(),
  highThreshold: integer("high_threshold").default(180),
  lowThreshold: integer("low_threshold").default(70),
  emailAlerts: boolean("email_alerts").default(true),
  smsAlerts: boolean("sms_alerts").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAlertSettingsSchema = createInsertSchema(alertSettings).omit({ id: true, createdAt: true });

export type InsertAlertSettings = z.infer<typeof insertAlertSettingsSchema>;
export type AlertSettings = typeof alertSettings.$inferSelect;

// Family contacts for emergency notifications
export const familyContacts = pgTable("family_contacts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  relationship: text("relationship").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFamilyContactSchema = createInsertSchema(familyContacts).omit({ id: true, createdAt: true, userId: true }).extend({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  relationship: z.string().min(1, "Relationship is required"),
});

export type InsertFamilyContact = z.infer<typeof insertFamilyContactSchema>;
export type FamilyContact = typeof familyContacts.$inferSelect;

// Email verification tokens
export const verificationTokens = pgTable("verification_tokens", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type VerificationToken = typeof verificationTokens.$inferSelect;

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

// Doctor verification schema for registration
// Physician registration (requires verification)
export const doctorRegisterSchema = insertUserSchema.extend({
  consent: z.boolean().refine(val => val === true, "You must agree to the terms"),
  confirmPassword: z.string(),
  licenseNumber: z.string().min(1, "License number is required"),
  hospitalClinic: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type DoctorRegisterData = z.infer<typeof doctorRegisterSchema>;

// Dietitian registration (no verification required)
export const dietitianRegisterSchema = insertUserSchema.extend({
  consent: z.boolean().refine(val => val === true, "You must agree to the terms"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type DietitianRegisterData = z.infer<typeof dietitianRegisterSchema>;

// Patient registration with hospital/doctor selection
export const patientRegisterSchema = insertUserSchema.extend({
  consent: z.boolean().refine(val => val === true, "You must agree to the terms"),
  confirmPassword: z.string(),
  selectedHospitalId: z.string().optional(),
  selectedDoctorId: z.string().optional(),
  diabetesType: z.string().min(1, "Please select your diabetes type"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type PatientRegisterData = z.infer<typeof patientRegisterSchema>;

// Appointment status
export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

// Appointments table
export const appointments = pgTable("appointments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  physicianId: varchar("physician_id", { length: 36 }).notNull(),
  patientId: varchar("patient_id", { length: 36 }).notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  duration: integer("duration").notNull().default(30), // minutes
  status: text("status").$type<AppointmentStatus>().notNull().default("pending"),
  notes: text("notes"), // Notes/messages for patient
  requirements: text("requirements"), // What patient should bring/upload
  reminderDays: integer("reminder_days").default(2), // Days before to send reminder
  reminderSent: boolean("reminder_sent").default(false),
  patientSeen: boolean("patient_seen").default(false), // Has patient seen the notification
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({ 
  id: true, 
  createdAt: true, 
  reminderSent: true,
  patientSeen: true 
}).extend({
  physicianId: z.string(),
  patientId: z.string(),
  appointmentDate: z.string().or(z.date()),
  duration: z.number().min(15, "Duration must be at least 15 minutes").max(180, "Duration must be at most 180 minutes").optional(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  notes: z.string().optional(),
  requirements: z.string().optional(),
  reminderDays: z.number().min(0).max(14).optional(),
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;
