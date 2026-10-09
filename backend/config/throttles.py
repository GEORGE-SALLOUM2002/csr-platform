"""حدّ معدّل مشترك لنقاط العدّادات (الزيارات/المشاهدات/الضغطات) لمنع التضخيم المتعمّد."""
from rest_framework.throttling import SimpleRateThrottle


class StatsThrottle(SimpleRateThrottle):
    """لكل عنوان IP — المعدّل من DEFAULT_THROTTLE_RATES["stats"]."""
    scope = "stats"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}
