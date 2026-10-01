from django.db import models

from base.models import BaseMission
from users.models import User
from projects.models import Project


class Task(BaseMission):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tasks")
    parent_task = models.ForeignKey("self", on_delete=models.CASCADE, null=True, related_name="child_tasks")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="tasks")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    def task_level(self):
        level = 1
        task = self
        while task.parent_task is not None:
            level += 1
            task = task.parent_task

        return level

    def current_points(self):
        if self.task_level() > 1:
            return self.base_current_points() * 0.5
        else:
            return self.base_current_points()

    def final_points(self):
        if self.status in ("completed", "canceled"):
            return self.current_points()
        else:
            return None
