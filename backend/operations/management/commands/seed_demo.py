from datetime import timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.utils import timezone

from operations.models import Room, UserProfile


class Command(BaseCommand):
    help = "Create demo users, roles, and hotel rooms."

    def handle(self, *args, **options):
        users = [
            ("ava", "Ava", "Sharma", "admin", "Front desk", "admin123"),
            ("maya", "Maya", "Patel", "room_service", "Morning shift", "staff123"),
            ("daniel", "Daniel", "Kim", "room_service", "Morning shift", "staff123"),
            ("sofia", "Sofia", "Reed", "room_service", "Evening shift", "staff123"),
        ]
        created_users = {}
        for username, first, last, role, shift, password in users:
            user, _ = User.objects.get_or_create(
                username=username,
                defaults={"first_name": first, "last_name": last},
            )
            user.first_name = first
            user.last_name = last
            user.is_staff = role == UserProfile.Role.ADMIN
            user.is_superuser = role == UserProfile.Role.ADMIN
            user.set_password(password)
            user.save()
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.role = role
            profile.shift = shift
            profile.save()
            created_users[username] = user

        now = timezone.now()
        rooms = [
            ("201", "Deluxe King", "2nd Floor", "Priority", "Arrival at 12:00 PM", "assigned", "maya", now - timedelta(minutes=18), None),
            ("305", "Executive Suite", "3rd Floor", "Standard", "Arrival at 2:00 PM", "assigned", "maya", now - timedelta(minutes=8), None),
            ("412", "Twin Room", "4th Floor", "Standard", "Stayover service", "completed", "daniel", now - timedelta(minutes=95), now - timedelta(minutes=22)),
            ("118", "Queen Room", "1st Floor", "Standard", "Arrival at 3:00 PM", "available", None, None, None),
            ("207", "Deluxe Twin", "2nd Floor", "Standard", "Arrival at 4:00 PM", "available", None, None, None),
            ("309", "King Room", "3rd Floor", "Standard", "Stayover service", "completed", "sofia", now - timedelta(minutes=180), now - timedelta(minutes=64)),
        ]
        completed_checklist = [
            "collect_dirty_items",
            "soak_bathroom",
            "dust_room",
            "clean_refreshment_area",
            "clean_dresser_tv",
            "clean_furniture",
            "clean_window_ac",
            "clean_bedside_items",
            "clean_closet_mirror",
            "scrub_bathroom",
            "disinfect_bathroom_floor",
            "replace_bath_amenities",
            "make_beds",
            "vacuum_deodorize",
        ]
        for number, room_type, floor, priority, guest, status, assignee, assigned_at, submitted_at in rooms:
            Room.objects.update_or_create(
                number=number,
                defaults={
                    "room_type": room_type,
                    "floor": floor,
                    "priority": priority,
                    "guest_status": guest,
                    "status": status,
                    "assigned_to": created_users.get(assignee),
                    "assigned_at": assigned_at,
                    "submitted_at": submitted_at,
                    "checklist": (
                        completed_checklist
                        if status == Room.Status.COMPLETED
                        else []
                    ),
                    "guest_items": [],
                },
            )

        self.stdout.write(self.style.SUCCESS("Demo users and rooms are ready."))
        self.stdout.write("Admin: ava / admin123")
        self.stdout.write("Room service: maya / staff123")
