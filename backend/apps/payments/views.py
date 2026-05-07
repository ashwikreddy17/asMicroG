import hmac
import hashlib
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt

from .models import Payment
from apps.orders.models import Order, OrderStatusHistory
from apps.notifications.tasks import send_order_confirmation_email


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_razorpay_order(request):
    import razorpay
    order_id = request.data.get("order_id")
    order = get_object_or_404(Order, pk=order_id, user=request.user)

    if order.payment_status == "paid":
        return Response({"error": "Already paid."}, status=status.HTTP_400_BAD_REQUEST)

    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    amount_paise = int(order.final_amount * 100)

    rz_order = client.order.create(
        {"amount": amount_paise, "currency": "INR", "receipt": order.order_number}
    )

    payment, _ = Payment.objects.get_or_create(
        order=order,
        defaults={"user": request.user, "gateway": "razorpay", "amount": order.final_amount},
    )
    payment.gateway_order_id = rz_order["id"]
    payment.raw_response = rz_order
    payment.save()

    return Response({
        "razorpay_order_id": rz_order["id"],
        "amount": amount_paise,
        "currency": "INR",
        "key": settings.RAZORPAY_KEY_ID,
        "order_number": order.order_number,
    })


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def verify_razorpay_payment(request):
    data = request.data
    razorpay_order_id = data.get("razorpay_order_id")
    razorpay_payment_id = data.get("razorpay_payment_id")
    razorpay_signature = data.get("razorpay_signature")

    payment = get_object_or_404(Payment, gateway_order_id=razorpay_order_id)

    # Verify signature
    body = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        body.encode(),
        hashlib.sha256,
    ).hexdigest()

    if expected != razorpay_signature:
        payment.status = "failed"
        payment.save()
        return Response({"error": "Payment verification failed."}, status=status.HTTP_400_BAD_REQUEST)

    payment.gateway_payment_id = razorpay_payment_id
    payment.gateway_signature = razorpay_signature
    payment.status = "paid"
    payment.save()

    order = payment.order
    order.payment_status = "paid"
    order.payment_id = razorpay_payment_id
    order.status = "processing"
    order.save()

    OrderStatusHistory.objects.create(order=order, status="processing", note="Payment confirmed.")
    send_order_confirmation_email.delay(order.id)

    return Response({"detail": "Payment verified.", "order_number": order.order_number})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_stripe_intent(request):
    import stripe
    order_id = request.data.get("order_id")
    order = get_object_or_404(Order, pk=order_id, user=request.user)

    if order.payment_status == "paid":
        return Response({"error": "Already paid."}, status=status.HTTP_400_BAD_REQUEST)

    stripe.api_key = settings.STRIPE_SECRET_KEY
    intent = stripe.PaymentIntent.create(
        amount=int(order.final_amount * 100),
        currency="inr",
        metadata={"order_id": order.id, "order_number": order.order_number},
    )

    payment, _ = Payment.objects.get_or_create(
        order=order,
        defaults={"user": request.user, "gateway": "stripe", "amount": order.final_amount},
    )
    payment.gateway_order_id = intent.id
    payment.currency = "INR"
    payment.save()

    return Response({"client_secret": intent.client_secret})


@csrf_exempt
@api_view(["POST"])
def stripe_webhook(request):
    import stripe
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        return Response(status=status.HTTP_400_BAD_REQUEST)

    if event["type"] == "payment_intent.succeeded":
        intent = event["data"]["object"]
        try:
            payment = Payment.objects.get(gateway_order_id=intent["id"])
            payment.status = "paid"
            payment.gateway_payment_id = intent["id"]
            payment.save()
            order = payment.order
            order.payment_status = "paid"
            order.status = "processing"
            order.save()
            OrderStatusHistory.objects.create(order=order, status="processing", note="Stripe payment succeeded.")
            send_order_confirmation_email.delay(order.id)
        except Payment.DoesNotExist:
            pass

    return Response({"status": "ok"})
