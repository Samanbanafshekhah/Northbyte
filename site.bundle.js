(() => {
'use strict';
// Editable identity and contact values. Empty contact details are never fabricated.
const siteConfig = {
  brand: 'NorthByte',
  contactEmail: '',
  publicUrl: '',
  people: [
    { id: 'saman', name: { en: 'Saman Banafshe Khah', fa: 'سامان بنفشه‌خواه' }, role: 'founder', portrait: 'assets/person-2.png', bio: { en: 'Saman is the founder of {brand}. Together with Mohsen, he builds web products that connect practical interfaces, backend systems, and the infrastructure behind them. The team’s approach brings architecture, implementation, and ongoing operation into one continuous process.', fa: 'سامان بنیان‌گذار {brand} است. او در کنار محسن روی ساخت محصولات وب کار می‌کند؛ محصولاتی که رابط کاربردی، سیستم بک‌اند و زیرساخت را به هم وصل می‌کنند. رویکرد تیم، معماری، پیاده‌سازی و نگهداری را در یک مسیر پیوسته کنار هم قرار می‌دهد.' } },
    { id: 'mohsen', name: { en: 'Mohsen Zirak', fa: 'محسن زیرک' }, role: 'cofounder', portrait: 'assets/person-1.png', bio: { en: 'Mohsen is the co-founder of {brand}. Together with Saman, he works across software engineering and delivery, turning complex requirements into usable web systems. Their shared focus is clear workflows, well-connected services, and software a team can understand and maintain.', fa: 'محسن هم‌بنیان‌گذار {brand} است. او در کنار سامان در مهندسی نرم‌افزار و اجرای پروژه فعالیت می‌کند و نیازهای پیچیده را به سیستم‌های وب کاربردی تبدیل می‌کند. تمرکز مشترک آن‌ها، گردش کار روشن، سرویس‌های هماهنگ و نرم‌افزاری است که تیم بتواند آن را بفهمد و نگهداری کند.' } },
  ],
};

const technologies = ['PHP', 'Laravel', 'Yii', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'MySQL', 'PostgreSQL', 'Redis', 'REST APIs', 'Docker', 'Linux', 'Nginx', 'Git', 'CI/CD'];

const content = {
  en: {
    title: 'Software engineering, from interface to infrastructure',
    meta: 'Web applications, reliable APIs, integrations, and deployment. Meet the team building the systems behind ambitious ideas.',
    skip: 'Skip to content', navLabel: 'Main navigation', nav: ['Services', 'Work', 'Process', 'Team'],
    contactLink: 'Let’s talk', language: 'فارسی', languageLabel: 'Switch to Persian',
    heroLabel: 'SOFTWARE ENGINEERING / BUILT TOGETHER', heroTitle: 'We build the systems behind <em>ambitious ideas.</em>',
    heroText: 'From thoughtful interfaces and reliable APIs to deployment and operations, we turn complex requirements into web products built to work in the real world.',
    primary: 'Start a project', secondary: 'Explore our work', scroll: 'Explore what we build',
    heroNote: 'Two perspectives. One engineering team.', heroTags: ['Full-stack development', 'Backend systems', 'DevOps & delivery'],
    systemLabel: 'FROM IDEA TO OPERATION', systemNodes: ['Interface', 'Application', 'Infrastructure'],
    servicesLabel: '01 / WHAT WE DO', servicesTitle: 'The whole system.<br><em>Not just the screen.</em>',
    servicesIntro: 'We connect the experience your users see with the engineering they rely on. One team, from the first requirement to ongoing operation.',
    services: [
      ['01', 'Web applications', 'Tools that fit the way you work: dashboards, portals, approval flows, and applications with the right permissions.', 'WORKFLOWS / PERMISSIONS / DATA'],
      ['02', 'Websites & interfaces', 'Clear, responsive websites and practical interfaces that help people find information and get things done.', 'RESPONSIVE / ACCESSIBLE / USABLE'],
      ['03', 'Backend & API development', 'Structured business logic, reliable data models, and APIs that give your product room to evolve.', 'BUSINESS LOGIC / DATABASES / REST'],
      ['04', 'DevOps & deployment', 'Repeatable releases and considered infrastructure, with deployment, configuration, and maintenance built into the plan.', 'LINUX / CONTAINERS / CI/CD'],
      ['05', 'System integrations', 'Connect services and reduce manual handoffs with validated data exchange and well-defined failure handling.', 'EXTERNAL SERVICES / DATA EXCHANGE'],
    ],
    workLabel: '02 / SELECTED WORK', workTitle: 'Real workflows.<br><em>Considered engineering.</em>',
    workIntro: 'A closer look at the kinds of systems we work on, the problems they address, and the decisions behind them.',
    detail: 'Explore the approach', challenge: 'The challenge', approach: 'The approach', capabilities: 'Key capabilities', stack: 'Relevant technologies',
    projects: [
      { category: 'PORTALS & INTEGRATIONS', title: 'Cooperative services portal', description: 'A clear path through registration, approvals, and external service checks.', challenge: 'Multi-step requests need accurate data and a clear view of what happens next, even when external services are involved.', approach: 'Model the application as explicit workflow stages, validate each step, and keep external checks separate from the request lifecycle.', capabilities: ['Registration & approval stages', 'Request tracking and validation', 'Government or registry service integrations'], tech: ['PHP', 'Laravel', 'MySQL', 'REST APIs'], diagram: ['Register', 'Validate', 'Review', 'Approve'] },
      { category: 'OPERATIONS & WORKFLOWS', title: 'Organizational task manager', description: 'Tasks, permissions, and approvals that reflect how an organization operates.', challenge: 'Hierarchical roles and approval paths make a simple task list insufficient for coordinating work.', approach: 'Define role-aware access and explicit task states, with APIs that keep assignments, requests, and progress consistent.', capabilities: ['Hierarchical positions & access control', 'Task assignment and request approvals', 'Progress tracking and API design'], tech: ['PHP', 'Yii', 'PostgreSQL', 'REST APIs'], diagram: ['Assign', 'In progress', 'Review', 'Complete'] },
      { category: 'COMMERCE & PLATFORMS', title: 'E-commerce platform', description: 'Product discovery and purchase flows, supported by practical administration.', challenge: 'Catalog structure, pricing, purchase flows, and permissions must work together for both shoppers and administrators.', approach: 'Separate catalog and pricing rules from purchase workflows, and plan administrative access alongside deployment.', capabilities: ['Product, category & pricing management', 'Purchase flows and administration', 'Permissions and deployment'], tech: ['Laravel', 'JavaScript', 'MySQL', 'Docker'], diagram: ['Discover', 'Select', 'Purchase', 'Manage'] },
    ],
    processLabel: '03 / HOW WE WORK', processTitle: 'A clear path from<br><em>question to release.</em>', processIntro: 'Small decisions, visible progress, and a shared understanding of what comes next.',
    process: [
      ['Discovery & scope', 'Understand the users, constraints, and requirements. Agree on the scope and what acceptance looks like.'],
      ['Architecture & design', 'Map the workflows, data, interfaces, and infrastructure before committing to implementation.'],
      ['Iterative development', 'Build in reviewable increments, share progress, and refine the details with your feedback.'],
      ['Testing & deployment', 'Check the important flows, prepare the environment, and make the release process repeatable.'],
      ['Maintain & improve', 'Resolve issues, adapt to new needs, and keep the product and its infrastructure maintainable.'],
    ],
    teamLabel: '04 / THE PEOPLE BEHIND THE SYSTEMS', teamTitle: 'Different perspectives.<br><em>Shared responsibility.</em>',
    teamIntro: 'Saman and Mohsen bring software engineering and delivery together. Architecture, implementation, and operation are part of the same conversation.',
    founder: 'Founder', cofounder: 'Co-founder', portraitAlt: 'Portrait of',
    teamNote: 'We work across the product, not in isolated handoffs. The goal is a system your team can use, understand, and maintain.',
    techLabel: '05 / OUR TOOLKIT', techTitle: 'The right tools.<br><em>For the actual problem.</em>', techIntro: 'A practical stack for application development, data, integrations, and reliable delivery. The requirements guide the choices.',
    contactLabel: '06 / LET’S BUILD SOMETHING USEFUL', contactTitle: 'What do you<br><em>have in mind?</em>', contactIntro: 'Tell us about the problem, who the product is for, and the constraints that matter. That is a good place to start.',
    nameLabel: 'Your name', namePlaceholder: 'How should we address you?', emailLabel: 'Your email', emailPlaceholder: 'you@company.com', ideaLabel: 'What would you like to build?', ideaPlaceholder: 'The idea, your users, and what success looks like…',
    send: 'Open email draft', save: 'Save project brief',
    mailNote: 'Opens your email app with a draft. You review and send it there.',
    localNote: 'Email contact is not configured yet. You can save a brief on your device; nothing is sent.',
    required: 'Please complete this field.', emailInvalid: 'Please enter a valid email address.',
    mailSuccess: 'Your email draft is ready in your email app. It has not been sent automatically.', localSuccess: 'Your brief is ready to save. Nothing has been sent.', contactError: 'The brief could not be prepared. Please try again.',
    briefTitle: 'Project enquiry', footerStatement: 'Thoughtful interfaces. Reliable systems. Built together.', footerNav: 'Footer navigation', backTop: 'Back to top', footerKicker: 'SOFTWARE & SYSTEMS', reduceMotion: 'Reduce motion', noScript: 'Enable JavaScript to prepare a project brief or change the language.',
  },
  fa: {
    title: 'مهندسی نرم‌افزار؛ از رابط کاربری تا زیرساخت',
    meta: 'طراحی و توسعه وب‌اپلیکیشن، API، یکپارچه‌سازی سرویس‌ها و استقرار. تیمی برای ساخت سیستم‌هایی که ایده‌های بلندپروازانه را عملی می‌کنند.',
    skip: 'رفتن به محتوای اصلی', navLabel: 'منوی اصلی', nav: ['خدمات', 'پروژه‌ها', 'روش همکاری', 'تیم'],
    contactLink: 'شروع گفتگو', language: 'English', languageLabel: 'Switch to English',
    heroLabel: 'مهندسی نرم‌افزار / با هم می‌سازیم', heroTitle: 'پشت هر ایده بزرگ،<br><em>یک سیستم درست.</em>',
    heroText: 'از رابط کاربری دقیق و API قابل اتکا تا استقرار و نگهداری؛ نیازهای پیچیده را به محصولاتی تبدیل می‌کنیم که در دنیای واقعی کار می‌کنند.',
    primary: 'شروع یک پروژه', secondary: 'نگاهی به پروژه‌ها', scroll: 'ببینید چه می‌سازیم',
    heroNote: 'دو نگاه متفاوت. یک تیم مهندسی.', heroTags: ['توسعه فول‌استک', 'سیستم‌های بک‌اند', 'دواپس و استقرار'],
    systemLabel: 'از ایده تا اجرا', systemNodes: ['رابط کاربری', 'اپلیکیشن', 'زیرساخت'],
    servicesLabel: '۰۱ / خدمات ما', servicesTitle: 'تمام سیستم؛<br><em>فراتر از ظاهر.</em>',
    servicesIntro: 'تجربه‌ای که کاربر می‌بیند را به زیرساختی وصل می‌کنیم که به آن تکیه دارد. از اولین نیاز تا نگهداری، یک تیم کنار پروژه است.',
    services: [
      ['۰۱', 'وب‌اپلیکیشن', 'ابزارهایی متناسب با روش کار شما؛ از داشبورد و پرتال تا گردش تأیید درخواست‌ها و دسترسی‌های دقیق.', 'گردش کار / دسترسی / داده'],
      ['۰۲', 'وب‌سایت و رابط کاربری', 'وب‌سایت‌های واکنش‌گرا و رابط‌های روشن و کاربردی که پیدا کردن اطلاعات و انجام کارها را ساده می‌کنند.', 'واکنش‌گرا / دسترس‌پذیر / کاربردی'],
      ['۰۳', 'بک‌اند و توسعه API', 'منطق کسب‌وکار منسجم، مدل داده دقیق و APIهایی که با رشد محصول قابل توسعه می‌مانند.', 'منطق کسب‌وکار / پایگاه داده / REST'],
      ['۰۴', 'دواپس و استقرار', 'انتشار تکرارپذیر و زیرساخت سنجیده؛ استقرار، پیکربندی و نگهداری از ابتدا بخشی از برنامه‌اند.', 'لینوکس / کانتینر / CI/CD'],
      ['۰۵', 'یکپارچه‌سازی سیستم‌ها', 'اتصال سرویس‌ها و کاهش کارهای دستی با تبادل داده معتبر و مدیریت روشن خطاها.', 'سرویس‌های بیرونی / تبادل داده'],
    ],
    workLabel: '۰۲ / نگاهی به پروژه‌ها', workTitle: 'نیازهای واقعی.<br><em>راهکارهای سنجیده.</em>',
    workIntro: 'نگاهی نزدیک‌تر به نوع سیستم‌هایی که روی آن‌ها کار می‌کنیم، مسئله‌هایی که حل می‌کنند و تصمیم‌های فنی پشت آن‌ها.',
    detail: 'بررسی رویکرد فنی', challenge: 'مسئله', approach: 'رویکرد', capabilities: 'قابلیت‌های اصلی', stack: 'فناوری‌های مرتبط',
    projects: [
      { category: 'پرتال و یکپارچه‌سازی', title: 'پرتال خدمات تعاونی', description: 'مسیری روشن برای ثبت‌نام، تأیید درخواست و استعلام از سرویس‌های بیرونی.', challenge: 'درخواست‌های چندمرحله‌ای به داده دقیق و وضعیت قابل پیگیری نیاز دارند؛ به‌خصوص وقتی استعلام از سرویس‌های بیرونی بخشی از فرایند است.', approach: 'فرایند به مرحله‌های مشخص تقسیم می‌شود، داده‌ها در هر مرحله اعتبارسنجی می‌شوند و استعلام‌های بیرونی از چرخه اصلی درخواست جدا می‌مانند.', capabilities: ['ثبت‌نام و تأیید چندمرحله‌ای', 'پیگیری درخواست و اعتبارسنجی داده', 'اتصال به سرویس‌های دولتی یا ثبتی'], tech: ['PHP', 'Laravel', 'MySQL', 'REST APIs'], diagram: ['ثبت‌نام', 'اعتبارسنجی', 'بررسی', 'تأیید'] },
      { category: 'عملیات و گردش کار', title: 'مدیریت وظایف سازمانی', description: 'وظایف، دسترسی‌ها و تأییدهایی هماهنگ با ساختار واقعی سازمان.', challenge: 'وقتی سمت‌ها سلسله‌مراتبی و مسیرهای تأیید چندمرحله‌ای هستند، یک فهرست ساده وظایف برای هماهنگی کافی نیست.', approach: 'دسترسی مبتنی بر نقش و وضعیت‌های مشخص وظیفه تعریف می‌شوند و APIها تخصیص کار، درخواست‌ها و پیشرفت را هماهنگ نگه می‌دارند.', capabilities: ['سمت‌های سلسله‌مراتبی و کنترل دسترسی', 'تخصیص وظیفه و تأیید درخواست', 'پیگیری پیشرفت و طراحی API'], tech: ['PHP', 'Yii', 'PostgreSQL', 'REST APIs'], diagram: ['تخصیص', 'در حال انجام', 'بررسی', 'تکمیل'] },
      { category: 'تجارت الکترونیک', title: 'پلتفرم فروشگاهی', description: 'از پیدا کردن محصول تا خرید، همراه با ابزارهای مدیریت کاربردی.', challenge: 'ساختار محصولات، قیمت‌گذاری، فرایند خرید و سطح دسترسی باید برای خریدار و مدیر فروشگاه هماهنگ عمل کنند.', approach: 'قواعد محصول و قیمت از فرایند خرید جدا می‌شوند و دسترسی‌های مدیریتی هم‌زمان با برنامه استقرار طراحی می‌شوند.', capabilities: ['مدیریت محصول، دسته‌بندی و قیمت', 'فرایند خرید و پنل مدیریت', 'سطوح دسترسی و استقرار'], tech: ['Laravel', 'JavaScript', 'MySQL', 'Docker'], diagram: ['جست‌وجو', 'انتخاب', 'خرید', 'مدیریت'] },
    ],
    processLabel: '۰۳ / روش همکاری', processTitle: 'مسیری روشن،<br><em>از سؤال تا انتشار.</em>', processIntro: 'تصمیم‌های مشخص، پیشرفت قابل مشاهده و درک مشترک از قدم بعدی.',
    process: [
      ['شناخت و تعیین محدوده', 'کاربران، محدودیت‌ها و نیازها را می‌شناسیم و بر سر محدوده کار و معیار پذیرش توافق می‌کنیم.'],
      ['معماری و طراحی', 'پیش از پیاده‌سازی، گردش کار، ساختار داده، رابط‌ها و زیرساخت را مشخص می‌کنیم.'],
      ['توسعه مرحله‌به‌مرحله', 'کار را در بخش‌های قابل بررسی پیش می‌بریم و با بازخورد شما جزئیات را بهتر می‌کنیم.'],
      ['آزمون و استقرار', 'مسیرهای مهم را می‌آزماییم، محیط را آماده می‌کنیم و انتشار را به فرایندی تکرارپذیر تبدیل می‌کنیم.'],
      ['نگهداری و بهبود', 'مشکلات را رفع می‌کنیم، به نیازهای تازه پاسخ می‌دهیم و محصول و زیرساخت را قابل نگهداری نگه می‌داریم.'],
    ],
    teamLabel: '۰۴ / آدم‌های پشت سیستم‌ها', teamTitle: 'نگاه‌های متفاوت.<br><em>مسئولیت مشترک.</em>',
    teamIntro: 'سامان و محسن، مهندسی نرم‌افزار و اجرای پروژه را کنار هم پیش می‌برند. معماری، پیاده‌سازی و بهره‌برداری برای ما بخش‌های یک گفت‌وگو هستند.',
    founder: 'بنیان‌گذار', cofounder: 'هم‌بنیان‌گذار', portraitAlt: 'تصویر',
    teamNote: 'محصول را یکپارچه می‌بینیم، نه مجموعه‌ای از تحویل‌های جداگانه. هدف، سیستمی است که تیم شما بتواند با آن کار کند، آن را بفهمد و نگهداری کند.',
    techLabel: '۰۵ / ابزارهای ما', techTitle: 'ابزار مناسب،<br><em>برای مسئله واقعی.</em>', techIntro: 'مجموعه‌ای کاربردی برای توسعه نرم‌افزار، داده، اتصال سرویس‌ها و استقرار قابل اتکا. نیاز پروژه، انتخاب‌ها را مشخص می‌کند.',
    contactLabel: '۰۶ / بیایید چیزی کاربردی بسازیم', contactTitle: 'چه ایده‌ای<br><em>در ذهن دارید؟</em>', contactIntro: 'از مسئله، کاربران محصول و محدودیت‌های مهم بگویید. همین‌ها نقطه شروع خوبی برای یک گفت‌وگوی سازنده‌اند.',
    nameLabel: 'نام شما', namePlaceholder: 'چطور صدایتان کنیم؟', emailLabel: 'ایمیل شما', emailPlaceholder: 'you@company.com', ideaLabel: 'چه چیزی می‌خواهید بسازید؟', ideaPlaceholder: 'ایده، کاربران و تصویری که از موفقیت پروژه دارید…',
    send: 'آماده کردن ایمیل', save: 'ذخیره شرح پروژه',
    mailNote: 'پیش‌نویس در برنامه ایمیل شما باز می‌شود. بررسی و ارسال آن با شماست.',
    localNote: 'آدرس تماس هنوز تنظیم نشده است. می‌توانید شرح پروژه را روی دستگاه خود ذخیره کنید؛ اطلاعاتی ارسال نمی‌شود.',
    required: 'لطفاً این بخش را تکمیل کنید.', emailInvalid: 'لطفاً یک آدرس ایمیل معتبر وارد کنید.',
    mailSuccess: 'پیش‌نویس در برنامه ایمیل شما آماده است. ایمیل به‌صورت خودکار ارسال نشده است.', localSuccess: 'شرح پروژه برای ذخیره آماده است. اطلاعاتی ارسال نشده است.', contactError: 'آماده‌سازی شرح پروژه انجام نشد. لطفاً دوباره تلاش کنید.',
    briefTitle: 'درخواست همکاری برای پروژه', footerStatement: 'رابط‌های سنجیده. سیستم‌های قابل اتکا. با هم می‌سازیم.', footerNav: 'پیوندهای پایانی', backTop: 'بازگشت به بالا', footerKicker: 'نرم‌افزار و زیرساخت', reduceMotion: 'کاهش حرکت', noScript: 'برای آماده کردن شرح پروژه یا تغییر زبان، جاوااسکریپت را فعال کنید.',
  },
};


const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const ids = ['services', 'work', 'process', 'team'];
const arrow = '<span aria-hidden="true">↗</span>';
const pills = values => values.map(value => `<span>${escapeHtml(value)}</span>`).join('');
function sectionHeading(label, title, intro) {
  return `<div class="section-heading"><div><p class="eyebrow">${label}</p><h2>${title}</h2></div><p class="section-intro">${intro}</p></div>`;
}
function languageButton(c, location) {
  return `<button class="language-switch" data-language-switch aria-label="${c.languageLabel}" data-location="${location}"><span aria-hidden="true">◎</span> <span lang="${c.language === 'فارسی' ? 'fa' : 'en'}">${c.language}</span></button>`;
}
function renderSite(language = 'en') {
  const lang = content[language] ? language : 'en';
  const c = content[lang];
  const brand = escapeHtml(siteConfig.brand);
  const architectureLabels = lang === 'fa' ? ['وب / رابط / تجربه کاربری', 'API / منطق / یکپارچه‌سازی', 'داده / استقرار / نگهداری'] : ['WEB / UI / EXPERIENCE', 'API / LOGIC / INTEGRATIONS', 'DATA / DEPLOY / OPERATE'];
  const nav = ids.map((id, i) => `<a href="#${id}">${c.nav[i]}</a>`).join('');
  return `
    <a class="skip-link" href="#main">${c.skip}</a>
    <header class="site-header"><a class="brand" href="#home" aria-label="${brand}"><img class="brand-mark" src="assets/northbyte-mark.svg" width="38" height="38" alt="" aria-hidden="true"><b dir="ltr">${brand}</b></a><nav aria-label="${c.navLabel}">${nav}</nav><div class="header-actions">${languageButton(c, 'header')}<a class="header-cta" href="#contact">${c.contactLink} ${arrow}</a></div></header>
    <main id="main">
      <section class="hero section" id="home" aria-labelledby="hero-title">
        <div class="hero-atmosphere" aria-hidden="true"><div class="grid"></div><div class="smoke smoke-one"></div><div class="smoke smoke-two"></div><div class="particles"></div></div>
        <div class="hero-copy"><p class="eyebrow"><span class="live-dot"></span>${c.heroLabel}</p><h1 id="hero-title">${c.heroTitle}</h1><p class="hero-description">${c.heroText}</p><div class="actions"><a class="button primary" href="#contact">${c.primary} ${arrow}</a><a class="text-link" href="#work">${c.secondary}<span aria-hidden="true">→</span></a></div><div class="hero-tags">${pills(c.heroTags)}</div></div>
        <div class="architecture-stage" aria-label="${c.systemLabel}"><div class="architecture-halo" aria-hidden="true"></div><div class="architecture-header"><span class="live-dot"></span>${c.systemLabel}<span aria-hidden="true">↗</span></div><div class="architecture-stack">${c.systemNodes.map((label, i) => `<div class="architecture-layer layer-${i}"><span class="layer-number" dir="ltr">0${i + 1}</span><div><h3>${label}</h3><p>${architectureLabels[i]}</p></div><span class="layer-symbol" aria-hidden="true">${['▧', '{ }', '⌘'][i]}</span><i class="signal" aria-hidden="true"></i></div>`).join('')}</div><div class="architecture-footer" aria-hidden="true"><span>⌁</span><span>${lang === 'fa' ? 'طراحی ← توسعه ← استقرار' : 'DESIGN → BUILD → DEPLOY'}</span><span>+</span></div></div>
        <div class="hero-bottom"><a href="#services"><span class="scroll-symbol" aria-hidden="true">↓</span>${c.scroll}</a><span>${c.systemLabel}</span></div>
      </section>
      <div class="system-band"><div class="system-band-label"><span class="live-dot"></span>${c.systemLabel}</div><div class="system-nodes">${c.systemNodes.map((label, i) => `<span><b dir="ltr">0${i + 1}</b>${label}</span>${i < 2 ? '<i aria-hidden="true">⟶</i>' : ''}`).join('')}</div><span class="band-end" aria-hidden="true">&lt; / &gt;</span></div>
      <section class="section services-section" id="services">${sectionHeading(c.servicesLabel, c.servicesTitle, c.servicesIntro)}<div class="service-grid">${c.services.map(([number, title, description, tags], i) => `<article class="service-card"><div class="service-top"><span class="service-icon" aria-hidden="true">${['⌘', '▧', '{ }', '↥', '⤧'][i]}</span><span class="card-index">${number}</span></div><h3>${title}</h3><p>${description}</p><div class="service-tags">${tags}</div></article>`).join('')}<div class="service-visual" aria-hidden="true"><div class="visual-orbit"></div><div class="code-core">&lt;/&gt;</div><span class="code-label label-top">API</span><span class="code-label label-left">UI</span><span class="code-label label-right">OPS</span><span class="code-label label-bottom">DATA</span></div></div></section>
      <section class="section work-section" id="work">${sectionHeading(c.workLabel, c.workTitle, c.workIntro)}<div class="project-grid">${c.projects.map((project, index) => `<article class="project-card"><div class="project-visual visual-${index}" aria-hidden="true"><div class="diagram-toolbar"><span></span><span></span><span></span><i>0${index + 1}</i></div><div class="workflow-diagram">${project.diagram.map((label, i) => `<div class="workflow-step"><span class="workflow-check">${i < 2 ? '✓' : '○'}</span><span>${label}</span><i></i></div>`).join('')}</div><div class="diagram-decoration">{ ${['workflow', 'access', 'commerce'][index]} }</div></div><div class="project-body"><p class="eyebrow">${project.category}</p><h3>${project.title}</h3><p>${project.description}</p><div class="tech-pills" dir="ltr">${pills(project.tech)}</div><details><summary>${c.detail}<span aria-hidden="true">+</span></summary><div class="project-detail"><h4>${c.challenge}</h4><p>${project.challenge}</p><h4>${c.approach}</h4><p>${project.approach}</p><h4>${c.capabilities}</h4><ul>${project.capabilities.map(capability => `<li>${capability}</li>`).join('')}</ul><p class="stack-note">${c.stack}: <bdi>${project.tech.join(' / ')}</bdi></p></div></details></div></article>`).join('')}</div></section>
      <section class="section process-section" id="process">${sectionHeading(c.processLabel, c.processTitle, c.processIntro)}<ol class="process-list">${c.process.map(([title, description], i) => `<li><span class="process-number">${new Intl.NumberFormat(lang, { minimumIntegerDigits: 2 }).format(i + 1)}</span><h3>${title}</h3><p>${description}</p></li>`).join('')}</ol></section>
      <section class="section team-section" id="team">${sectionHeading(c.teamLabel, c.teamTitle, c.teamIntro)}<div class="team-grid">${siteConfig.people.map(member => `<article class="team-card" id="${member.id}"><div class="team-avatar"><img src="${escapeHtml(member.portrait)}" width="1254" height="1254" alt="${c.portraitAlt} ${escapeHtml(member.name[lang])}" loading="lazy" decoding="async"></div><div class="team-info"><p class="team-position">${c[member.role]}</p><h3>${escapeHtml(member.name[lang])}</h3><p class="team-bio">${escapeHtml(member.bio[lang].replaceAll('{brand}', siteConfig.brand))}</p></div></article>`).join('')}</div><p class="team-note">${c.teamNote}</p></section>
      <section class="section technology-section" id="technology">${sectionHeading(c.techLabel, c.techTitle, c.techIntro)}<div class="technology-list" dir="ltr">${pills(technologies)}</div></section>
      <section class="section contact-section" id="contact"><div class="contact-copy"><p class="eyebrow">${c.contactLabel}</p><h2>${c.contactTitle}</h2><p class="section-intro">${c.contactIntro}</p><div class="contact-orbit" aria-hidden="true"><span>↗</span></div>${siteConfig.contactEmail ? `<a class="contact-address" href="mailto:${escapeHtml(siteConfig.contactEmail)}" dir="ltr">${escapeHtml(siteConfig.contactEmail)}</a>` : ''}</div><form id="contact-form"><div class="form-row"><div><label for="contact-name">${c.nameLabel}</label><input id="contact-name" name="name" autocomplete="name" required maxlength="100" placeholder="${c.namePlaceholder}"></div><div><label for="contact-email">${c.emailLabel}</label><input id="contact-email" name="email" type="email" autocomplete="email" required maxlength="254" dir="ltr" placeholder="${c.emailPlaceholder}"></div></div><label for="contact-idea">${c.ideaLabel}</label><textarea id="contact-idea" name="idea" required rows="5" maxlength="5000" placeholder="${c.ideaPlaceholder}"></textarea><button class="button primary" type="submit" data-contact-submit disabled>${siteConfig.contactEmail ? c.send : c.save}${arrow}</button><p class="form-status" id="form-status" role="status" aria-live="polite">${siteConfig.contactEmail ? c.mailNote : c.localNote}</p><noscript><p class="form-status">${c.noScript}</p></noscript></form></section>
    </main>
    <footer class="site-footer"><div><a class="brand footer-brand" href="#home"><img class="brand-mark" src="assets/northbyte-mark.svg" width="38" height="38" alt="" aria-hidden="true"><b dir="ltr">${brand}</b></a><p>${c.footerStatement}</p></div><nav aria-label="${c.footerNav}">${nav}<a href="#contact">${c.contactLink}</a></nav><div class="footer-bottom"><span><bdi>${brand}</bdi> / ${c.footerKicker}</span>${languageButton(c, 'footer')}<button class="motion-switch" data-motion-toggle aria-pressed="false">${c.reduceMotion}</button><a href="#home">${c.backTop}<span aria-hidden="true"> ↑</span></a></div></footer>`;
}




const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

// Scroll-linked depth for the abstract hero. Deterministic in both directions.
function getSceneOffset(progress) {
  const p = clamp(progress);
  return -24 * p * p * (3 - 2 * p);
}


const root = document.querySelector('#site');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let language = 'en';
let manualReduced = false;
try { language = localStorage.getItem('webteam-language') === 'fa' ? 'fa' : 'en'; } catch { /* Storage can be unavailable in private contexts. */ }
let hero, architecture, sections = [], navigation = [];
let frame = 0;
let observer;
let currentSection = '';

function updateMetadata() {
  const c = content[language];
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
  document.title = `${siteConfig.brand} — ${c.title}`;
  document.querySelector('meta[name="description"]').content = c.meta;
  document.querySelector('meta[property="og:title"]').content = document.title;
  document.querySelector('meta[property="og:description"]').content = c.meta;
  document.querySelector('meta[property="og:locale"]').content = language === 'fa' ? 'fa_IR' : 'en_US';
}

function renderMotion() {
  frame = 0;
  const heroRect = hero.getBoundingClientRect();
  const positions = sections.map(section => ({ element: section, top: section.getBoundingClientRect().top }));
  const active = positions.filter(item => item.top <= innerHeight * 0.4).at(-1)?.element.id ?? 'home';
  if (active !== currentSection) {
    currentSection = active;
    navigation.forEach(link => {
      if (link.hash === `#${active}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  if (reduced.matches || manualReduced) return;
  if (heroRect.bottom > 0 && heroRect.top < innerHeight) {
    architecture.style.setProperty('--scene-shift', `${getSceneOffset((90 - heroRect.top) / heroRect.height)}px`);
  }
}
function schedule() { if (!frame) frame = requestAnimationFrame(renderMotion); }

function syncMotionPreference() {
  const isReduced = reduced.matches || manualReduced;
  document.documentElement.classList.toggle('motion-enabled', !isReduced);
  architecture.style.removeProperty('--scene-shift');
  const toggle = document.querySelector('[data-motion-toggle]');
  toggle.setAttribute('aria-pressed', String(isReduced));
  toggle.disabled = reduced.matches;
  schedule();
}

function bindPage() {
  hero = document.querySelector('.hero');
  architecture = document.querySelector('.architecture-stage');
  sections = [...document.querySelectorAll('main > section')];
  navigation = [...document.querySelectorAll('nav a')];
  currentSection = '';
  observer?.disconnect();
  observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      entry.target.dataset.visible = String(entry.isIntersecting);
      if (entry.target.hasAttribute('data-reveal')) entry.target.dataset.inView = String(entry.isIntersecting);
    });
  }, { threshold: 0.06 });
  observer.observe(hero);
  // Animate meaningful content groups instead of stacking transforms on every nested div.
  const revealTargets = document.querySelectorAll('.hero-copy > *, .architecture-stage, .system-band > *, .section-heading > *, .service-card, .service-visual, .project-card, .process-list li, .team-card, .technology-list span, .contact-copy > *, #contact-form, .site-footer > div, .site-footer > nav');
  revealTargets.forEach((element, index) => {
    element.dataset.reveal = '';
    element.style.setProperty('--reveal-delay', `${index % 3 * 65}ms`);
    observer.observe(element);
  });
  document.querySelectorAll('[data-language-switch]').forEach(button => button.addEventListener('click', () => switchLanguage(button.dataset.location)));
  document.querySelector('[data-motion-toggle]').addEventListener('click', () => { manualReduced = !manualReduced; syncMotionPreference(); });
  bindContact();
  syncMotionPreference();
}

function switchLanguage(location) {
  const anchor = [...sections].reverse().find(section => section.getBoundingClientRect().top <= 125) ?? hero;
  const anchorId = anchor.id;
  const relativeScroll = clamp((scrollY - anchor.offsetTop) / anchor.offsetHeight);
  const values = Object.fromEntries(new FormData(document.querySelector('#contact-form')));
  const expanded = [...document.querySelectorAll('.project-card details')].map(detail => detail.open);
  language = language === 'en' ? 'fa' : 'en';
  try { localStorage.setItem('webteam-language', language); } catch { /* Preference still works in memory. */ }
  root.innerHTML = renderSite(language);
  updateMetadata();
  bindPage();
  Object.entries(values).forEach(([name, value]) => { document.querySelector(`#contact-form [name="${name}"]`).value = value; });
  document.querySelectorAll('.project-card details').forEach((detail, index) => { detail.open = expanded[index]; });
  const nextAnchor = document.getElementById(anchorId);
  window.scrollTo({ top: anchorId === 'home' ? 0 : nextAnchor.offsetTop + relativeScroll * nextAnchor.offsetHeight, behavior: 'instant' });
  document.querySelector(`[data-language-switch][data-location="${location}"]`).focus({ preventScroll: true });
}

function bindContact() {
  const form = document.querySelector('#contact-form');
  form.querySelector('[data-contact-submit]').disabled = false;
  const fields = [...form.querySelectorAll('input, textarea')];
  const c = content[language];
  fields.forEach(field => {
    field.addEventListener('input', () => field.setCustomValidity(''));
    field.addEventListener('invalid', () => field.setCustomValidity(field.validity.valueMissing ? c.required : field.validity.typeMismatch ? c.emailInvalid : ''));
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    fields.forEach(field => {
      field.value = field.value.trim();
      field.setCustomValidity(field.value ? '' : c.required);
    });
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const status = document.querySelector('#form-status');
    const body = `${c.nameLabel}: ${data.get('name').trim()}\n${c.emailLabel}: ${data.get('email').trim()}\n\n${c.ideaLabel}\n${data.get('idea').trim()}\n`;
    status.classList.remove('error');
    try {
      if (siteConfig.contactEmail) {
        window.location.href = `mailto:${encodeURIComponent(siteConfig.contactEmail)}?subject=${encodeURIComponent(c.briefTitle)}&body=${encodeURIComponent(body)}`;
        status.textContent = c.mailSuccess;
      } else {
        const url = URL.createObjectURL(new Blob([body], { type: 'text/plain;charset=utf-8' }));
        const link = Object.assign(document.createElement('a'), { href: url, download: 'project-brief.txt' });
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        status.textContent = c.localSuccess;
      }
    } catch {
      status.textContent = c.contactError;
      status.classList.add('error');
    }
  });
}

if (language !== document.documentElement.lang) root.innerHTML = renderSite(language);
updateMetadata();
bindPage();
window.addEventListener('scroll', schedule, { passive: true });
window.addEventListener('resize', schedule, { passive: true });
reduced.addEventListener('change', syncMotionPreference);

})();
