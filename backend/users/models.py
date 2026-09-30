from django.db import models
from django.contrib.auth.models import AbstractUser

from base.services import exp_to_next_level


class User(AbstractUser):
    pass


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    display_name = models.CharField(max_length=80)

    commit_points = models.FloatField(default=5.0)
    level = models.IntegerField(default=0)
    exp = models.FloatField(default=0.0)

    def __str__(self):
        return f"{self.display_name}`s profile"

    def exp_threshold(self):
        return exp_to_next_level(self.level)
