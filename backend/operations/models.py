from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    class Role(models.TextChoices):
        ADMIN = "admin", "Front Desk Admin"
        ROOM_SERVICE = "room_service", "Room Service Staff"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ROOM_SERVICE,
    )
    shift = models.CharField(max_length=50, blank=True, default="")

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} - {self.get_role_display()}"


class Room(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = "available", "Available"
        ASSIGNED = "assigned", "Assigned"
        COMPLETED = "completed", "Completed"

    number = models.CharField(max_length=10, unique=True)
    room_type = models.CharField(max_length=100, blank=True, default="")
    floor = models.CharField(max_length=50)
    priority = models.CharField(max_length=20, default="Standard")
    guest_status = models.CharField(max_length=150, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE,
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_rooms",
    )
    assigned_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    checklist = models.JSONField(default=list, blank=True)
    guest_items = models.JSONField(default=list, blank=True)
    housekeeping_remark = models.TextField(blank=True, default="")
    attention_resolved = models.BooleanField(default=False)

    class Meta:
        ordering = ["number"]

    def __str__(self):
        return f"Room {self.number}"
