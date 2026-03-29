import { defineConfig } from 'vite';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        products: resolve(__dirname, 'products.html'),
        productDetail: resolve(__dirname, 'product-detail.html'),
        factory: resolve(__dirname, 'factory.html'),
        cases: resolve(__dirname, 'cases.html'),
        certifications: resolve(__dirname, 'certifications.html'),
        partnerships: resolve(__dirname, 'partnerships.html'),
        contact: resolve(__dirname, 'contact.html'),
        technology: resolve(__dirname, 'technology.html'),
        blog: resolve(__dirname, 'blog/index.html'),
        error404: resolve(__dirname, '404.html'),
        zh_main: resolve(__dirname, 'zh/index.html'),
        zh_products: resolve(__dirname, 'zh/products.html'),
        zh_factory: resolve(__dirname, 'zh/factory.html'),
        zh_cases: resolve(__dirname, 'zh/cases.html'),
        zh_certifications: resolve(__dirname, 'zh/certifications.html'),
        zh_partnerships: resolve(__dirname, 'zh/partnerships.html'),
        zh_contact: resolve(__dirname, 'zh/contact.html'),
        zh_technology: resolve(__dirname, 'zh/technology.html'),
      }
    }
  }
});
