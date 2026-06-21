"""Seed demo data for the school parent app."""
from datetime import datetime, timezone, timedelta
import uuid

SCHOOL_ID = "school-greenwood-001"
SCHOOL_NAME = "Greenwood International"

# Students with auto-generated passwords
STUDENTS = [
    {
        "id": "stu-001",
        "school_id": SCHOOL_ID,
        "school_name": SCHOOL_NAME,
        "name": "Aarav Sharma",
        "class": "5",
        "section": "A",
        "roll_number": "12",
        "password": "aarav123",
        "parent_name": "Mr. Rajesh Sharma",
        "parent_phone": "+91 98765 43210",
        "avatar_color": "#5C785A",
        "photo_url": "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=facearea&facepad=2.5&w=400&h=400&q=80",
        "dob": "2014-03-15",
        "admission_no": "ADM2020-0123",
    },
    {
        "id": "stu-002",
        "school_id": SCHOOL_ID,
        "school_name": SCHOOL_NAME,
        "name": "Priya Patel",
        "class": "7",
        "section": "B",
        "roll_number": "08",
        "password": "priya123",
        "parent_name": "Mrs. Anita Patel",
        "parent_phone": "+91 98765 11220",
        "avatar_color": "#B87B2E",
        "photo_url": "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?auto=format&fit=facearea&facepad=2.5&w=400&h=400&q=80",
        "dob": "2012-08-22",
        "admission_no": "ADM2018-0089",
    },
    {
        "id": "stu-003",
        "school_id": SCHOOL_ID,
        "school_name": SCHOOL_NAME,
        "name": "Rohan Mehta",
        "class": "3",
        "section": "A",
        "roll_number": "21",
        "password": "rohan123",
        "parent_name": "Mr. Vikram Mehta",
        "parent_phone": "+91 98123 45678",
        "avatar_color": "#4E706F",
        "photo_url": "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=facearea&facepad=2.5&w=400&h=400&q=80",
        "dob": "2016-11-05",
        "admission_no": "ADM2022-0201",
    },
]


def _today_iso():
    return datetime.now(timezone.utc).date().isoformat()


def homework_for(student_id, cls):
    today = datetime.now(timezone.utc).date()
    items = [
        {
            "id": f"hw-{student_id}-1",
            "student_id": student_id,
            "subject": "Mathematics",
            "title": "Fractions Worksheet",
            "description": "Complete pages 24-26 from the workbook. Solve all addition and subtraction problems on fractions with unlike denominators.",
            "assigned_date": today.isoformat(),
            "due_date": (today + timedelta(days=1)).isoformat(),
            "teacher": "Ms. Kavita Iyer",
            "status": "pending",
        },
        {
            "id": f"hw-{student_id}-2",
            "student_id": student_id,
            "subject": "Science",
            "title": "Plant Cell Diagram",
            "description": "Draw a labelled diagram of a plant cell and write functions of any 5 organelles.",
            "assigned_date": today.isoformat(),
            "due_date": (today + timedelta(days=2)).isoformat(),
            "teacher": "Mr. Arjun Rao",
            "status": "pending",
        },
        {
            "id": f"hw-{student_id}-3",
            "student_id": student_id,
            "subject": "English",
            "title": "Read Chapter 4",
            "description": "Read 'The Magic Garden' and answer questions 1 to 5 in your notebook.",
            "assigned_date": (today - timedelta(days=1)).isoformat(),
            "due_date": today.isoformat(),
            "teacher": "Mrs. Sunita Joshi",
            "status": "pending",
        },
        {
            "id": f"hw-{student_id}-4",
            "student_id": student_id,
            "subject": "Hindi",
            "title": "Essay Writing",
            "description": "Write a 150-word essay on 'My Favourite Festival' in Hindi.",
            "assigned_date": (today - timedelta(days=2)).isoformat(),
            "due_date": (today + timedelta(days=3)).isoformat(),
            "teacher": "Mr. Mohan Verma",
            "status": "pending",
        },
    ]
    return items


def timetable_for(student_id):
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    schedule = {
        "Monday": [("08:00", "08:45", "English", "Mrs. Joshi"), ("08:50", "09:35", "Mathematics", "Ms. Iyer"), ("09:40", "10:25", "Science", "Mr. Rao"), ("10:25", "10:45", "Break", ""), ("10:45", "11:30", "Hindi", "Mr. Verma"), ("11:35", "12:20", "Social Studies", "Mrs. Nair"), ("12:20", "13:00", "Lunch", ""), ("13:00", "13:45", "Computer", "Mr. Khan")],
        "Tuesday": [("08:00", "08:45", "Mathematics", "Ms. Iyer"), ("08:50", "09:35", "English", "Mrs. Joshi"), ("09:40", "10:25", "Hindi", "Mr. Verma"), ("10:25", "10:45", "Break", ""), ("10:45", "11:30", "Science", "Mr. Rao"), ("11:35", "12:20", "Art", "Ms. Pillai"), ("12:20", "13:00", "Lunch", ""), ("13:00", "13:45", "P.E.", "Mr. Singh")],
        "Wednesday": [("08:00", "08:45", "Science", "Mr. Rao"), ("08:50", "09:35", "Mathematics", "Ms. Iyer"), ("09:40", "10:25", "English", "Mrs. Joshi"), ("10:25", "10:45", "Break", ""), ("10:45", "11:30", "Social Studies", "Mrs. Nair"), ("11:35", "12:20", "Music", "Mr. Das"), ("12:20", "13:00", "Lunch", ""), ("13:00", "13:45", "Library", "Mrs. Kapoor")],
        "Thursday": [("08:00", "08:45", "Hindi", "Mr. Verma"), ("08:50", "09:35", "Science", "Mr. Rao"), ("09:40", "10:25", "Mathematics", "Ms. Iyer"), ("10:25", "10:45", "Break", ""), ("10:45", "11:30", "English", "Mrs. Joshi"), ("11:35", "12:20", "Computer", "Mr. Khan"), ("12:20", "13:00", "Lunch", ""), ("13:00", "13:45", "P.E.", "Mr. Singh")],
        "Friday": [("08:00", "08:45", "Social Studies", "Mrs. Nair"), ("08:50", "09:35", "Mathematics", "Ms. Iyer"), ("09:40", "10:25", "Hindi", "Mr. Verma"), ("10:25", "10:45", "Break", ""), ("10:45", "11:30", "Science", "Mr. Rao"), ("11:35", "12:20", "English", "Mrs. Joshi"), ("12:20", "13:00", "Lunch", ""), ("13:00", "13:45", "Art", "Ms. Pillai")],
    }
    rows = []
    for day in days:
        for start, end, subject, teacher in schedule[day]:
            rows.append({
                "id": str(uuid.uuid4()),
                "student_id": student_id,
                "day": day,
                "start_time": start,
                "end_time": end,
                "subject": subject,
                "teacher": teacher,
            })
    return rows


def exams_for(student_id):
    today = datetime.now(timezone.utc).date()
    subjects = ["English", "Mathematics", "Science", "Hindi", "Social Studies"]
    exams = []
    for i, s in enumerate(subjects):
        exams.append({
            "id": f"exam-{student_id}-{i}",
            "student_id": student_id,
            "name": "Mid-Term Examination",
            "subject": s,
            "date": (today + timedelta(days=7 + i * 2)).isoformat(),
            "start_time": "09:00",
            "end_time": "11:00",
            "room": f"Hall {i + 1}",
            "syllabus": f"Chapters 1-5 of {s} textbook",
        })
    return exams


def announcements_for(school_id):
    today = datetime.now(timezone.utc).date()
    return [
        {
            "id": "ann-001",
            "school_id": school_id,
            "type": "holiday",
            "title": "Diwali Holiday",
            "body": "School will remain closed from 1st to 5th November for Diwali celebrations. Wishing all our students and families a happy Diwali!",
            "date": today.isoformat(),
            "priority": "high",
        },
        {
            "id": "ann-002",
            "school_id": school_id,
            "type": "event",
            "title": "Annual Sports Day",
            "body": "Annual Sports Day will be held on Saturday, 20th November. Parents are cordially invited. Programme starts at 9:00 AM.",
            "date": (today - timedelta(days=1)).isoformat(),
            "priority": "medium",
        },
        {
            "id": "ann-003",
            "school_id": school_id,
            "type": "activity",
            "title": "Science Exhibition",
            "body": "Students of classes 5 to 8 will participate in the inter-school Science Exhibition next week. Models due Friday.",
            "date": (today - timedelta(days=2)).isoformat(),
            "priority": "medium",
        },
        {
            "id": "ann-004",
            "school_id": school_id,
            "type": "notice",
            "title": "PTM Reminder",
            "body": "Parent-Teacher Meeting is scheduled for Saturday at 10 AM. Kindly carry your child's progress booklet.",
            "date": (today - timedelta(days=3)).isoformat(),
            "priority": "low",
        },
    ]


def fees_for(student_id):
    today = datetime.now(timezone.utc).date()
    return [
        {
            "id": f"fee-{student_id}-q1",
            "student_id": student_id,
            "term": "Quarter 1 (Apr-Jun)",
            "amount": 18500,
            "due_date": (today - timedelta(days=90)).isoformat(),
            "status": "paid",
            "paid_on": (today - timedelta(days=95)).isoformat(),
        },
        {
            "id": f"fee-{student_id}-q2",
            "student_id": student_id,
            "term": "Quarter 2 (Jul-Sep)",
            "amount": 18500,
            "due_date": (today - timedelta(days=10)).isoformat(),
            "status": "paid",
            "paid_on": (today - timedelta(days=12)).isoformat(),
        },
        {
            "id": f"fee-{student_id}-q3",
            "student_id": student_id,
            "term": "Quarter 3 (Oct-Dec)",
            "amount": 18500,
            "due_date": (today + timedelta(days=5)).isoformat(),
            "status": "due",
            "paid_on": None,
        },
        {
            "id": f"fee-{student_id}-q4",
            "student_id": student_id,
            "term": "Quarter 4 (Jan-Mar)",
            "amount": 18500,
            "due_date": (today + timedelta(days=95)).isoformat(),
            "status": "upcoming",
            "paid_on": None,
        },
    ]


BUS_INFOS = {
    "stu-001": {
        "id": "bus-stu-001",
        "student_id": "stu-001",
        "bus_number": "GW-12",
        "route_name": "Route 3 - North Loop",
        "pickup_point": "Lotus Apartments, Gate 2",
        "pickup_time": "07:15 AM",
        "drop_time": "03:45 PM",
        "driver_name": "Ramesh Kumar",
        "driver_phone": "+91 98765 23456",
        "current_lat": 28.6139,
        "current_lng": 77.2090,
        "stops": [
            {"name": "School Gate", "time": "06:50 AM"},
            {"name": "Green Park", "time": "07:05 AM"},
            {"name": "Lotus Apartments", "time": "07:15 AM"},
            {"name": "Cedar Heights", "time": "07:25 AM"},
            {"name": "School Gate", "time": "07:50 AM"},
        ],
    },
    "stu-002": {
        "id": "bus-stu-002",
        "student_id": "stu-002",
        "bus_number": "GW-08",
        "route_name": "Route 1 - South Loop",
        "pickup_point": "Sunshine Society, Main Road",
        "pickup_time": "07:20 AM",
        "drop_time": "03:50 PM",
        "driver_name": "Suresh Yadav",
        "driver_phone": "+91 98123 45678",
        "current_lat": 28.5355,
        "current_lng": 77.3910,
        "stops": [
            {"name": "School Gate", "time": "06:55 AM"},
            {"name": "Sunshine Society", "time": "07:20 AM"},
            {"name": "City Centre", "time": "07:30 AM"},
            {"name": "School Gate", "time": "07:55 AM"},
        ],
    },
    "stu-003": {
        "id": "bus-stu-003",
        "student_id": "stu-003",
        "bus_number": "GW-15",
        "route_name": "Route 5 - East Loop",
        "pickup_point": "Maple Residency, Block C",
        "pickup_time": "07:10 AM",
        "drop_time": "03:40 PM",
        "driver_name": "Vinod Singh",
        "driver_phone": "+91 99999 12345",
        "current_lat": 28.6448,
        "current_lng": 77.2167,
        "stops": [
            {"name": "School Gate", "time": "06:45 AM"},
            {"name": "Maple Residency", "time": "07:10 AM"},
            {"name": "Riverside Heights", "time": "07:20 AM"},
            {"name": "School Gate", "time": "07:45 AM"},
        ],
    },
}


def attendance_for(student_id):
    today = datetime.now(timezone.utc).date()
    records = []
    for i in range(30):
        d = today - timedelta(days=i)
        # weekend
        if d.weekday() >= 6:
            status = "holiday"
        elif i % 11 == 0 and i != 0:
            status = "absent"
        elif i % 17 == 0 and i != 0:
            status = "leave"
        else:
            status = "present"
        records.append({
            "id": f"att-{student_id}-{i}",
            "student_id": student_id,
            "date": d.isoformat(),
            "status": status,
        })
    return records


def leaves_for(student_id):
    today = datetime.now(timezone.utc).date()
    return [
        {
            "id": f"lv-{student_id}-1",
            "student_id": student_id,
            "from_date": (today - timedelta(days=17)).isoformat(),
            "to_date": (today - timedelta(days=17)).isoformat(),
            "reason": "Family wedding",
            "status": "approved",
            "applied_on": (today - timedelta(days=20)).isoformat(),
        },
    ]


async def seed_all(db):
    # Clear existing
    await db.schools.delete_many({})
    await db.students.delete_many({})
    await db.homework.delete_many({})
    await db.timetable.delete_many({})
    await db.exams.delete_many({})
    await db.announcements.delete_many({})
    await db.fees.delete_many({})
    await db.bus_info.delete_many({})
    await db.attendance.delete_many({})
    await db.leaves.delete_many({})

    await db.schools.insert_one({"id": SCHOOL_ID, "name": SCHOOL_NAME, "address": "Sector 12, New Delhi"})

    for s in STUDENTS:
        await db.students.insert_one(dict(s))
        await db.homework.insert_many(homework_for(s["id"], s["class"]))
        await db.timetable.insert_many(timetable_for(s["id"]))
        await db.exams.insert_many(exams_for(s["id"]))
        await db.fees.insert_many(fees_for(s["id"]))
        await db.bus_info.insert_one(dict(BUS_INFOS[s["id"]]))
        await db.attendance.insert_many(attendance_for(s["id"]))
        leaves = leaves_for(s["id"])
        if leaves:
            await db.leaves.insert_many(leaves)

    await db.announcements.insert_many(announcements_for(SCHOOL_ID))
