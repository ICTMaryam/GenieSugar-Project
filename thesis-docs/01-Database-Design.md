# GenieSugar Database Design Documentation
## Student ID: 202200033

---

# 1. DATABASE DESIGN

## 1.1 Enhanced Entity-Relationship Diagram (EERD)

### Database Schema Overview

The GenieSugar database follows **Third Normal Form (3NF)** normalization to ensure data integrity, eliminate redundancy, and maintain referential consistency.

### Entity Categories

#### Core Entities (Patient Data)
- **users** - Central entity storing all user accounts
- **glucose_readings** - Blood glucose measurements
- **food_logs** - Food intake records with nutritional data
- **activity_logs** - Physical activity records

#### Collaboration Entities
- **care_team** - Provider-patient relationships
- **provider_notes** - Clinical notes from providers
- **chat_messages** - Messaging between users

#### Operations Entities
- **appointments** - Scheduled appointments
- **audit_logs** - System activity tracking

#### Support Entities
- **alert_settings** - User notification preferences
- **family_contacts** - Emergency contact information
- **verification_tokens** - Email verification

#### Reference Data (Static)
- **hospital_directory** - Bahrain hospitals list
- **doctor_directory** - Diabetes specialists

---

## 1.2 EERD Diagram (Text Representation)

```
+------------------+          +-------------------+
|     USERS        |          | HOSPITAL_DIRECTORY|
+------------------+          +-------------------+
| PK: id (UUID)    |          | PK: id (VARCHAR)  |
| email            |          | name              |
| password_hash    |          | city              |
| full_name        |          +-------------------+
| role (ENUM)      |                   |
| diabetes_type    |                   |
| phone            |          +-------------------+
| date_of_birth    |          | DOCTOR_DIRECTORY  |
| language_pref    |          +-------------------+
| created_at       |          | PK: id (VARCHAR)  |
| email_verified   |          | name              |
+--------+---------+          | FK: hospital_id   |
         |                    | specialization    |
         |                    +-------------------+
    +----+----+----+----+
    |    |    |    |    |
    v    v    v    v    v

+------------------+    +------------------+    +------------------+
| GLUCOSE_READINGS |    |    FOOD_LOGS     |    |  ACTIVITY_LOGS   |
+------------------+    +------------------+    +------------------+
| PK: id (UUID)    |    | PK: id (UUID)    |    | PK: id (UUID)    |
| FK: user_id      |    | FK: user_id      |    | FK: user_id      |
| value (INT)      |    | food_name        |    | activity_type    |
| unit (mg/dL)     |    | calories (INT)   |    | duration (INT)   |
| reading_type     |    | carbs (DECIMAL)  |    | intensity        |
| meal_context     |    | protein (DECIMAL)|    | timestamp        |
| timestamp        |    | fat (DECIMAL)    |    | notes            |
| notes            |    | glycemic_index   |    | created_at       |
| source           |    | glycemic_load    |    +------------------+
| created_at       |    | serving_size     |
+------------------+    | meal_type        |
                        | timestamp        |
                        | notes            |
                        | created_at       |
                        +------------------+

+------------------+    +------------------+    +------------------+
|    CARE_TEAM     |    | PROVIDER_NOTES   |    |  CHAT_MESSAGES   |
+------------------+    +------------------+    +------------------+
| PK: id (UUID)    |    | PK: id (UUID)    |    | PK: id (UUID)    |
| FK: patient_id   |    | FK: patient_id   |    | FK: sender_id    |
| FK: provider_id  |    | FK: provider_id  |    | FK: receiver_id  |
| permissions      |    | content (TEXT)   |    | content (TEXT)   |
| status           |    | created_at       |    | is_read (BOOL)   |
| hospital_id      |    +------------------+    | created_at       |
| doctor_dir_id    |                            +------------------+
| created_at       |
+------------------+

+------------------+    +------------------+    +------------------+
|   APPOINTMENTS   |    |   AUDIT_LOGS     |    | ALERT_SETTINGS   |
+------------------+    +------------------+    +------------------+
| PK: id (UUID)    |    | PK: id (UUID)    |    | PK: id (UUID)    |
| FK: patient_id   |    | FK: user_id      |    | FK: user_id      |
| FK: physician_id |    | action (TEXT)    |    | high_threshold   |
| date_time        |    | details (TEXT)   |    | low_threshold    |
| purpose          |    | timestamp        |    | email_alerts     |
| notes            |    +------------------+    | push_alerts      |
| status           |                            | created_at       |
| seen_by_patient  |                            +------------------+
| created_at       |
+------------------+

+------------------+    +-------------------+
| FAMILY_CONTACTS  |    |VERIFICATION_TOKENS|
+------------------+    +-------------------+
| PK: id (UUID)    |    | PK: id (UUID)     |
| FK: user_id      |    | FK: user_id       |
| name             |    | token (VARCHAR)   |
| relationship     |    | expires_at        |
| phone            |    | created_at        |
| email            |    +-------------------+
| notify_high      |
| notify_low       |
| created_at       |
+------------------+
```

---

## 1.3 Tables and Views Structure

### Table Definitions with Design Decisions

#### 1. USERS Table
**Purpose**: Central authentication and profile storage for all user types.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID for unique identification |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login credential |
| password | VARCHAR(255) | NOT NULL | SHA-256 hashed password |
| full_name | VARCHAR(255) | NOT NULL | Display name |
| role | ENUM | NOT NULL | 'patient', 'physician', 'dietitian', 'admin' |
| diabetes_type | VARCHAR(50) | NULLABLE | Type 1, Type 2, Gestational, Pre-diabetic |
| phone | VARCHAR(20) | NULLABLE | Contact number |
| date_of_birth | DATE | NULLABLE | For age calculations |
| language_preference | VARCHAR(10) | DEFAULT 'en' | 'en' or 'ar' for bilingual |
| email_verified | BOOLEAN | DEFAULT false | Email verification status |
| created_at | TIMESTAMP | DEFAULT NOW() | Registration timestamp |

**Design Decision**: Single table inheritance pattern used for all user roles to simplify authentication while role-based access control (RBAC) is enforced at application level.

---

#### 2. GLUCOSE_READINGS Table
**Purpose**: Store blood glucose measurements with metadata for trend analysis.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| user_id | VARCHAR(36) | FOREIGN KEY | References users.id |
| value | INTEGER | NOT NULL | Glucose reading in mg/dL |
| unit | VARCHAR(10) | DEFAULT 'mg/dL' | Measurement unit |
| reading_type | VARCHAR(50) | NOT NULL | fasting, pre-meal, post-meal, bedtime, random |
| meal_context | VARCHAR(100) | NULLABLE | Additional meal context |
| timestamp | TIMESTAMP | NOT NULL | When reading was taken |
| notes | TEXT | NULLABLE | User notes |
| source | VARCHAR(50) | DEFAULT 'manual' | 'manual' or 'dexcom' |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation time |

**Design Decision**: Source field distinguishes manual entries from CGM device imports (Dexcom integration).

---

#### 3. FOOD_LOGS Table
**Purpose**: Track nutritional intake with glycemic impact calculations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| user_id | VARCHAR(36) | FOREIGN KEY | References users.id |
| food_name | VARCHAR(255) | NOT NULL | Food item name |
| calories | INTEGER | NULLABLE | Caloric content |
| carbs | DECIMAL(10,2) | NULLABLE | Carbohydrates in grams |
| protein | DECIMAL(10,2) | NULLABLE | Protein in grams |
| fat | DECIMAL(10,2) | NULLABLE | Fat in grams |
| fiber | DECIMAL(10,2) | NULLABLE | Dietary fiber |
| glycemic_index | INTEGER | NULLABLE | GI value (0-100) |
| glycemic_load | DECIMAL(10,2) | NULLABLE | Calculated GL = (GI x Net Carbs) / 100 |
| serving_size | VARCHAR(100) | NULLABLE | Portion description |
| meal_type | VARCHAR(50) | NOT NULL | breakfast, lunch, dinner, snack |
| timestamp | TIMESTAMP | NOT NULL | When food was consumed |
| notes | TEXT | NULLABLE | Additional notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |

**Design Decision**: Glycemic Load is stored as a calculated field using the formula GL = (GI x Net Carbs) / 100 where Net Carbs = Carbs - Fiber.

---

#### 4. ACTIVITY_LOGS Table
**Purpose**: Record physical activities for health correlation analysis.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| user_id | VARCHAR(36) | FOREIGN KEY | References users.id |
| activity_type | VARCHAR(100) | NOT NULL | Walking, Running, Swimming, etc. |
| duration | INTEGER | NOT NULL | Duration in minutes |
| intensity | ENUM | NOT NULL | 'low', 'moderate', 'high' |
| timestamp | TIMESTAMP | NOT NULL | Activity time |
| notes | TEXT | NULLABLE | Additional notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |

---

#### 5. CARE_TEAM Table
**Purpose**: Manage provider-patient relationships with granular permissions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| patient_id | VARCHAR(36) | FOREIGN KEY | References users.id (patient) |
| provider_id | VARCHAR(36) | FOREIGN KEY | References users.id (physician/dietitian) |
| permissions | ENUM | NOT NULL | 'glucose' (view glucose only) or 'all' (full access) |
| status | ENUM | DEFAULT 'pending' | 'pending', 'approved', 'rejected' |
| hospital_id | VARCHAR(10) | NULLABLE | References hospital_directory |
| doctor_directory_id | VARCHAR(10) | NULLABLE | References doctor_directory |
| created_at | TIMESTAMP | DEFAULT NOW() | Relationship creation |

**Design Decision**: Two permission levels support HIPAA-compliant data sharing - minimal (glucose-only) or comprehensive (all health data).

---

#### 6. APPOINTMENTS Table
**Purpose**: Schedule and track medical appointments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| patient_id | VARCHAR(36) | FOREIGN KEY | References users.id |
| physician_id | VARCHAR(36) | FOREIGN KEY | References users.id |
| date_time | TIMESTAMP | NOT NULL | Appointment datetime |
| purpose | TEXT | NOT NULL | Appointment reason |
| notes | TEXT | NULLABLE | Provider notes |
| status | ENUM | DEFAULT 'scheduled' | 'scheduled', 'completed', 'cancelled' |
| seen_by_patient | BOOLEAN | DEFAULT false | Notification status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |

---

#### 7. AUDIT_LOGS Table
**Purpose**: Track all system actions for compliance and debugging.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | VARCHAR(36) | PRIMARY KEY | UUID |
| user_id | VARCHAR(36) | FOREIGN KEY | References users.id |
| action | VARCHAR(100) | NOT NULL | Action type (LOGIN, LOGOUT, DATA_ACCESS, etc.) |
| details | TEXT | NULLABLE | JSON details of action |
| timestamp | TIMESTAMP | DEFAULT NOW() | When action occurred |

---

### View Definitions (Queries - Not in ERD)

#### View 1: patient_glucose_summary
```sql
CREATE VIEW patient_glucose_summary AS
SELECT 
    user_id,
    DATE(timestamp) as reading_date,
    AVG(value) as avg_glucose,
    MIN(value) as min_glucose,
    MAX(value) as max_glucose,
    COUNT(*) as reading_count
FROM glucose_readings
GROUP BY user_id, DATE(timestamp);
```
**Purpose**: Daily glucose statistics for dashboard charts.

#### View 2: provider_patient_list
```sql
CREATE VIEW provider_patient_list AS
SELECT 
    ct.provider_id,
    u.id as patient_id,
    u.full_name as patient_name,
    u.diabetes_type,
    ct.permissions,
    ct.status
FROM care_team ct
JOIN users u ON ct.patient_id = u.id
WHERE ct.status = 'approved';
```
**Purpose**: Quick lookup of patients assigned to each provider.

#### View 3: weekly_nutrition_summary
```sql
CREATE VIEW weekly_nutrition_summary AS
SELECT 
    user_id,
    DATE_TRUNC('week', timestamp) as week_start,
    SUM(calories) as total_calories,
    SUM(carbs) as total_carbs,
    AVG(glycemic_load) as avg_glycemic_load
FROM food_logs
GROUP BY user_id, DATE_TRUNC('week', timestamp);
```
**Purpose**: Weekly nutritional trends for reports.

---

## 1.4 Database Code (SQL DDL)

```sql
-- GenieSugar Database Schema
-- Student ID: 202200033
-- Third Normal Form (3NF) Compliant

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- REFERENCE TABLES (Static Data)
-- =====================================================

CREATE TABLE hospital_directory (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL
);

CREATE TABLE doctor_directory (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    hospital_id VARCHAR(10) REFERENCES hospital_directory(id),
    specialization VARCHAR(255) NOT NULL
);

-- =====================================================
-- CORE TABLES
-- =====================================================

CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'physician', 'dietitian', 'admin')),
    diabetes_type VARCHAR(50),
    phone VARCHAR(20),
    date_of_birth DATE,
    language_preference VARCHAR(10) DEFAULT 'en',
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE TABLE glucose_readings (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    value INTEGER NOT NULL,
    unit VARCHAR(10) DEFAULT 'mg/dL',
    reading_type VARCHAR(50) NOT NULL,
    meal_context VARCHAR(100),
    timestamp TIMESTAMP NOT NULL,
    notes TEXT,
    source VARCHAR(50) DEFAULT 'manual',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_glucose_user ON glucose_readings(user_id);
CREATE INDEX idx_glucose_timestamp ON glucose_readings(timestamp);

CREATE TABLE food_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    food_name VARCHAR(255) NOT NULL,
    calories INTEGER,
    carbs DECIMAL(10,2),
    protein DECIMAL(10,2),
    fat DECIMAL(10,2),
    fiber DECIMAL(10,2),
    glycemic_index INTEGER,
    glycemic_load DECIMAL(10,2),
    serving_size VARCHAR(100),
    meal_type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_food_user ON food_logs(user_id);
CREATE INDEX idx_food_timestamp ON food_logs(timestamp);

CREATE TABLE activity_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    duration INTEGER NOT NULL,
    intensity VARCHAR(20) NOT NULL CHECK (intensity IN ('low', 'moderate', 'high')),
    timestamp TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_user ON activity_logs(user_id);

-- =====================================================
-- COLLABORATION TABLES
-- =====================================================

CREATE TABLE care_team (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    patient_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permissions VARCHAR(20) NOT NULL CHECK (permissions IN ('glucose', 'all')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    hospital_id VARCHAR(10),
    doctor_directory_id VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(patient_id, provider_id)
);

CREATE INDEX idx_care_team_patient ON care_team(patient_id);
CREATE INDEX idx_care_team_provider ON care_team(provider_id);

CREATE TABLE provider_notes (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    patient_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    sender_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chat_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_receiver ON chat_messages(receiver_id);

-- =====================================================
-- OPERATIONS TABLES
-- =====================================================

CREATE TABLE appointments (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    patient_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    physician_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date_time TIMESTAMP NOT NULL,
    purpose TEXT NOT NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    seen_by_patient BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_physician ON appointments(physician_id);

CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);

-- =====================================================
-- SUPPORT TABLES
-- =====================================================

CREATE TABLE alert_settings (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    high_threshold INTEGER DEFAULT 180,
    low_threshold INTEGER DEFAULT 70,
    email_alerts BOOLEAN DEFAULT true,
    push_alerts BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE family_contacts (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    notify_high BOOLEAN DEFAULT true,
    notify_low BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE verification_tokens (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SEED DATA: Bahrain Hospitals
-- =====================================================

INSERT INTO hospital_directory (id, name, city) VALUES
('H001', 'Salmaniya Medical Complex', 'Manama'),
('H002', 'King Hamad University Hospital', 'Busaiteen'),
('H003', 'Bahrain Defence Force Hospital', 'Riffa'),
('H004', 'Ibn Al-Nafees Hospital', 'Manama'),
('H005', 'American Mission Hospital', 'Manama');

-- =====================================================
-- SEED DATA: Diabetes Specialists
-- =====================================================

INSERT INTO doctor_directory (id, name, hospital_id, specialization) VALUES
('DIA001', 'Dr. Hassan Abdulrahman', 'H001', 'Endocrinology (Diabetes)'),
('DIA002', 'Dr. Fatima Al-Khalifa', 'H001', 'Internal Medicine & Diabetes'),
('DIA003', 'Dr. Mohammed Al-Doseri', 'H001', 'Pediatric Diabetes'),
('DIA004', 'Dr. Noor Al-Sayed', 'H002', 'Diabetes & Metabolism'),
('DIA005', 'Dr. Ahmed Al-Mannai', 'H002', 'Endocrinology'),
('DIA006', 'Dr. Sara Al-Zayani', 'H002', 'Diabetic Complications'),
('DIA007', 'Dr. Abdulaziz Al-Mutawa', 'H003', 'Endocrinology (Diabetes Care)'),
('DIA008', 'Dr. Khalid Al-Rumaihi', 'H003', 'Diabetes Management'),
('DIA009', 'Dr. Lulwa Al-Binali', 'H004', 'Adult Diabetes Management'),
('DIA010', 'Dr. Huda Al-Ansari', 'H004', 'Endocrinology'),
('DIA011', 'Dr. Yusuf Al-Jassim', 'H004', 'Diabetes & Nutrition'),
('DIA012', 'Dr. Salman Al-Kooheji', 'H005', 'Endocrinology & Diabetes'),
('DIA013', 'Dr. Mariam Al-Hashimi', 'H005', 'Gestational Diabetes'),
('DIA014', 'Dr. Ali Al-Awadhi', 'H005', 'Type 2 Diabetes Care');
```

---

## 1.5 Normalization Analysis

### First Normal Form (1NF)
- All tables have atomic values (no repeating groups)
- Each column contains single values
- Primary keys defined for all tables

### Second Normal Form (2NF)
- All non-key attributes depend on the entire primary key
- No partial dependencies exist
- Composite keys properly decomposed

### Third Normal Form (3NF)
- No transitive dependencies
- All non-key attributes depend only on the primary key
- Reference tables (hospital_directory, doctor_directory) properly separated

### Example: Food Logs 3NF Compliance
- food_name, calories, carbs, protein, fat, glycemic_index all depend directly on the food_logs.id
- No attribute depends on another non-key attribute
- Glycemic load is derived from GI and carbs but stored for query performance (denormalization for performance)

---

*End of Database Design Section*
