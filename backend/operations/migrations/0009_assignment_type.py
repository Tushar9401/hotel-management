from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("operations", "0008_roomassignmentlog"),
    ]

    operations = [
        migrations.AddField(
            model_name="room",
            name="assignment_type",
            field=models.CharField(
                choices=[
                    ("checkout", "Checkout"),
                    ("stayover", "Stayover"),
                ],
                default="checkout",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="roomassignmentlog",
            name="assignment_type",
            field=models.CharField(
                choices=[
                    ("checkout", "Checkout"),
                    ("stayover", "Stayover"),
                ],
                default="checkout",
                max_length=20,
            ),
        ),
    ]
