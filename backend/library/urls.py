"""مسارات المكتبة."""
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ResourceViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="categories")
router.register("resources", ResourceViewSet, basename="resources")

urlpatterns = router.urls
