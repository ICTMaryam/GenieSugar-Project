import { db } from "./db";
import { users, glucoseReadings, foodLogs, activityLogs, careTeam } from "@shared/schema";
import crypto from "crypto";

function generateId(): string {
  return crypto.randomUUID();
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const defaultPassword = hashPassword("password123");

async function seedDatabase() {
  console.log("Starting database seeding...");

  // Doctors from CSV
  const doctors = [
    { id: "D001", fullName: "Dr. Ahmed Al-Noor", email: "ahmed.alnoor@geniesugar.com", licenseNumber: "BH-MD-12345", specialization: "Endocrinology", hospitalClinic: "Salmaniya Medical Complex", isVerified: true },
    { id: "D002", fullName: "Dr. Fatima Al-Haddad", email: "fatima.haddad@geniesugar.com", licenseNumber: "BH-MD-23456", specialization: "Internal Medicine", hospitalClinic: "Salmaniya Medical Complex", isVerified: true },
    { id: "D003", fullName: "Dr. Khalid Al-Mahroos", email: "khalid.mahroos@geniesugar.com", licenseNumber: "BH-MD-34567", specialization: "Family Medicine", hospitalClinic: "Salmaniya Medical Complex", isVerified: true },
    { id: "D004", fullName: "Dr. Mariam Al-Zayani", email: "mariam.zayani@geniesugar.com", licenseNumber: "BH-MD-45678", specialization: "Nutrition & Metabolism", hospitalClinic: "Salmaniya Medical Complex", isVerified: false },
    { id: "D005", fullName: "Dr. Yousif Al-Ansari", email: "yousif.ansari@geniesugar.com", licenseNumber: "BH-MD-56789", specialization: "Endocrinology", hospitalClinic: "Salmaniya Medical Complex", isVerified: true },
  ];

  // Patients from CSV
  const patients = [
    { id: "P006", fullName: "Hussain Ali", email: "hussain.ali@example.com", phone: "+973-3611-1001", diabetesType: "Type 1" },
    { id: "P007", fullName: "Noora Salman", email: "noora.salman@example.com", phone: "+973-3611-1002", diabetesType: "Type 2" },
    { id: "P008", fullName: "Abdulrahman Yusuf", email: "abdulrahman.yusuf@example.com", phone: "+973-3611-1003", diabetesType: "Type 1" },
    { id: "P009", fullName: "Maryam Jasim", email: "maryam.jasim@example.com", phone: "+973-3611-1004", diabetesType: "Type 2" },
    { id: "P010", fullName: "Saeed Ahmed", email: "saeed.ahmed@example.com", phone: "+973-3611-1005", diabetesType: "Type 2" },
    { id: "P011", fullName: "Zahra Hasan", email: "zahra.hasan@example.com", phone: "+973-3611-1006", diabetesType: "Type 1" },
    { id: "P012", fullName: "Omar Khalil", email: "omar.khalil@example.com", phone: "+973-3611-1007", diabetesType: "Type 2" },
    { id: "P013", fullName: "Lulwa Fawzi", email: "lulwa.fawzi@example.com", phone: "+973-3611-1008", diabetesType: "Type 1" },
    { id: "P014", fullName: "Mahdi Ibrahim", email: "mahdi.ibrahim@example.com", phone: "+973-3611-1009", diabetesType: "Type 2" },
    { id: "P015", fullName: "Reem Abdulaziz", email: "reem.abdulaziz@example.com", phone: "+973-3611-1010", diabetesType: "Type 2" },
  ];

  // Dietitians from CSV
  const dietitians = [
    { id: "DT001", fullName: "Sara Al-Khalifa", email: "sara.khalifa@example.com", phone: "+973-3622-2001", licenseNumber: "BH-DT-10021", specialization: "Diabetes Nutrition", hospitalClinic: "Salmaniya Medical Complex", isVerified: true },
    { id: "DT002", fullName: "Huda Al-Sayed", email: "huda.sayed@example.com", phone: "+973-3622-2002", licenseNumber: "BH-DT-10022", specialization: "Clinical Nutrition", hospitalClinic: "Salmaniya Medical Complex", isVerified: true },
    { id: "DT003", fullName: "Amina Yusuf", email: "amina.yusuf@example.com", phone: "+973-3622-2003", licenseNumber: "BH-DT-10023", specialization: "Weight & Glucose Management", hospitalClinic: "Salmaniya Medical Complex", isVerified: false },
    { id: "DT004", fullName: "Noor Abdulrahman", email: "noor.abdulrahman@example.com", phone: "+973-3622-2004", licenseNumber: "BH-DT-10024", specialization: "Endocrine Nutrition", hospitalClinic: "Salmaniya Medical Complex", isVerified: true },
    { id: "DT005", fullName: "Lina Hasan", email: "lina.hasan@example.com", phone: "+973-3622-2005", licenseNumber: "BH-DT-10025", specialization: "Diabetes & Lifestyle Care", hospitalClinic: "Salmaniya Medical Complex", isVerified: true },
  ];

  // Sample glucose readings from diabetes CSV (selecting valid values between 20-600)
  const glucoseValues = [
    148, 85, 183, 89, 137, 116, 78, 115, 197, 125, 110, 168, 139, 189, 166, 100, 118, 107, 103, 115,
    126, 99, 196, 119, 143, 125, 147, 97, 145, 117, 109, 158, 88, 92, 122, 103, 138, 102, 90, 111,
    180, 133, 106, 171, 159, 180, 146, 71, 103, 105, 103, 101, 88, 176, 150, 73, 187, 100, 146, 105,
    84, 133, 44, 141, 114, 99, 109, 109, 95, 146, 100, 139, 126, 129, 79, 48, 62, 95, 131, 112, 113,
    74, 83, 101, 137, 110, 106, 100, 136, 107, 80, 123, 81, 134, 142, 144, 92, 71, 93, 122
  ].filter(v => v >= 20 && v <= 600);

  // Insert doctors
  console.log("Inserting doctors...");
  for (const doctor of doctors) {
    try {
      await db.insert(users).values({
        id: doctor.id,
        email: doctor.email,
        password: defaultPassword,
        fullName: doctor.fullName,
        role: "physician",
        licenseNumber: doctor.licenseNumber,
        specialization: doctor.specialization,
        hospitalClinic: doctor.hospitalClinic,
        isVerified: doctor.isVerified,
        emailVerified: true,
      }).onConflictDoNothing();
      console.log(`  Created doctor: ${doctor.fullName}`);
    } catch (error: any) {
      if (error.code !== '23505') {
        console.error(`  Error creating doctor ${doctor.fullName}:`, error.message);
      }
    }
  }

  // Insert patients
  console.log("Inserting patients...");
  for (const patient of patients) {
    try {
      await db.insert(users).values({
        id: patient.id,
        email: patient.email,
        password: defaultPassword,
        fullName: patient.fullName,
        role: "patient",
        diabetesType: patient.diabetesType,
        phone: patient.phone,
        emailVerified: true,
      }).onConflictDoNothing();
      console.log(`  Created patient: ${patient.fullName}`);
    } catch (error: any) {
      if (error.code !== '23505') {
        console.error(`  Error creating patient ${patient.fullName}:`, error.message);
      }
    }
  }

  // Insert dietitians
  console.log("Inserting dietitians...");
  for (const dietitian of dietitians) {
    try {
      await db.insert(users).values({
        id: dietitian.id,
        email: dietitian.email,
        password: defaultPassword,
        fullName: dietitian.fullName,
        role: "dietitian",
        phone: dietitian.phone,
        licenseNumber: dietitian.licenseNumber,
        specialization: dietitian.specialization,
        hospitalClinic: dietitian.hospitalClinic,
        isVerified: dietitian.isVerified,
        emailVerified: true,
      }).onConflictDoNothing();
      console.log(`  Created dietitian: ${dietitian.fullName}`);
    } catch (error: any) {
      if (error.code !== '23505') {
        console.error(`  Error creating dietitian ${dietitian.fullName}:`, error.message);
      }
    }
  }

  // Insert glucose readings for each patient
  console.log("Inserting glucose readings...");
  const now = new Date();
  for (const patient of patients) {
    const readingsCount = Math.floor(Math.random() * 20) + 10; // 10-30 readings per patient
    for (let i = 0; i < readingsCount; i++) {
      const value = glucoseValues[Math.floor(Math.random() * glucoseValues.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const timestamp = new Date(now.getTime() - (daysAgo * 24 + hoursAgo) * 60 * 60 * 1000);
      
      const notes = ["Before breakfast", "After lunch", "Before dinner", "Bedtime", "Fasting", "Post-exercise", ""];
      const note = notes[Math.floor(Math.random() * notes.length)];
      
      try {
        await db.insert(glucoseReadings).values({
          id: generateId(),
          userId: patient.id,
          value: value,
          timestamp: timestamp,
          note: note || null,
        });
      } catch (error: any) {
        console.error(`  Error inserting glucose reading:`, error.message);
      }
    }
    console.log(`  Created glucose readings for: ${patient.fullName}`);
  }

  // Insert food logs for patients
  console.log("Inserting food logs...");
  const mealTypes = ["breakfast", "lunch", "dinner", "snack"] as const;
  const foods = {
    breakfast: ["Oatmeal with berries", "Eggs with toast", "Greek yogurt with nuts", "Whole grain cereal", "Smoothie bowl"],
    lunch: ["Grilled chicken salad", "Quinoa bowl", "Turkey sandwich", "Vegetable soup", "Rice with fish"],
    dinner: ["Baked salmon with vegetables", "Grilled steak with salad", "Chicken stir-fry", "Pasta with marinara", "Lentil curry with rice"],
    snack: ["Apple slices", "Mixed nuts", "Carrot sticks with hummus", "Cheese and crackers", "Protein bar"],
  };

  for (const patient of patients) {
    const logsCount = Math.floor(Math.random() * 15) + 5; // 5-20 food logs per patient
    for (let i = 0; i < logsCount; i++) {
      const mealType = mealTypes[Math.floor(Math.random() * mealTypes.length)];
      const mealFoods = foods[mealType];
      const foodName = mealFoods[Math.floor(Math.random() * mealFoods.length)];
      const daysAgo = Math.floor(Math.random() * 14);
      const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      try {
        await db.insert(foodLogs).values({
          id: generateId(),
          userId: patient.id,
          mealType: mealType,
          foodName: foodName,
          portion: ["Small", "Medium", "Large"][Math.floor(Math.random() * 3)],
          notes: "",
          timestamp: timestamp,
        });
      } catch (error: any) {
        console.error(`  Error inserting food log:`, error.message);
      }
    }
    console.log(`  Created food logs for: ${patient.fullName}`);
  }

  // Insert activity logs for patients
  console.log("Inserting activity logs...");
  const activities = ["Walking", "Running", "Cycling", "Swimming", "Yoga", "Gym workout", "Dancing", "Hiking"];
  const intensities = ["low", "moderate", "high"] as const;

  for (const patient of patients) {
    const logsCount = Math.floor(Math.random() * 10) + 3; // 3-13 activity logs per patient
    for (let i = 0; i < logsCount; i++) {
      const activityType = activities[Math.floor(Math.random() * activities.length)];
      const intensity = intensities[Math.floor(Math.random() * intensities.length)];
      const duration = (Math.floor(Math.random() * 6) + 1) * 15; // 15-90 minutes
      const daysAgo = Math.floor(Math.random() * 14);
      const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      try {
        await db.insert(activityLogs).values({
          id: generateId(),
          userId: patient.id,
          activityType: activityType,
          duration: duration,
          intensity: intensity,
          timestamp: timestamp,
          notes: "",
        });
      } catch (error: any) {
        console.error(`  Error inserting activity log:`, error.message);
      }
    }
    console.log(`  Created activity logs for: ${patient.fullName}`);
  }

  // Create care team relationships (connect some patients with doctors and dietitians)
  console.log("Creating care team relationships...");
  const careRelationships = [
    { patientId: "P006", providerId: "D001", permissions: "all" },
    { patientId: "P006", providerId: "DT001", permissions: "all" },
    { patientId: "P007", providerId: "D001", permissions: "glucose" },
    { patientId: "P007", providerId: "DT002", permissions: "all" },
    { patientId: "P008", providerId: "D002", permissions: "all" },
    { patientId: "P008", providerId: "DT001", permissions: "glucose" },
    { patientId: "P009", providerId: "D003", permissions: "all" },
    { patientId: "P010", providerId: "D002", permissions: "all" },
    { patientId: "P010", providerId: "DT003", permissions: "all" },
    { patientId: "P011", providerId: "D005", permissions: "glucose" },
    { patientId: "P012", providerId: "D001", permissions: "all" },
    { patientId: "P012", providerId: "DT004", permissions: "all" },
    { patientId: "P013", providerId: "D003", permissions: "all" },
    { patientId: "P014", providerId: "D002", permissions: "glucose" },
    { patientId: "P015", providerId: "D005", permissions: "all" },
    { patientId: "P015", providerId: "DT005", permissions: "all" },
  ];

  for (const rel of careRelationships) {
    try {
      await db.insert(careTeam).values({
        id: generateId(),
        patientId: rel.patientId,
        providerId: rel.providerId,
        permissions: rel.permissions as "glucose" | "all",
      }).onConflictDoNothing();
      console.log(`  Connected patient ${rel.patientId} with provider ${rel.providerId}`);
    } catch (error: any) {
      if (error.code !== '23505') {
        console.error(`  Error creating care team relationship:`, error.message);
      }
    }
  }

  // Create an admin user
  console.log("Creating admin user...");
  try {
    await db.insert(users).values({
      id: "ADMIN001",
      email: "admin@geniesugar.com",
      password: defaultPassword,
      fullName: "System Administrator",
      role: "admin",
      emailVerified: true,
    }).onConflictDoNothing();
    console.log("  Created admin user");
  } catch (error: any) {
    if (error.code !== '23505') {
      console.error("  Error creating admin:", error.message);
    }
  }

  console.log("\nDatabase seeding completed!");
  console.log("\nTest accounts (password for all: password123):");
  console.log("  Admin: admin@geniesugar.com");
  console.log("  Doctor: ahmed.alnoor@geniesugar.com");
  console.log("  Dietitian: sara.khalifa@example.com");
  console.log("  Patient: hussain.ali@example.com");
}

seedDatabase()
  .then(() => {
    console.log("Seed script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed script failed:", error);
    process.exit(1);
  });
