from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CheckoutCallbackView,
    CreateCheckoutSessionView,
    CurrentSubscriptionView,
    InfinitePayWebhookView,
    SubscriptionPlanViewSet,
)


router = DefaultRouter()
router.register(r'plans', SubscriptionPlanViewSet, basename='billing-plan')

urlpatterns = [
    path('', include(router.urls)),
    path('me/', CurrentSubscriptionView.as_view(), name='billing-me'),
    path('checkout/', CreateCheckoutSessionView.as_view(), name='billing-checkout'),
    path('checkout/callback/', CheckoutCallbackView.as_view(), name='billing-checkout-callback'),
    path('webhook/infinitepay/', InfinitePayWebhookView.as_view(), name='billing-infinitepay-webhook'),
]
