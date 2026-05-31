from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProducerProfileViewSet

router = DefaultRouter()
router.register(r'', ProducerProfileViewSet, basename='producer')

urlpatterns = [
    path('', include(router.urls)),
]
