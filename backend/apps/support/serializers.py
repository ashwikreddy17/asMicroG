from rest_framework import serializers
from .models import SupportTicket, TicketMessage, FAQ


class TicketMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = TicketMessage
        fields = ("id", "sender", "sender_name", "message", "is_staff_reply", "created_at")
        read_only_fields = ("sender", "is_staff_reply", "created_at")

    def get_sender_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.username


class SupportTicketSerializer(serializers.ModelSerializer):
    messages = TicketMessageSerializer(many=True, read_only=True)

    class Meta:
        model = SupportTicket
        fields = (
            "id", "ticket_number", "subject", "description", "status",
            "priority", "order", "assigned_to", "messages", "created_at", "updated_at",
        )
        read_only_fields = ("ticket_number", "assigned_to", "created_at", "updated_at")


class FAQSerializer(serializers.ModelSerializer):
    asker_name = serializers.SerializerMethodField()

    class Meta:
        model = FAQ
        fields = ("id", "question", "answer", "category", "ask_count", "is_published", "asker_name", "created_at", "answered_at")
        read_only_fields = ("answer", "ask_count", "is_published", "asker_name", "answered_at", "created_at")

    def get_asker_name(self, obj):
        if not obj.asked_by:
            return "Anonymous"
        name = obj.asked_by.get_full_name()
        return name or obj.asked_by.username
