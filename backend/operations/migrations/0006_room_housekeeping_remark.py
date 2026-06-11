from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("operations", "0005_room_guest_items"),
    ]

    operations = [
        migrations.AddField(
            model_name="room",
            name="housekeeping_remark",
            field=models.TextField(blank=True, default=""),
        ),
    ]
