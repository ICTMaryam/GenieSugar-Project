# backend/app.py - Cleaned + Fixed GenieSugar Backend (Option A)
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from dateutil import parser as dtparser
import os
import requests
import json
import html

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# -------------------- CONFIG --------------------
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///geniesugar.db")
JWT_SECRET = os.getenv("JWT_SECRET_KEY", "change-me-in-env")
OPENAI_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")  # change if you want

app.config.update(
    SQLALCHEMY_DATABASE_URI=DATABASE_URL,
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
    JWT_SECRET_KEY=JWT_SECRET,
    JWT_ACCESS_TOKEN_EXPIRES=timedelta(days=7),
)

db = SQLAlchemy(app)
jwt = JWTManager(app)

# -------------------- MODELS --------------------
class User(db.Model):
    __tablename__ = "users"
    user_id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20))
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="patient")
    date_of_birth = db.Column(db.Date)
    is_verified = db.Column(db.Boolean, default=False)
    medical_history = db.Column(db.Text)
    dexcom_id = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    glucose_readings = db.relationship(
        "GlucoseReading", backref="user", lazy=True, cascade="all, delete-orphan"
    )
    food_logs = db.relationship(
        "FoodLog", backref="user", lazy=True, cascade="all, delete-orphan"
    )

class GlucoseReading(db.Model):
    __tablename__ = "glucose_readings"
    reading_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False, index=True)
    reading_value = db.Column(db.Float, nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), index=True)
    context = db.Column(db.String(50))
    notes = db.Column(db.Text)
    is_synced = db.Column(db.Boolean, default=False)

class FoodLog(db.Model):
    __tablename__ = "food_logs"
    log_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False, index=True)
    food_name = db.Column(db.String(200), nullable=False)
    quantity = db.Column(db.String(50))
    calories = db.Column(db.Integer)
    carbs = db.Column(db.Float)
    protein = db.Column(db.Float)
    meal_type = db.Column(db.String(20))
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)

class Appointment(db.Model):
    __tablename__ = "appointments"
    appointment_id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey("users.user_id"))
    appointment_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default="scheduled")
    notes = db.Column(db.Text)

class Comment(db.Model):
    __tablename__ = "comments"
    comment_id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)
    provider_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)
    comment_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))


# -------------------- HELPERS --------------------
def api_error(message, code=400):
    return jsonify({"success": False, "error": message}), code

def require_json(*fields):
    data = request.get_json(silent=True) or {}
    missing = [f for f in fields if f not in data or data[f] in (None, "", [])]
    if missing:
        return None, api_error(f"Missing fields: {', '.join(missing)}", 400)
    return data, None

def send_email(to_email, subject, html_content):
    """Send email via SendGrid (safe if keys missing)."""
    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail

        key = os.getenv("SENDGRID_API_KEY")
        if not key:
            print("SendGrid key missing; skipping email.")
            return False

        sg = sendgrid.SendGridAPIClient(api_key=key)
        message = Mail(
            from_email=os.getenv("SENDGRID_FROM_EMAIL", "noreply@geniesugar.com"),
            to_emails=to_email,
            subject=subject,
            html_content=html_content,
        )
        response = sg.send(message)
        return response.status_code == 202
    except Exception as e:
        print(f"Email error: {e}")
        return False

def send_sms(to_phone, message):
    """Send SMS via Twilio (safe if keys missing)."""
    try:
        from twilio.rest import Client
        sid = os.getenv("TWILIO_ACCOUNT_SID")
        token = os.getenv("TWILIO_AUTH_TOKEN")
        from_num = os.getenv("TWILIO_PHONE_NUMBER")
        if not (sid and token and from_num):
            print("Twilio keys missing; skipping SMS.")
            return False

        client = Client(sid, token)
        client.messages.create(body=message, from_=from_num, to=to_phone)
        return True
    except Exception as e:
        print(f"SMS error: {e}")
        return False

def sync_dexcom_data(user_id):
    """
    Sync glucose data from Dexcom v3 /egvs.
    Needs OAuth bearer token in DEXCOM_ACCESS_TOKEN.
    Dexcom requires ISO-8601 UTC startDate/endDate and <=30-day window. :contentReference[oaicite:2]{index=2}
    """
    try:
        user = User.query.get(user_id)
        if not user or not user.dexcom_id:
            return {"success": False, "error": "Dexcom not connected"}

        access_token = os.getenv("DEXCOM_ACCESS_TOKEN")
        if not access_token:
            return {"success": False, "error": "Missing Dexcom access token"}

        headers = {"Authorization": f"Bearer {access_token}"}

        # last 24 hours (well within v3 30-day window)
        end_dt = datetime.now(timezone.utc)
        start_dt = end_dt - timedelta(hours=24)

        start_date = start_dt.isoformat().replace("+00:00", "Z")
        end_date = end_dt.isoformat().replace("+00:00", "Z")

        base_url = os.getenv("DEXCOM_API_URL", "https://sandbox-api.dexcom.com")
        url = f"{base_url}/v3/users/self/egvs"
        params = {"startDate": start_date, "endDate": end_date}

        response = requests.get(url, headers=headers, params=params, timeout=20)

        if response.status_code != 200:
            return {"success": False, "error": f"Dexcom API error: {response.status_code}"}

        data = response.json()
        readings_added = 0

        for reading in data.get("egvs", []):
            system_time = reading.get("systemTime")
            if not system_time:
                continue

            ts = dtparser.isoparse(system_time).astimezone(timezone.utc)

            existing = GlucoseReading.query.filter_by(
                user_id=user_id,
                timestamp=ts
            ).first()

            if not existing:
                new_reading = GlucoseReading(
                    user_id=user_id,
                    reading_value=reading.get("value"),
                    timestamp=ts,
                    is_synced=True
                )
                db.session.add(new_reading)
                readings_added += 1

        db.session.commit()
        return {"success": True, "readings_added": readings_added}
    except Exception as e:
        db.session.rollback()
        return {"success": False, "error": str(e)}

def get_ai_response(message, user_context=None):
    """
    OpenAI response using current Python SDK client style. :contentReference[oaicite:3]{index=3}
    """
    if not OPENAI_KEY:
        return {"success": False, "response": "OpenAI API key not configured."}

    try:
        from openai import OpenAI
        client = OpenAI(api_key=OPENAI_KEY)

        system_prompt = (
            "You are a helpful diabetes management assistant. "
            "Provide accurate, supportive advice about diabetes care, nutrition, exercise, and medication. "
            "Always remind users to consult their healthcare provider for medical decisions."
        )

        if user_context:
            system_prompt += f"\nUser context: {json.dumps(user_context)}"

        resp = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message},
            ],
            max_tokens=500,
            temperature=0.7,
        )

        return {"success": True, "response": resp.choices[0].message.content}
    except Exception as e:
        return {
            "success": False,
            "response": f"I'm having trouble connecting right now. Please try again later. Error: {str(e)}"
        }


# -------------------- HEALTH --------------------
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"success": True, "status": "ok", "time": datetime.now(timezone.utc).isoformat()})


# -------------------- AUTH --------------------
@app.route("/api/auth/register", methods=["POST"])
def register():
    data, err = require_json("full_name", "email", "password")
    if err:
        return err

    try:
        if User.query.filter_by(email=data["email"]).first():
            return api_error("Email already registered", 400)

        dob = None
        if data.get("date_of_birth"):
            dob = datetime.strptime(data["date_of_birth"], "%Y-%m-%d").date()

        user = User(
            full_name=data["full_name"],
            email=data["email"].lower().strip(),
            phone=data.get("phone"),
            password_hash=generate_password_hash(data["password"]),
            role=data.get("role", "patient"),
            date_of_birth=dob,
        )
        db.session.add(user)
        db.session.commit()

        # Send welcome email
        welcome_email_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Welcome to GenieSugar! 🎉</h1>
                                </td>
                            </tr>
                            
                            <!-- Content -->
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h2 style="color: #1e3a8a; margin: 0 0 20px 0; font-size: 24px;">
                                        Hi {html.escape(user.full_name)}! 👋
                                    </h2>
                                    
                                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                        Thank you for joining GenieSugar! Your account has been successfully created.
                                    </p>
                                    
                                    <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                        You can now start managing your diabetes with our smart features:
                                    </p>
                                    
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="padding: 10px 0;">
                                                <p style="margin: 0; color: #333333; font-size: 15px;">
                                                    ✅ Track your glucose levels in real-time
                                                </p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 10px 0;">
                                                <p style="margin: 0; color: #333333; font-size: 15px;">
                                                    ✅ Log meals and track nutrition
                                                </p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 10px 0;">
                                                <p style="margin: 0; color: #333333; font-size: 15px;">
                                                    ✅ Get AI-powered health insights
                                                </p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 10px 0;">
                                                <p style="margin: 0; color: #333333; font-size: 15px;">
                                                    ✅ Connect with your healthcare team
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <div style="margin: 30px 0; padding: 20px; background-color: #e0f2fe; border-left: 4px solid #1e40af; border-radius: 5px;">
                                        <p style="margin: 0; color: #1e3a8a; font-size: 15px; font-weight: 600;">
                                            Ready to get started?
                                        </p>
                                        <p style="margin: 10px 0 0 0; color: #333333; font-size: 14px;">
                                            Log in to your account and start your diabetes management journey today!
                                        </p>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                                    <p style="margin: 0; color: #64748b; font-size: 12px;">
                                        © 2025 GenieSugar. All rights reserved.
                                    </p>
                                    <p style="margin: 10px 0 0 0; color: #64748b; font-size: 12px;">
                                        Smart Diabetes Management System
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        """
        
        send_email(
            user.email,
            "Welcome to GenieSugar! 🎉",
            welcome_email_html
        )

        if user.phone:
            send_sms(user.phone, f"Welcome to GenieSugar, {user.full_name}! Your account is ready.")

        return jsonify({
            "success": True, 
            "message": "Registration successful!", 
            "user_id": user.user_id,
            "user": {
                "id": user.user_id,
                "name": user.full_name,
                "email": user.email,
                "role": user.role
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return api_error(str(e), 500)

@app.route("/api/auth/login", methods=["POST"])
def login():
    data, err = require_json("email", "password")
    if err:
        return err

    try:
        user = User.query.filter_by(email=data["email"].lower().strip()).first()
        if not user or not check_password_hash(user.password_hash, data["password"]):
            return api_error("Invalid credentials", 401)

        token = create_access_token(identity=user.user_id)

        send_email(
            user.email,
            "New Login to Your GenieSugar Account",
            f"Hi {html.escape(user.full_name)}, you just logged in to GenieSugar. If this wasn't you, secure your account.",
        )

        return jsonify({
            "success": True,
            "token": token,
            "user": {
                "id": user.user_id,
                "name": user.full_name,
                "email": user.email,
                "role": user.role
            }
        }), 200
    except Exception as e:
        return api_error(str(e), 500)


# -------------------- GLUCOSE --------------------
@app.route("/api/glucose", methods=["GET"])
@jwt_required()
def get_glucose_readings():
    try:
        user_id = get_jwt_identity()
        days = request.args.get("days", 7, type=int)
        start_date = datetime.now(timezone.utc) - timedelta(days=days)

        readings = (GlucoseReading.query
            .filter(GlucoseReading.user_id == user_id, GlucoseReading.timestamp >= start_date)
            .order_by(GlucoseReading.timestamp.desc())
            .all()
        )

        return jsonify({
            "success": True,
            "readings": [{
                "id": r.reading_id,
                "value": round(r.reading_value, 1),
                "timestamp": r.timestamp.isoformat(),
                "context": r.context,
                "notes": r.notes,
                "synced": r.is_synced
            } for r in readings]
        }), 200

    except Exception as e:
        return api_error(str(e), 500)

@app.route("/api/glucose", methods=["POST"])
@jwt_required()
def add_glucose_reading():
    data, err = require_json("reading_value")
    if err:
        return err

    try:
        user_id = get_jwt_identity()

        reading = GlucoseReading(
            user_id=user_id,
            reading_value=float(data["reading_value"]),
            context=data.get("context"),
            notes=data.get("notes"),
            timestamp=datetime.now(timezone.utc)
        )
        db.session.add(reading)
        db.session.commit()

        user = User.query.get(user_id)
        val = reading.reading_value

        if val < 70:
            alert_msg = f"⚠️ LOW GLUCOSE ALERT: {val} mg/dL - Take fast-acting carbs and recheck soon."
            send_email(user.email, "Critical Low Glucose Alert", f"<h2>{html.escape(alert_msg)}</h2>")
            if user.phone:
                send_sms(user.phone, alert_msg)

        elif val > 200:
            alert_msg = f"⚠️ HIGH GLUCOSE ALERT: {val} mg/dL - Monitor closely and contact your doctor if persistent."
            send_email(user.email, "Critical High Glucose Alert", f"<h2>{html.escape(alert_msg)}</h2>")
            if user.phone:
                send_sms(user.phone, alert_msg)

        return jsonify({"success": True, "reading_id": reading.reading_id}), 201

    except Exception as e:
        db.session.rollback()
        return api_error(str(e), 500)

@app.route("/api/glucose/sync-dexcom", methods=["POST"])
@jwt_required()
def sync_dexcom():
    user_id = get_jwt_identity()
    result = sync_dexcom_data(user_id)
    return jsonify(result), 200 if result.get("success") else 400


# -------------------- DOCTOR --------------------
@app.route("/api/doctor/patients", methods=["GET"])
@jwt_required()
def get_doctor_patients():
    try:
        # In a real app you'd check role == doctor here
        patients = User.query.filter_by(role="patient").all()

        patient_list = []
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)

        for patient in patients:
            readings = GlucoseReading.query.filter(
                GlucoseReading.user_id == patient.user_id,
                GlucoseReading.timestamp >= seven_days_ago
            ).all()

            avg_glucose = None
            last_reading = None
            if readings:
                values = [r.reading_value for r in readings]
                avg_glucose = sum(values) / len(values)
                last_reading = readings[-1].reading_value

            patient_list.append({
                "id": patient.user_id,
                "name": patient.full_name,
                "email": patient.email,
                "phone": patient.phone,
                "last_reading": round(last_reading, 1) if last_reading else None,
                "avg_glucose": round(avg_glucose, 1) if avg_glucose else None,
                "readings_count": len(readings),
            })

        return jsonify({"success": True, "patients": patient_list}), 200

    except Exception as e:
        return api_error(str(e), 500)

@app.route("/api/doctor/patients/<int:patient_id>/comments", methods=["POST"])
@jwt_required()
def add_doctor_comment(patient_id):
    data, err = require_json("comment_text")
    if err:
        return err

    try:
        doctor_id = get_jwt_identity()
        safe_text = html.escape(data["comment_text"])

        comment = Comment(
            patient_id=patient_id,
            provider_id=doctor_id,
            comment_text=data["comment_text"],
        )
        db.session.add(comment)
        db.session.commit()

        patient = User.query.get(patient_id)
        doctor = User.query.get(doctor_id)

        send_email(
            patient.email,
            "New Message from Your Doctor",
            f"""
            <h2>New Medical Update</h2>
            <p>Dr. {html.escape(doctor.full_name)} added a comment:</p>
            <div style="background:#E3F2FD;padding:20px;border-left:4px solid #1565A6;">
              <p>{safe_text}</p>
            </div>
            """,
        )

        return jsonify({"success": True, "comment_id": comment.comment_id}), 201

    except Exception as e:
        db.session.rollback()
        return api_error(str(e), 500)


# -------------------- AI CHAT --------------------
@app.route("/api/ai/chat", methods=["POST"])
@jwt_required()
def ai_chat():
    data, err = require_json("message")
    if err:
        return err

    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        recent_readings = (GlucoseReading.query
            .filter_by(user_id=user_id)
            .order_by(GlucoseReading.timestamp.desc())
            .limit(5).all()
        )

        context = {
            "user_name": user.full_name,
            "recent_glucose": [r.reading_value for r in recent_readings],
        }

        result = get_ai_response(data["message"], context)
        return jsonify(result), 200

    except Exception:
        return jsonify({"success": False, "response": "Error processing request"}), 500


# -------------------- FOOD LOGS --------------------
@app.route("/api/food-logs", methods=["GET", "POST"])
@jwt_required()
def food_logs():
    user_id = get_jwt_identity()

    if request.method == "GET":
        logs = (FoodLog.query
            .filter_by(user_id=user_id)
            .order_by(FoodLog.timestamp.desc())
            .limit(50).all()
        )

        return jsonify({
            "success": True,
            "logs": [{
                "id": log.log_id,
                "food_name": log.food_name,
                "quantity": log.quantity,
                "calories": log.calories,
                "carbs": log.carbs,
                "protein": log.protein,
                "meal_type": log.meal_type,
                "timestamp": log.timestamp.isoformat(),
            } for log in logs]
        }), 200

    # POST
    data, err = require_json("food_name")
    if err:
        return err

    try:
        log = FoodLog(
            user_id=user_id,
            food_name=data["food_name"],
            quantity=data.get("quantity"),
            calories=data.get("calories"),
            carbs=data.get("carbs"),
            protein=data.get("protein"),
            meal_type=data.get("meal_type"),
            timestamp=datetime.now(timezone.utc),
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({"success": True, "log_id": log.log_id}), 201

    except Exception as e:
        db.session.rollback()
        return api_error(str(e), 500)


# -------------------- INIT DB --------------------
with app.app_context():
    db.create_all()
    print("✅ Database initialized!")

if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_ENV", "").lower() != "production"
    app.run(debug=debug_mode, host="0.0.0.0", port=8000)