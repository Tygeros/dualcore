from django.urls import path

from . import views

urlpatterns = [
    path("priority-levels/", views.PriorityLevelList.as_view()),
    path("difficulty-levels/", views.DifficultyLevelList.as_view()),
]
