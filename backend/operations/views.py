import json

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .models import Room, UserProfile

CHECKLIST_ITEMS = {
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
}


def parse_json(request):
    try:
        return json.loads(request.body or "{}")
    except json.JSONDecodeError:
        return None


def user_payload(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    full_name = user.get_full_name().strip() or user.username
    initials = "".join(part[0] for part in full_name.split()[:2]).upper()
    return {
        "id": user.id,
        "username": user.username,
        "name": full_name,
        "initials": initials,
        "role": profile.role,
        "roleLabel": profile.get_role_display(),
        "shift": profile.shift,
    }


def room_payload(room):
    return {
        "id": room.number,
        "type": room.room_type,
        "floor": room.floor,
        "status": room.status,
        "assignedTo": room.assigned_to_id,
        "assignedAt": room.assigned_at.isoformat() if room.assigned_at else None,
        "submittedAt": room.submitted_at.isoformat() if room.submitted_at else None,
        "priority": room.priority,
        "guest": room.guest_status,
        "checklist": room.checklist,
        "guestItems": room.guest_items,
        "remark": room.housekeeping_remark,
        "attentionResolved": room.attention_resolved,
    }


def require_role(request, role):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    if profile.role != role:
        return JsonResponse({"detail": "You do not have permission for this action."}, status=403)
    return None


def validate_guest_items(items):
    guest_items = []
    for index, item in enumerate(items):
        name = str(item.get("name", "")).strip()
        try:
            expected_quantity = int(item.get("expectedQuantity"))
        except (TypeError, ValueError):
            return None, "Each guest item must have a valid quantity."
        if not name or expected_quantity < 1:
            return None, "Guest item names and positive quantities are required."
        guest_items.append(
            {
                "id": index + 1,
                "name": name,
                "expectedQuantity": expected_quantity,
                "foundQuantity": None,
            }
        )
    return guest_items, None


@require_GET
@ensure_csrf_cookie
def csrf_cookie(request):
    return JsonResponse({"detail": "CSRF cookie set."})


@require_POST
@csrf_exempt
def login_view(request):
    payload = parse_json(request)
    if payload is None:
        return JsonResponse({"detail": "Invalid JSON."}, status=400)

    user = authenticate(
        request,
        username=payload.get("username", ""),
        password=payload.get("password", ""),
    )
    if user is None:
        return JsonResponse({"detail": "Invalid username or password."}, status=401)
    if not user.is_active:
        return JsonResponse({"detail": "This account is inactive."}, status=403)

    login(request, user)
    return JsonResponse({"user": user_payload(user)})


@require_POST
@csrf_exempt
def logout_view(request):
    logout(request)
    return JsonResponse({"detail": "Signed out."})


@require_GET
def me_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({"detail": "Authentication required."}, status=401)
    return JsonResponse({"user": user_payload(request.user)})


@require_GET
@login_required
def rooms_view(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)
    rooms = Room.objects.select_related("assigned_to", "assigned_to__profile")
    if profile.role == UserProfile.Role.ROOM_SERVICE:
        rooms = rooms.filter(assigned_to=request.user)
    return JsonResponse({"rooms": [room_payload(room) for room in rooms]})


@require_GET
@login_required
def staff_view(request):
    denied = require_role(request, UserProfile.Role.ADMIN)
    if denied:
        return denied

    profiles = UserProfile.objects.select_related("user").filter(
        role=UserProfile.Role.ROOM_SERVICE,
        user__is_active=True,
    )
    return JsonResponse({"staff": [user_payload(profile.user) for profile in profiles]})


@require_POST
@csrf_exempt
@login_required
def assign_room_view(request, room_number):
    denied = require_role(request, UserProfile.Role.ADMIN)
    if denied:
        return denied

    payload = parse_json(request)
    if payload is None:
        return JsonResponse({"detail": "Invalid JSON."}, status=400)

    staff_profile = get_object_or_404(
        UserProfile.objects.select_related("user"),
        user_id=payload.get("staffId"),
        role=UserProfile.Role.ROOM_SERVICE,
        user__is_active=True,
    )
    room = get_object_or_404(Room, number=room_number)
    if room.status != Room.Status.AVAILABLE:
        return JsonResponse({"detail": "Only available rooms can be assigned."}, status=409)

    room.assigned_to = staff_profile.user
    room.assigned_at = timezone.now()
    room.submitted_at = None
    room.checklist = []
    room.housekeeping_remark = ""
    room.attention_resolved = False
    room.status = Room.Status.ASSIGNED
    room.save()
    return JsonResponse({"room": room_payload(room)})


@require_POST
@csrf_exempt
@login_required
def guest_items_view(request, room_number):
    denied = require_role(request, UserProfile.Role.ADMIN)
    if denied:
        return denied

    room = get_object_or_404(Room, number=room_number)
    if room.status == Room.Status.COMPLETED:
        return JsonResponse(
            {"detail": "Guest items cannot be changed after room submission."},
            status=409,
        )

    payload = parse_json(request)
    if payload is None:
        return JsonResponse({"detail": "Invalid JSON."}, status=400)

    guest_items, error = validate_guest_items(payload.get("guestItems", []))
    if error:
        return JsonResponse({"detail": error}, status=400)

    room.guest_items = guest_items
    room.save(update_fields=["guest_items"])
    return JsonResponse({"room": room_payload(room)})


@require_POST
@csrf_exempt
@login_required
def resolve_attention_view(request, room_number):
    denied = require_role(request, UserProfile.Role.ADMIN)
    if denied:
        return denied

    room = get_object_or_404(Room, number=room_number)
    if room.status != Room.Status.COMPLETED:
        return JsonResponse(
            {"detail": "Only completed room reports can be resolved."},
            status=409,
        )

    room.attention_resolved = True
    room.save(update_fields=["attention_resolved"])
    return JsonResponse({"room": room_payload(room)})


@require_POST
@csrf_exempt
@login_required
def submit_checklist_view(request, room_number):
    denied = require_role(request, UserProfile.Role.ROOM_SERVICE)
    if denied:
        return denied

    room = get_object_or_404(Room, number=room_number, assigned_to=request.user)
    if room.status != Room.Status.ASSIGNED:
        return JsonResponse({"detail": "This room is not awaiting completion."}, status=409)

    payload = parse_json(request)
    if payload is None:
        return JsonResponse({"detail": "Invalid JSON."}, status=400)
    checklist = payload.get("checklist", [])
    if set(checklist) != CHECKLIST_ITEMS:
        return JsonResponse({"detail": "All checklist items must be completed."}, status=400)

    remark = str(payload.get("remark", "")).strip()
    if len(remark) > 1000:
        return JsonResponse(
            {"detail": "The room remark must be 1,000 characters or fewer."},
            status=400,
        )

    submitted_items = payload.get("guestItems", [])
    if len(submitted_items) != len(room.guest_items):
        return JsonResponse(
            {"detail": "Every guest-issued item must be counted."},
            status=400,
        )

    verified_items = []
    for expected_item, submitted_item in zip(room.guest_items, submitted_items):
        try:
            found_quantity = int(submitted_item.get("foundQuantity"))
        except (TypeError, ValueError):
            return JsonResponse(
                {"detail": "Enter the quantity found for every guest item."},
                status=400,
            )
        if found_quantity < 0:
            return JsonResponse(
                {"detail": "Found quantities cannot be negative."},
                status=400,
            )
        verified_items.append(
            {
                **expected_item,
                "foundQuantity": found_quantity,
            }
        )

    room.checklist = checklist
    room.guest_items = verified_items
    room.housekeeping_remark = remark
    room.attention_resolved = False
    room.submitted_at = timezone.now()
    room.status = Room.Status.COMPLETED
    room.save()
    return JsonResponse({"room": room_payload(room)})
