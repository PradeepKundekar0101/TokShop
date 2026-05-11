export const DEFAULT_LANDING_CONTENT = {
  hero: {
    title: 'The Live Shopping Marketplace',
    subtitle: 'Shop, sell, and connect around the things you love.',
    primaryButtonText: 'Get Started',
    primaryButtonLink: '/signup',
    secondaryButtonText: 'Browse Shows',
    secondaryButtonLink: '/marketplace',
    downloadText: 'Download',
    phoneImage1: '',
    phoneImage2: '',
    qrCodeImage: ''
  },
  joinFun: {
    title: 'Join In the Fun',
    subtitle: 'Take part in fast-paced auctions, incredible flash sales, live show giveaways, and so much more.',
    downloadText: 'Download',
    phoneImage: '',
    qrCodeImage: ''
  },
  gotItAll: {
    title: "We've Got It All",
    subtitle: "Search our marketplace to find the exact product you're looking for",
    downloadText: 'Download',
    phoneImage: '',
    qrCodeImage: ''
  },
  deals: {
    title: 'Find Incredible Deals on Name Brands',
    subtitle: "From the brands you love, to hard-to-find specialty products. There's a deal on whatever you're looking for.",
    buttonText: 'Start Shopping',
    buttonLink: '/signup',
    downloadText: 'Download',
    trustBadgeText: 'PEACE OF MIND',
    phoneImage: '',
    qrCodeImage: ''
  },
  footer: {
    copyrightText: '2025'
  }
};

export const DEFAULT_CONTENT_PAGES: Record<string, any> = {
  faq: {
    title: 'Frequently Asked Questions',
    subtitle: 'Find answers to common questions about our platform',
    faqs: [
      { question: 'How do I create an account?', answer: 'Click on the "Get Started" button and follow the registration process. You can sign up using your email or social media accounts.' },
      { question: 'Is it safe to shop here?', answer: 'Yes! We provide buyer protection on all purchases and use secure payment processing to ensure your transactions are safe.' },
      { question: 'How do live auctions work?', answer: 'Join a live show, browse the items being showcased, and place your bids in real-time. The highest bidder wins when the auction closes.' },
      { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, debit cards, and digital payment methods through our secure payment processor.' },
    ],
  },
  about: {
    title: 'About Us',
    subtitle: 'Learn more about our platform and mission',
    sections: [
      { title: 'Our Story', content: 'We started with a simple mission: to create the most engaging and trustworthy live shopping marketplace. Today, thousands of buyers and sellers connect on our platform every day to discover amazing deals and build lasting relationships.' },
      { title: 'Our Mission', content: "We believe shopping should be fun, social, and exciting. That's why we've built a platform that combines the thrill of live auctions with the convenience of online shopping." },
      { title: 'Why Choose Us', content: "With buyer protection, secure payments, and a vibrant community of sellers, we're committed to providing the best live shopping experience possible." },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'How we collect, use, and protect your information',
    sections: [
      { title: 'Information We Collect', content: 'We collect information you provide directly to us, such as when you create an account, make a purchase, or contact our support team.' },
      { title: 'How We Use Your Information', content: 'We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.' },
      { title: 'Data Security', content: 'We implement appropriate security measures to protect your personal information from unauthorized access, alteration, or disclosure.' },
      { title: 'Your Rights', content: "You have the right to access, update, or delete your personal information. Contact us if you'd like to exercise these rights." },
    ],
  },
  terms: {
    title: 'Terms of Service',
    subtitle: 'Rules and guidelines for using our platform',
    sections: [
      { title: 'Acceptance of Terms', content: 'By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement.' },
      { title: 'User Accounts', content: 'You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.' },
      { title: 'Prohibited Activities', content: 'You may not use our platform for any illegal purposes or to violate any laws. This includes but is not limited to fraud, harassment, or posting harmful content.' },
      { title: 'Termination', content: 'We reserve the right to terminate or suspend your account at any time for violations of these terms or for any other reason we deem necessary.' },
    ],
  },
  contact: {
    title: 'Contact Us',
    subtitle: 'Get in touch with our team',
    description: "Have a question or need help? We're here for you. Reach out and we'll respond as soon as possible.",
    contactInfo: {
      email: 'support@example.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main Street, City, State 12345',
    },
    showContactForm: true,
    sections: [
      { title: 'Customer Support', content: 'Our support team is available Monday through Friday, 9am to 5pm EST. We aim to respond to all inquiries within 24 hours.' },
    ],
  },
};
