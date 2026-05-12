from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CreateCheckoutSessionView, CurrentSubscriptionView, StripeWebhookView, SubscriptionPlanViewSet


router = DefaultRouter()
router.register(r'plans', SubscriptionPlanViewSet, basename='billing-plan')

urlpatterns = [
    path('', include(router.urls)),
    path('me/', CurrentSubscriptionView.as_view(), name='billing-me'),
    path('checkout/', CreateCheckoutSessionView.as_view(), name='billing-checkout'),
    path('webhook/stripe/', StripeWebhookView.as_view(), name='billing-stripe-webhook'),
]
