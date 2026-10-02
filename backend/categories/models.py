from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=50, unique=True)
    note = models.TextField(blank=True)
    color = models.CharField(max_length=20, default="#6366f1")

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name
