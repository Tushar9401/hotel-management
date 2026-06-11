import json

from django.contrib.auth.models import User
from django.test import Client, TestCase

from .models import Room, UserProfile


class OperationsApiTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user("admin", password="password")
        UserProfile.objects.update_or_create(
            user=self.admin,
            defaults={"role": UserProfile.Role.ADMIN},
        )
        self.staff = User.objects.create_user("staff", password="password")
        UserProfile.objects.update_or_create(
            user=self.staff,
            defaults={
                "role": UserProfile.Role.ROOM_SERVICE,
                "shift": "Morning shift",
            },
        )
        self.room = Room.objects.create(
            number="101",
            room_type="King Room",
            floor="1st Floor",
            guest_items=[
                {
                    "id": 1,
                    "name": "Towel",
                    "expectedQuantity": 7,
                    "foundQuantity": None,
                }
            ],
        )

    def login(self, client, username):
        response = client.post(
            "/api/auth/login/",
            data=json.dumps({"username": username, "password": "password"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        return response.json()["user"]

    def test_login_returns_assigned_role(self):
        user = self.login(Client(), "admin")
        self.assertEqual(user["role"], UserProfile.Role.ADMIN)

    def test_admin_can_assign_room_and_staff_cannot(self):
        admin_client = Client()
        self.login(admin_client, "admin")
        response = admin_client.post(
            "/api/rooms/101/assign/",
            data=json.dumps({"staffId": self.staff.id}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["room"]["guestItems"][0]["expectedQuantity"], 7)

        second_room = Room.objects.create(
            number="102",
            room_type="Queen Room",
            floor="1st Floor",
        )
        staff_client = Client()
        self.login(staff_client, "staff")
        response = staff_client.post(
            f"/api/rooms/{second_room.number}/assign/",
            data=json.dumps({"staffId": self.staff.id}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_staff_only_sees_own_rooms_and_can_submit(self):
        self.room.assigned_to = self.staff
        self.room.status = Room.Status.ASSIGNED
        self.room.guest_items = [
            {
                "id": 1,
                "name": "Towel",
                "expectedQuantity": 7,
                "foundQuantity": None,
            }
        ]
        self.room.save()
        Room.objects.create(
            number="202",
            room_type="Twin Room",
            floor="2nd Floor",
        )

        client = Client()
        self.login(client, "staff")
        rooms = client.get("/api/rooms/").json()["rooms"]
        self.assertEqual([room["id"] for room in rooms], ["101"])

        response = client.post(
            "/api/rooms/101/submit/",
            data=json.dumps(
                {
                    "checklist": [
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
                    ],
                    "guestItems": [
                        {"foundQuantity": 6},
                    ],
                    "remark": "One towel was not found in the bathroom.",
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["room"]["status"], Room.Status.COMPLETED)
        self.assertIsNotNone(response.json()["room"]["submittedAt"])
        self.assertEqual(response.json()["room"]["guestItems"][0]["expectedQuantity"], 7)
        self.assertEqual(response.json()["room"]["guestItems"][0]["foundQuantity"], 6)
        self.assertEqual(
            response.json()["room"]["remark"],
            "One towel was not found in the bathroom.",
        )
        self.room.refresh_from_db()
        self.assertEqual(
            self.room.housekeeping_remark,
            "One towel was not found in the bathroom.",
        )

    def test_assigning_room_clears_previous_remark(self):
        self.room.housekeeping_remark = "Old submission note"
        self.room.attention_resolved = True
        self.room.save(
            update_fields=["housekeeping_remark", "attention_resolved"],
        )

        client = Client()
        self.login(client, "admin")
        response = client.post(
            "/api/rooms/101/assign/",
            data=json.dumps({"staffId": self.staff.id}),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["room"]["remark"], "")
        self.room.refresh_from_db()
        self.assertEqual(self.room.housekeeping_remark, "")
        self.assertFalse(self.room.attention_resolved)

    def test_admin_can_resolve_attention_report_and_staff_cannot(self):
        self.room.status = Room.Status.COMPLETED
        self.room.housekeeping_remark = "Missing towel"
        self.room.save(
            update_fields=["status", "housekeeping_remark"],
        )

        admin_client = Client()
        self.login(admin_client, "admin")
        response = admin_client.post(
            "/api/rooms/101/resolve-attention/",
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["room"]["attentionResolved"])
        self.room.refresh_from_db()
        self.assertTrue(self.room.attention_resolved)
        self.assertEqual(self.room.housekeeping_remark, "Missing towel")

        self.room.attention_resolved = False
        self.room.save(update_fields=["attention_resolved"])
        staff_client = Client()
        self.login(staff_client, "staff")
        forbidden = staff_client.post(
            "/api/rooms/101/resolve-attention/",
            content_type="application/json",
        )
        self.assertEqual(forbidden.status_code, 403)

    def test_admin_can_update_guest_items_independently(self):
        client = Client()
        self.login(client, "admin")
        response = client.post(
            "/api/rooms/101/guest-items/",
            data=json.dumps(
                {
                    "guestItems": [
                        {"name": "Towel", "expectedQuantity": 7},
                        {"name": "Bathrobe", "expectedQuantity": 2},
                    ]
                }
            ),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["room"]["guestItems"]), 2)

        staff_client = Client()
        self.login(staff_client, "staff")
        forbidden = staff_client.post(
            "/api/rooms/101/guest-items/",
            data=json.dumps({"guestItems": []}),
            content_type="application/json",
        )
        self.assertEqual(forbidden.status_code, 403)
