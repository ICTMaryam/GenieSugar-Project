import type { Express } from "express";
import { type Server } from "http";
import session from "express-session";
import archiver from "archiver";
import { storage } from "./storage";
import { db } from "./db";
import { 
  insertUserSchema, 
  loginSchema, 
  insertGlucoseSchema,
  insertFoodLogSchema,
  insertActivityLogSchema,
  insertChatMessageSchema,
  insertAlertSettingsSchema,
  insertFamilyContactSchema,
  insertAppointmentSchema,
  careTeam,
  users,
  hospitalDirectory,
  doctorDirectory,
} from "@shared/schema";
import { eq, sql, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { createHash, randomBytes } from "crypto";
import { sendWelcomeEmail, sendVerificationEmail, sendGlucoseAlertEmail, sendFamilyAlertEmail, sendAppointmentBookedEmail, sendAppointmentReminderEmail, sendPasswordResetEmail } from "./email";

// Simple password hashing (in production use bcrypt)
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

// Check and send glucose alerts
async function checkAndSendGlucoseAlerts(user: any, glucoseValue: number, timestamp: Date) {
  const alertSettingsData = await storage.getAlertSettings(user.id);
  if (!alertSettingsData) return;
  
  const { highThreshold, lowThreshold, emailAlerts } = alertSettingsData;
  
  let alertType: 'high' | 'low' | null = null;
  if (glucoseValue >= (highThreshold || 180)) {
    alertType = 'high';
  } else if (glucoseValue <= (lowThreshold || 70)) {
    alertType = 'low';
  }
  
  if (!alertType) return;
  
  // Send email alert to user
  if (emailAlerts) {
    await sendGlucoseAlertEmail(user.email, user.fullName, glucoseValue, alertType, timestamp);
  }
  
  // Send alerts to family contacts
  const familyContactsList = await storage.getFamilyContacts(user.id);
  for (const contact of familyContactsList) {
    if (contact.email) {
      await sendFamilyAlertEmail(contact.email, contact.name, user.fullName, glucoseValue, alertType);
    }
  }
}

// Extend session with user data
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<void> {
  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "genie-sugar-secret-key-change-in-prod",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Auth middleware
  const requireAuth = async (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    req.user = user;
    next();
  };

  const requireRole = (...roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    };
  };

  // ==================== HOSPITAL & DOCTOR DIRECTORY ====================

  app.get("/api/hospitals", (req, res) => {
    res.json(hospitalDirectory);
  });

  app.get("/api/doctors", (req, res) => {
    const { hospitalId } = req.query;
    if (hospitalId) {
      const filteredDoctors = doctorDirectory.filter(d => d.hospitalId === hospitalId);
      return res.json(filteredDoctors);
    }
    res.json(doctorDirectory);
  });

  // ==================== AUTH ROUTES ====================

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { selectedHospitalId, selectedDoctorId, ...userData } = req.body;
      const data = insertUserSchema.parse(userData);
      
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const user = await storage.createUser({
        ...data,
        password: hashPassword(data.password),
      });

      await storage.createAuditLog(user.id, "USER_REGISTERED", `New ${user.role} registered`);

      // If patient selected a doctor, create a pending care team request
      if (user.role === "patient" && selectedDoctorId && selectedHospitalId) {
        // Find the physician user associated with this doctor directory entry
        // For now, we'll store the request with the doctor directory ID
        await storage.createPendingCareTeamRequest({
          patientId: user.id,
          hospitalId: selectedHospitalId,
          doctorDirectoryId: selectedDoctorId,
        });
      }

      // Send welcome email (non-blocking)
      sendWelcomeEmail(user.email, user.fullName, user.role).catch(err => {
        console.error("Failed to send welcome email:", err);
      });

      // Create verification token and send verification email
      const verificationToken = randomBytes(32).toString("hex");
      await storage.createVerificationToken(user.id, verificationToken);
      sendVerificationEmail(user.email, user.fullName, verificationToken).catch(err => {
        console.error("Failed to send verification email:", err);
      });

      // Remove password from response
      const { password, ...safeUser } = user;
      req.session.userId = user.id;
      
      res.json({ user: safeUser });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Register error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user || user.password !== hashPassword(data.password)) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      await storage.createAuditLog(user.id, "USER_LOGIN", `${user.role} logged in`);

      req.session.userId = user.id;
      const { password, ...safeUser } = user;
      
      res.json({ user: safeUser });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out" });
    });
  });

  // Forgot Password - Request reset
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      
      // Always respond with success to prevent email enumeration
      if (!user) {
        return res.json({ message: "If this email exists, a reset link has been sent" });
      }
      
      // Delete any existing reset tokens for this user
      await storage.deletePasswordResetTokensByUser(user.id);
      
      // Create new reset token
      const resetToken = randomBytes(32).toString("hex");
      await storage.createPasswordResetToken(user.id, resetToken);
      
      // Send password reset email
      await sendPasswordResetEmail(user.email, user.fullName, resetToken);
      
      await storage.createAuditLog(user.id, "PASSWORD_RESET_REQUESTED", "Password reset email sent");
      
      res.json({ message: "If this email exists, a reset link has been sent" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  // Forgot Password - Reset with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = z.object({
        token: z.string().min(1),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }).parse(req.body);
      
      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset link" });
      }
      
      // Update user password
      await storage.updateUser(resetToken.userId, {
        password: hashPassword(password),
      });
      
      // Delete used token
      await storage.deletePasswordResetToken(resetToken.id);
      
      // Get user for audit log
      const user = await storage.getUser(resetToken.userId);
      if (user) {
        await storage.createAuditLog(user.id, "PASSWORD_RESET_COMPLETED", "Password was reset via email link");
      }
      
      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Verify reset token is valid
  app.get("/api/auth/verify-reset-token/:token", async (req, res) => {
    try {
      const resetToken = await storage.getPasswordResetToken(req.params.token);
      
      if (!resetToken) {
        return res.status(400).json({ valid: false, message: "Invalid or expired reset link" });
      }
      
      res.json({ valid: true });
    } catch (error) {
      res.status(500).json({ valid: false, message: "Failed to verify token" });
    }
  });

  app.get("/api/auth/me", requireAuth, (req: any, res) => {
    const { password, ...safeUser } = req.user;
    res.json({ user: safeUser });
  });

  // ==================== USER ROUTES ====================

  app.patch("/api/users/profile", requireAuth, async (req: any, res) => {
    try {
      const { fullName, diabetesType, profileImage } = req.body;
      
      const updateData: Record<string, any> = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (diabetesType !== undefined) updateData.diabetesType = diabetesType;
      if (profileImage !== undefined) {
        if (profileImage && typeof profileImage === 'string') {
          if (profileImage.length > 2 * 1024 * 1024) {
            return res.status(400).json({ message: "Image too large (max 2MB)" });
          }
          if (!profileImage.startsWith('data:image/')) {
            return res.status(400).json({ message: "Invalid image format" });
          }
        }
        updateData.profileImage = profileImage;
      }
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }
      
      const updated = await storage.updateUser(req.user.id, updateData);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...safeUser } = updated;
      res.json({ user: safeUser });
    } catch (error) {
      res.status(500).json({ message: "Update failed" });
    }
  });

  app.delete("/api/users/profile-image", requireAuth, async (req: any, res) => {
    try {
      const updated = await storage.updateUser(req.user.id, { profileImage: null });
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...safeUser } = updated;
      res.json({ user: safeUser });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove image" });
    }
  });

  // ==================== GLUCOSE ROUTES ====================

  app.get("/api/glucose", requireAuth, async (req: any, res) => {
    try {
      const readings = await storage.getGlucoseReadings(req.user.id);
      res.json(readings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch readings" });
    }
  });

  app.post("/api/glucose", requireAuth, requireRole("patient"), async (req: any, res) => {
    try {
      const data = insertGlucoseSchema.parse(req.body);
      const reading = await storage.createGlucoseReading(req.user.id, data);
      await storage.createAuditLog(req.user.id, "GLUCOSE_LOGGED", `Value: ${data.value} mg/dL`);
      
      // Check for alerts (non-blocking)
      checkAndSendGlucoseAlerts(req.user, data.value, reading.timestamp || new Date()).catch(err => {
        console.error("Alert check failed:", err);
      });
      
      res.json(reading);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create reading" });
    }
  });

  app.delete("/api/glucose/:id", requireAuth, requireRole("patient"), async (req: any, res) => {
    try {
      await storage.deleteGlucoseReading(req.params.id, req.user.id);
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete" });
    }
  });

  // ==================== FOOD ROUTES ====================

  app.get("/api/food", requireAuth, async (req: any, res) => {
    try {
      const logs = await storage.getFoodLogs(req.user.id);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch food logs" });
    }
  });

  app.post("/api/food", requireAuth, requireRole("patient"), async (req: any, res) => {
    try {
      const data = insertFoodLogSchema.parse(req.body);
      const log = await storage.createFoodLog(req.user.id, data);
      await storage.createAuditLog(req.user.id, "FOOD_LOGGED", `${data.foodName} (${data.mealType})`);
      res.json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create food log" });
    }
  });

  app.delete("/api/food/:id", requireAuth, requireRole("patient"), async (req: any, res) => {
    try {
      await storage.deleteFoodLog(req.params.id, req.user.id);
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete" });
    }
  });

  // ==================== ACTIVITY ROUTES ====================

  app.get("/api/activity", requireAuth, async (req: any, res) => {
    try {
      const logs = await storage.getActivityLogs(req.user.id);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });

  app.post("/api/activity", requireAuth, requireRole("patient"), async (req: any, res) => {
    try {
      const data = insertActivityLogSchema.parse(req.body);
      const log = await storage.createActivityLog(req.user.id, data);
      await storage.createAuditLog(req.user.id, "ACTIVITY_LOGGED", `${data.activityType} for ${data.duration} min`);
      res.json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create activity log" });
    }
  });

  app.delete("/api/activity/:id", requireAuth, requireRole("patient"), async (req: any, res) => {
    try {
      await storage.deleteActivityLog(req.params.id, req.user.id);
      res.json({ message: "Deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete" });
    }
  });

  // ==================== CARE TEAM ROUTES ====================

  app.get("/api/care-team", requireAuth, requireRole("patient"), async (req: any, res) => {
    try {
      const team = await storage.getCareTeamByPatient(req.user.id);
      res.json(team);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch care team" });
    }
  });

  app.post("/api/care-team", requireAuth, requireRole("patient"), async (req: any, res) => {
    try {
      const { email, permissions } = req.body;
      
      const provider = await storage.getUserByEmail(email);
      if (!provider) {
        return res.status(404).json({ message: "Provider not found with that email" });
      }
      
      if (!["physician", "dietitian"].includes(provider.role)) {
        return res.status(400).json({ message: "User is not a healthcare provider" });
      }

      const existing = await storage.getCareTeamRelation(req.user.id, provider.id);
      if (existing) {
        return res.status(400).json({ message: "Provider already in care team" });
      }

      const relation = await storage.addCareTeamMember({
        patientId: req.user.id,
        providerId: provider.id,
        permissions,
      });

      await storage.createAuditLog(req.user.id, "CARE_TEAM_ADDED", `Added ${provider.fullName}`);

      res.json({ ...relation, provider });
    } catch (error) {
      res.status(500).json({ message: "Failed to add care team member" });
    }
  });

  app.delete("/api/care-team/:id", requireAuth, requireRole("patient"), async (req: any, res) => {
    try {
      await storage.removeCareTeamMember(req.params.id, req.user.id);
      res.json({ message: "Removed" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove" });
    }
  });

  // ==================== PENDING PATIENT REQUESTS ====================

  // Helper to find matching doctor directory entries for a physician
  function findMatchingDoctorIds(physician: { fullName: string; hospitalClinic?: string | null }): string[] {
    const normalizedName = physician.fullName?.toLowerCase().trim() || "";
    const normalizedHospital = physician.hospitalClinic?.toLowerCase().trim() || "";
    
    return doctorDirectory
      .filter(doc => {
        const docName = doc.name.toLowerCase().trim();
        const hospitalMatch = hospitalDirectory.find(h => h.id === doc.hospitalId);
        const docHospital = hospitalMatch?.name.toLowerCase().trim() || "";
        
        // Match by name (exact or contains) and optionally hospital
        const nameMatch = docName === normalizedName || 
                          docName.includes(normalizedName) || 
                          normalizedName.includes(docName);
        const hospitalMatches = !normalizedHospital || 
                                docHospital.includes(normalizedHospital) || 
                                normalizedHospital.includes(docHospital);
        
        return nameMatch && hospitalMatches;
      })
      .map(doc => doc.id);
  }

  // Get pending patient requests for physician (scoped by doctor directory ID matching)
  app.get("/api/care-team/pending-requests", requireAuth, requireRole("physician"), async (req: any, res) => {
    try {
      const matchingDoctorIds = findMatchingDoctorIds(req.user);
      
      // If no matching doctor IDs, return empty array
      if (matchingDoctorIds.length === 0) {
        return res.json([]);
      }
      
      // Get pending requests only for matching doctor directory entries
      const allPending = await db.select().from(careTeam).where(
        and(
          eq(careTeam.status, "pending"),
          inArray(careTeam.doctorDirectoryId, matchingDoctorIds)
        )
      );
      
      const withPatients = await Promise.all(
        allPending.map(async (rel) => {
          const [patient] = await db.select().from(users).where(eq(users.id, rel.patientId));
          const hospital = hospitalDirectory.find(h => h.id === rel.hospitalId);
          const doctor = doctorDirectory.find(d => d.id === rel.doctorDirectoryId);
          return { 
            ...rel, 
            patient,
            hospitalName: hospital?.name || "Unknown Hospital",
            doctorName: doctor?.name || "Unknown Doctor",
            doctorSpecialization: doctor?.specialization || "",
          };
        })
      );
      res.json(withPatients);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({ message: "Failed to fetch pending requests" });
    }
  });

  // Get pending request count for physicians (scoped)
  app.get("/api/care-team/pending-count", requireAuth, requireRole("physician"), async (req: any, res) => {
    try {
      const matchingDoctorIds = findMatchingDoctorIds(req.user);
      
      if (matchingDoctorIds.length === 0) {
        return res.json({ count: 0 });
      }
      
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(careTeam)
        .where(
          and(
            eq(careTeam.status, "pending"),
            inArray(careTeam.doctorDirectoryId, matchingDoctorIds)
          )
        );
      res.json({ count: Number(result[0]?.count || 0) });
    } catch (error) {
      res.status(500).json({ message: "Failed to get count" });
    }
  });

  // Accept a pending patient request (verify ownership)
  app.post("/api/care-team/requests/:id/accept", requireAuth, requireRole("physician"), async (req: any, res) => {
    try {
      const matchingDoctorIds = findMatchingDoctorIds(req.user);
      
      // Verify the request belongs to this physician
      const [request] = await db.select().from(careTeam).where(eq(careTeam.id, req.params.id));
      if (!request || !matchingDoctorIds.includes(request.doctorDirectoryId || "")) {
        return res.status(403).json({ message: "Not authorized to accept this request" });
      }
      
      const updated = await storage.updateCareTeamRequestStatus(req.params.id, "approved", req.user.id);
      if (!updated) {
        return res.status(404).json({ message: "Request not found" });
      }
      await storage.createAuditLog(req.user.id, "PATIENT_REQUEST_ACCEPTED", `Accepted patient request ${req.params.id}`);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to accept request" });
    }
  });

  // Reject a pending patient request (verify ownership)
  app.post("/api/care-team/requests/:id/reject", requireAuth, requireRole("physician"), async (req: any, res) => {
    try {
      const matchingDoctorIds = findMatchingDoctorIds(req.user);
      
      // Verify the request belongs to this physician
      const [request] = await db.select().from(careTeam).where(eq(careTeam.id, req.params.id));
      if (!request || !matchingDoctorIds.includes(request.doctorDirectoryId || "")) {
        return res.status(403).json({ message: "Not authorized to reject this request" });
      }
      
      const updated = await storage.updateCareTeamRequestStatus(req.params.id, "rejected");
      if (!updated) {
        return res.status(404).json({ message: "Request not found" });
      }
      await storage.createAuditLog(req.user.id, "PATIENT_REQUEST_REJECTED", `Rejected patient request ${req.params.id}`);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to reject request" });
    }
  });

  // ==================== PROVIDER ROUTES ====================

  app.get("/api/provider/patients", requireAuth, requireRole("physician", "dietitian"), async (req: any, res) => {
    try {
      const relations = await storage.getCareTeamByProvider(req.user.id);
      
      const patients = await Promise.all(relations.map(async (rel) => {
        const readings = await storage.getGlucoseReadings(rel.patientId);
        const foodLogs = rel.permissions === "all" ? await storage.getFoodLogs(rel.patientId) : [];
        
        return {
          id: rel.patient.id,
          fullName: rel.patient.fullName,
          email: rel.patient.email,
          permissions: rel.permissions,
          lastReading: readings[0] ? { value: readings[0].value, timestamp: readings[0].timestamp } : undefined,
          recentFoodLog: foodLogs[0] ? { 
            foodName: foodLogs[0].foodName, 
            mealType: foodLogs[0].mealType,
            timestamp: foodLogs[0].timestamp,
          } : undefined,
        };
      }));

      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get("/api/provider/patient/:id", requireAuth, requireRole("physician", "dietitian"), async (req: any, res) => {
    try {
      const relations = await storage.getCareTeamByProvider(req.user.id);
      const relation = relations.find(r => r.patientId === req.params.id);
      
      if (!relation) {
        return res.status(403).json({ message: "No access to this patient" });
      }

      const patient = relation.patient;
      const glucoseReadings = await storage.getGlucoseReadings(patient.id);
      const foodLogs = relation.permissions === "all" ? await storage.getFoodLogs(patient.id) : [];
      const activityLogs = relation.permissions === "all" ? await storage.getActivityLogs(patient.id) : [];

      res.json({
        patient: {
          id: patient.id,
          fullName: patient.fullName,
          email: patient.email,
          diabetesType: patient.diabetesType,
        },
        permissions: relation.permissions,
        glucoseReadings,
        foodLogs,
        activityLogs,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient data" });
    }
  });

  // ==================== ADMIN ROUTES ====================

  app.get("/api/admin/users", requireAuth, requireRole("admin"), async (req: any, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      res.json(allUsers.map(u => ({ ...u, password: undefined })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id/lock", requireAuth, requireRole("admin"), async (req: any, res) => {
    try {
      const { lock } = req.body;
      const user = await storage.lockUser(req.params.id, lock);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.createAuditLog(req.user.id, lock ? "USER_LOCKED" : "USER_UNLOCKED", `User ${user.email}`);
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.get("/api/admin/audit-logs", requireAuth, requireRole("admin"), async (req: any, res) => {
    try {
      const logs = await storage.getAuditLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // ==================== CHAT ROUTES ====================

  app.get("/api/chat/conversations", requireAuth, async (req: any, res) => {
    try {
      const conversations = await storage.getConversations(req.user.id);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get("/api/chat/unread-count", requireAuth, async (req: any, res) => {
    try {
      const count = await storage.getUnreadMessageCount(req.user.id);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.get("/api/chat/:partnerId", requireAuth, async (req: any, res) => {
    try {
      const messages = await storage.getChatMessages(req.user.id, req.params.partnerId);
      await storage.markMessagesAsRead(req.params.partnerId, req.user.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/chat/:receiverId", requireAuth, async (req: any, res) => {
    try {
      const { content } = req.body;
      if (!content || typeof content !== "string") {
        return res.status(400).json({ message: "Message content is required" });
      }
      const message = await storage.sendChatMessage({
        senderId: req.user.id,
        receiverId: req.params.receiverId,
        content,
      });
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // ==================== ALERT SETTINGS ROUTES ====================

  app.get("/api/alerts/settings", requireAuth, async (req: any, res) => {
    try {
      let settings = await storage.getAlertSettings(req.user.id);
      if (!settings) {
        settings = await storage.upsertAlertSettings(req.user.id, {
          highThreshold: 180,
          lowThreshold: 70,
          emailAlerts: true,
          smsAlerts: false,
        });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch alert settings" });
    }
  });

  app.put("/api/alerts/settings", requireAuth, async (req: any, res) => {
    try {
      const data = insertAlertSettingsSchema.omit({ userId: true }).partial().parse(req.body);
      const settings = await storage.upsertAlertSettings(req.user.id, data);
      await storage.createAuditLog(req.user.id, "ALERT_SETTINGS_UPDATED", "Alert settings updated");
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to update alert settings" });
    }
  });

  // ==================== FAMILY CONTACTS ROUTES ====================

  app.get("/api/family-contacts", requireAuth, async (req: any, res) => {
    try {
      const contacts = await storage.getFamilyContacts(req.user.id);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch family contacts" });
    }
  });

  app.post("/api/family-contacts", requireAuth, async (req: any, res) => {
    try {
      const data = insertFamilyContactSchema.parse(req.body);
      const contact = await storage.addFamilyContact(req.user.id, data);
      await storage.createAuditLog(req.user.id, "FAMILY_CONTACT_ADDED", `Added ${contact.name}`);
      res.json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to add family contact" });
    }
  });

  app.delete("/api/family-contacts/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.removeFamilyContact(req.params.id, req.user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove family contact" });
    }
  });

  // ==================== EMAIL VERIFICATION ====================

  app.get("/api/verify-email/:token", async (req, res) => {
    try {
      const verificationToken = await storage.getVerificationToken(req.params.token);
      if (!verificationToken) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      if (new Date() > verificationToken.expiresAt) {
        await storage.deleteVerificationToken(verificationToken.id);
        return res.status(400).json({ message: "Token expired" });
      }
      await storage.verifyUserEmail(verificationToken.userId);
      await storage.deleteVerificationToken(verificationToken.id);
      res.json({ message: "Email verified successfully" });
    } catch (error) {
      res.status(500).json({ message: "Verification failed" });
    }
  });

  // ==================== APPOINTMENT ROUTES ====================

  // Get physician's appointments
  app.get("/api/appointments/physician", requireAuth, requireRole("physician"), async (req: any, res) => {
    try {
      const appointments = await storage.getAppointmentsByPhysician(req.user.id);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  // Get patient's appointments
  app.get("/api/appointments/patient", requireAuth, requireRole("patient"), async (req: any, res) => {
    try {
      const appointments = await storage.getAppointmentsByPatient(req.user.id);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  // Get unseen appointment count for patient
  app.get("/api/appointments/unseen-count", requireAuth, async (req: any, res) => {
    try {
      if (req.user.role !== "patient") {
        return res.json({ count: 0 });
      }
      const count = await storage.getUnseenAppointmentCount(req.user.id);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unseen count" });
    }
  });

  // Create appointment (physician only)
  app.post("/api/appointments", requireAuth, requireRole("physician"), async (req: any, res) => {
    try {
      const data = insertAppointmentSchema.parse({
        ...req.body,
        physicianId: req.user.id,
      });
      
      // Verify patient is in physician's care team
      const careRelation = await storage.getCareTeamRelation(data.patientId, req.user.id);
      if (!careRelation) {
        return res.status(403).json({ message: "Patient is not in your care team" });
      }
      
      const appointment = await storage.createAppointment(data);
      
      // Get patient info and send email notification
      const patient = await storage.getUser(data.patientId);
      if (patient) {
        sendAppointmentBookedEmail(
          patient.email,
          patient.fullName,
          req.user.fullName,
          new Date(data.appointmentDate),
          data.duration || 30,
          data.notes || undefined,
          data.requirements || undefined
        ).catch(err => console.error("Failed to send appointment email:", err));
      }
      
      await storage.createAuditLog(req.user.id, "APPOINTMENT_CREATED", `Appointment with patient ${data.patientId}`);
      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Create appointment error:", error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  // Update appointment status
  app.patch("/api/appointments/:id", requireAuth, async (req: any, res) => {
    try {
      const appointment = await storage.getAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      // Only the physician who created or the patient can update
      if (appointment.physicianId !== req.user.id && appointment.patientId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updateData: any = {};
      if (req.body.status) updateData.status = req.body.status;
      if (req.body.notes !== undefined) updateData.notes = req.body.notes;
      if (req.body.requirements !== undefined) updateData.requirements = req.body.requirements;
      
      const updated = await storage.updateAppointment(req.params.id, updateData);
      await storage.createAuditLog(req.user.id, "APPOINTMENT_UPDATED", `Appointment ${req.params.id} updated`);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  // Mark appointment as seen by patient
  app.post("/api/appointments/:id/seen", requireAuth, requireRole("patient"), async (req: any, res) => {
    try {
      await storage.markAppointmentSeen(req.params.id, req.user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark appointment as seen" });
    }
  });

  // Background job for sending appointment reminders (called periodically)
  app.post("/api/appointments/send-reminders", async (req, res) => {
    try {
      const appointmentsNeedingReminder = await storage.getAppointmentsNeedingReminder();
      
      for (const apt of appointmentsNeedingReminder) {
        const now = new Date();
        const daysUntil = Math.ceil((apt.appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        await sendAppointmentReminderEmail(
          apt.patient.email,
          apt.patient.fullName,
          apt.physician.fullName,
          apt.appointmentDate,
          daysUntil,
          apt.requirements || undefined
        );
        
        await storage.updateAppointment(apt.id, { reminderSent: true });
      }
      
      res.json({ sent: appointmentsNeedingReminder.length });
    } catch (error) {
      console.error("Reminder job error:", error);
      res.status(500).json({ message: "Failed to send reminders" });
    }
  });

  // ==================== DEXCOM SENSOR INTEGRATION ====================
  
  const DEXCOM_CLIENT_ID = process.env.DEXCOM_CLIENT_ID;
  const DEXCOM_CLIENT_SECRET = process.env.DEXCOM_CLIENT_SECRET;
  const DEXCOM_SANDBOX_API = "https://sandbox-api.dexcom.com";
  const DEXCOM_AUTH_URL = "https://sandbox-api.dexcom.com/v2/oauth2/login";
  const DEXCOM_TOKEN_URL = "https://sandbox-api.dexcom.com/v2/oauth2/token";

  // Store Dexcom tokens temporarily (in production, store in database)
  const dexcomTokens: Map<string, { accessToken: string; refreshToken: string; expiresAt: Date }> = new Map();

  // Initiate Dexcom OAuth flow
  app.get("/api/dexcom/auth", requireAuth, requireRole("patient"), async (req: any, res) => {
    try {
      if (!DEXCOM_CLIENT_ID) {
        return res.status(500).json({ message: "Dexcom integration not configured" });
      }

      const redirectUri = `${req.protocol}://${req.get('host')}/api/dexcom/callback`;
      const state = req.user.id; // Use user ID as state for security
      
      const authUrl = `${DEXCOM_AUTH_URL}?client_id=${DEXCOM_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=offline_access&state=${state}`;
      
      res.json({ authUrl });
    } catch (error) {
      console.error("Dexcom auth error:", error);
      res.status(500).json({ message: "Failed to initiate Dexcom authorization" });
    }
  });

  // Dexcom OAuth callback
  app.get("/api/dexcom/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code || !state || !DEXCOM_CLIENT_ID || !DEXCOM_CLIENT_SECRET) {
        return res.redirect("/?dexcom=error&message=missing_params");
      }

      const redirectUri = `${req.protocol}://${req.get('host')}/api/dexcom/callback`;
      
      // Exchange code for tokens
      const tokenResponse = await fetch(DEXCOM_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: DEXCOM_CLIENT_ID,
          client_secret: DEXCOM_CLIENT_SECRET,
          code: code as string,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error("Dexcom token error:", error);
        return res.redirect("/?dexcom=error&message=token_exchange_failed");
      }

      const tokens = await tokenResponse.json();
      
      // Store tokens for user
      const userId = state as string;
      dexcomTokens.set(userId, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      });

      await storage.createAuditLog(userId, "DEXCOM_CONNECTED", "Patient connected Dexcom sensor");
      
      res.redirect("/glucose?dexcom=connected");
    } catch (error) {
      console.error("Dexcom callback error:", error);
      res.redirect("/?dexcom=error&message=callback_failed");
    }
  });

  // Check Dexcom connection status
  app.get("/api/dexcom/status", requireAuth, requireRole("patient"), async (req: any, res) => {
    const tokens = dexcomTokens.get(req.user.id);
    const connected = tokens && tokens.expiresAt > new Date();
    res.json({ connected });
  });

  // Fetch glucose readings from Dexcom
  app.get("/api/dexcom/readings", requireAuth, requireRole("patient"), async (req: any, res) => {
    try {
      const tokens = dexcomTokens.get(req.user.id);
      
      if (!tokens || tokens.expiresAt < new Date()) {
        return res.status(401).json({ message: "Dexcom not connected or token expired" });
      }

      // Get readings from the last 24 hours
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      
      const response = await fetch(
        `${DEXCOM_SANDBOX_API}/v2/users/self/egvs?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("Dexcom readings error:", error);
        return res.status(500).json({ message: "Failed to fetch readings from Dexcom" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Dexcom readings error:", error);
      res.status(500).json({ message: "Failed to fetch Dexcom readings" });
    }
  });

  // Sync Dexcom readings to local database
  app.post("/api/dexcom/sync", requireAuth, requireRole("patient"), async (req: any, res) => {
    try {
      const tokens = dexcomTokens.get(req.user.id);
      
      if (!tokens || tokens.expiresAt < new Date()) {
        return res.status(401).json({ message: "Dexcom not connected or token expired" });
      }

      // Get readings from the last 24 hours
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
      
      const response = await fetch(
        `${DEXCOM_SANDBOX_API}/v2/users/self/egvs?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        return res.status(500).json({ message: "Failed to fetch readings from Dexcom" });
      }

      const data = await response.json();
      let syncedCount = 0;

      // Import readings into our database
      if (data.egvs && Array.isArray(data.egvs)) {
        for (const reading of data.egvs) {
          try {
            await storage.createGlucoseReading(req.user.id, {
              value: reading.value,
              timestamp: new Date(reading.systemTime).toISOString(),
              note: "Synced from Dexcom sensor",
            });
            syncedCount++;
          } catch (err) {
            // Skip duplicate readings
          }
        }
      }

      await storage.createAuditLog(req.user.id, "DEXCOM_SYNC", `Synced ${syncedCount} readings from Dexcom`);
      
      res.json({ synced: syncedCount });
    } catch (error) {
      console.error("Dexcom sync error:", error);
      res.status(500).json({ message: "Failed to sync Dexcom readings" });
    }
  });

  // Disconnect Dexcom
  app.post("/api/dexcom/disconnect", requireAuth, requireRole("patient"), async (req: any, res) => {
    dexcomTokens.delete(req.user.id);
    await storage.createAuditLog(req.user.id, "DEXCOM_DISCONNECTED", "Patient disconnected Dexcom sensor");
    res.json({ success: true });
  });

  // Download project code as zip (generates dynamically)
  app.get("/download-code", (req, res) => {
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=geniesugar-code.zip");

    const archive = archiver("zip", { zlib: { level: 9 } });
    
    archive.on("error", (err) => {
      res.status(500).send("Error creating zip file");
    });

    archive.pipe(res);

    // Add project directories
    archive.directory("client/", "client");
    archive.directory("server/", "server");
    archive.directory("shared/", "shared");
    archive.directory("GenieSugar-Web/", "GenieSugar-Web");
    
    // Add config files
    archive.file("package.json", { name: "package.json" });
    archive.file("package-lock.json", { name: "package-lock.json" });
    archive.file("tsconfig.json", { name: "tsconfig.json" });
    archive.file("vite.config.ts", { name: "vite.config.ts" });
    archive.file("tailwind.config.ts", { name: "tailwind.config.ts" });
    archive.file("drizzle.config.ts", { name: "drizzle.config.ts" });
    archive.file("postcss.config.js", { name: "postcss.config.js" });
    archive.file("components.json", { name: "components.json" });
    archive.file("replit.md", { name: "replit.md" });

    archive.finalize();
  });
}
