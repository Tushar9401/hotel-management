from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.models import User

from .models import Room, RoomAssignmentLog, UserProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    extra = 0
    max_num = 1


class RoomlyUserAdmin(UserAdmin):
    inlines = (UserProfileInline,)

    def role(self, obj):
        profile, _ = UserProfile.objects.get_or_create(
            user=obj,
            defaults={
                "role": (
                    UserProfile.Role.ADMIN
                    if obj.is_superuser
                    else UserProfile.Role.ROOM_SERVICE
                )
            },
        )
        return profile.get_role_display()

    role.short_description = "Role"
    list_display = (*UserAdmin.list_display, "role")


admin.site.unregister(User)
admin.site.register(User, RoomlyUserAdmin)


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = (
        "number",
        "room_type",
        "floor",
        "assignment_type",
        "status",
        "assigned_to",
        "assigned_at",
        "submitted_at",
    )
    list_filter = ("status", "assignment_type", "floor", "priority")
    search_fields = ("number", "room_type", "assigned_to__username")


@admin.register(RoomAssignmentLog)
class RoomAssignmentLogAdmin(admin.ModelAdmin):
    list_display = (
        "room",
        "assigned_to_name",
        "assigned_at",
        "submitted_at",
        "assignment_type",
        "status",
    )
    list_filter = ("status", "assignment_type", "assigned_at", "submitted_at")
    search_fields = ("room__number", "assigned_to_name", "assigned_to__username")
