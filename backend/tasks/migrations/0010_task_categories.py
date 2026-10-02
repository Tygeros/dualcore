# Generated manually — ManyToMany categories on Task

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("categories", "0002_alter_category_options_alter_category_color_and_more"),
        ("tasks", "0009_alter_task_parent_task"),
    ]

    operations = [
        migrations.AddField(
            model_name="task",
            name="categories",
            field=models.ManyToManyField(
                blank=True, related_name="tasks", to="categories.category"
            ),
        ),
    ]
