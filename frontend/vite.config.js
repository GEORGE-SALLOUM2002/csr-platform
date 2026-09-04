import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// أثناء التطوير: خادم Vite (5173) يمرّر طلبات الـ API والملفات إلى Django (8001)،
// فيصبح كل شيء على أصل واحد (نفس المنفذ 5173): واجهة + API + وسائط.
// هذا يوحّد التجربة ويجعل معاينة ملفات الـPDF المدمجة تعمل محلياً أيضاً.
// changeOrigin: false ليبقى ترويسة Host كما هي (localhost) فتُبنى روابط الملفات على نفس الأصل.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8001', changeOrigin: false },
      '/media': { target: 'http://localhost:8001', changeOrigin: false },
    },
  },
})
