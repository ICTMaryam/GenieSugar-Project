# GenieSugar GUI Design Documentation
## Student ID: 202200033
## Graphical User Interface Design

---

# 3. GRAPHICAL USER INTERFACE DESIGN

## 3.1 GUI HIERARCHY

### Complete Application Navigation Structure

```
GenieSugar Application
|
+-- PUBLIC PAGES (No Authentication Required)
|   |
|   +-- Landing Page (/)
|   |   |-- Hero Section with App Overview
|   |   |-- Features Showcase
|   |   |-- Login/Register Buttons
|   |   +-- Language Toggle (EN/AR)
|   |
|   +-- Login Page (/login)
|   |   |-- Email Input
|   |   |-- Password Input
|   |   |-- Login Button
|   |   +-- Register Link
|   |
|   +-- Register Page (/register)
|       |-- Role Selection (Patient/Physician/Dietitian)
|       |-- Personal Information Form
|       |-- Patient-specific Fields:
|       |   |-- Hospital Selection
|       |   |-- Doctor Selection
|       |   +-- Diabetes Type
|       +-- Submit Registration
|
+-- PATIENT DASHBOARD (/dashboard) [Role: Patient]
|   |
|   +-- Sidebar Navigation
|   |   |-- Dashboard (Home)
|   |   |-- Glucose Log
|   |   |-- Food Log
|   |   |-- Activity Log
|   |   |-- Reports
|   |   |-- Care Team
|   |   |-- Appointments
|   |   |-- Chat
|   |   |-- Alert Settings
|   |   |-- Family Contacts
|   |   +-- Profile
|   |
|   +-- Dashboard Home
|   |   |-- Welcome Message
|   |   |-- Today's Glucose Summary Card
|   |   |-- Recent Readings List
|   |   |-- Weekly Trend Chart
|   |   +-- Quick Actions
|   |
|   +-- Glucose Log (/glucose)
|   |   |-- Reading Entry Form
|   |   |-- Dexcom Sync Button
|   |   |-- Readings History Table
|   |   +-- Glucose Trend Chart
|   |
|   +-- Food Log (/food)
|   |   |-- Food Search/Entry Form
|   |   |-- Bahraini Food Database Selector
|   |   |-- GL Calculator Display
|   |   |-- Daily Nutrition Summary
|   |   +-- Food History Table
|   |
|   +-- Activity Log (/activity)
|   |   |-- Activity Entry Form
|   |   |-- Activity History Table
|   |   +-- Weekly Activity Summary
|   |
|   +-- Reports (/reports)
|   |   |-- Date Range Selector
|   |   |-- Glucose Trends Chart
|   |   |-- Nutrition Summary
|   |   |-- Activity Summary
|   |   +-- Export Options (PDF)
|   |
|   +-- Care Team (/care-team)
|   |   |-- Current Providers List
|   |   |-- Add Provider Form
|   |   +-- Permission Management
|   |
|   +-- Appointments (/appointments)
|   |   |-- Upcoming Appointments
|   |   +-- Past Appointments
|   |
|   +-- Chat (/chat)
|   |   |-- Conversation List
|   |   |-- Message Thread View
|   |   +-- New Message Input
|   |
|   +-- Alert Settings (/alert-settings)
|   |   |-- High Glucose Threshold
|   |   |-- Low Glucose Threshold
|   |   +-- Notification Preferences
|   |
|   +-- Family Contacts (/family-contacts)
|   |   |-- Contact List
|   |   |-- Add Contact Form
|   |   +-- Notification Settings
|   |
|   +-- Profile (/profile)
|       |-- Personal Information
|       |-- Password Change
|       |-- Dexcom Connection Status
|       +-- Language Preference
|
+-- PHYSICIAN DASHBOARD (/physician) [Role: Physician]
|   |
|   +-- Sidebar Navigation
|   |   |-- Dashboard
|   |   |-- Patient Requests
|   |   |-- My Patients
|   |   |-- Appointments
|   |   |-- Chat
|   |   +-- Profile
|   |
|   +-- Dashboard Home
|   |   |-- Patient Statistics
|   |   |-- Pending Requests Count
|   |   |-- Today's Appointments
|   |   +-- Recent Activity
|   |
|   +-- Patient Requests (/physician/requests)
|   |   |-- Pending Request Cards
|   |   |-- Accept/Reject Actions
|   |   +-- Patient Preview Info
|   |
|   +-- My Patients (/physician/patients)
|   |   |-- Patient List
|   |   |-- Search/Filter
|   |   +-- Patient Detail View
|   |       |-- Glucose Readings
|   |       |-- Food Log (if permission=all)
|   |       |-- Activity Log (if permission=all)
|   |       +-- Add Clinical Note
|   |
|   +-- Appointments (/physician/appointments)
|       |-- Calendar View
|       |-- Schedule New Appointment
|       +-- Appointment History
|
+-- DIETITIAN DASHBOARD (/dietitian) [Role: Dietitian]
|   |
|   +-- Sidebar Navigation
|   |   |-- Dashboard
|   |   |-- My Patients
|   |   |-- Chat
|   |   +-- Profile
|   |
|   +-- Dashboard Home
|   |   |-- Patient Count
|   |   +-- Recent Notes
|   |
|   +-- My Patients (/dietitian/patients)
|       |-- Patient List
|       |-- Patient Detail View
|       |   |-- Food Logs (focus)
|       |   |-- Nutritional Analysis
|       |   +-- Glycemic Load Trends
|       +-- Add Nutrition Note
|
+-- ADMIN DASHBOARD (/admin) [Role: Admin]
    |
    +-- Sidebar Navigation
    |   |-- Dashboard
    |   |-- User Management
    |   |-- Audit Logs
    |   +-- Profile
    |
    +-- Dashboard Home
    |   |-- Total Users by Role
    |   |-- New Registrations Chart
    |   +-- System Health
    |
    +-- User Management (/admin/users)
    |   |-- User Search/Filter
    |   |-- User List Table
    |   |-- User Actions (Lock/Unlock)
    |   +-- Export User Data
    |
    +-- Audit Logs (/admin/audit)
        |-- Date Range Filter
        |-- Action Type Filter
        |-- Log Table
        +-- Export Logs
```

---

## 3.2 OUTPUT INTERFACES

### 3.2.1 Dashboard Displays

#### Patient Dashboard - Glucose Summary Card
```
+--------------------------------------------------+
|  Today's Glucose                         [icon]  |
+--------------------------------------------------+
|                                                  |
|  Average:  142 mg/dL                             |
|  Range:    98 - 186 mg/dL                        |
|  Readings: 5                                     |
|                                                  |
|  [==========||============] Target Range         |
|     70      120  142   180                       |
|                                                  |
+--------------------------------------------------+
```

#### Glucose Trend Chart
```
+--------------------------------------------------+
|  Weekly Glucose Trend                            |
+--------------------------------------------------+
|  mg/dL                                           |
|  200 |                                           |
|      |        *                                  |
|  180 |----*-------*--------- High Threshold      |
|      |  *   *       *   *                        |
|  140 |*       *       *   *   *                  |
|      |          *       *                        |
|  100 |                    *                      |
|   70 |----------------------- Low Threshold      |
|      +--+--+--+--+--+--+--+                      |
|        M  T  W  Th F  Sa Su                      |
+--------------------------------------------------+
```

#### Daily Nutrition Summary
```
+--------------------------------------------------+
|  Today's Nutrition                               |
+--------------------------------------------------+
|                                                  |
|  Calories    [========    ]  1,450 / 2,000       |
|  Carbs       [==========  ]  165g / 200g         |
|  Protein     [======      ]  58g / 100g          |
|  Fat         [=====       ]  45g / 65g           |
|                                                  |
|  Avg Glycemic Load: 32.5 (Moderate)              |
|                                                  |
+--------------------------------------------------+
```

### 3.2.2 Data Tables

#### Glucose Readings History Table
```
+--------+----------+------------+----------+--------+--------+
| Date   | Time     | Value      | Type     | Source | Notes  |
+--------+----------+------------+----------+--------+--------+
| Dec 27 | 08:30 AM | 98 mg/dL   | Fasting  | Manual |        |
| Dec 27 | 12:45 PM | 145 mg/dL  | Pre-meal | Dexcom |        |
| Dec 27 | 02:30 PM | 168 mg/dL  | Post-meal| Dexcom | Lunch  |
| Dec 26 | 09:00 PM | 122 mg/dL  | Bedtime  | Manual |        |
+--------+----------+------------+----------+--------+--------+
```

#### Food Log History Table
```
+--------+----------+------------------+------+-------+----+-----+
| Date   | Meal     | Food             | Cals | Carbs | GI | GL  |
+--------+----------+------------------+------+-------+----+-----+
| Dec 27 | Breakfast| Balaleet         | 320  | 48g   | 70 | 33.6|
| Dec 27 | Lunch    | Machboos Chicken | 450  | 55g   | 65 | 35.8|
| Dec 27 | Snack    | Dates (3)        | 99   | 27g   | 42 | 11.3|
+--------+----------+------------------+------+-------+----+-----+
```

### 3.2.3 Provider Views

#### Physician - Patient List
```
+--------------------------------------------------+
|  My Patients                         [Search]    |
+--------------------------------------------------+
| [Avatar] Hussain Ali                             |
|          Type 2 Diabetes | Last reading: 145     |
|          Permissions: All Data      [View]       |
+--------------------------------------------------+
| [Avatar] Fatima Mohammed                         |
|          Type 1 Diabetes | Last reading: 98      |
|          Permissions: Glucose Only  [View]       |
+--------------------------------------------------+
| [Avatar] Ahmed Hassan                            |
|          Pre-diabetic | Last reading: 112        |
|          Permissions: All Data      [View]       |
+--------------------------------------------------+
```

#### Admin - User Statistics Dashboard
```
+--------------------------------------------------+
|  System Overview                                 |
+--------------------------------------------------+
|                                                  |
|  +----------+  +----------+  +----------+        |
|  | Patients |  |Physicians|  |Dietitians|        |
|  |    156   |  |    23    |  |    12    |        |
|  +----------+  +----------+  +----------+        |
|                                                  |
|  New Registrations (Last 7 Days)                 |
|  [Bar Chart: Mon-Sun registration counts]        |
|                                                  |
+--------------------------------------------------+
```

---

## 3.3 INPUT INTERFACES

### 3.3.1 Authentication Forms

#### Login Form
```
+--------------------------------------------------+
|              [GenieSugar Logo]                   |
|                                                  |
|           Welcome Back                           |
|                                                  |
|  Email                                           |
|  +--------------------------------------------+  |
|  | user@example.com                           |  |
|  +--------------------------------------------+  |
|                                                  |
|  Password                                        |
|  +--------------------------------------------+  |
|  | ********                            [eye]  |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  |               Sign In                      |  |
|  +--------------------------------------------+  |
|                                                  |
|  Don't have an account? [Register]               |
|                                                  |
+--------------------------------------------------+
```

#### Registration Form (Patient Role Selected)
```
+--------------------------------------------------+
|              Create Account                      |
+--------------------------------------------------+
|                                                  |
|  I am a:                                         |
|  [Patient]  [Physician]  [Dietitian]             |
|                                                  |
|  Full Name *                                     |
|  +--------------------------------------------+  |
|  | Hussain Ali                                |  |
|  +--------------------------------------------+  |
|                                                  |
|  Email *                                         |
|  +--------------------------------------------+  |
|  | hussain@example.com                        |  |
|  +--------------------------------------------+  |
|                                                  |
|  Password *                                      |
|  +--------------------------------------------+  |
|  | ********                                   |  |
|  +--------------------------------------------+  |
|                                                  |
|  Phone                                           |
|  +--------------------------------------------+  |
|  | +973 3XXX XXXX                             |  |
|  +--------------------------------------------+  |
|                                                  |
|  --- Patient Information ---                     |
|                                                  |
|  Diabetes Type *                                 |
|  +--------------------------------------------+  |
|  | Type 2 Diabetes                       [v]  |  |
|  +--------------------------------------------+  |
|                                                  |
|  Select Your Hospital                            |
|  +--------------------------------------------+  |
|  | Salmaniya Medical Complex             [v]  |  |
|  +--------------------------------------------+  |
|                                                  |
|  Select Your Doctor                              |
|  +--------------------------------------------+  |
|  | Dr. Hassan Abdulrahman                [v]  |  |
|  +--------------------------------------------+  |
|                                                  |
|  +--------------------------------------------+  |
|  |             Create Account                 |  |
|  +--------------------------------------------+  |
|                                                  |
+--------------------------------------------------+
```

### 3.3.2 Data Entry Forms

#### Glucose Reading Entry Form
```
+--------------------------------------------------+
|  Log Glucose Reading                             |
+--------------------------------------------------+
|                                                  |
|  Glucose Value (mg/dL) *                         |
|  +--------------------------------------------+  |
|  | 145                                        |  |
|  +--------------------------------------------+  |
|                                                  |
|  Reading Type *                                  |
|  +--------------------------------------------+  |
|  | Post-meal                              [v] |  |
|  +--------------------------------------------+  |
|  Options: Fasting, Pre-meal, Post-meal,          |
|           Bedtime, Random                        |
|                                                  |
|  Meal Context                                    |
|  +--------------------------------------------+  |
|  | After lunch                                |  |
|  +--------------------------------------------+  |
|                                                  |
|  Date & Time                                     |
|  +--------------------------------------------+  |
|  | Dec 27, 2025  2:30 PM             [cal]    |  |
|  +--------------------------------------------+  |
|                                                  |
|  Notes                                           |
|  +--------------------------------------------+  |
|  | Felt slightly elevated after heavy meal    |  |
|  |                                            |  |
|  +--------------------------------------------+  |
|                                                  |
|  [Cancel]                    [Save Reading]      |
|                                                  |
+--------------------------------------------------+
```

#### Food Log Entry Form
```
+--------------------------------------------------+
|  Log Food Entry                                  |
+--------------------------------------------------+
|                                                  |
|  Search Food                                     |
|  +--------------------------------------------+  |
|  | Machboos                            [mag]  |  |
|  +--------------------------------------------+  |
|  | > Machboos (Chicken) - 450 cal             |  |
|  | > Machboos (Lamb) - 520 cal                |  |
|  | > Machboos (Fish) - 380 cal                |  |
|  +--------------------------------------------+  |
|                                                  |
|  --- Nutritional Information (Auto-filled) ---   |
|                                                  |
|  Calories: 450    Carbs: 55g    Protein: 28g    |
|  Fat: 15g         Fiber: 3g     GI: 65          |
|                                                  |
|  Glycemic Load: 33.8 (Moderate)                 |
|  Formula: GL = (65 x 52) / 100                  |
|                                                  |
|  Serving Size                                    |
|  +--------------------------------------------+  |
|  | 1 plate (300g)                         [v] |  |
|  +--------------------------------------------+  |
|                                                  |
|  Meal Type *                                     |
|  +--------------------------------------------+  |
|  | Lunch                                  [v] |  |
|  +--------------------------------------------+  |
|                                                  |
|  Date & Time                                     |
|  +--------------------------------------------+  |
|  | Dec 27, 2025  1:00 PM                      |  |
|  +--------------------------------------------+  |
|                                                  |
|  [Cancel]                    [Save Entry]        |
|                                                  |
+--------------------------------------------------+
```

#### Activity Log Entry Form
```
+--------------------------------------------------+
|  Log Activity                                    |
+--------------------------------------------------+
|                                                  |
|  Activity Type *                                 |
|  +--------------------------------------------+  |
|  | Walking                                [v] |  |
|  +--------------------------------------------+  |
|  Options: Walking, Running, Swimming, Cycling,   |
|           Gym, Yoga, Sports, Other               |
|                                                  |
|  Duration (minutes) *                            |
|  +--------------------------------------------+  |
|  | 30                                         |  |
|  +--------------------------------------------+  |
|                                                  |
|  Intensity *                                     |
|  [Low]  [Moderate]  [High]                       |
|                                                  |
|  Date & Time                                     |
|  +--------------------------------------------+  |
|  | Dec 27, 2025  6:00 PM                      |  |
|  +--------------------------------------------+  |
|                                                  |
|  Notes                                           |
|  +--------------------------------------------+  |
|  | Evening walk around the block              |  |
|  +--------------------------------------------+  |
|                                                  |
|  [Cancel]                    [Save Activity]     |
|                                                  |
+--------------------------------------------------+
```

### 3.3.3 Settings Forms

#### Alert Settings Form
```
+--------------------------------------------------+
|  Glucose Alert Settings                          |
+--------------------------------------------------+
|                                                  |
|  High Glucose Threshold                          |
|  +--------------------------------------------+  |
|  | 180                               mg/dL    |  |
|  +--------------------------------------------+  |
|  Alert when reading exceeds this value           |
|                                                  |
|  Low Glucose Threshold                           |
|  +--------------------------------------------+  |
|  | 70                                mg/dL    |  |
|  +--------------------------------------------+  |
|  Alert when reading falls below this value       |
|                                                  |
|  Notification Methods                            |
|  [x] Email Alerts                                |
|  [x] Push Notifications                          |
|                                                  |
|  [Cancel]                    [Save Settings]     |
|                                                  |
+--------------------------------------------------+
```

#### Add Family Contact Form
```
+--------------------------------------------------+
|  Add Family Contact                              |
+--------------------------------------------------+
|                                                  |
|  Contact Name *                                  |
|  +--------------------------------------------+  |
|  | Ahmed Ali                                  |  |
|  +--------------------------------------------+  |
|                                                  |
|  Relationship *                                  |
|  +--------------------------------------------+  |
|  | Spouse                                 [v] |  |
|  +--------------------------------------------+  |
|                                                  |
|  Phone Number                                    |
|  +--------------------------------------------+  |
|  | +973 3XXX XXXX                             |  |
|  +--------------------------------------------+  |
|                                                  |
|  Email                                           |
|  +--------------------------------------------+  |
|  | ahmed.ali@example.com                      |  |
|  +--------------------------------------------+  |
|                                                  |
|  Notify for:                                     |
|  [x] High Glucose Alerts                         |
|  [x] Low Glucose Alerts                          |
|                                                  |
|  [Cancel]                    [Add Contact]       |
|                                                  |
+--------------------------------------------------+
```

### 3.3.4 Physician Input Forms

#### Schedule Appointment Form
```
+--------------------------------------------------+
|  Schedule Appointment                            |
+--------------------------------------------------+
|                                                  |
|  Patient *                                       |
|  +--------------------------------------------+  |
|  | Hussain Ali                            [v] |  |
|  +--------------------------------------------+  |
|                                                  |
|  Date *                                          |
|  +--------------------------------------------+  |
|  | January 5, 2026                    [cal]   |  |
|  +--------------------------------------------+  |
|                                                  |
|  Time *                                          |
|  +--------------------------------------------+  |
|  | 10:00 AM                               [v] |  |
|  +--------------------------------------------+  |
|                                                  |
|  Purpose *                                       |
|  +--------------------------------------------+  |
|  | Quarterly diabetes review                  |  |
|  +--------------------------------------------+  |
|                                                  |
|  Notes                                           |
|  +--------------------------------------------+  |
|  | Review recent glucose trends and adjust    |  |
|  | medication if needed.                      |  |
|  +--------------------------------------------+  |
|                                                  |
|  [Cancel]                [Create Appointment]    |
|                                                  |
+--------------------------------------------------+
```

---

## 3.4 BILINGUAL INTERFACE (English/Arabic)

### Language Toggle Implementation
```
+--------------------------------------------------+
|  Header                            [EN] [AR]     |
+--------------------------------------------------+
```

### Arabic Interface Example (RTL Layout)
```
+--------------------------------------------------+
|                              [AR] [EN]   راسية   |
+--------------------------------------------------+
|                                                  |
|                                    لوحة التحكم   |
|                                                  |
|  +--------------------------------------------+  |
|  |                     ملخص السكر اليوم       |  |
|  |                                            |  |
|  |                   mg/dL 142 :المتوسط       |  |
|  |              mg/dL 186 - 98 :النطاق        |  |
|  |                            5 :القراءات     |  |
|  +--------------------------------------------+  |
|                                                  |
+--------------------------------------------------+
```

---

## 3.5 RESPONSIVE DESIGN

### Desktop Layout (1920x1080)
```
+------+------------------------------------------+
|      |                                          |
| Side |          Main Content Area               |
| bar  |                                          |
|      |  +----------------+  +----------------+  |
| Nav  |  |  Card 1        |  |  Card 2        |  |
|      |  +----------------+  +----------------+  |
|      |                                          |
|      |  +------------------------------------+  |
|      |  |         Data Table / Chart         |  |
|      |  +------------------------------------+  |
|      |                                          |
+------+------------------------------------------+
```

### Mobile Layout (375x812)
```
+------------------------------------------+
| [Menu]  GenieSugar             [Profile] |
+------------------------------------------+
|                                          |
|  +------------------------------------+  |
|  |         Card 1 (Full Width)       |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  |         Card 2 (Full Width)       |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  |         Chart (Scrollable)        |  |
|  +------------------------------------+  |
|                                          |
+------------------------------------------+
| [Home] [Glucose] [Food] [Activity] [More]|
+------------------------------------------+
```

---

## 3.6 ACCESSIBILITY FEATURES

1. **Color Contrast**: WCAG 2.1 AA compliant contrast ratios
2. **Keyboard Navigation**: Full keyboard accessibility for all interactions
3. **Screen Reader Support**: ARIA labels on all interactive elements
4. **Font Sizing**: Minimum 16px for body text, scalable via browser settings
5. **Focus Indicators**: Visible focus states on all interactive elements
6. **Error Messages**: Clear, descriptive error messages with suggestions
7. **Loading States**: Skeleton screens and loading indicators

---

*End of GUI Design Section*
