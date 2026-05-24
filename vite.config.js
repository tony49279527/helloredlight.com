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
        siliconeLedMask: resolve(__dirname, 'silicone-led-mask.html'),
        luxor360Bed: resolve(__dirname, 'luxor-360-bed.html'),
        miniPanel300w: resolve(__dirname, 'mini-panel-300w.html'),
        laserPen: resolve(__dirname, 'laser-pen.html'),
        therapyBelt: resolve(__dirname, 'therapy-belt.html'),
        factory: resolve(__dirname, 'factory.html'),
        cases: resolve(__dirname, 'cases.html'),
        certifications: resolve(__dirname, 'certifications.html'),
        partnerships: resolve(__dirname, 'partnerships.html'),
        contact: resolve(__dirname, 'contact.html'),
        resources: resolve(__dirname, 'resources.html'),
        technology: resolve(__dirname, 'technology.html'),
        oemManufacturing: resolve(__dirname, 'oem-red-light-therapy.html'),
        privateLabel: resolve(__dirname, 'private-label-red-light-therapy.html'),
        wholesalePanels: resolve(__dirname, 'wholesale-red-light-panels.html'),
        buyersGuide: resolve(__dirname, 'buyers-guide.html'),
        blog: resolve(__dirname, 'blog/index.html'),
        blogWavelength: resolve(__dirname, 'blog/wavelength-comparison-guide.html'),
        blogBenefits: resolve(__dirname, 'blog/red-light-therapy-benefits.html'),
        blogGyms: resolve(__dirname, 'blog/red-light-therapy-for-gyms.html'),
        blogSkincare: resolve(__dirname, 'blog/red-light-therapy-for-skincare-clinics.html'),
        blogStartup: resolve(__dirname, 'blog/how-to-start-red-light-therapy-business.html'),
        blogWholesaleSupplier: resolve(__dirname, 'blog/how-to-choose-red-light-therapy-wholesale-supplier.html'),
        blogCostGuide: resolve(__dirname, 'blog/red-light-therapy-equipment-cost-guide.html'),
        casesBeauty: resolve(__dirname, 'cases/beauty-salon-chain-deployment.html'),
        casesGym: resolve(__dirname, 'cases/gym-recovery-center.html'),
        casesDistributor: resolve(__dirname, 'cases/global-distributor-private-label.html'),
        error404: resolve(__dirname, '404.html'),
        thankYou: resolve(__dirname, 'thank-you.html'),
        zh_main: resolve(__dirname, 'zh/index.html'),
        zh_products: resolve(__dirname, 'zh/products.html'),
        zh_factory: resolve(__dirname, 'zh/factory.html'),
        zh_cases: resolve(__dirname, 'zh/cases.html'),
        zh_certifications: resolve(__dirname, 'zh/certifications.html'),
        zh_partnerships: resolve(__dirname, 'zh/partnerships.html'),
        zh_contact: resolve(__dirname, 'zh/contact.html'),
        zh_resources: resolve(__dirname, 'zh/resources.html'),
        zh_technology: resolve(__dirname, 'zh/technology.html'),
        faq: resolve(__dirname, 'faq.html'),
        zh_faq: resolve(__dirname, 'zh/faq.html'),
        zh_productDetail: resolve(__dirname, 'zh/product-detail.html'),
        zh_siliconeLedMask: resolve(__dirname, 'zh/silicone-led-mask.html'),
        zh_luxor360Bed: resolve(__dirname, 'zh/luxor-360-bed.html'),
        zh_miniPanel300w: resolve(__dirname, 'zh/mini-panel-300w.html'),
        zh_laserPen: resolve(__dirname, 'zh/laser-pen.html'),
        zh_therapyBelt: resolve(__dirname, 'zh/therapy-belt.html'),
        zh_thankYou: resolve(__dirname, 'zh/thank-you.html'),
      }
    }
  }
});
