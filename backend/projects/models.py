from django.db import models

from base.models import BaseMission
from users.models import User


class Project(BaseMission):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="projects")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    def current_points(self):
        return self.base_current_points() * 3

    def final_points(self):
        if self.status in ("completed", "canceled"):
            return self.current_points()
        else:
            return None
