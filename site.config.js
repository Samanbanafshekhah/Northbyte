// Editable identity and contact values. Empty contact details are never fabricated.
export const siteConfig = {
  brand: 'NorthByte',
  contactEmail: '',
  publicUrl: '',
  authEndpoint: '',
  registerEndpoint: '',
  sessionEndpoint: '',
  projectApiBase: '',
  postLoginPath: '/dashboard',
  // Local preview credentials only. Disable this when real authentication is connected.
  demoAuth: {
    enabled: true,
    email: 'client@northbyte.dev',
    password: 'NorthByte2026!',
    user: { fullName: 'Demo Client', email: 'client@northbyte.dev' },
  },
  people: [
    { id: 'saman', name: { en: 'Saman Banafshe Khah', fa: 'سامان بنفشه‌خواه' }, role: 'founder', portrait: 'assets/person-2.png', social: { github: '', linkedin: '', instagram: '' }, bio: { en: 'Saman is the founder of {brand}. Together with Mohsen, he builds web products that connect practical interfaces, backend systems, and the infrastructure behind them. The team’s approach brings architecture, implementation, and ongoing operation into one continuous process.', fa: 'سامان بنیان‌گذار {brand} است. او در کنار محسن روی ساخت محصولات وب کار می‌کند؛ محصولاتی که رابط کاربردی، سیستم بک‌اند و زیرساخت را به هم وصل می‌کنند. رویکرد تیم، معماری، پیاده‌سازی و نگهداری را در یک مسیر پیوسته کنار هم قرار می‌دهد.' } },
    { id: 'mohsen', name: { en: 'Mohsen Zirak', fa: 'محسن زیرک' }, role: 'cofounder', portrait: 'assets/person-1.png', social: { github: '', linkedin: '', instagram: '' }, bio: { en: 'Mohsen is the co-founder of {brand}. Together with Saman, he works across software engineering and delivery, turning complex requirements into usable web systems. Their shared focus is clear workflows, well-connected services, and software a team can understand and maintain.', fa: 'محسن هم‌بنیان‌گذار {brand} است. او در کنار سامان در مهندسی نرم‌افزار و اجرای پروژه فعالیت می‌کند و نیازهای پیچیده را به سیستم‌های وب کاربردی تبدیل می‌کند. تمرکز مشترک آن‌ها، گردش کار روشن، سرویس‌های هماهنگ و نرم‌افزاری است که تیم بتواند آن را بفهمد و نگهداری کند.' } },
  ],
};
