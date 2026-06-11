from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import UserProfile


@receiver(post_save, sender=get_user_model())
def create_missing_profile(sender, instance, **kwargs):
    UserProfile.objects.get_or_create(
        user=instance,
        defaults={
            "role": (
                UserProfile.Role.ADMIN
                if instance.is_superuser
                else UserProfile.Role.ROOM_SERVICE
            )
        },
    )
