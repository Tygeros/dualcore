# Generated manually — ManyToMany categories on Project

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("categories", "0002_alter_category_options_alter_category_color_and_more"),
        ("projects", "0008_alter_project_difficulty_alter_project_priority"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="categories",
            field=models.ManyToManyField(
                blank=True, related_name="projects", to="categories.category"
            ),
        ),
    ]
