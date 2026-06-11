from django.urls import path

from . import views

urlpatterns = [
    path("auth/csrf/", views.csrf_cookie, name="csrf"),
    path("auth/login/", views.login_view, name="login"),
    path("auth/logout/", views.logout_view, name="logout"),
    path("auth/me/", views.me_view, name="me"),
    path("rooms/", views.rooms_view, name="rooms"),
    path("rooms/<str:room_number>/assign/", views.assign_room_view, name="assign-room"),
    path(
        "rooms/<str:room_number>/guest-items/",
        views.guest_items_view,
        name="guest-items",
    ),
    path(
        "rooms/<str:room_number>/submit/",
        views.submit_checklist_view,
        name="submit-checklist",
    ),
    path(
        "rooms/<str:room_number>/resolve-attention/",
        views.resolve_attention_view,
        name="resolve-attention",
    ),
    path("staff/", views.staff_view, name="staff"),
]
