# Generated manually for unique name, default color, ordering

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("categories", "0001_initial"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="category",
            options={"ordering": ["name"], "verbose_name_plural": "categories"},
        ),
        migrations.AlterField(
            model_name="category",
            name="color",
            field=models.CharField(default="#6366f1", max_length=20),
        ),
        migrations.AlterField(
            model_name="category",
            name="name",
            field=models.CharField(max_length=50, unique=True),
        ),
    ]
