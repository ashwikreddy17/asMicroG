from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from .models import SupportTicket, TicketMessage, FAQ
from .serializers import SupportTicketSerializer, TicketMessageSerializer, FAQSerializer
from apps.core.pagination import StandardPagePagination


class TicketListCreateView(generics.ListCreateAPIView):
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return SupportTicket.objects.filter(user=self.request.user).prefetch_related("messages")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TicketDetailView(generics.RetrieveAPIView):
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return SupportTicket.objects.filter(user=self.request.user).prefetch_related("messages")


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def add_ticket_message(request, pk):
    try:
        ticket = SupportTicket.objects.get(pk=pk, user=request.user)
    except SupportTicket.DoesNotExist:
        return Response({"error": "Ticket not found."}, status=status.HTTP_404_NOT_FOUND)

    message = request.data.get("message", "").strip()
    if not message:
        return Response({"error": "Message required."}, status=status.HTTP_400_BAD_REQUEST)

    msg = TicketMessage.objects.create(ticket=ticket, sender=request.user, message=message)
    ticket.status = "open"
    ticket.save(update_fields=["status", "updated_at"])
    return Response(TicketMessageSerializer(msg).data, status=status.HTTP_201_CREATED)


# ── Admin ─────────────────────────────────────────────────────────

class AdminTicketListView(generics.ListAPIView):
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = StandardPagePagination
    filterset_fields = ["status", "priority"]
    search_fields = ["ticket_number", "subject", "user__email"]

    def get_queryset(self):
        return SupportTicket.objects.all().select_related("user").prefetch_related("messages", "messages__sender")


class AdminTicketDetailView(generics.RetrieveAPIView):
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return SupportTicket.objects.all().select_related("user").prefetch_related("messages", "messages__sender")


@api_view(["PATCH"])
@permission_classes([permissions.IsAdminUser])
def admin_update_ticket(request, pk):
    from django.shortcuts import get_object_or_404
    ticket = get_object_or_404(SupportTicket, pk=pk)
    new_status = request.data.get("status")
    reply = request.data.get("reply")

    if new_status:
        ticket.status = new_status
        ticket.save(update_fields=["status", "updated_at"])

    if reply:
        TicketMessage.objects.create(ticket=ticket, sender=request.user, message=reply, is_staff_reply=True)
        if not new_status:
            ticket.status = "in_progress"
            ticket.save(update_fields=["status", "updated_at"])

    ticket.refresh_from_db()
    return Response(SupportTicketSerializer(ticket).data)


# ── FAQ ───────────────────────────────────────────────────

@api_view(["GET", "POST"])
def faq_list(request):
    if request.method == "GET":
        faqs = FAQ.objects.filter(is_published=True).order_by("-ask_count", "-created_at")
        return Response(FAQSerializer(faqs, many=True).data)

    # POST — authenticated users submit a question
    if not request.user.is_authenticated:
        return Response({"error": "Login to ask a question."}, status=status.HTTP_401_UNAUTHORIZED)

    question = request.data.get("question", "").strip()
    category = request.data.get("category", "General").strip()
    if not question:
        return Response({"error": "Question is required."}, status=status.HTTP_400_BAD_REQUEST)

    faq = FAQ.objects.create(question=question, category=category, asked_by=request.user)
    return Response(FAQSerializer(faq).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def my_faqs(request):
    faqs = FAQ.objects.filter(asked_by=request.user)
    return Response(FAQSerializer(faqs, many=True).data)


class AdminFAQListView(generics.ListAPIView):
    serializer_class = FAQSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = FAQ.objects.all()


@api_view(["PATCH"])
@permission_classes([permissions.IsAdminUser])
def admin_answer_faq(request, pk):
    from django.shortcuts import get_object_or_404
    faq = get_object_or_404(FAQ, pk=pk)
    answer = request.data.get("answer", "").strip()
    category = request.data.get("category")
    publish = request.data.get("is_published")

    update_fields = []
    if answer:
        faq.answer = answer
        faq.answered_at = timezone.now()
        update_fields += ["answer", "answered_at"]
    if category:
        faq.category = category
        update_fields.append("category")
    if publish is not None:
        faq.is_published = bool(publish)
        update_fields.append("is_published")

    if update_fields:
        faq.save(update_fields=update_fields)
    return Response(FAQSerializer(faq).data)
