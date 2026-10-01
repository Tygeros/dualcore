from django.urls import path

from . import views


urlpatterns = [
    path("", views.ProfileList.as_view(), name="profile-list"),
    path("today-points/", views.TodayPointsView.as_view(), name="today-points"),
    path("<int:pk>/", views.ProfileDetail.as_view(), name="profile-detail"),
]
