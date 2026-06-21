from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import math
import asyncio
import httpx
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Optional, List
import uuid
from datetime import datetime, timezone

#from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

from seed_data import seed_all

from fastapi.middleware.cors import CORSMiddleware




ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
EMERGENT_PUSH_KEY = os.environ.get("EMERGENT_PUSH_KEY", "placeholder")
PUSH_BASE_URL = "https://integrations.emergentagent.com"

_push_client = httpx.AsyncClient(
    base_url=PUSH_BASE_URL,
    headers={"X-Push-Key": EMERGENT_PUSH_KEY},
    timeout=10.0,
)

app = FastAPI()
api_router = APIRouter(prefix="/api")

logger = logging.getLogger("schoolapp")
logging.basicConfig(level=logging.INFO)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- Models ----------------
class LoginBody(BaseModel):
    school_name: str
    student_name: str
    password: str


class LeaveBody(BaseModel):
    student_id: str
    from_date: str
    to_date: str
    reason: str


class ChatBody(BaseModel):
    student_id: str
    message: str
    session_id: Optional[str] = None


class RegisterPushBody(BaseModel):
    user_id: str
    platform: str
    device_token: str


class PayBody(BaseModel):
    fee_id: str


class PhotoBody(BaseModel):
    photo_url: str


def _clean(d):
    if d is None:
        return None
    d.pop("_id", None)
    return d


def _clean_many(items):
    return [_clean(dict(i)) for i in items]


# ---------------- Push helper ----------------
async def send_push(recipients, data, idempotency_key=None):
    if not recipients:
        return
    if "title" not in data or "message" not in data:
        return
    payload = {"recipients": recipients, "data": data}
    if idempotency_key:
        payload["$idempotency_key"] = idempotency_key
    try:
        resp = await _push_client.post("/api/v1/push/trigger", json=payload)
        if resp.status_code >= 400:
            logger.warning(f"Push trigger failed: {resp.status_code} {resp.text[:200]}")
    except Exception as e:
        logger.warning(f"Push trigger exception: {e}")

        

   
   


# ---------------- Routes ----------------
@api_router.get("/")
async def root():
    return {"status": "ok", "app": "School Parent Tracker"}


@api_router.get("/schools")
async def list_schools():
    rows = await db.schools.find({}, {"_id": 0}).to_list(50)
    return rows


@api_router.post("/auth/login")
async def login(body: LoginBody):
    school = await db.schools.find_one(
        {"name": {"$regex": f"^{body.school_name.strip()}$", "$options": "i"}}, {"_id": 0}
    )
    if not school:
        raise HTTPException(404, "School not found")
    student = await db.students.find_one(
        {
            "school_id": school["id"],
            "name": {"$regex": f"^{body.student_name.strip()}$", "$options": "i"},
        },
        {"_id": 0},
    )
    if not student:
        raise HTTPException(404, "Student not found in this school")
    if student.get("password") != body.password:
        raise HTTPException(401, "Incorrect password")
    return {"student": student, "school": school}


@api_router.get("/students")
async def list_students():
    """Helper endpoint to view demo credentials."""
    rows = await db.students.find({}, {"_id": 0}).to_list(50)
    return [
        {
            "name": r["name"],
            "school": r.get("school_name"),
            "class": r["class"],
            "section": r["section"],
            "password": r["password"],
        }
        for r in rows
    ]


@api_router.get("/student/{student_id}")
async def get_student(student_id: str):
    s = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not s:
        raise HTTPException(404, "Student not found")
    return s


@api_router.post("/student/{student_id}/photo")
async def update_student_photo(student_id: str, body: PhotoBody):
    res = await db.students.update_one(
        {"id": student_id}, {"$set": {"photo_url": body.photo_url}}
    )
    if res.matched_count == 0:
        raise HTTPException(404, "Student not found")
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    return student


@api_router.get("/homework/{student_id}")
async def get_homework(student_id: str):
    rows = await db.homework.find({"student_id": student_id}, {"_id": 0}).to_list(200)
    rows.sort(key=lambda x: x.get("due_date", ""))
    return rows


@api_router.get("/timetable/{student_id}")
async def get_timetable(student_id: str):
    rows = await db.timetable.find({"student_id": student_id}, {"_id": 0}).to_list(500)
    day_order = {"Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6}
    rows.sort(key=lambda x: (day_order.get(x.get("day", ""), 7), x.get("start_time", "")))
    return rows


@api_router.get("/exams/{student_id}")
async def get_exams(student_id: str):
    rows = await db.exams.find({"student_id": student_id}, {"_id": 0}).to_list(100)
    rows.sort(key=lambda x: x.get("date", ""))
    return rows


@api_router.get("/announcements/{school_id}")
async def get_announcements(school_id: str):
    rows = await db.announcements.find({"school_id": school_id}, {"_id": 0}).to_list(100)
    rows.sort(key=lambda x: x.get("date", ""), reverse=True)
    return rows


@api_router.get("/fees/{student_id}")
async def get_fees(student_id: str):
    rows = await db.fees.find({"student_id": student_id}, {"_id": 0}).to_list(100)
    rows.sort(key=lambda x: x.get("due_date", ""))
    total = sum(r["amount"] for r in rows)
    paid = sum(r["amount"] for r in rows if r["status"] == "paid")
    due = sum(r["amount"] for r in rows if r["status"] == "due")
    upcoming = sum(r["amount"] for r in rows if r["status"] == "upcoming")
    return {"items": rows, "total": total, "paid": paid, "due": due, "upcoming": upcoming}


@api_router.post("/fees/pay")
async def pay_fee(body: PayBody):
    fee = await db.fees.find_one({"id": body.fee_id}, {"_id": 0})
    if not fee:
        raise HTTPException(404, "Fee not found")
    today = datetime.now(timezone.utc).date().isoformat()
    await db.fees.update_one({"id": body.fee_id}, {"$set": {"status": "paid", "paid_on": today}})
    try:
        await send_push(
            [fee["student_id"]],
            {"title": "Fee Payment Received", "message": f"Payment of \u20b9{fee['amount']} for {fee['term']} confirmed."},
        )
    except Exception:
        pass
    return {"status": "paid", "fee_id": body.fee_id}


# Simple sim coords cache - bus moves around a fixed origin
_bus_step = {"i": 0}


def _simulated_position(base_lat, base_lng, step):
    # tiny ellipse around base
    angle = (step % 60) * (2 * math.pi / 60)
    dlat = 0.003 * math.cos(angle)
    dlng = 0.004 * math.sin(angle)
    return base_lat + dlat, base_lng + dlng


@api_router.get("/bus/{student_id}")
async def get_bus(student_id: str):
    bus = await db.bus_info.find_one({"student_id": student_id}, {"_id": 0})
    if not bus:
        raise HTTPException(404, "Bus info not found")
    _bus_step["i"] += 1
    lat, lng = _simulated_position(bus["current_lat"], bus["current_lng"], _bus_step["i"])
    bus["live_lat"] = lat
    bus["live_lng"] = lng
    bus["status"] = "En route"
    bus["eta_minutes"] = 8 + (_bus_step["i"] % 5)
    return bus


@api_router.get("/attendance/{student_id}")
async def get_attendance(student_id: str):
    rows = await db.attendance.find({"student_id": student_id}, {"_id": 0}).to_list(500)
    rows.sort(key=lambda x: x.get("date", ""), reverse=True)
    total_days = sum(1 for r in rows if r["status"] != "holiday")
    present = sum(1 for r in rows if r["status"] == "present")
    absent = sum(1 for r in rows if r["status"] == "absent")
    leave = sum(1 for r in rows if r["status"] == "leave")
    percent = round((present / total_days * 100) if total_days else 0, 1)
    return {
        "records": rows,
        "total_days": total_days,
        "present": present,
        "absent": absent,
        "leave": leave,
        "percent": percent,
    }


@api_router.get("/leaves/{student_id}")
async def get_leaves(student_id: str):
    rows = await db.leaves.find({"student_id": student_id}, {"_id": 0}).to_list(100)
    rows.sort(key=lambda x: x.get("applied_on", ""), reverse=True)
    return rows


@api_router.post("/leaves")
async def create_leave(body: LeaveBody):
    today = datetime.now(timezone.utc).date().isoformat()
    leave = {
        "id": str(uuid.uuid4()),
        "student_id": body.student_id,
        "from_date": body.from_date,
        "to_date": body.to_date,
        "reason": body.reason,
        "status": "pending",
        "applied_on": today,
    }
    await db.leaves.insert_one(dict(leave))
    try:
        await send_push(
            [body.student_id],
            {"title": "Leave Request Submitted", "message": "Your leave request has been sent to the class teacher."},
        )
    except Exception:
        pass
    return leave


@api_router.get("/reminders/{student_id}")
async def get_reminders(student_id: str):
    today = datetime.now(timezone.utc).date().isoformat()
    fees = await db.fees.find({"student_id": student_id, "status": "due"}, {"_id": 0}).to_list(20)
    exams = await db.exams.find({"student_id": student_id, "date": {"$gte": today}}, {"_id": 0}).to_list(20)
    homework = await db.homework.find({"student_id": student_id, "due_date": {"$gte": today}}, {"_id": 0}).to_list(20)
    return {
        "fees": fees[:3],
        "exams": sorted(exams, key=lambda x: x["date"])[:3],
        "homework": sorted(homework, key=lambda x: x["due_date"])[:3],
    }


# ---------------- AI Chat ----------------
@api_router.get("/ai/messages/{student_id}")
async def get_ai_messages(student_id: str):
    rows = await db.chat_messages.find({"student_id": student_id}, {"_id": 0}).to_list(500)
    rows.sort(key=lambda x: x.get("created_at", ""))
    return rows


@api_router.post("/ai/chat")
async def ai_chat(body: ChatBody):
    student = await db.students.find_one({"id": body.student_id}, {"_id": 0})
    if not student:
        raise HTTPException(404, "Student not found")
    session_id = body.session_id or f"ai-{body.student_id}"

    # Save user message
    user_msg = {
        "id": str(uuid.uuid4()),
        "student_id": body.student_id,
        "session_id": session_id,
        "role": "user",
        "content": body.message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.chat_messages.insert_one(dict(user_msg))

    # Load history (last 20 messages, excluding the one just inserted from being sent twice)
    history = await db.chat_messages.find(
        {"session_id": session_id}, {"_id": 0}
    ).to_list(50)
    history.sort(key=lambda x: x.get("created_at", ""))

    system_msg = (
        f"You are a friendly AI Homework Helper for {student['name']}, a Class {student['class']} student. "
        "Explain concepts simply, step by step, in a tutoring style. Use age-appropriate language. "
        "Encourage the student to think, ask guiding questions, and never just give answers. Keep responses concise."
    )

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_msg,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    # Replay previous turns
    prev_turns = [m for m in history if m["id"] != user_msg["id"]]
    for m in prev_turns:
        if m["role"] == "user":
            try:
                await chat.send_message(UserMessage(text=m["content"]))
            except Exception as e:
                logger.warning(f"history replay failed: {e}")
                break

    async def event_generator():
        full_text = ""
        try:
            async for event in chat.stream_message(UserMessage(text=body.message)):
                if isinstance(event, TextDelta):
                    full_text += event.content
                    # SSE format
                    yield f"data: {event.content}\n\n".replace("\n\n", "\u0000").replace("\u0000", "\n\n")
                elif isinstance(event, StreamDone):
                    break
        except Exception as e:
            logger.error(f"AI chat error: {e}")
            full_text = full_text or f"Sorry, I couldn't process that right now. ({e})"
            yield f"data: {full_text}\n\n"

        # save assistant message
        assistant_msg = {
            "id": str(uuid.uuid4()),
            "student_id": body.student_id,
            "session_id": session_id,
            "role": "assistant",
            "content": full_text,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.chat_messages.insert_one(dict(assistant_msg))
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# Simpler non-streaming endpoint for clients that don't handle SSE well (web)
@api_router.post("/ai/chat-sync")
async def ai_chat_sync(body: ChatBody):
    student = await db.students.find_one({"id": body.student_id}, {"_id": 0})
    if not student:
        raise HTTPException(404, "Student not found")
    session_id = body.session_id or f"ai-{body.student_id}"

    user_msg = {
        "id": str(uuid.uuid4()),
        "student_id": body.student_id,
        "session_id": session_id,
        "role": "user",
        "content": body.message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.chat_messages.insert_one(dict(user_msg))

    history = await db.chat_messages.find({"session_id": session_id}, {"_id": 0}).to_list(50)
    history.sort(key=lambda x: x.get("created_at", ""))

    system_msg = (
        f"You are a friendly AI Homework Helper for {student['name']}, a Class {student['class']} student. "
        "Explain concepts simply, step by step. Encourage the student to think. Keep responses concise (under 200 words)."
    )

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_msg,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    prev_turns = [m for m in history if m["id"] != user_msg["id"]]
    for m in prev_turns[:-1]:
        if m["role"] == "user":
            try:
                await chat.send_message(UserMessage(text=m["content"]))
            except Exception:
                break

    try:
        reply = await chat.send_message(UserMessage(text=body.message))
        reply_text = reply if isinstance(reply, str) else str(reply)
    except Exception as e:
        logger.error(f"ai_chat_sync error: {e}")
        reply_text = "I'm having trouble right now. Please try again in a moment."

    assistant_msg = {
        "id": str(uuid.uuid4()),
        "student_id": body.student_id,
        "session_id": session_id,
        "role": "assistant",
        "content": reply_text,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.chat_messages.insert_one(dict(assistant_msg))
    return {"reply": reply_text, "message": assistant_msg}


# ---------------- Push ----------------
@api_router.post("/register-push", status_code=201)
async def register_push(body: RegisterPushBody):
    try:
        resp = await _push_client.post("/api/v1/push/users/register", json=body.model_dump())
        if resp.status_code in (401, 403):
            # Placeholder/missing key — by design before deploy. Don't crash.
            return {"status": "skipped", "reason": "push key not configured"}
        if resp.status_code >= 500:
            return {"status": "skipped", "reason": "push provider unavailable"}
        resp.raise_for_status()
    except HTTPException:
        raise
    except Exception as e:
        logger.warning(f"register-push failed: {e}")
        return {"status": "skipped", "reason": str(e)}
    return {"status": "registered"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    # Seed only if empty
    count = await db.students.count_documents({})
    if count == 0:
        logger.info("Seeding demo data...")
        await seed_all(db)
        logger.info("Seed complete.")
    else:
        logger.info(f"DB already seeded ({count} students).")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    await _push_client.aclose()
