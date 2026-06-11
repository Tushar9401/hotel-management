from django.db import migrations


def create_missing_profiles(apps, schema_editor):
    User = apps.get_model("auth", "User")
    UserProfile = apps.get_model("operations", "UserProfile")

    for user in User.objects.all():
        UserProfile.objects.get_or_create(
            user_id=user.id,
            defaults={
                "role": "admin" if user.is_superuser else "room_service",
                "shift": "",
            },
        )


def remove_backfilled_profiles(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("operations", "0002_alter_room_due_time_alter_room_room_type"),
    ]

    operations = [
        migrations.RunPython(create_missing_profiles, remove_backfilled_profiles),
    ]
