from django.urls import path
from .views import create_razorpay_order, verify_razorpay_payment, create_stripe_intent, stripe_webhook

urlpatterns = [
    path("razorpay/create/", create_razorpay_order, name="razorpay_create"),
    path("razorpay/verify/", verify_razorpay_payment, name="razorpay_verify"),
    path("stripe/intent/", create_stripe_intent, name="stripe_intent"),
    path("stripe/webhook/", stripe_webhook, name="stripe_webhook"),
]
