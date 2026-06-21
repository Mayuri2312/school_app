"""End-to-end backend test suite for EduTrack School Parent App."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = (
    os.environ.get("EXPO_PUBLIC_BACKEND_URL")
    or os.environ.get("EXPO_BACKEND_URL")
    or "https://school-parent-hub-6.preview.emergentagent.com"
).rstrip("/")

STUDENT_ID = "stu-001"
SCHOOL_ID = "school-greenwood-001"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# --------- Health & schools ---------
def test_health(s):
    r = s.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


def test_list_schools(s):
    r = s.get(f"{BASE_URL}/api/schools")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) >= 1
    assert any("Greenwood" in (x.get("name") or "") for x in data)


# --------- Auth login ---------
class TestAuth:
    def test_login_valid(self, s):
        r = s.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "school_name": "Greenwood International",
                "student_name": "Aarav Sharma",
                "password": "aarav123",
            },
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["student"]["id"] == STUDENT_ID
        assert body["school"]["id"] == SCHOOL_ID

    def test_login_wrong_password(self, s):
        r = s.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "school_name": "Greenwood International",
                "student_name": "Aarav Sharma",
                "password": "wrongpw",
            },
        )
        assert r.status_code == 401

    def test_login_unknown_school(self, s):
        r = s.post(
            f"{BASE_URL}/api/auth/login",
            json={"school_name": "Nope", "student_name": "Aarav Sharma", "password": "aarav123"},
        )
        assert r.status_code == 404

    def test_login_unknown_student(self, s):
        r = s.post(
            f"{BASE_URL}/api/auth/login",
            json={"school_name": "Greenwood International", "student_name": "Ghost", "password": "x"},
        )
        assert r.status_code == 404


# --------- Student profile + curriculum data ---------
class TestStudentData:
    def test_student(self, s):
        r = s.get(f"{BASE_URL}/api/student/{STUDENT_ID}")
        assert r.status_code == 200
        d = r.json()
        assert d["name"] == "Aarav Sharma"
        assert "_id" not in d

    def test_homework(self, s):
        r = s.get(f"{BASE_URL}/api/homework/{STUDENT_ID}")
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list) and len(rows) >= 1
        assert all("due_date" in x and "subject" in x for x in rows)

    def test_timetable(self, s):
        r = s.get(f"{BASE_URL}/api/timetable/{STUDENT_ID}")
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list) and len(rows) >= 1
        assert all("day" in x and "start_time" in x for x in rows)
        days = {x["day"] for x in rows}
        assert {"Monday", "Tuesday"}.issubset(days)

    def test_exams(self, s):
        r = s.get(f"{BASE_URL}/api/exams/{STUDENT_ID}")
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list) and len(rows) >= 1

    def test_announcements(self, s):
        r = s.get(f"{BASE_URL}/api/announcements/{SCHOOL_ID}")
        assert r.status_code == 200
        rows = r.json()
        assert isinstance(rows, list) and len(rows) >= 1


# --------- Fees ---------
class TestFees:
    def test_fees_summary(self, s):
        r = s.get(f"{BASE_URL}/api/fees/{STUDENT_ID}")
        assert r.status_code == 200
        d = r.json()
        assert {"items", "total", "paid", "due"} <= set(d.keys())
        # Backend's `due` only counts items with status=="due"; total may also include
        # "upcoming"/"overdue" statuses. Just assert paid+due <= total.
        assert d["paid"] + d["due"] <= d["total"]

    def test_pay_fee_updates_status(self, s):
        r = s.get(f"{BASE_URL}/api/fees/{STUDENT_ID}")
        items = r.json()["items"]
        due_items = [i for i in items if i["status"] == "due"]
        if not due_items:
            pytest.skip("No due fee to pay")
        fee_id = due_items[0]["id"]
        pay = s.post(f"{BASE_URL}/api/fees/pay", json={"fee_id": fee_id})
        assert pay.status_code == 200
        assert pay.json()["status"] == "paid"
        # Verify persisted
        r2 = s.get(f"{BASE_URL}/api/fees/{STUDENT_ID}")
        updated = next(i for i in r2.json()["items"] if i["id"] == fee_id)
        assert updated["status"] == "paid"

    def test_pay_fee_not_found(self, s):
        r = s.post(f"{BASE_URL}/api/fees/pay", json={"fee_id": "no-such-fee"})
        assert r.status_code == 404


# --------- Bus simulation ---------
class TestBus:
    def test_bus_simulation_moves(self, s):
        r1 = s.get(f"{BASE_URL}/api/bus/{STUDENT_ID}")
        assert r1.status_code == 200
        d1 = r1.json()
        assert "live_lat" in d1 and "live_lng" in d1
        time.sleep(0.2)
        r2 = s.get(f"{BASE_URL}/api/bus/{STUDENT_ID}")
        d2 = r2.json()
        # Position should differ between calls
        assert (d1["live_lat"], d1["live_lng"]) != (d2["live_lat"], d2["live_lng"])
        assert d2["status"] == "En route"


# --------- Attendance & Leaves ---------
class TestAttendance:
    def test_attendance(self, s):
        r = s.get(f"{BASE_URL}/api/attendance/{STUDENT_ID}")
        assert r.status_code == 200
        d = r.json()
        assert {"records", "percent", "present", "absent"} <= set(d.keys())
        assert isinstance(d["percent"], (int, float))

    def test_leaves_get(self, s):
        r = s.get(f"{BASE_URL}/api/leaves/{STUDENT_ID}")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_leave_create_and_verify(self, s):
        reason = f"TEST_{uuid.uuid4().hex[:8]}"
        r = s.post(
            f"{BASE_URL}/api/leaves",
            json={
                "student_id": STUDENT_ID,
                "from_date": "2026-02-01",
                "to_date": "2026-02-02",
                "reason": reason,
            },
        )
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["status"] == "pending"
        # Verify persisted
        rows = s.get(f"{BASE_URL}/api/leaves/{STUDENT_ID}").json()
        assert any(x["reason"] == reason for x in rows)


# --------- Reminders ---------
def test_reminders(s):
    r = s.get(f"{BASE_URL}/api/reminders/{STUDENT_ID}")
    assert r.status_code == 200
    d = r.json()
    assert {"fees", "exams", "homework"} <= set(d.keys())


# --------- AI Chat ---------
class TestAI:
    def test_ai_chat_sync_and_history(self, s):
        msg = f"What is 2+2? (test {uuid.uuid4().hex[:6]})"
        r = s.post(
            f"{BASE_URL}/api/ai/chat-sync",
            json={"student_id": STUDENT_ID, "message": msg},
            timeout=60,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert "reply" in body and isinstance(body["reply"], str) and len(body["reply"]) > 0
        # History should contain user msg + assistant reply
        hist = s.get(f"{BASE_URL}/api/ai/messages/{STUDENT_ID}").json()
        assert any(m["content"] == msg and m["role"] == "user" for m in hist)
        assert any(m["role"] == "assistant" for m in hist)


# --------- Push ---------
def test_register_push_does_not_crash(s):
    r = s.post(
        f"{BASE_URL}/api/register-push",
        json={"user_id": STUDENT_ID, "platform": "web", "device_token": "TEST_token_123"},
    )
    # Expected to be 201 registered OR 200 skipped (placeholder key), but never 5xx
    assert r.status_code in (200, 201), f"Unexpected: {r.status_code} {r.text}"
    body = r.json()
    assert body.get("status") in ("registered", "skipped")
