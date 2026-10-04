from django.utils import timezone
from django.core.management.base import BaseCommand

from users.models import User, Profile
from projects.models import Project
from tasks.models import Task

from base.services import up_level


class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        user = User.objects.first()
        profile = Profile.objects.get(user=user)
        commit_date = timezone.localdate()

        projects = Project.objects.filter(
            terminated_date=commit_date,
            status__in=["completed", "canceled"]
        )

        tasks = Task.objects.filter(
            terminated_date=commit_date,
            status__in=["completed", "canceled"]
        )

        today_points = 0.0

        for project in projects:
            pts = project.final_points()
            if pts is not None:
                today_points += pts

        for task in tasks:
            pts = task.final_points()
            if pts is not None:
                today_points += pts

        level_coefficient = 1
        if profile.level > 0:
            level_coefficient = profile.level
        bonus_points = (today_points - profile.commit_points) * level_coefficient

        if today_points >= profile.commit_points:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Today points: {today_points} points, add {bonus_points} to your EXP!"
                ),
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    f"Today points: {today_points} points, minus {-bonus_points} from your EXP!"
                )
            )

        new_level, new_exp = up_level(profile, bonus_points)
        profile.level = new_level
        profile.exp = new_exp

        profile.save()
