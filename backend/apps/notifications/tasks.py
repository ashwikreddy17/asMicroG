from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_order_confirmation_email(self, order_id):
    try:
        from apps.orders.models import Order
        order = Order.objects.select_related("user").prefetch_related("items__product").get(pk=order_id)
        subject = f"Order Confirmed – {order.order_number}"
        html = render_to_string("emails/order_confirmation.html", {"order": order})
        send_mail(
            subject=subject,
            message=f"Your order {order.order_number} has been confirmed.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.user.email],
            html_message=html,
            fail_silently=True,
        )
    except Exception as exc:
        if not settings.DEBUG:
            raise self.retry(exc=exc)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_order_status_update_email(self, order_id):
    try:
        from apps.orders.models import Order
        order = Order.objects.select_related("user").get(pk=order_id)
        subject = f"Order Update – {order.order_number} is now {order.get_status_display()}"
        send_mail(
            subject=subject,
            message=f"Your order {order.order_number} status: {order.get_status_display()}.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[order.user.email],
            fail_silently=False,
        )
    except Exception as exc:
        raise self.retry(exc=exc)


@shared_task
def send_low_stock_alert(product_id):
    from apps.products.models import Product
    try:
        product = Product.objects.get(pk=product_id)
        send_mail(
            subject=f"Low Stock Alert – {product.name}",
            message=f"Product '{product.name}' (SKU: {product.sku}) has only {product.stock} units left.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.EMAIL_HOST_USER],
            fail_silently=True,
        )
    except Product.DoesNotExist:
        pass


@shared_task
def send_sms_notification(phone, message):
    if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_PHONE_NUMBER]):
        return
    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        client.messages.create(body=message, from_=settings.TWILIO_PHONE_NUMBER, to=phone)
    except Exception:
        pass
