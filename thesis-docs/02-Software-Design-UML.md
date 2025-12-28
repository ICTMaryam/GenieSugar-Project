# GenieSugar Software Design Documentation
## Student ID: 202200033
## Unified Modeling Language (UML) Diagrams

---

# 2. SOFTWARE DESIGN

## 2.1 System Overview

GenieSugar is a diabetes self-management web application with four distinct user roles:
- **Patient**: Primary users tracking their glucose, food, and activities
- **Physician**: Medical providers monitoring patient health data
- **Dietitian**: Nutrition specialists reviewing food intake patterns
- **Admin**: System administrators managing users and auditing activity

---

## 2.2 USE CASE NARRATIVES

### Use Case 1: Patient Glucose Tracking

| Element | Description |
|---------|-------------|
| **Use Case ID** | UC-001 |
| **Use Case Name** | Log Glucose Reading |
| **Actor** | Patient |
| **Description** | Patient records a blood glucose measurement manually or via Dexcom CGM sync |
| **Pre-conditions** | Patient is authenticated and on the glucose logging page |
| **Post-conditions** | Glucose reading is stored; alerts triggered if thresholds exceeded |

**Main Flow (Steps):**
1. Patient navigates to "Glucose Log" page
2. System displays glucose entry form with fields: value, reading type, meal context, notes
3. Patient enters glucose value (e.g., 145 mg/dL)
4. Patient selects reading type (fasting, pre-meal, post-meal, bedtime, random)
5. Patient optionally adds meal context and notes
6. Patient clicks "Save Reading" button
7. System validates input (value must be 20-600 mg/dL)
8. System stores reading in glucose_readings table
9. System checks alert thresholds from alert_settings
10. If threshold exceeded, system sends email/notification to patient and family contacts
11. System displays success message and updates glucose chart
12. System logs action to audit_logs

**Alternate Flows:**
- **A1 (Dexcom Sync)**: At step 2, patient clicks "Sync from Dexcom" to import readings automatically
- **A2 (Validation Error)**: At step 7, if value invalid, system displays error and returns to step 3

**Boundaries:**
- UI Boundary: GlucoseLogPage component
- Entity Boundary: glucose_readings table

---

### Use Case 2: Patient Food Logging

| Element | Description |
|---------|-------------|
| **Use Case ID** | UC-002 |
| **Use Case Name** | Log Food Intake |
| **Actor** | Patient |
| **Description** | Patient records food consumption with automatic nutritional calculation |
| **Pre-conditions** | Patient is authenticated |
| **Post-conditions** | Food entry saved with calculated glycemic load |

**Main Flow (Steps):**
1. Patient navigates to "Food Log" page
2. System displays food entry form
3. Patient searches or selects food from Bahraini food database
4. System auto-fills nutritional data (calories, carbs, protein, fat, GI)
5. Patient adjusts serving size if needed
6. Patient selects meal type (breakfast, lunch, dinner, snack)
7. Patient sets timestamp and optional notes
8. System calculates Glycemic Load: GL = (GI x Net Carbs) / 100
9. Patient clicks "Save Entry"
10. System validates and stores food_log entry
11. System displays success and updates daily nutrition summary
12. System logs action to audit_logs

**Alternate Flows:**
- **A1 (Custom Food)**: At step 3, patient enters custom food with manual nutritional values
- **A2 (Edit Entry)**: Patient edits existing food log entry

**Entities:**
- Food Log Entry (food_logs table)
- Bahraini Food Database (static reference data)

---

### Use Case 3: Patient Activity Logging

| Element | Description |
|---------|-------------|
| **Use Case ID** | UC-003 |
| **Use Case Name** | Log Physical Activity |
| **Actor** | Patient |
| **Description** | Patient records physical activities for health tracking |
| **Pre-conditions** | Patient is authenticated |
| **Post-conditions** | Activity entry saved in activity_logs |

**Main Flow (Steps):**
1. Patient navigates to "Activity Log" page
2. System displays activity entry form
3. Patient selects activity type (Walking, Running, Swimming, Cycling, etc.)
4. Patient enters duration in minutes
5. Patient selects intensity level (Low, Moderate, High)
6. Patient sets timestamp
7. Patient optionally adds notes
8. Patient clicks "Save Activity"
9. System validates input
10. System stores activity in activity_logs table
11. System displays success message
12. System logs action to audit_logs

---

### Use Case 4: Care Team Management

| Element | Description |
|---------|-------------|
| **Use Case ID** | UC-004 |
| **Use Case Name** | Request Provider Access |
| **Actor** | Patient |
| **Description** | Patient requests a healthcare provider to access their health data |
| **Pre-conditions** | Patient is authenticated |
| **Post-conditions** | Care team request created with pending status |

**Main Flow (Steps):**
1. Patient navigates to "Care Team" page
2. System displays current care team members and form to add new provider
3. Patient selects hospital from dropdown
4. System filters and displays doctors at selected hospital
5. Patient selects doctor from list
6. Patient chooses permission level:
   - "Glucose Only" - Provider sees only glucose readings
   - "All Data" - Provider sees glucose, food, and activity logs
7. Patient clicks "Send Request"
8. System creates care_team entry with status = "pending"
9. System notifies physician of pending request
10. System displays confirmation message

**Alternate Flow:**
- **A1 (Provider Approves)**: Physician reviews and approves request
- **A2 (Provider Rejects)**: Physician rejects request with reason

---

### Use Case 5: Physician Patient Review

| Element | Description |
|---------|-------------|
| **Use Case ID** | UC-005 |
| **Use Case Name** | Review Patient Data |
| **Actor** | Physician |
| **Description** | Physician views patient health data based on granted permissions |
| **Pre-conditions** | Physician has approved care_team relationship with patient |
| **Post-conditions** | Physician views patient data; optionally adds clinical notes |

**Main Flow (Steps):**
1. Physician navigates to "My Patients" page
2. System displays list of patients who granted access
3. Physician clicks on patient name
4. System verifies care_team permissions
5. System displays patient dashboard with:
   - Glucose trend chart (always visible)
   - Food log (if permissions = "all")
   - Activity log (if permissions = "all")
6. Physician reviews data patterns
7. Physician optionally adds clinical note
8. System stores note in provider_notes table
9. Physician optionally schedules appointment
10. System logs access to audit_logs

---

### Use Case 6: Physician Appointment Scheduling

| Element | Description |
|---------|-------------|
| **Use Case ID** | UC-006 |
| **Use Case Name** | Schedule Appointment |
| **Actor** | Physician |
| **Description** | Physician creates appointment for patient |
| **Pre-conditions** | Physician has care_team relationship with patient |
| **Post-conditions** | Appointment created and patient notified |

**Main Flow (Steps):**
1. Physician navigates to "Appointments" page
2. Physician clicks "Schedule New Appointment"
3. System displays appointment form
4. Physician selects patient from care_team list
5. Physician sets date and time
6. Physician enters purpose/reason
7. Physician adds optional notes
8. Physician clicks "Create Appointment"
9. System validates date is in future
10. System stores appointment in appointments table
11. System sends email notification to patient
12. System displays confirmation

---

### Use Case 7: Admin User Management

| Element | Description |
|---------|-------------|
| **Use Case ID** | UC-007 |
| **Use Case Name** | Manage System Users |
| **Actor** | Admin |
| **Description** | Administrator views all users and audit logs |
| **Pre-conditions** | Admin is authenticated with admin role |
| **Post-conditions** | Admin action completed and logged |

**Main Flow (Steps):**
1. Admin navigates to "Admin Dashboard"
2. System displays user statistics (total users by role)
3. Admin views user list with search/filter options
4. Admin can view user details
5. Admin can lock/unlock user accounts
6. Admin views audit logs for compliance
7. Admin exports data for reporting
8. All admin actions logged to audit_logs

---

### Use Case 8: Dexcom CGM Integration

| Element | Description |
|---------|-------------|
| **Use Case ID** | UC-008 |
| **Use Case Name** | Connect Dexcom Account |
| **Actor** | Patient, Dexcom API |
| **Description** | Patient connects Dexcom CGM device to auto-import glucose readings |
| **Pre-conditions** | Patient has Dexcom CGM and account |
| **Post-conditions** | Dexcom tokens stored; readings can be synced |

**Main Flow (Steps):**
1. Patient navigates to Profile > Connected Devices
2. Patient clicks "Connect Dexcom"
3. System redirects to Dexcom OAuth authorization page
4. Patient logs into Dexcom and grants permission
5. Dexcom redirects back with authorization code
6. System exchanges code for access/refresh tokens
7. System stores encrypted tokens for user
8. System displays "Dexcom Connected" status
9. Patient can now sync readings from Dexcom API

---

## 2.3 ACTIVITY DIAGRAMS

### Activity Diagram 1: Patient Glucose Logging

```
[Start]
    |
    v
[Navigate to Glucose Log Page]
    |
    v
[Display Glucose Entry Form]
    |
    v
<Manual or Dexcom?>
   /          \
  v            v
[Enter Value]  [Sync from Dexcom]
[Select Type]       |
[Add Notes]         v
    |          [Fetch Dexcom Readings]
    v               |
[Click Save]        v
    |          [Display Imported Readings]
    v               |
[Validate Input]<---+
    |
    v
<Valid?>
  /    \
 No    Yes
 |      |
 v      v
[Show Error]  [Store in Database]
 |                  |
 v                  v
[Return to Form]  [Check Alert Thresholds]
                        |
                        v
                   <Threshold Exceeded?>
                      /           \
                    Yes           No
                     |             |
                     v             v
              [Send Alerts]   [Update Chart]
              [Email Family]       |
                     |             |
                     +------+------+
                            |
                            v
                     [Log to Audit]
                            |
                            v
                     [Display Success]
                            |
                            v
                         [End]
```

---

### Activity Diagram 2: Food Logging with GL Calculation

```
[Start]
    |
    v
[Navigate to Food Log Page]
    |
    v
[Display Food Entry Form]
    |
    v
<Search or Custom?>
   /           \
  v             v
[Search Food DB]  [Enter Custom Food]
    |                   |
    v                   v
[Select Food Item]  [Enter Nutritional Values]
    |                   |
    +--------+----------+
             |
             v
[Auto-populate Nutrition Data]
             |
             v
[Adjust Serving Size]
             |
             v
[Select Meal Type]
             |
             v
[Calculate Glycemic Load]
GL = (GI x (Carbs - Fiber)) / 100
             |
             v
[Click Save Entry]
             |
             v
[Validate Input]
             |
             v
<Valid?>
  /    \
 No    Yes
 |      |
 v      v
[Error] [Store Food Log]
            |
            v
     [Update Daily Summary]
            |
            v
       [Log Audit]
            |
            v
         [End]
```

---

### Activity Diagram 3: Care Team Request Flow

```
[Start]
    |
    v
[Patient: Navigate to Care Team]
    |
    v
[Display Current Care Team]
    |
    v
[Select "Add Provider"]
    |
    v
[Select Hospital]
    |
    v
[Filter Doctors by Hospital]
    |
    v
[Select Doctor]
    |
    v
[Choose Permission Level]
    |
    v
[Submit Request]
    |
    v
[Create care_team (status=pending)]
    |
    v
[Notify Physician]
    |
    v
         ... (Physician Lane) ...
    |
    v
[Physician: View Pending Requests]
    |
    v
[Review Patient Info]
    |
    v
<Accept or Reject?>
   /          \
Accept       Reject
  |            |
  v            v
[Update status='approved']  [Update status='rejected']
  |            |
  +-----+------+
        |
        v
[Notify Patient of Decision]
        |
        v
     [End]
```

---

### Activity Diagram 4: Physician Patient Review

```
[Start]
    |
    v
[Physician: Navigate to Patients]
    |
    v
[Display Patient List]
    |
    v
[Select Patient]
    |
    v
[Verify care_team Permissions]
    |
    v
<Permission Level?>
   /           \
"glucose"    "all"
   |           |
   v           v
[Show Glucose Only]  [Show All Data]
   |                 (Glucose, Food, Activity)
   +--------+--------+
            |
            v
     [Display Patient Dashboard]
            |
            v
     [Review Data Trends]
            |
            v
    <Add Clinical Note?>
       /        \
      Yes       No
       |         |
       v         |
[Enter Note]     |
       |         |
       v         |
[Save to provider_notes]
       |         |
       +----+----+
            |
            v
     [Log Access to Audit]
            |
            v
         [End]
```

---

### Activity Diagram 5: Admin User Management

```
[Start]
    |
    v
[Admin: Navigate to Dashboard]
    |
    v
[Display User Statistics]
    |
    v
[View User List]
    |
    v
<Action?>
   /     |      \
View   Lock   Export
  |      |       |
  v      v       v
[Show Details] [Toggle Lock] [Generate Report]
  |      |       |
  +------+-------+
         |
         v
  [Log Admin Action]
         |
         v
      [End]
```

---

## 2.4 SEQUENCE DIAGRAMS

### Sequence Diagram 1: Glucose Reading Submission

```
Patient          Browser/UI        React Query       Express API       Storage          Database        Email Service
   |                 |                  |                |                |                 |                |
   | Click "Log Glucose"                |                |                |                 |                |
   |---------------->|                  |                |                |                 |                |
   |                 | Display Form     |                |                |                 |                |
   |<----------------|                  |                |                |                 |                |
   | Enter Value, Submit               |                |                |                 |                |
   |---------------->|                  |                |                |                 |                |
   |                 | mutation.mutate(data)            |                |                 |                |
   |                 |----------------->|                |                |                 |                |
   |                 |                  | POST /api/glucose              |                 |                |
   |                 |                  |--------------->|                |                 |                |
   |                 |                  |                | Validate Zod Schema             |                |
   |                 |                  |                |--------------->|                 |                |
   |                 |                  |                | createGlucoseReading()          |                |
   |                 |                  |                |                |---------------->|                |
   |                 |                  |                |                | INSERT glucose_readings         |
   |                 |                  |                |                |<----------------|                |
   |                 |                  |                | getAlertSettings()              |                 |
   |                 |                  |                |                |---------------->|                |
   |                 |                  |                |                |<----------------|                |
   |                 |                  |                | Check Thresholds                |                |
   |                 |                  |                |---+            |                 |                |
   |                 |                  |                |<--+            |                 |                |
   |                 |                  |                | [If threshold exceeded]         |                |
   |                 |                  |                |-------------------------------------------------->|
   |                 |                  |                |                |                 | Send Alert Email
   |                 |                  |                |                |                 |<-----------------|
   |                 |                  |                | createAuditLog()                |                |
   |                 |                  |                |                |---------------->|                |
   |                 |                  |                |<---------------|                 |                |
   |                 |                  |<---------------|                |                 |                |
   |                 | invalidateQueries(['/api/glucose'])               |                 |                |
   |                 |<-----------------|                |                |                 |                |
   | Display Success |                  |                |                |                 |                |
   |<----------------|                  |                |                |                 |                |
```

---

### Sequence Diagram 2: Food Log with GL Calculation

```
Patient          Browser/UI        React Query       Express API       Storage          Database
   |                 |                  |                |                |                 |
   | Search "Machboos"                 |                |                |                 |
   |---------------->|                  |                |                |                 |
   |                 | Filter Food DB   |                |                |                 |
   |                 |---+              |                |                |                 |
   |                 |<--+              |                |                |                 |
   |                 | Display Matches  |                |                |                 |
   |<----------------|                  |                |                |                 |
   | Select "Machboos (Chicken)"       |                |                |                 |
   |---------------->|                  |                |                |                 |
   |                 | Auto-fill: calories=450, carbs=55, GI=65          |                 |
   |<----------------|                  |                |                |                 |
   | Adjust serving, Submit            |                |                |                 |
   |---------------->|                  |                |                |                 |
   |                 | Calculate GL = (65 x 55) / 100 = 35.75            |                 |
   |                 |---+              |                |                |                 |
   |                 |<--+              |                |                |                 |
   |                 | mutation.mutate(foodData)        |                |                 |
   |                 |----------------->|                |                |                 |
   |                 |                  | POST /api/food |                |                 |
   |                 |                  |--------------->|                |                 |
   |                 |                  |                | Validate Schema|                 |
   |                 |                  |                | createFoodLog()|                 |
   |                 |                  |                |--------------->|                 |
   |                 |                  |                |                | INSERT food_logs|
   |                 |                  |                |                |---------------->|
   |                 |                  |                |                |<----------------|
   |                 |                  |                |<---------------|                 |
   |                 |                  |<---------------|                |                 |
   |                 |<-----------------|                |                |                 |
   | Display Success |                  |                |                |                 |
   |<----------------|                  |                |                |                 |
```

---

### Sequence Diagram 3: Care Team Request Approval

```
Patient          Physician        Browser          Express API       Storage          Database
   |                 |                |                |                |                 |
   | Submit Care Team Request        |                |                |                 |
   |--------------------------------->|                |                |                 |
   |                 |                | POST /api/care-team             |                 |
   |                 |                |--------------->|                |                 |
   |                 |                |                | createPendingRequest()           |
   |                 |                |                |--------------->|                 |
   |                 |                |                |                |---------------->|
   |                 |                |                |                |<----------------|
   |                 |                |<---------------|                |                 |
   | Confirmation    |                |                |                |                 |
   |<---------------------------------|                |                |                 |
   |                 |                |                |                |                 |
   |      ... Time Passes ...        |                |                |                 |
   |                 |                |                |                |                 |
   |                 | View Pending Requests           |                |                 |
   |                 |--------------->|                |                |                 |
   |                 |                | GET /api/care-team/pending-requests              |
   |                 |                |--------------->|                |                 |
   |                 |                |                | getPendingRequests()             |
   |                 |                |                |--------------->|                 |
   |                 |                |                |                |---------------->|
   |                 |                |                |                |<----------------|
   |                 |                |<---------------|                |                 |
   |                 | Display Requests               |                |                 |
   |                 |<---------------|                |                |                 |
   |                 | Click "Accept" |                |                |                 |
   |                 |--------------->|                |                |                 |
   |                 |                | POST /api/care-team/requests/:id/accept          |
   |                 |                |--------------->|                |                 |
   |                 |                |                | updateStatus('approved')         |
   |                 |                |                |--------------->|                 |
   |                 |                |                |                |---------------->|
   |                 |                |                |                |<----------------|
   |                 |                |<---------------|                |                 |
   |                 | Success        |                |                |                 |
   |                 |<---------------|                |                |                 |
```

---

### Sequence Diagram 4: Dexcom OAuth Integration

```
Patient          Browser          Express API       Dexcom OAuth      Dexcom API
   |                |                |                   |                |
   | Click "Connect Dexcom"         |                   |                |
   |--------------->|                |                   |                |
   |                | GET /api/dexcom/auth              |                |
   |                |--------------->|                   |                |
   |                |                | Generate Auth URL |                |
   |                |                |---+               |                |
   |                |                |<--+               |                |
   |                |<---------------|                   |                |
   |                | Redirect to Dexcom               |                |
   |<---------------|                |                   |                |
   |                |                |                   |                |
   | Login to Dexcom, Grant Access  |                   |                |
   |----------------------------------------------->|                |
   |                |                |                   |                |
   | Redirect with Auth Code        |                   |                |
   |<-----------------------------------------------|                |
   |                |                |                   |                |
   | GET /api/dexcom/callback?code=xxx                 |                |
   |--------------->|--------------->|                   |                |
   |                |                | Exchange Code for Tokens          |
   |                |                |------------------>|                |
   |                |                |                   | Access Token   |
   |                |                |                   | Refresh Token  |
   |                |                |<------------------|                |
   |                |                | Store Tokens      |                |
   |                |                |---+               |                |
   |                |                |<--+               |                |
   |                |<---------------|                   |                |
   | Display "Connected"            |                   |                |
   |<---------------|                |                   |                |
   |                |                |                   |                |
   | Click "Sync Readings"          |                   |                |
   |--------------->|                |                   |                |
   |                | POST /api/dexcom/sync             |                |
   |                |--------------->|                   |                |
   |                |                | GET /egvs (with token)            |
   |                |                |------------------------------------------>|
   |                |                |                   |    Glucose Data|
   |                |                |<------------------------------------------|
   |                |                | Store Readings    |                |
   |                |                |---+               |                |
   |                |                |<--+               |                |
   |                |<---------------|                   |                |
   | Display Synced Readings        |                   |                |
   |<---------------|                |                   |                |
```

---

## 2.5 DEPLOYMENT DIAGRAM

```
+=========================================================================+
|                          CLIENT TIER (Browser)                           |
+=========================================================================+
|                                                                          |
|  +---------------------------+    +---------------------------+          |
|  |    Web Browser (Chrome,   |    |    Mobile Browser         |          |
|  |    Firefox, Safari)       |    |    (iOS Safari, Android)  |          |
|  +---------------------------+    +---------------------------+          |
|            |                               |                             |
|            |    HTTPS (Port 443)           |                             |
|            +---------------+---------------+                             |
|                            |                                             |
+=========================================================================+
                             |
                             v
+=========================================================================+
|                       APPLICATION TIER (Replit)                          |
+=========================================================================+
|                                                                          |
|  +-------------------------------------------------------------------+   |
|  |                     Node.js Runtime                                |   |
|  |  +---------------------------+  +-----------------------------+   |   |
|  |  |    Vite Dev Server        |  |    Express.js Backend       |   |   |
|  |  |    (React SPA)            |  |    (REST API)               |   |   |
|  |  |  - Components             |  |  - Authentication           |   |   |
|  |  |  - Pages                  |  |  - Session Management       |   |   |
|  |  |  - React Query            |  |  - Route Handlers           |   |   |
|  |  |  - Theme/Language         |  |  - Zod Validation           |   |   |
|  |  +---------------------------+  +-----------------------------+   |   |
|  |            Port 5000                   Port 5000 (same)           |   |
|  +-------------------------------------------------------------------+   |
|                                                                          |
+=========================================================================+
                             |
            +----------------+----------------+
            |                                 |
            v                                 v
+========================+      +============================+
|    DATA TIER           |      |    EXTERNAL SERVICES       |
+========================+      +============================+
|                        |      |                            |
|  +------------------+  |      |  +----------------------+  |
|  |   PostgreSQL     |  |      |  |   SendGrid Email     |  |
|  |   (Neon Cloud)   |  |      |  |   Service            |  |
|  +------------------+  |      |  +----------------------+  |
|  | - users          |  |      |                            |
|  | - glucose_readings|  |      |  +----------------------+  |
|  | - food_logs      |  |      |  |   Dexcom API          |  |
|  | - activity_logs  |  |      |  |   (CGM Integration)   |  |
|  | - care_team      |  |      |  +----------------------+  |
|  | - appointments   |  |      |                            |
|  | - audit_logs     |  |      +============================+
|  +------------------+  |
|                        |
+========================+


                    DEPLOYMENT SPECIFICATIONS
    +----------------------------------------------------------+
    | Component          | Technology        | Port/Protocol   |
    +----------------------------------------------------------+
    | Frontend           | React 18 + Vite   | HTTPS/5000      |
    | Backend            | Express.js        | HTTPS/5000      |
    | Database           | PostgreSQL 15     | TCP/5432        |
    | Email Service      | SendGrid API      | HTTPS/443       |
    | CGM Integration    | Dexcom API        | HTTPS/443       |
    | Session Store      | PostgreSQL        | TCP/5432        |
    | Hosting            | Replit            | Cloud           |
    +----------------------------------------------------------+
```

### Deployment Notes

1. **Single-Port Architecture**: Frontend and backend served on same port (5000) for simplified deployment
2. **HTTPS Encryption**: All traffic encrypted via Replit's automatic TLS
3. **Session Persistence**: Sessions stored in PostgreSQL for reliability
4. **Stateless Scaling**: Application designed for horizontal scaling
5. **External API Integration**: 
   - SendGrid for transactional emails (alerts, notifications)
   - Dexcom for CGM glucose data import

---

*End of Software Design Section*
