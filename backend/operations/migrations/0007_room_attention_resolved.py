from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("operations", "0006_room_housekeeping_remark"),
    ]

    operations = [
        migrations.AddField(
            model_name="room",
            name="attention_resolved",
            field=models.BooleanField(default=False),
        ),
    ]
