import { 
  users, 
  glucoseReadings, 
  foodLogs, 
  activityLogs, 
  careTeam, 
  providerNotes,
  auditLogs,
  chatMessages,
  alertSettings,
  familyContacts,
  verificationTokens,
  passwordResetTokens,
  appointments,
  type User, 
  type InsertUser,
  type GlucoseReading,
  type InsertGlucose,
  type FoodLog,
  type InsertFoodLog,
  type ActivityLog,
  type InsertActivityLog,
  type CareTeamRelation,
  type InsertCareTeam,
  type ProviderNote,
  type InsertProviderNote,
  type AuditLog,
  type ChatMessage,
  type InsertChatMessage,
  type AlertSettings,
  type InsertAlertSettings,
  type FamilyContact,
  type InsertFamilyContact,
  type VerificationToken,
  type PasswordResetToken,
  type Appointment,
  type InsertAppointment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, or, gte } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  lockUser(id: string, lock: boolean): Promise<User | undefined>;

  // Glucose
  getGlucoseReadings(userId: string): Promise<GlucoseReading[]>;
  createGlucoseReading(userId: string, data: InsertGlucose): Promise<GlucoseReading>;
  deleteGlucoseReading(id: string, userId: string): Promise<boolean>;

  // Food
  getFoodLogs(userId: string): Promise<FoodLog[]>;
  createFoodLog(userId: string, data: InsertFoodLog): Promise<FoodLog>;
  deleteFoodLog(id: string, userId: string): Promise<boolean>;

  // Activity
  getActivityLogs(userId: string): Promise<ActivityLog[]>;
  createActivityLog(userId: string, data: InsertActivityLog): Promise<ActivityLog>;
  deleteActivityLog(id: string, userId: string): Promise<boolean>;

  // Care Team
  getCareTeamByPatient(patientId: string): Promise<(CareTeamRelation & { provider: User })[]>;
  getCareTeamByProvider(providerId: string): Promise<(CareTeamRelation & { patient: User })[]>;
  addCareTeamMember(data: InsertCareTeam): Promise<CareTeamRelation>;
  removeCareTeamMember(id: string, patientId: string): Promise<boolean>;
  getCareTeamRelation(patientId: string, providerId: string): Promise<CareTeamRelation | undefined>;

  // Audit
  createAuditLog(userId: string, action: string, details?: string): Promise<void>;
  getAuditLogs(): Promise<AuditLog[]>;

  // Chat
  getChatMessages(userId1: string, userId2: string): Promise<ChatMessage[]>;
  sendChatMessage(data: InsertChatMessage): Promise<ChatMessage>;
  getConversations(userId: string): Promise<{ partnerId: string; partner: User; lastMessage: ChatMessage }[]>;
  markMessagesAsRead(senderId: string, receiverId: string): Promise<void>;
  getUnreadMessageCount(userId: string): Promise<number>;

  // Alert Settings
  getAlertSettings(userId: string): Promise<AlertSettings | undefined>;
  upsertAlertSettings(userId: string, data: Partial<InsertAlertSettings>): Promise<AlertSettings>;

  // Family Contacts
  getFamilyContacts(userId: string): Promise<FamilyContact[]>;
  addFamilyContact(userId: string, data: InsertFamilyContact): Promise<FamilyContact>;
  removeFamilyContact(id: string, userId: string): Promise<boolean>;

  // Verification
  createVerificationToken(userId: string, token: string): Promise<VerificationToken>;
  getVerificationToken(token: string): Promise<VerificationToken | undefined>;
  deleteVerificationToken(id: string): Promise<void>;
  verifyUserEmail(userId: string): Promise<User | undefined>;

  // Appointments
  createAppointment(data: InsertAppointment): Promise<Appointment>;
  getAppointmentsByPhysician(physicianId: string): Promise<(Appointment & { patient: User })[]>;
  getAppointmentsByPatient(patientId: string): Promise<(Appointment & { physician: User })[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  updateAppointment(id: string, data: Partial<Appointment>): Promise<Appointment | undefined>;
  getUnseenAppointmentCount(patientId: string): Promise<number>;
  markAppointmentSeen(id: string, patientId: string): Promise<void>;
  getAppointmentsNeedingReminder(): Promise<(Appointment & { patient: User; physician: User })[]>;

  // Pending Care Team Requests
  createPendingCareTeamRequest(data: { patientId: string; hospitalId: string; doctorDirectoryId: string }): Promise<CareTeamRelation>;
  getPendingCareTeamRequests(providerId: string): Promise<(CareTeamRelation & { patient: User })[]>;
  getPendingRequestsByDoctorDirectoryId(doctorDirectoryId: string): Promise<(CareTeamRelation & { patient: User })[]>;
  updateCareTeamRequestStatus(id: string, status: "approved" | "rejected", providerId?: string): Promise<CareTeamRelation | undefined>;
  getPendingRequestCount(providerId: string): Promise<number>;

  // Password Reset
  createPasswordResetToken(userId: string, token: string): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  deletePasswordResetToken(id: string): Promise<void>;
  deletePasswordResetTokensByUser(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, id })
      .returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async lockUser(id: string, lock: boolean): Promise<User | undefined> {
    // For now, we'll use a simple approach - in production you'd add an isLocked column
    return this.getUser(id);
  }

  // Glucose
  async getGlucoseReadings(userId: string): Promise<GlucoseReading[]> {
    return db
      .select()
      .from(glucoseReadings)
      .where(eq(glucoseReadings.userId, userId))
      .orderBy(desc(glucoseReadings.timestamp));
  }

  async createGlucoseReading(userId: string, data: InsertGlucose): Promise<GlucoseReading> {
    const id = randomUUID();
    const [reading] = await db
      .insert(glucoseReadings)
      .values({ 
        ...data, 
        id, 
        userId,
        timestamp: new Date(data.timestamp),
      })
      .returning();
    return reading;
  }

  async deleteGlucoseReading(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(glucoseReadings)
      .where(and(eq(glucoseReadings.id, id), eq(glucoseReadings.userId, userId)));
    return true;
  }

  // Food
  async getFoodLogs(userId: string): Promise<FoodLog[]> {
    return db
      .select()
      .from(foodLogs)
      .where(eq(foodLogs.userId, userId))
      .orderBy(desc(foodLogs.timestamp));
  }

  async createFoodLog(userId: string, data: InsertFoodLog): Promise<FoodLog> {
    const id = randomUUID();
    const [log] = await db
      .insert(foodLogs)
      .values({ 
        ...data, 
        id, 
        userId,
        timestamp: new Date(data.timestamp),
      })
      .returning();
    return log;
  }

  async deleteFoodLog(id: string, userId: string): Promise<boolean> {
    await db
      .delete(foodLogs)
      .where(and(eq(foodLogs.id, id), eq(foodLogs.userId, userId)));
    return true;
  }

  // Activity
  async getActivityLogs(userId: string): Promise<ActivityLog[]> {
    return db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.timestamp));
  }

  async createActivityLog(userId: string, data: InsertActivityLog): Promise<ActivityLog> {
    const id = randomUUID();
    const [log] = await db
      .insert(activityLogs)
      .values({ 
        ...data, 
        id, 
        userId,
        timestamp: new Date(data.timestamp),
      })
      .returning();
    return log;
  }

  async deleteActivityLog(id: string, userId: string): Promise<boolean> {
    await db
      .delete(activityLogs)
      .where(and(eq(activityLogs.id, id), eq(activityLogs.userId, userId)));
    return true;
  }

  // Care Team
  async getCareTeamByPatient(patientId: string): Promise<(CareTeamRelation & { provider: User })[]> {
    const relations = await db
      .select()
      .from(careTeam)
      .where(eq(careTeam.patientId, patientId));
    
    const result = [];
    for (const rel of relations) {
      const provider = await this.getUser(rel.providerId);
      if (provider) {
        result.push({ ...rel, provider });
      }
    }
    return result;
  }

  async getCareTeamByProvider(providerId: string): Promise<(CareTeamRelation & { patient: User })[]> {
    const relations = await db
      .select()
      .from(careTeam)
      .where(eq(careTeam.providerId, providerId));
    
    const result = [];
    for (const rel of relations) {
      const patient = await this.getUser(rel.patientId);
      if (patient) {
        result.push({ ...rel, patient });
      }
    }
    return result;
  }

  async addCareTeamMember(data: InsertCareTeam): Promise<CareTeamRelation> {
    const id = randomUUID();
    const [relation] = await db
      .insert(careTeam)
      .values({ ...data, id })
      .returning();
    return relation;
  }

  async removeCareTeamMember(id: string, patientId: string): Promise<boolean> {
    await db
      .delete(careTeam)
      .where(and(eq(careTeam.id, id), eq(careTeam.patientId, patientId)));
    return true;
  }

  async getCareTeamRelation(patientId: string, providerId: string): Promise<CareTeamRelation | undefined> {
    const [relation] = await db
      .select()
      .from(careTeam)
      .where(and(eq(careTeam.patientId, patientId), eq(careTeam.providerId, providerId)));
    return relation || undefined;
  }

  // Audit
  async createAuditLog(userId: string, action: string, details?: string): Promise<void> {
    const id = randomUUID();
    await db.insert(auditLogs).values({ id, userId, action, details });
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(100);
  }

  // Chat
  async getChatMessages(userId1: string, userId2: string): Promise<ChatMessage[]> {
    const { or } = await import("drizzle-orm");
    return db
      .select()
      .from(chatMessages)
      .where(
        or(
          and(eq(chatMessages.senderId, userId1), eq(chatMessages.receiverId, userId2)),
          and(eq(chatMessages.senderId, userId2), eq(chatMessages.receiverId, userId1))
        )
      )
      .orderBy(chatMessages.createdAt);
  }

  async sendChatMessage(data: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const [message] = await db
      .insert(chatMessages)
      .values({ ...data, id })
      .returning();
    return message;
  }

  async getConversations(userId: string): Promise<{ partnerId: string; partner: User; lastMessage: ChatMessage }[]> {
    const { or, sql } = await import("drizzle-orm");
    const messages = await db
      .select()
      .from(chatMessages)
      .where(or(eq(chatMessages.senderId, userId), eq(chatMessages.receiverId, userId)))
      .orderBy(desc(chatMessages.createdAt));
    
    const conversationMap = new Map<string, ChatMessage>();
    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, msg);
      }
    }

    const result = [];
    const entries = Array.from(conversationMap.entries());
    for (const [partnerId, lastMessage] of entries) {
      const partner = await this.getUser(partnerId);
      if (partner) {
        result.push({ partnerId, partner, lastMessage });
      }
    }
    return result;
  }

  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    await db
      .update(chatMessages)
      .set({ isRead: true })
      .where(and(eq(chatMessages.senderId, senderId), eq(chatMessages.receiverId, receiverId)));
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .where(and(eq(chatMessages.receiverId, userId), eq(chatMessages.isRead, false)));
    return Number(result[0]?.count || 0);
  }

  // Alert Settings
  async getAlertSettings(userId: string): Promise<AlertSettings | undefined> {
    const [settings] = await db.select().from(alertSettings).where(eq(alertSettings.userId, userId));
    return settings || undefined;
  }

  async upsertAlertSettings(userId: string, data: Partial<InsertAlertSettings>): Promise<AlertSettings> {
    const existing = await this.getAlertSettings(userId);
    if (existing) {
      const [updated] = await db
        .update(alertSettings)
        .set(data)
        .where(eq(alertSettings.userId, userId))
        .returning();
      return updated;
    }
    const id = randomUUID();
    const [created] = await db
      .insert(alertSettings)
      .values({ ...data, id, userId })
      .returning();
    return created;
  }

  // Family Contacts
  async getFamilyContacts(userId: string): Promise<FamilyContact[]> {
    return db.select().from(familyContacts).where(eq(familyContacts.userId, userId));
  }

  async addFamilyContact(userId: string, data: InsertFamilyContact): Promise<FamilyContact> {
    const id = randomUUID();
    const [contact] = await db
      .insert(familyContacts)
      .values({ ...data, id, userId })
      .returning();
    return contact;
  }

  async removeFamilyContact(id: string, userId: string): Promise<boolean> {
    await db.delete(familyContacts).where(and(eq(familyContacts.id, id), eq(familyContacts.userId, userId)));
    return true;
  }

  // Verification
  async createVerificationToken(userId: string, token: string): Promise<VerificationToken> {
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const [verificationToken] = await db
      .insert(verificationTokens)
      .values({ id, userId, token, expiresAt })
      .returning();
    return verificationToken;
  }

  async getVerificationToken(token: string): Promise<VerificationToken | undefined> {
    const [vt] = await db.select().from(verificationTokens).where(eq(verificationTokens.token, token));
    return vt || undefined;
  }

  async deleteVerificationToken(id: string): Promise<void> {
    await db.delete(verificationTokens).where(eq(verificationTokens.id, id));
  }

  async verifyUserEmail(userId: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  // Appointments
  async createAppointment(data: InsertAppointment): Promise<Appointment> {
    const id = randomUUID();
    const [appointment] = await db
      .insert(appointments)
      .values({ 
        ...data, 
        id,
        appointmentDate: new Date(data.appointmentDate),
      })
      .returning();
    return appointment;
  }

  async getAppointmentsByPhysician(physicianId: string): Promise<(Appointment & { patient: User })[]> {
    const results = await db
      .select()
      .from(appointments)
      .where(eq(appointments.physicianId, physicianId))
      .orderBy(desc(appointments.appointmentDate));
    
    const withPatients = await Promise.all(
      results.map(async (apt) => {
        const [patient] = await db.select().from(users).where(eq(users.id, apt.patientId));
        return { ...apt, patient };
      })
    );
    return withPatients;
  }

  async getAppointmentsByPatient(patientId: string): Promise<(Appointment & { physician: User })[]> {
    const results = await db
      .select()
      .from(appointments)
      .where(eq(appointments.patientId, patientId))
      .orderBy(desc(appointments.appointmentDate));
    
    const withPhysicians = await Promise.all(
      results.map(async (apt) => {
        const [physician] = await db.select().from(users).where(eq(users.id, apt.physicianId));
        return { ...apt, physician };
      })
    );
    return withPhysicians;
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment || undefined;
  }

  async updateAppointment(id: string, data: Partial<Appointment>): Promise<Appointment | undefined> {
    const [appointment] = await db
      .update(appointments)
      .set(data)
      .where(eq(appointments.id, id))
      .returning();
    return appointment || undefined;
  }

  async getUnseenAppointmentCount(patientId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(and(
        eq(appointments.patientId, patientId),
        eq(appointments.patientSeen, false),
        or(eq(appointments.status, "pending"), eq(appointments.status, "confirmed"))
      ));
    return Number(result[0]?.count || 0);
  }

  async markAppointmentSeen(id: string, patientId: string): Promise<void> {
    await db
      .update(appointments)
      .set({ patientSeen: true })
      .where(and(eq(appointments.id, id), eq(appointments.patientId, patientId)));
  }

  async getAppointmentsNeedingReminder(): Promise<(Appointment & { patient: User; physician: User })[]> {
    const now = new Date();
    const results = await db
      .select()
      .from(appointments)
      .where(and(
        eq(appointments.reminderSent, false),
        or(eq(appointments.status, "pending"), eq(appointments.status, "confirmed")),
        gte(appointments.appointmentDate, now)
      ));
    
    const withUsers = await Promise.all(
      results.filter(apt => {
        if (!apt.reminderDays) return false;
        const reminderDate = new Date(apt.appointmentDate);
        reminderDate.setDate(reminderDate.getDate() - apt.reminderDays);
        return now >= reminderDate;
      }).map(async (apt) => {
        const [patient] = await db.select().from(users).where(eq(users.id, apt.patientId));
        const [physician] = await db.select().from(users).where(eq(users.id, apt.physicianId));
        return { ...apt, patient, physician };
      })
    );
    return withUsers;
  }

  // Pending Care Team Requests
  async createPendingCareTeamRequest(data: { patientId: string; hospitalId: string; doctorDirectoryId: string }): Promise<CareTeamRelation> {
    const id = randomUUID();
    const [request] = await db
      .insert(careTeam)
      .values({
        id,
        patientId: data.patientId,
        providerId: "", // Will be set when physician accepts
        permissions: "all",
        status: "pending",
        hospitalId: data.hospitalId,
        doctorDirectoryId: data.doctorDirectoryId,
      })
      .returning();
    return request;
  }

  async getPendingCareTeamRequests(providerId: string): Promise<(CareTeamRelation & { patient: User })[]> {
    const results = await db
      .select()
      .from(careTeam)
      .where(and(
        eq(careTeam.providerId, providerId),
        eq(careTeam.status, "pending")
      ));
    
    const withPatients = await Promise.all(
      results.map(async (rel) => {
        const [patient] = await db.select().from(users).where(eq(users.id, rel.patientId));
        return { ...rel, patient };
      })
    );
    return withPatients;
  }

  async getPendingRequestsByDoctorDirectoryId(doctorDirectoryId: string): Promise<(CareTeamRelation & { patient: User })[]> {
    const results = await db
      .select()
      .from(careTeam)
      .where(and(
        eq(careTeam.doctorDirectoryId, doctorDirectoryId),
        eq(careTeam.status, "pending")
      ));
    
    const withPatients = await Promise.all(
      results.map(async (rel) => {
        const [patient] = await db.select().from(users).where(eq(users.id, rel.patientId));
        return { ...rel, patient };
      })
    );
    return withPatients;
  }

  async updateCareTeamRequestStatus(id: string, status: "approved" | "rejected", providerId?: string): Promise<CareTeamRelation | undefined> {
    const updateData: Partial<CareTeamRelation> = { status };
    if (providerId && status === "approved") {
      updateData.providerId = providerId;
    }
    const [updated] = await db
      .update(careTeam)
      .set(updateData)
      .where(eq(careTeam.id, id))
      .returning();
    return updated || undefined;
  }

  async getPendingRequestCount(providerId: string): Promise<number> {
    // First get by provider ID (direct requests)
    const byProvider = await db
      .select({ count: sql<number>`count(*)` })
      .from(careTeam)
      .where(and(
        eq(careTeam.providerId, providerId),
        eq(careTeam.status, "pending")
      ));
    return Number(byProvider[0]?.count || 0);
  }

  // Password Reset
  async createPasswordResetToken(userId: string, token: string): Promise<PasswordResetToken> {
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const [resetToken] = await db
      .insert(passwordResetTokens)
      .values({ id, userId, token, expiresAt })
      .returning();
    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        gte(passwordResetTokens.expiresAt, new Date())
      ));
    return resetToken;
  }

  async deletePasswordResetToken(id: string): Promise<void> {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, id));
  }

  async deletePasswordResetTokensByUser(userId: string): Promise<void> {
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  }
}

export const storage = new DatabaseStorage();
