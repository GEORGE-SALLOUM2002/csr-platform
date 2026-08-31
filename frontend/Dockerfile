# ============================================================
#  واجهة جمعية الأشعة — بناء React ثم خدمتها عبر Nginx
# ============================================================

# ---- مرحلة البناء ----
FROM node:20-alpine AS build
WORKDIR /app

# تثبيت الاعتماديات (طبقة كاش مستقلة)
COPY package*.json ./
RUN npm ci

# نسخ الشيفرة والبناء
COPY . .
# في الإنتاج: الـ API على نفس النطاق تحت /api (عبر Nginx) — نبنيه في الحزمة
RUN printf "VITE_API_URL=/api\n" > .env.production \
    && npm run build

# ---- مرحلة التشغيل (Nginx) ----
FROM nginx:1.27-alpine
# إعداد Nginx (SPA + تمرير /api و/admin و/static + خدمة /media)
COPY nginx.conf /etc/nginx/conf.d/default.conf
# ملفات الواجهة المبنية
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
