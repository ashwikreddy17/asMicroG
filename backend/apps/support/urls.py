from django.urls import path
from .views import (
    TicketListCreateView, TicketDetailView, add_ticket_message,
    AdminTicketListView, AdminTicketDetailView, admin_update_ticket,
    faq_list, my_faqs, AdminFAQListView, admin_answer_faq,
)

urlpatterns = [
    path("tickets/", TicketListCreateView.as_view(), name="ticket_list"),
    path("tickets/<int:pk>/", TicketDetailView.as_view(), name="ticket_detail"),
    path("tickets/<int:pk>/messages/", add_ticket_message, name="ticket_message"),

    # FAQ — public + user
    path("faqs/", faq_list, name="faq_list"),
    path("faqs/mine/", my_faqs, name="my_faqs"),

    # Admin tickets
    path("admin/tickets/", AdminTicketListView.as_view(), name="admin_ticket_list"),
    path("admin/tickets/<int:pk>/", AdminTicketDetailView.as_view(), name="admin_ticket_detail"),
    path("admin/tickets/<int:pk>/reply/", admin_update_ticket, name="admin_ticket_update"),

    # Admin FAQs
    path("admin/faqs/", AdminFAQListView.as_view(), name="admin_faq_list"),
    path("admin/faqs/<int:pk>/answer/", admin_answer_faq, name="admin_faq_answer"),
]
