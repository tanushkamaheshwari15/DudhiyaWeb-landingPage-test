document.addEventListener('DOMContentLoaded', function () {
    // Mobile Navigation Toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', function () {
            const isOpen = !mobileMenu.classList.contains('translate-x-full');

            if (isOpen) {
                // Close menu
                mobileMenu.classList.add('translate-x-full');
                mobileMenuToggle.classList.remove('active');
                // Reset hamburger icon
                const spans = mobileMenuToggle.querySelectorAll('span');
                spans[0].style.transform = 'rotate(0) translateY(0)';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'rotate(0) translateY(0)';
            } else {
                // Open menu
                mobileMenu.classList.remove('translate-x-full');
                mobileMenuToggle.classList.add('active');
                // Transform to X
                const spans = mobileMenuToggle.querySelectorAll('span');
                spans[0].style.transform = 'rotate(45deg) translateY(5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translateY(-5px)';
            }
        });
    }

    // Close mobile menu when clicking on a nav link
    mobileNavLinks.forEach(navLink => {
        navLink.addEventListener('click', () => {
            mobileMenu.classList.add('translate-x-full');
            mobileMenuToggle.classList.remove('active');
            const spans = mobileMenuToggle.querySelectorAll('span');
            spans[0].style.transform = 'rotate(0) translateY(0)';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'rotate(0) translateY(0)';
        });
    });

    // Auth button (Login/Dashboard) logic
    const authBtn = document.getElementById('authBtn');
    if (authBtn) {
        const setAuthBtnState = () => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                authBtn.textContent = 'Dashboard';
                authBtn.href = '/dashboard';
                // Optional: style tweak to differentiate
                authBtn.classList.remove('primary');
                authBtn.classList.add('secondary');
            } else {
                authBtn.textContent = 'Login';
                authBtn.href = '/login';
                authBtn.classList.remove('secondary');
                authBtn.classList.add('primary');
            }
        };

        setAuthBtnState();


    }

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Adjusted for header height
                    behavior: 'smooth'
                });
            }
        });
    });

    // Testimonial Carousel (Handled in index.html)

    // Contact Form Submission (Handled in index.html)

    // Download Button: legacy APK handler removed to let the Play Store link work natively

    // Header scroll effect
    const header = document.querySelector('header');

    window.addEventListener('scroll', () => {
        if (header && window.scrollY > 50) {
            if (header) header.style.padding = '5px 0';
            if (header) header.style.boxShadow = '0 2px 15px rgba(0, 0, 0, 0.1)';
        } else {
            if (header) header.style.padding = '10px 0';
            if (header) header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        }
    });

    // Enhanced Animation on scroll
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.feature-card, .benefit-text, .benefit-image, .download-buttons, .contact-item, .testimonial-card, .benefits-cta, .floating-badge');

        elements.forEach((element, index) => {
            const elementPosition = element.getBoundingClientRect().top;
            const screenPosition = window.innerHeight / 1.2;

            if (elementPosition < screenPosition) {
                setTimeout(() => {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0) scale(1)';
                }, index * 100); // Staggered animation
            }
        });
    };

    // Set initial styles for enhanced animation
    document.querySelectorAll('.feature-card, .benefit-text, .benefit-image, .download-buttons, .contact-item, .testimonial-card, .benefits-cta, .floating-badge').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px) scale(0.95)';
        element.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    });

    // Run animation on scroll
    window.addEventListener('scroll', animateOnScroll);

    // Run once on load
    animateOnScroll();

    // Feature Modal functionality
    const featureModal = document.getElementById('featureModal');
    const modalContent = document.getElementById('modalContent');

    // Feature data
    const featureData = {
        'milk-calculator': {
            titleKey: 'modal_milk_calculator_title',
            descKey: 'modal_milk_calculator_desc',
            featureKeys: [
                'modal_milk_calculator_feature1',
                'modal_milk_calculator_feature2',
                'modal_milk_calculator_feature3',
                'modal_milk_calculator_feature4',
                'modal_milk_calculator_feature5'
            ],
            image: 'assets/milk-calculator.png'
        },
        'farmer-management': {
            titleKey: 'modal_farmer_management_title',
            descKey: 'modal_farmer_management_desc',
            featureKeys: [
                'modal_farmer_management_feature1',
                'modal_farmer_management_feature2',
                'modal_farmer_management_feature3',
                'modal_farmer_management_feature4',
                'modal_farmer_management_feature5'
            ],
            image: 'assets/farmer-managent.png'
        },
        'collection-entry': {
            titleKey: 'modal_collection_entry_title',
            descKey: 'modal_collection_entry_desc',
            featureKeys: [
                'modal_collection_entry_feature1',
                'modal_collection_entry_feature2',
                'modal_collection_entry_feature3',
                'modal_collection_entry_feature4',
                'modal_collection_entry_feature5'
            ],
            image: 'assets/collection-entry.png'
        },
        'wallet-payments': {
            titleKey: 'modal_wallet_payments_title',
            descKey: 'modal_wallet_payments_desc',
            featureKeys: [
                // 'modal_wallet_payments_feature1',
                'modal_wallet_payments_feature2',
                'modal_wallet_payments_feature3',
                'modal_wallet_payments_feature4',
                'modal_wallet_payments_feature5'
            ],
            image: 'assets/wallet-payments.png'
        },
        'shift-management': {
            titleKey: 'modal_shift_management_title',
            descKey: 'modal_shift_management_desc',
            featureKeys: [
                'modal_shift_management_feature1',
                'modal_shift_management_feature2',
                'modal_shift_management_feature3',
                'modal_shift_management_feature4',
                'modal_shift_management_feature5'
            ],
            image: 'assets/shift-management.png'
        },
        'reports-bills': {
            titleKey: 'modal_reports_bills_title',
            descKey: 'modal_reports_bills_desc',
            featureKeys: [
                'modal_reports_bills_feature1',
                'modal_reports_bills_feature2',
                'modal_reports_bills_feature3',
                'modal_reports_bills_feature4',
                'modal_reports_bills_feature5'
            ],
            image: 'assets/reports-bills.png'
        },
        'multi-language': {
            titleKey: 'modal_multi_language_title',
            descKey: 'modal_multi_language_desc',
            featureKeys: [
                'modal_multi_language_feature1',
                'modal_multi_language_feature2',
                'modal_multi_language_feature3',
                'modal_multi_language_feature4',
                'modal_multi_language_feature5'
            ],
            image: 'assets/multi-language.jpg'
        },
        'data-backup': {
            titleKey: 'modal_data_backup_title',
            descKey: 'modal_data_backup_desc',
            featureKeys: [
                'modal_data_backup_feature1',
                'modal_data_backup_feature2',
                'modal_data_backup_feature3',
                'modal_data_backup_feature4',
                'modal_data_backup_feature5'
            ],
            image: 'assets/data-backup.png'
        },
        // 'extra-feature': {
        //     title: 'Advanced Features',
        //     image: 'https://picsum.photos/seed/extra-feature-ui/600/300.jpg',
        //     description: 'Additional powerful features to enhance your dairy management.',
        //     features: [
        //         'Multi-language support (English, Hindi, Punjabi, Kannada)',
        //         'Different collection types (Standard, Pro-Rata, Raw)',
        //         'Bulk entry for multiple farmers at once',
        //         'Advanced analytics and insights',
        //         'Customizable settings and preferences'
        //     ]
        // }
    };

    // Open feature modal
    window.openFeatureModal = function (featureId) {
        const feature = featureData[featureId];
        if (!feature) return;

        // Get current language
        const currentLang = localStorage.getItem('preferredLanguage') || 'en';

        // Get translated content
        const title = translations[currentLang][feature.titleKey] || translations['en'][feature.titleKey];
        const description = translations[currentLang][feature.descKey] || translations['en'][feature.descKey];
        const features = feature.featureKeys.map(key =>
            translations[currentLang][key] || translations['en'][key]
        );
        const closeText = translations[currentLang]['modal_close'] || translations['en']['modal_close'];
        const keyFeaturesText = translations[currentLang]['modal_key_features'] || translations['en']['modal_key_features'];
        const tryFeatureText = translations[currentLang]['modal_try_feature'] || translations['en']['modal_try_feature'];

        const modalHTML = `
            <div class="flex flex-col lg:flex-row gap-4 lg:gap-8">
                <div class="lg:w-1/2">
                    <img src="${feature.image}" alt="${title}" class="w-full h-48 sm:h-56 lg:h-full object-cover rounded-lg">
                </div>
                <div class="lg:w-1/2 flex flex-col justify-between">
                    <div>
                        <h2 class="text-xl sm:text-2xl lg:text-3xl font-bold text-on-surface mb-3 lg:mb-4">${title}</h2>
                        <p class="text-base sm:text-lg text-on-surface-variant leading-relaxed mb-4 lg:mb-6">${description}</p>
                        <h3 class="text-lg sm:text-xl font-bold text-on-surface mb-3 lg:mb-4">${keyFeaturesText}:</h3>
                        <ul class="space-y-2 lg:space-y-3">
                            ${features.map(feat => `
                                <li class="flex items-start gap-2 lg:gap-3">
                                    <span class="material-symbols-outlined text-primary mt-0.5 flex-shrink-0 text-sm lg:text-base">check_circle</span>
                                    <span class="text-sm sm:text-base text-on-surface-variant">${feat}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    <div class="flex gap-2 lg:gap-3 pt-4 lg:pt-6 mt-auto">
                        <button onclick="closeFeatureModal()" class="flex-1 bg-surface-container text-on-surface px-4 lg:px-6 py-2.5 lg:py-3 rounded-lg font-semibold hover:bg-surface-container-high transition-colors text-sm sm:text-base">
                            ${closeText}
                        </button>
                        <button onclick="downloadApp()" class="flex-1 bg-primary text-on-primary px-4 lg:px-6 py-2.5 lg:py-3 rounded-lg font-semibold hover:bg-primary-hover transition-colors text-sm sm:text-base">
                            ${tryFeatureText}
                        </button>
                    </div>
                </div>
            </div>
        `;

        modalContent.innerHTML = modalHTML;
        featureModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    // Close feature modal
    window.closeFeatureModal = function () {
        featureModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    };

    // Close modal when clicking outside
    featureModal?.addEventListener('click', function (e) {
        if (e.target === featureModal) {
            closeFeatureModal();
        }
    });

    // Download app function
    window.downloadApp = function () {
        closeFeatureModal();
        // Scroll to download section or trigger download
        const downloadSection = document.getElementById('download');
        if (downloadSection) {
            downloadSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Multilingual Support
    const translations = {
        'en': {
            'nav_home': 'Home',
            'nav_features': 'Features',
            'nav_benefits': 'Benefits',
            'nav_download': 'Download',
            'nav_about': 'About',
            'nav_partner': 'Partner/Dealer',
            'nav_pricing': 'Pricing',
            'nav_contact': 'Contact',
            'nav_login': 'Login',
            'nav_dashboard': 'Dashboard',
            'select_language': 'Select Language',
            'hero_badge': 'First Month FREE • ₹500 Bonus',
            'hero_title': "India's #1 App for Milk Collection Centers",
            'hero_title_part1': "India's ",
            'hero_title_part2': "#1 App",
            'hero_title_part3': " for Milk Collection Centers",
            'hero_subtitle': 'Replace paper registers and calculators. Record farmer milk deliveries, auto-calculate FAT/SNF payments, and generate reports — all from your phone. Used by 10,000+ dairy centers.',
            'btn_download': 'Download Mobile App',
            'btn_explore': 'Explore Features',
            'workflow_buyer_label': 'For Buyers (Collection Centers)',
            'workflow_buyer_title': 'Simple 3-Step Workflow',
            'workflow_buyer_subtitle': 'Manage your collection center efficiently with our streamlined process',
            'workflow_buyer_step1_title': 'Add Supplier',
            'workflow_buyer_step1_desc': 'Connect dairy farmers',
            'workflow_buyer_step1_title_full': 'Add Supplier',
            'workflow_buyer_step1_desc_full': 'Connect dairy farmers to your collection center with detailed profiles',
            'workflow_buyer_step2_title': 'Do Collections',
            'workflow_buyer_step2_desc': 'Pro rata & standard',
            'workflow_buyer_step2_title_full': 'Do Collections',
            'workflow_buyer_step2_desc_full': 'Record milk deliveries with auto-calculated FAT, SNF, and rates',
            'workflow_buyer_step3_title': 'Generate Reports',
            'workflow_buyer_step3_desc': 'By supplier or all',
            'workflow_buyer_step3_title_full': 'Generate Reports',
            'workflow_buyer_step3_desc_full': 'Create PDF/Excel reports for any date range, supplier, or shift',
            'workflow_supplier_label': 'For Suppliers (Farmers)',
            'workflow_supplier_title': 'Simple 3-Step Workflow',
            'workflow_supplier_subtitle': 'Track your milk deliveries and earnings with our farmer-friendly system',
            'workflow_supplier_step1_title': 'See Connected Dairies',
            'workflow_supplier_step1_desc': 'View all buyers',
            'workflow_supplier_step1_title_full': 'See Connected Dairies',
            'workflow_supplier_step1_desc_full': 'View all collection centers you\'re connected to',
            'workflow_supplier_step2_title': 'View Collections',
            'workflow_supplier_step2_desc': 'By particular buyer',
            'workflow_supplier_step2_title_full': 'View Collections',
            'workflow_supplier_step2_desc_full': 'Check your milk deliveries by particular buyer',
            'workflow_supplier_step3_title': 'Generate Reports',
            'workflow_supplier_step3_desc': 'Download & share',
            'workflow_supplier_step3_title_full': 'View Reports & Earnings',
            'workflow_supplier_step3_desc_full': 'View reports shared by buyers & track your earnings',
            'farmer_details': 'Farmer Details',
            'contact_info': 'Contact Info',
            'pro_rata': 'Pro Rata',
            'standard': 'Standard',
            'pdf_bills': 'PDF Bills',
            'excel_export': 'Excel Export',
            'all_buyers': 'All Buyers',
            'status': 'Status',
            'daily_logs': 'Daily Logs',
            'rates': 'Rates',
            'view_reports': 'View Reports',
            'track_earnings': 'Track Earnings',
            'learn_more': 'Learn More',
            'learn_more_btn': 'Learn More',
            'free_for_first_month': 'Completely Free for First Month',
            'free_for_lifetime': 'Free For Lifetime!',
            'whatis_title': 'What is Dudhiya?',
            'whatis_subtitle': 'The smart app that replaces your paper registers and manual calculations for milk collection management.',
            'whatis_without_title': 'Without Dudhiya',
            'whatis_without_point1': 'Manual registers get lost or damaged',
            'whatis_without_point2': 'Calculator errors in FAT/SNF calculations',
            'whatis_without_point3': 'Payment disputes with farmers',
            'whatis_without_point4': 'Hours spent on manual reporting',
            'whatis_with_title': 'With Dudhiya',
            'whatis_with_point1': 'Digital records with cloud backup',
            'whatis_with_point2': 'Automatic FAT/SNF calculations',
            'whatis_with_point3': 'Transparent wallet for every farmer',
            'whatis_with_point4': 'One-click PDF/Excel reports',
            'use_web_app': 'Use Web App',
            'first_month_free': 'First Month FREE',
            'no_credit_card': 'No Credit Card',
            'support_24_7': '24/7 Support',
            'about_title': 'About Dudhiya',
            'about_subtitle': 'Your complete dairy management solution in one powerful app',
            'about_card_what_title': 'What',
            'about_card_what_desc': 'Smart app for milk collection management with cutting-edge technology',
            'about_card_who_title': 'Who',
            'about_card_who_desc': 'Collection centers & dairy farmers working together seamlessly',
            'about_card_how_title': 'How',
            'about_card_how_desc': 'Simple 3-step digital workflow that saves hours daily',
            'about_card_why_title': 'Why',
            'about_card_why_desc': 'Save time, reduce errors, grow business exponentially',
            'watch_demo': 'Watch Demo & Learn More',
            'demo_duration': '2-minute demo video',
            'features_title': 'Everything You Need to Run Your Dairy',
            'feature1_title': 'Milk Calculator',
            'feature1_desc': 'Instantly calculate milk value based on FAT, SNF, and volume with precision accuracy.',
            'feature2_title': 'Farmer Management',
            'feature2_desc': 'Add, edit, and track all your farmers with detailed profiles and history.',
            'feature3_title': 'Collection Entry',
            'feature3_desc': 'Record milk deliveries with quantity, FAT, SNF, and rate in seconds.',
            'feature4_title': 'Wallet & Subscription',
            'feature4_desc': 'Continue using the app with Wallet Recharge or Subscription Plans.',
            'feature5_title': 'Shift Management',
            'feature5_desc': 'Handle morning and evening shifts separately with ease.',
            'feature6_title': 'Reports & Bills',
            'feature6_desc': 'Generate comprehensive PDF/Excel reports and bills for any date range, farmer, or shift.',
            'feature7_title': 'Multi-Language Support',
            'feature7_desc': 'Use the app in your preferred language with support for English, Hindi, Punjabi, and Kannada.',
            'feature8_title': 'Data Backup & Safety',
            'feature8_desc': 'All data saved safely in the cloud with automatic backups and recovery options.',
            'btn_call_us': 'Call Us Now',
            'btn_use_web_app': 'Use Web App',
            'btn_contact_us': 'Contact Us',
            // Modal feature data
            'modal_milk_calculator_title': 'Milk Calculator',
            'modal_milk_calculator_desc': 'Instantly calculate milk value based on FAT, SNF, and volume with precision accuracy.',
            'modal_milk_calculator_feature1': 'Enter details like: weight, FAT percentage, SNF percentage',
            'modal_milk_calculator_feature2': 'No more paper registers that get lost',
            'modal_milk_calculator_feature3': 'Digital records with automatic backups',
            'modal_milk_calculator_feature4': 'Easy data entry with smart suggestions',
            'modal_milk_calculator_feature5': 'Real-time validation and error prevention',
            'modal_farmer_management_title': 'Farmer (Supplier) Management',
            'modal_farmer_management_desc': 'Add, edit, and track all your farmers with detailed profiles and history.',
            'modal_farmer_management_feature1': 'Save farmer details: name, phone number, village',
            'modal_farmer_management_feature2': 'Search farmers quickly by name or ID number',
            'modal_farmer_management_feature3': 'View complete history of each farmer\'s deliveries',
            'modal_farmer_management_feature4': 'Manage multiple farmers efficiently',
            'modal_farmer_management_feature5': 'Track farmer performance and quality trends',
            'modal_collection_entry_title': 'Collection Entry',
            'modal_collection_entry_desc': 'Record milk deliveries with quantity, FAT, SNF, and rate in seconds.',
            'modal_collection_entry_feature1': 'Record milk deliveries from farmers on your phone',
            'modal_collection_entry_feature2': 'Enter details like: weight, FAT percentage, SNF percentage',
            'modal_collection_entry_feature3': 'Quick entry during busy collection hours',
            'modal_collection_entry_feature4': 'Real-time data validation',
            'modal_collection_entry_feature5': 'Automatic quality calculations',
            'modal_wallet_payments_title': 'Wallet & Payments',
            'modal_wallet_payments_desc': 'Continue using the app with Wallet Recharge or Subscription Plans.',
            // 'modal_wallet_payments_feature1': 'Digital wallet to track money owed to farmers',
            'modal_wallet_payments_feature2': 'Add money to your wallet using online payment (UPI/Card)',
            'modal_wallet_payments_feature3': 'Get bonus money when you recharge (10% extra offers)',
            'modal_wallet_payments_feature4': 'Farmers can see their balance and payment history',
            'modal_wallet_payments_feature5': 'Instant payment processing and notifications',
            'modal_shift_management_title': 'Shift Management',
            'modal_shift_management_desc': 'Handle morning and evening shifts separately with ease.',
            'modal_shift_management_feature1': 'Separate entries for morning and evening milk collection',
            'modal_shift_management_feature2': 'Track which shift the milk was delivered',
            'modal_shift_management_feature3': 'Shift-wise reporting and analytics',
            'modal_shift_management_feature4': 'Manage different pricing for different shifts',
            'modal_shift_management_feature5': 'Easy shift switching and tracking',
            'modal_reports_bills_title': 'Reports & Bills',
            'modal_reports_bills_desc': 'Generate comprehensive PDF/Excel reports and bills for any date range, farmer, or shift.',
            'modal_reports_bills_feature1': 'Generate PDF bills for farmers',
            'modal_reports_bills_feature2': 'Create reports for any date range (daily, weekly, monthly)',
            'modal_reports_bills_feature3': 'Download and share reports via WhatsApp',
            'modal_reports_bills_feature4': 'See total milk collected, total money to pay',
            'modal_reports_bills_feature5': 'Customizable report templates and formats',
            'modal_multi_language_title': 'Multi-Language Support',
            'modal_multi_language_desc': 'Use the app in your preferred language with support for multiple regional languages.',
            'modal_multi_language_feature1': 'English',
            'modal_multi_language_feature2': 'Hindi (हिन्दी)',
            'modal_multi_language_feature3': 'Punjabi (ਪੰਜਾਬੀ)',
            'modal_multi_language_feature4': 'Kannada (ಕನ್ನಡ)',
            'modal_multi_language_feature5': 'Easy language switching within the app',
            'modal_data_backup_title': 'Data Backup & Safety',
            'modal_data_backup_desc': 'All data saved safely in the cloud with automatic backups and recovery options.',
            'modal_data_backup_feature1': 'All data saved safely in the cloud',
            'modal_data_backup_feature2': 'Access your data from any device',
            'modal_data_backup_feature3': 'If you change phones, your data is still there',
            'modal_data_backup_feature4': 'No fear of losing paper records',
            'modal_data_backup_feature5': 'Automatic backup and recovery options',
            'modal_close': 'Close',
            'modal_key_features': 'Key Features',
            'modal_try_feature': 'Try This Feature',
            'benefits_rating': '4.9/5 Rating',
            'benefits_subtitle': 'Why Choose Dudhiya?',
            'benefits_title': 'Efficiency Meets Precision Farming',
            'benefit1_title': 'Save Hours Daily',
            'benefit1_desc': 'Automated calculations eliminate manual work and reduce errors by 99%.',
            'benefit2_title': 'Build Trust',
            'benefit2_desc': 'Transparent digital records create confidence with your farmers.',
            'benefit3_title': 'Grow Your Business',
            'benefit3_desc': 'Handle 10x more farmers with the same team size.',
            'benefits_ready_text': 'Ready to experience these benefits?',
            'whois_badge': 'For Everyone in Dairy',
            'whois_title': 'Who is Dudhiya For?',
            'whois_subtitle': 'Choose your role and discover how Dudhiya simplifies dairy management for you',
            'whois_card1_role': 'Manager Role',
            'whois_card1_title': 'Collection Centers',
            'whois_card1_desc': 'Are you a Buyer who runs a milk collection center? Manage 10 to 1000+ farmers with our powerful Android app or Web App. Record collections, calculate rates automatically, and generate instant reports.',
            'whois_card1_feature1_title': 'Add & Manage Suppliers',
            'whois_card1_feature1_desc': 'Create farmer profiles in the app',
            'whois_card1_feature2_title': 'Record Collections',
            'whois_card1_feature2_desc': 'Enter milk data with auto FAT/SNF calc',
            'whois_card1_feature3_title': 'Generate & Share Reports',
            'whois_card1_feature3_desc': 'PDF/Excel bills via WhatsApp',
            'whois_card1_desc_short': 'Manage collections, automate rates, and generate reports quickly.',
            'whois_card1_feat_short1': 'Add Suppliers',
            'whois_card1_feat_short2': 'Generate Reports',
            'whois_card2_role': 'Viewer Role',
            'whois_card2_title': 'Dairy Farmers',
            'whois_card2_desc': 'Are you a Supplier who delivers milk? Use our mobile app to track your daily deliveries, view your earnings, and access reports shared by your collection center - all in one place.',
            'whois_card2_feature1_title': 'See Connected Dairies',
            'whois_card2_feature1_desc': 'View all collection centers in the app',
            'whois_card2_feature2_title': 'View Your Collections',
            'whois_card2_feature2_desc': 'Check daily logs & milk rates',
            'whois_card2_feature3_title': 'Track Your Earnings',
            'whois_card2_feature3_desc': 'View wallet & reports in real-time',
            'whois_card2_desc_short': 'Track deliveries and wallet balances in one place.',
            'whois_card2_feat_short1': 'View Collections',
            'whois_card2_feat_short2': 'Track Earnings',
            'whois_card3_role': 'Enterprise Role',
            'whois_card3_title': 'Cooperatives & Societies',
            'whois_card3_desc': 'Managing multiple collection centers? Our Web App gives you a centralized dashboard to monitor all locations, view consolidated analytics, and manage access.',
            'whois_card3_feature1_title': 'Multi-Center Dashboard',
            'whois_card3_feature1_desc': 'Monitor all centers via Web App',
            'whois_card3_feature2_title': 'Consolidated Reports',
            'whois_card3_feature2_desc': 'Combined analytics across all centers',
            'whois_card3_feature3_title': 'Role-Based Access',
            'whois_card3_feature3_desc': 'Assign managers per center',
            'whois_card3_desc_short': 'Central dashboard to monitor multiple centers and consolidated analytics.',
            'whois_card3_feat_short1': 'Consolidated Reports',
            'whois_card3_feat_short2': 'Role Access',
            'whois_buyer_note': 'Buyers manage via App/Web',
            'whois_supplier_note': 'Suppliers view via Mobile App',
            'whois_cta_title': 'Ready to Get Started?',
            'whois_cta_desc': 'Download the Dudhiya Android app for on-the-go access or use the Web App from any device with a larger screen.',
            'faq_title': 'Frequently Asked Questions',
            'faq_a1_p1': 'For Suppliers (Farmers): Completely FREE. Suppliers can track their milk deliveries, view earnings, and manage their profile at no cost.',
            'faq_a1_p2': 'For Buyers (Collection Centers): FREE for the first month. After the trial, subscription plans are available based on your collection volume and wallet features.',
            'faq_a2': 'Yes, your data is securely stored in the cloud with automatic backups. Even if you lose your phone or switch devices, your data remains safe and can be accessed instantly when you log in.',
            'faq_a4': 'You can switch roles easily from the app settings. Tap on your profile, select "Switch Role," and choose between Buyer (Collection Center) or Supplier (Farmer) mode. Each role has its own dashboard and features.',
            'faq_a5': 'Dudhiya lets you generate comprehensive reports including: Collection Reports (daily, weekly, monthly), Farmer Wallet Statements, Payment Summaries, and Shift-wise Reports. All reports can be exported as PDF or Excel and shared instantly via WhatsApp.',
            'free_trial_text': 'Download the app and start your free trial today — no credit card required!',
            'download_badge': 'Now v2.0 is Live',
            'download_title': 'Revolutionize your Dairy Operations',
            'download_subtitle': 'Join 10,000+ dairy professionals transforming their business with Dudhiya',
            'scan_to_download': 'Scan to Download',
            'download_for': 'Download for',
            'download_android': 'Android',
            'version_info': 'Compatible with Android 5.0 and above',
            'version_number': 'Version: 1.0.0',
            'version_size': 'Size: 75MB',
            'testimonials_title': 'Trusted by Dairy Communities',
            'testimonials_subtitle': 'See how Dudhiya is making a real difference in the lives of collection center owners and farmers.',
            'testimonial1_text': 'The multi-lingual support is a lifesaver. Our farmers feel much more confident seeing their data in their own language.',
            'testimonial1_name': 'Anand Deshmukh',
            'testimonial1_title': 'Regional Collection Head',
            'testimonial2_text': 'Managing 500+ customers was a nightmare before Dudhiya. Now everything is automated and transparent.',
            'testimonial2_name': 'Meera Patel',
            'testimonial2_title': 'Dairy Entrepreneur',
            'testimonial3_text': 'The wallet system is incredible. Farmers can track their earnings live, which has built a lot of trust in our center.',
            'testimonial3_name': 'Suresh G.',
            'testimonial3_title': 'Farmer Union Representative',
            'testimonial3_org': 'Shree Krishna Dairy • Madhya Pradesh',
            'testimonial4_text': 'I used to spend hours calculating payments. Now Dudhiya does it automatically with complete accuracy.',
            'testimonial4_name': 'Rajesh Sharma',
            'testimonial4_title': 'Collection Center Owner',
            'testimonial4_org': 'Balaji Dairy • Rajasthan',
            'testimonial5_text': "Dudhiya's cooperative features have streamlined our operations across multiple centers. The shared data is a game-changer.",
            'testimonial5_name': 'Priya',
            'testimonial5_title': 'Cooperative Manager',
            'testimonial5_org': 'Karnataka Dairy Cooperative • Karnataka',
            'testimonial6_text': 'The analytics helped me grow my daily collection by 40%. Very easy to use for our entire team.',
            'testimonial6_name': 'Vikram Singh',
            'testimonial6_title': 'Dairy Business Owner',
            'testimonial6_org': 'Punjab Milk Union • Punjab',
            'contact_title': 'Get in Touch',
            'contact_subtitle': 'Have questions about setting up your dairy with Dudhiya? Our team of experts is ready to assist you in every step of the transformation.',
            'contact_phone_label': 'Call Us',
            'contact_email_label': 'Email Support',
            'contact_address_label': 'Visit Office',
            'contact_form_name_label': 'Your Name',
            'contact_form_name_placeholder': 'John Doe',
            'contact_form_email_label': 'Email Address',
            'contact_form_email_placeholder': 'john@example.com',
            'contact_form_dairy_label': 'Dairy Name',
            'contact_form_dairy_placeholder': 'Sunrise Dairy',
            'contact_form_message_label': 'Message',
            'contact_form_message_placeholder': 'How can we help you?',
            'contact_form_submit': 'Send Message',
            'footer_description': "The world's most advanced smart dairy management ecosystem, built for the next generation of dairy farmers.",
            'footer_quicklinks_title': 'Quick Links',
            'footer_link_features': 'Features',
            'footer_link_benefits': 'Benefits',
            'footer_link_download': 'Download',
            'footer_link_contact': 'Contact',
            'footer_link_pricing': 'Pricing',
            'footer_link_supplier': 'Supplier',
            'footer_link_buyer': 'Buyer',
            'footer_explore_title': 'Workflows',
            'footer_company_title': 'Company',
            'footer_link_about': 'About Us',
            'footer_link_faq': 'FAQ',
            'footer_link_terms': 'Terms of Service',
            'footer_link_privacy': 'Privacy Policy',
            'footer_newsletter_title': 'Newsletter',
            'footer_newsletter_desc': 'Get the latest dairy industry updates delivered to your inbox.',
            'footer_newsletter_placeholder': 'Email',
            'footer_powered': 'Powered by',
            'footer_copyright': '© 2026 Dudhiya (Milk Collection Management System). All rights reserved.',
            'footer_bottom_terms': 'Terms',
            'footer_bottom_refund': 'Refund',
            'footer_bottom_terms_of_use': 'Terms of Use',
            'footer_bottom_privacy': 'Privacy',
            'whois_title': 'Who is Dudhiya For?',
            'whois_subtitle': 'Built specifically for the Indian dairy ecosystem',
            'whois_card1_title': 'Collection Centers',
            'whois_card1_desc': 'Perfect for milk collection centers managing 10 to 1000+ farmers with daily morning and evening shifts.',
            'whois_card1_point1': 'Daily collection entry',
            'whois_card1_point2': 'Automatic rate calculations',
            'whois_card1_point3': 'Farmer-wise reports',
            'whois_card2_title': 'Dairy Farmers',
            'whois_card2_desc': 'Ideal for individual farmers and cooperatives who supply milk to collection centers.',
            'whois_card2_point1': 'View all your collections',
            'whois_card2_point2': 'Track wallet balance live',
            'whois_card2_point3': 'Access payment history',
            'whois_card3_title': 'Dairy Cooperatives',
            'whois_card3_desc': 'Designed for large-scale dairy unions and cooperative societies managing multiple centers.',
            'whois_card3_point1': 'Multi-center dashboard',
            'whois_card3_point2': 'Consolidated analytics',
            'whois_card3_point3': 'Role-based access',
            'faq_title': 'Frequently Asked Questions',
            'faq_subtitle': 'Everything you need to know about Dudhiya',
            'faq_q1': 'How much does Dudhiya cost?',
            'faq_q2': 'Is my data safe and backed up?',

            'faq_q4': 'How do I switch between Buyer and Supplier roles?',
            'faq_q5': 'What kind of reports can I generate?',
            'still_have_questions': 'Still have questions?',
            'ask_anything_text': "Can't find the answer you're looking for? Our team is here to help!",
            'ask_on_whatsapp': 'Ask on WhatsApp',
            'call_us': 'Call Us',
            'quick_response_text': 'Get instant support! We respond within minutes, not hours',
            'plans_badge': 'Plans & Subscription',
            'plans_title': 'Flexible Plans for Your <span class="text-primary" style="color: #00288e;">Dairy</span>',
            'plans_subtitle': 'Start for free and grow as your business expands with our transparent pricing',
            'plan_free_title': 'First Month FREE',
            'plan_free_duration': '/first month',
            'plan_feature_all': 'All Premium Features Included',
            'plan_feature_suppliers_unlimited': 'No Supplier Limits',
            'plan_feature_support': 'Priority 24/7 Support',
            'btn_start_free': 'Get started with free',
            'plan_monthly_title': 'Monthly Plan',
            'plan_monthly_duration': '/month',
            'plan_monthly_desc': 'Ideal for growing collection centers',
            'plan_feature_suppliers_limit': 'Unlimited Suppliers',
            'plan_feature_wallet_recharge': 'Wallet Recharge Feature',
            'plan_feature_wallet_recharge_desc': 'If monthly plan expires, recharge wallet from min ₹10 to continue working.',
            'plan_feature_reports': 'PDF Reports',
            'plan_feature_support_standard': 'Standard Support',
            'btn_choose_plan': 'Start with this plan',
            'plan_yearly_title': 'Yearly Plan',
            'plan_yearly_subtitle': 'Best Value Solution',
            'plan_yearly_price': '₹9,999',
            'plan_yearly_duration': '/year',
            'plan_yearly_desc': 'Complete dairy management for a full year with maximum savings.',
            'plan_feature_save': 'Save ₹789 Per Year',
            'plan_feature_suppliers_unlimited': 'Unlimited Suppliers',
            'plan_feature_priority_support': 'Priority 24/7 Support',
            'btn_get_yearly': 'Start with this plan',
            'plan_wallet_title': 'Wallet Recharge',
            'plan_wallet_min_recharge': 'minimum recharge',
            'plan_wallet_rate_desc': '₹0.0125 / kg collected',
            'plan_wallet_feature1': 'Unlimited Suppliers',
            'plan_wallet_feature2': 'Pay as you go (No fixed monthly fee)',
            'plan_wallet_feature3': '₹1.25 charge per 100 kg milk',
            'plan_wallet_feature4': 'Balance never expires',
            'btn_start_wallet': 'Get started with wallet',
            'plan_sub_card_title': 'Subscription Plan',
            'plan_sub_card_subtitle': 'Monthly & Yearly Subscription options for your dairy',
            'plan_sub_feat1': 'Monthly & Yearly Flat Rates',
            'plan_sub_feat2': 'Unlimited Collections & Suppliers',
            'plan_sub_feat3': 'Dedicated Support & PDF Reports',
            'btn_know_more': 'Know More',
            'modal_sub_heading': 'Subscription Plans',
            'modal_sub_subheading': 'Choose the right subscription plan for your dairy collection center.',
            'modal_contact_title': 'Contact us to buy Subscription',
            'modal_contact_desc': 'Call or WhatsApp our team to activate your subscription plan instantly.',
            'modal_btn_call': 'Call Us',
            'modal_btn_whatsapp': 'WhatsApp Us',
            'badge_free': 'Free',
            'badge_flexible': 'Flexible',
            'badge_popular': 'Popular',
            'badge_best_value': 'Best Value',
            'pricing_page_title': 'Dudhiya - Plans & Pricing Comparison',
            'pricing_hero_badge': '100% Transparent Billing',
            'pricing_hero_title': 'Choose the Perfect Plan for Your Dairy',
            'pricing_hero_subtitle': 'Whether you prefer a flat rate subscription or pay-as-you-go wallet billing, we have you covered.',
            'pricing_free_desc': 'Try all premium features for a full month completely free.',
            'pricing_badge_popular': 'Popular',
            'pricing_badge_value': 'Best Value',
            'pricing_badge_flexible': 'Flexible',
            'pricing_wallet_desc_short': 'Pay per kg of milk collected. Recharge only when you need.',
            'pricing_compare_title': 'Detailed Feature Comparison',
            'pricing_compare_subtitle': 'Compare all plans side-by-side to find the right fit for your dairy business.',
            'pricing_table_header_features': 'Features',
            'pricing_row_cost': 'Subscription Cost',
            'pricing_row_min_deposit': 'Minimum Deposit/Setup',
            'pricing_row_pay_as_you_go': 'Pay As You Go (Per KG)',
            'pricing_row_reports': 'Detailed PDF & Excel Reports',
            'pricing_row_backup': 'Automatic Cloud Backups',
            'pricing_row_shift': 'Shift Management (Morning/Evening)',
            'pricing_row_support': 'Customer Support',
            'pricing_info_title': 'Frequently Asked Questions',
            'pricing_q1': 'Can I switch plans anytime?',
            'pricing_a1': 'Yes! You can upgrade from Free Trial to Monthly, Yearly or Wallet Recharge at any time directly through your dashboard settings.',
            'pricing_q2': 'How does the Wallet Recharge plan charge me?',
            'pricing_a2': 'In the Wallet plan, there are no fixed monthly costs. You only pay ₹0.0125 per kg of milk collected. For example, if you collect 100 kg of milk, only ₹1.25 is deducted from your wallet balance. You can recharge with as low as ₹10 to keep using the services.',
            'pricing_q3': 'Does my wallet balance expire?',
            'pricing_a3': 'No! Your wallet balance has lifetime validity and will never expire, even if your collection center remains closed during seasonal off-times.',
            'btn_pricing_know_more': 'Compare Plans & Features',
            'calc_title': 'Plan Recommendation Calculator',
            'calc_subtitle': 'Input your monthly milk volume to see whether a flat-rate subscription or the pay-as-you-go wallet is cheaper.',
            'calc_label_milk': 'Estimated Monthly Milk Volume (in Kilograms)',
            'calc_sub_flat_cost': 'Flat subscription fee',
            'calc_sub_usage_cost': 'Charged at ₹0.0125 / kg',
            'hire_personnel_tag': 'Professional Service',
            'hire_personnel_title': "Don't Want to Do Collections Yourself?",
            'hire_personnel_subtitle': 'Hire a trained operator or person to handle your milk collections efficiently',
            'hire_personnel_card1_title': 'Hire a Person for Collections',
            'hire_personnel_card1_desc': 'Get reliable collection personnel who are trained to use Dudhiya app and manage your daily milk collections efficiently.',
            'hire_personnel_card2_title': 'Cost Estimate',
            'hire_personnel_card2_desc': 'Pricing typically ranges from ₹500 to ₹3,000-₹4,000 per month depending on the number of average daily collections and the volume of work required.',
            'hire_personnel_card3_title': 'Contact Dudhiya Support',
            'hire_personnel_card3_desc': 'Reach out to us to get a tailored quote and connect with reliable collection personnel in your area.',
            'hire_personnel_call': 'Call',
            'hire_personnel_whatsapp': 'WhatsApp Netpy',
            'hire_personnel_cta_title': 'Let Us Help You Find the Right Person',
            'hire_personnel_cta_desc': 'We connect you with trained, reliable collection personnel in your local area who are already familiar with Dudhiya app.',
            'hire_personnel_cta_button': 'Get Started Today',
            'hero_badge_tag': '3 Flexible Partnership Roles Available',
            'hero_main_title': 'Become a Partner with <span class="text-yellow-300 underline decoration-yellow-400/40 underline-offset-8">Dudhiya</span> — Build Your Business',
            'hero_main_subtitle': 'Earn steady income in the fast-growing dairy tech sector. Choose from 3 lucrative pathways: Sales Partner, Data Entry Operator, or Independent Dealer.',
            'btn_explore_roles': 'Explore 3 Roles',
            'btn_whatsapp_inquiry': 'WhatsApp Us',
            'pill_high_payout': 'High Recurring Payouts',
            'pill_zero_risk': 'Zero Risk & Investment Options',
            'pill_full_training': 'Full Training & Marketing Support',
            'card_opportunity_header': 'Earn Up To ₹50,000+ / Month',
            'card_opportunity_title': 'Select Your Partnership Goal',
            'mini_role1_title': '1. Sales Partner',
            'mini_role1_desc': 'Recommend dairies & earn 10% commission',
            'mini_role2_title': '2. Data Entry Operator',
            'mini_role2_desc': 'Manage assigned dairies & get paid per dairy',
            'mini_role3_title': '3. Franchise Dealer',
            'mini_role3_desc': 'Full territory network & 50%+ profit margin',
            'roles_section_badge': '3 Ways to Work & Earn',
            'roles_section_title': 'Choose Your Partnership Role',
            'roles_section_subtitle': 'Whether you want to refer local collection centers, operate daily data entry for dairy owners, or manage an entire territory dealership — we have the perfect opportunity for you.',
            'role1_badge': '10% Commission + Bonus',
            'role1_title': '1. Sales Partner',
            'role1_subtitle': 'Become a Sales Person / Advisor',
            'role1_desc': 'Introduce local dairy collection centers to the Dudhiya app and web portal. Help dairy owners digitize their business and earn lucrative payouts.',
            'role1_earning_label': 'Income Potential:',
            'role1_earning_val': '10% Lifetime Commission + ₹500 Bonus / Dairy',
            'role1_feat1': '10% instant discount / commission per dairy subscription',
            'role1_feat2': 'Recurring commission every month dairy recharges',
            'role1_feat3': 'Full app demo & marketing material provided',
            'role1_btn': 'Become a Sales Partner',
            'role2_badge': 'Guaranteed Pay Per Dairy',
            'role2_title': '2. Data Entry Operator',
            'role2_subtitle': 'Operate Milk Collections for Dairies',
            'role2_desc': 'Get assigned 2, 5, or more local dairies by Dudhiya or dairy owners. Enter daily morning and evening milk collection entries and generate PDF bills.',
            'role2_earning_label': 'Income Potential:',
            'role2_earning_val': 'Earn ₹1,500 – ₹3,000 per Dairy / Month',
            'role2_feat1': 'Work on assigned dairies locally or remotely',
            'role2_feat2': 'Guaranteed monthly payment per dairy managed',
            'role2_feat3': 'Zero software investment required',
            'role2_btn': 'Become an Operator',
            'role3_badge': '⭐ Maximum Earnings & Control',
            'role3_title': '3. Franchise Dealer',
            'role3_subtitle': 'Own Your Local Software Territory',
            'role3_desc': 'Operate a complete Dudhiya software franchise in your block or district. Add dairies, collect payments directly from dairy owners, and pay Dudhiya wholesale platform rates.',
            'role3_earning_label': 'Income Potential:',
            'role3_earning_val': 'Keep 50%+ Profit Margins (Earn ₹50,000+ / Mo)',
            'role3_feat1': 'Full territory ownership & client control',
            'role3_feat2': 'Direct payment collection from dairy owners',
            'role3_feat3': 'Dedicated 24/7 technical support & branding kit',
            'role3_btn': 'Become a Dealer',
            'matrix_title': 'Role Comparison & Earnings Overview',
            'matrix_subtitle': 'Compare key features, effort required, and payout structures side-by-side',
            'th_feature': 'Feature / Parameter',
            'th_role1': 'Sales Partner',
            'th_role2': 'Operator',
            'th_role3': 'Franchise Dealer',
            'tr1_label': 'Main Objective',
            'tr1_role1': 'Refer & Onboard Dairies',
            'tr1_role2': 'Enter Daily Collections',
            'tr1_role3': 'Run Territory Network',
            'tr2_label': 'Investment Required',
            'tr2_role1': '₹0 (Zero)',
            'tr2_role2': '₹0 (Zero)',
            'tr2_role3': 'Low Wholesale Rate',
            'tr3_label': 'Monthly Earning Range',
            'tr3_role1': '₹5,000 – ₹20,000',
            'tr3_role2': '₹10,000 – ₹25,000',
            'tr3_role3': '₹50,000 – ₹1,50,000+',
            'tr4_label': 'Time Commitment',
            'tr4_role1': 'Flexible / Part-time',
            'tr4_role2': '1-2 hrs Daily Shift',
            'tr4_role3': 'Full Business Ownership',
            'tr5_label': 'Support & Training',
            'tr5_role1': 'App Demo & Marketing Kit',
            'tr5_role2': 'Full Operator Training',
            'tr5_role3': 'Priority 24/7 Manager',
            'how_title': 'How to Get Started in 4 Easy Steps',
            'how_subtitle': 'Start earning with Dudhiya in less than 24 hours',
            'step1_title': 'Select Your Role',
            'step1_desc': 'Choose whether you want to be a Sales Partner, Operator, or Dealer.',
            'step2_title': 'Contact Our Team',
            'step2_desc': 'Reach out via WhatsApp or call our team directly.',
            'step3_title': 'Get Free Training',
            'step3_desc': 'Receive complete software demo, training, and marketing guidance.',
            'step4_title': 'Start Earning',
            'step4_desc': 'Onboard dairies or perform data entry and collect your monthly payouts.',
            'form_badge': 'Quick Registration',
            'form_title': 'Apply to Become a Partner or Dealer',
            'form_subtitle': 'Fill out your details and our team will contact you within 2 hours.',
            'label_name': 'Full Name *',
            'label_phone': 'Phone / Mobile Number *',
            'label_city': 'City / District *',
            'label_role': 'Select Preferred Role *',
            'label_message': 'Additional Message (Optional)',
            'btn_submit_application': 'Submit Application',
            'multirole_badge': 'All-in-One Multi-Role Advantage',
            'multirole_title': 'Can I Work in All 3 Roles Together? <span class="text-yellow-200">YES!</span>',
            'multirole_desc': 'You are not limited to just one role! Combine Sales Partnering (referring dairies), Data Entry Operations (managing milk entries for pay), and Territory Dealership to multiply your income streams.',
            'multirole_point1': 'Multiple Income Streams',
            'multirole_point2': 'Maximize Monthly Profits',
            'multirole_point3': 'Single Unified Account',
            'multirole_btn': 'Apply for Multi-Role Partner',
            'btn_whatsapp_ask': 'Ask on WhatsApp',
            'btn_call_us': 'Call Us',
            'contact_subtext_instant': 'Instant support! We respond in minutes, not hours.',
            'training_badge_tag': 'Free 1-on-1 & Group Masterclass',
            'training_title': 'Complete Dudhiya Software Training',
            'training_desc': 'Master the Dudhiya platform to support your clients effectively. Our experts will teach you how to set up dairy collection centers, manage farmer databases, automate FAT/SNF calculations, and generate one-click payment reports.',
            'train_topic1_title': 'Dairy Center Setup',
            'train_topic1_desc': 'Complete software & rate chart configuration',
            'train_topic2_title': 'Farmer Management',
            'train_topic2_desc': 'Add farmers, passbooks & advances',
            'train_topic3_title': 'FAT/SNF Automation',
            'train_topic3_desc': 'Auto milk testing & pricing calculation',
            'train_topic4_title': '1-Click PDF Reports',
            'train_topic4_desc': 'Instant billing, shift summary & reports',
            'badge_cert': '100% Free Partner Certification',
            'btn_call_training': 'Call for Training',
            'training_badge_support': 'Expert Support',
            'training_badge_sub': 'Available 24/7',
            'placeholder_name': 'Enter your full name',
            'placeholder_phone': '10-digit mobile number',
            'placeholder_city': 'Enter your city/district',
            'placeholder_message': 'Tell us about your experience or number of dairies in your area...',
            'option_role_1': '1. Sales Partner / Referral Agent (10% Commission)',
            'option_role_2': '2. Data Entry Operator (Guaranteed Per Dairy Pay)',
            'option_role_3': '3. Franchise Dealer (Full Software Network)',
            'option_role_4': '4. All 3 Roles Combined / All-in-One Multi-Role Partner (Max Income)',
            'contact_section_badge': 'Instant Assistance',
            'contact_section_title': 'Need Help or Have Questions? Talk to Us Immediately',
            'contact_section_subtitle': 'Our partnership experts are available to guide you through roles, earnings, and onboarding.',
            'contact_card_wa_title': 'Chat on WhatsApp',
            'contact_card_wa_desc': 'Get instant replies to all your questions from our support team.',
            'contact_card_call_title': 'Call Our Partnership Manager',
            'contact_card_call_desc': 'Direct 1-on-1 phone assistance from 9:00 AM to 8:00 PM.',
            'dealer_sub_badge': 'Software Pricing for Dairies & Dealers',
            'dealer_sub_title': 'Choose the Best Dudhiya Software Plan',
            'dealer_sub_subtitle': 'Affordable pricing plans for dairies using Dudhiya collection software.',
            'dealer_plan_freetrial_title': 'Free Trial',
            'dealer_plan_freetrial_price': 'FREE',
            'dealer_plan_freetrial_dur': 'For 1 Month',
            'dealer_plan_monthly_title': 'Monthly Plan',
            'dealer_plan_monthly_price': '₹899',
            'dealer_plan_monthly_orig': '₹999',
            'dealer_plan_monthly_unit': 'per Dairy/Collection Center',
            'dealer_plan_yearly_title': 'Yearly Plan',
            'dealer_plan_yearly_price': '₹9,999',
            'dealer_plan_yearly_orig': '₹10,999',
            'dealer_plan_yearly_unit': 'Unlimited Dairy/Collection Centers',
            'feat_1_center': '1 Dairy/Collection Center',
            'feat_basic_analytics': 'Basic reporting and analytics',
            'feat_std_support': 'Standard customer support',
            'feat_basic_training': 'Basic training materials',
            'feat_flex_center': 'Flexible center options',
            'feat_center_mgmt': 'Collection centers management',
            'feat_adv_analytics': 'Advanced reporting and analytics',
            'feat_prio_support': 'Priority customer support',
            'feat_training_onboard': 'Training and onboarding included',
            'feat_mktg_materials': 'Marketing materials provided',
            'btn_get_started': 'Get Started with this plan',
            'dealer_plan_contact_title': 'Contact Us to Activate Your Subscription',
            'dealer_plan_contact_sub': 'Call or WhatsApp our team to activate your software plan instantly.'
        },
        'hi': {
            'nav_home': 'मुख्य पृष्ठ',
            'nav_features': 'विशेषताएं',
            'nav_benefits': 'लाभ',
            'nav_download': 'डाउनलोड',
            'nav_about': 'हमारे बारे में',
            'nav_partner': 'पार्टनर/डीलर',
            'nav_pricing': 'कीमतें',
            'nav_contact': 'संपर्क',
            'nav_login': 'लॉग इन',
            'nav_dashboard': 'डैशबोर्ड',
            'select_language': 'भाषा चुनें',
            'hero_badge': 'पहला महीना FREE • ₹500 बोनस',
            'hero_title': 'दूध संग्रह केंद्रों के लिए भारत का #1 ऐप',
            'hero_title_part1': 'भारत का ',
            'hero_title_part2': '#1 ऐप',
            'hero_title_part3': ' दूध संग्रह केंद्रों के लिए',
            'hero_subtitle': 'कागज के रजिस्टर और कैलकुलेटर को बदलें। किसानों के दूध की डिलीवरी रिकॉर्ड करें, FAT/SNF भुगतान स्वचालित रूप से गणना करें, और रिपोर्ट तैयार करें — सब कुछ अपने फोन से। 10,000+ डेयरी केंद्रों द्वारा उपयोग किया जाता है।',
            'btn_download': 'मोबाइल ऐप डाउनलोड करें',
            'btn_explore': 'विशेषताएं देखें',
            'workflow_buyer_label': 'खरीदारों के लिए (संग्रह केंद्र)',
            'workflow_buyer_step1_title': 'सप्लायर जोड़ें',
            'workflow_buyer_step1_desc': 'डेयरी किसानों को जोड़ें',
            'workflow_buyer_step2_title': 'संग्रह करें',
            'workflow_buyer_step2_desc': 'प्रो रेटा और स्टैंडर्ड',
            'workflow_buyer_step3_title': 'रिपोर्ट तैयार करें',
            'workflow_buyer_step3_desc': 'सप्लायर या सभी के अनुसार',
            'workflow_supplier_label': 'सप्लायरों के लिए (किसान)',
            'workflow_supplier_step1_title': 'जुड़ी डेयरियां देखें',
            'workflow_supplier_step1_desc': 'सभी खरीदार देखें',
            'workflow_supplier_step2_title': 'संग्रह देखें',
            'workflow_supplier_step2_desc': 'विशेष खरीदार के अनुसार',
            'workflow_supplier_step3_title': 'रिपोर्ट तैयार करें',
            'workflow_supplier_step3_desc': 'डाउनलोड और साझा करें',
            'workflow_buyer_title': 'सरल 3-चरण वर्कफ़्लो',
            'workflow_buyer_subtitle': 'हमारी सुव्यवस्थित प्रक्रिया के साथ अपने संग्रह केंद्र को कुशलता से प्रबंधित करें',
            'workflow_buyer_step1_title_full': 'सप्लायर जोड़ें',
            'workflow_buyer_step1_desc_full': 'विस्तृत प्रोफाइल के साथ डेयरी किसानों को अपने संग्रह केंद्र से जोड़ें',
            'workflow_buyer_step2_title_full': 'संग्रह करें',
            'workflow_buyer_step2_desc_full': 'ऑटो-कैलकुलेटेड FAT, SNF और दरों के साथ दूध की डिलीवरी रिकॉर्ड करें',
            'workflow_buyer_step3_title_full': 'रिपोर्ट तैयार करें',
            'workflow_buyer_step3_desc_full': 'किसी भी दिनांक सीमा, सप्लायर या शिफ्ट के लिए PDF/Excel रिपोर्ट बनाएं',
            'workflow_supplier_title': 'सरल 3-चरण वर्कफ़्लो',
            'workflow_supplier_subtitle': 'हमारे किसान-अनुकूल सिस्टम के साथ अपनी दूध की डिलीवरी और कमाई ट्रैक करें',
            'workflow_supplier_step1_title_full': 'जुड़ी डेयरियां देखें',
            'workflow_supplier_step1_desc_full': 'उन सभी संग्रह केंद्रों को देखें जिनसे आप जुड़े हैं',
            'workflow_supplier_step2_title_full': 'संग्रह देखें',
            'workflow_supplier_step2_desc_full': 'विशेष खरीदार के अनुसार अपनी दूध की डिलीवरी चेक करें',
            'workflow_supplier_step3_title_full': 'रिपोर्ट और कमाई देखें',
            'workflow_supplier_step3_desc_full': 'खरीदारों द्वारा साझा की गई रिपोर्ट देखें और अपनी कमाई ट्रैक करें',
            'farmer_details': 'किसान विवरण',
            'contact_info': 'संपर्क जानकारी',
            'pro_rata': 'प्रो रेटा',
            'standard': 'स्टैंडर्ड',
            'pdf_bills': 'PDF बिल',
            'excel_export': 'एक्सल एक्सपोर्ट',
            'all_buyers': 'सभी खरीदार',
            'status': 'स्थिति',
            'daily_logs': 'दैनिक लॉग',
            'rates': 'दरें',
            'view_reports': 'रिपोर्ट देखें',
            'track_earnings': 'कमाई ट्रैक करें',
            'learn_more': 'और जानें',
            'learn_more_btn': 'और जानें',
            'free_for_first_month': 'पूरी तरह से पहले महीने के लिए मुफ्त',
            'free_for_lifetime': 'आजीवन मुफ्त!',
            'use_web_app': 'वेब ऐप का उपयोग करें',
            'first_month_free': 'पहला महीना FREE',
            'no_credit_card': 'कोई क्रेडिट कार्ड नहीं',
            'support_24_7': '24/7 सहायता',
            'about_title': 'दुधिया के बारे में',
            'about_subtitle': 'एक शक्तिशाली ऐप में आपका पूरा डेयरी प्रबंधन समाधान',
            'about_card_what_title': 'क्या है',
            'about_card_what_desc': 'नवीनतम तकनीक के साथ दूध संग्रह प्रबंधन के लिए स्मार्ट ऐप',
            'about_card_who_title': 'किसके लिए',
            'about_card_who_desc': 'संग्रह केंद्र और डेयरी किसान एक साथ काम करते हैं',
            'about_card_how_title': 'कैसे काम करता है',
            'about_card_how_desc': 'सरल 3-चरण डिजिटल वर्कफ़्लो जो रोज़ाना घंटे बचाता है',
            'about_card_why_title': 'क्यों चुनें',
            'about_card_why_desc': 'समय बचाएं, गलतियां घटाएं, व्यवसाय को तेज़ी से बढ़ाएं',
            'watch_demo': 'डेमो देखें और और जानें',
            'demo_duration': '2-मिनट का डेमो वीडियो',
            'whatis_title': 'दुधिया क्या है?',
            'whatis_subtitle': 'वह स्मार्ट ऐप जो दूध संग्रह प्रबंधन के लिए आपके कागज़ के रजिस्टर और मैनुअल गणना को बदल देता है।',
            'whatis_without_title': 'दुधिया के बिना',
            'whatis_without_point1': 'मैनुअल रजिस्टर खो जाते हैं या क्षतिग्रस्त हो जाते हैं',
            'whatis_without_point2': 'FAT/SNF गणना में कैलकुलेटर त्रुटियाँ',
            'whatis_without_point3': 'किसानों के साथ भुगतान विवाद',
            'whatis_without_point4': 'मैनुअल रिपोर्टिंग में घंटे बिताए',
            'whatis_with_title': 'दुधिया के साथ',
            'whatis_with_point1': 'क्लाउड बैकअप के साथ डिजिटल रिकॉर्ड',
            'whatis_with_point2': 'स्वचालित FAT/SNF गणना',
            'whatis_with_point3': 'हर किसान के लिए पारदर्शी वॉलेट',
            'whatis_with_point4': 'एक-क्लिक PDF/Excel रिपोर्ट',
            'features_title': 'अपनी डेयरी चलाने के लिए आवश्यक हर चीज़',
            'feature1_title': 'दूध कैलकुलेटर',
            'feature1_desc': 'FAT, SNF और मात्रा के आधार पर दूध का मूल्य तुरंत गणना करें।',
            'feature2_title': 'किसान प्रबंधन',
            'feature2_desc': 'विस्तृत प्रोफाइल और इतिहास के साथ सभी किसानों को जोड़ें, संपादित करें और ट्रैक करें।',
            'feature3_title': 'संग्रह एंट्री',
            'feature3_desc': 'मात्रा, FAT, SNF और दर के साथ दूध की डिलीवरी रिकॉर्ड करें।',
            'feature4_title': 'वॉलेट और योजना',
            'feature4_desc': 'ऐप का उपयोग जारी रखने हेतु रिचार्ज या सदस्यता लें।',
            'feature5_title': 'शिफ्ट प्रबंधन',
            'feature5_desc': 'सुबह और शाम की शिफ्ट को आसानी से अलग करके प्रबंधित करें।',
            'feature6_title': 'रिपोर्ट और बिल',
            'feature6_desc': 'किसी भी तिथि सीमा, किसान या शिफ्ट के लिए व्यापक PDF/Excel रिपोर्ट और बिल तैयार करें।',
            'feature7_title': 'बहुभाषी समर्थन',
            'feature7_desc': 'अपनी पसंदीदा भाषा में ऐप का उपयोग करें। अंग्रेजी, हिंदी, पंजाबी और कन्नड़ का समर्थन।',
            'feature8_title': 'डेटा बैकअप और सुरक्षा',
            'feature8_desc': 'स्वचालित बैकअप और पुनर्प्राप्ति विकल्पों के साथ सारा डेटा सुरक्षित रूप से क्लाउड में संग्रहीत है।',
            'btn_call_us': 'हमें अभी कॉल करें',
            'btn_use_web_app': 'वेब ऐप का उपयोग करें',
            'btn_contact_us': 'हमसे संपर्क करें',
            // Modal feature data
            'modal_milk_calculator_title': 'दूध कैलकुलेटर',
            'modal_milk_calculator_desc': 'FAT, SNF और मात्रा के आधार पर दूध का मूल्य तुरंत गणना करें।',
            'modal_milk_calculator_feature1': 'विवरण दर्ज करें: वजन, FAT प्रतिशत, SNF प्रतिशत',
            'modal_milk_calculator_feature2': 'अब खोने वाले कागजी रजिस्टर नहीं',
            'modal_milk_calculator_feature3': 'स्वचालित बैकअप के साथ डिजिटल रिकॉर्ड',
            'modal_milk_calculator_feature4': 'स्मार्ट सुझावों के साथ आसान डेटा एंट्री',
            'modal_milk_calculator_feature5': 'रीयल-टाइम सत्यापन और त्रुटि रोकथाम',
            'modal_farmer_management_title': 'किसान (सप्लायर) प्रबंधन',
            'modal_farmer_management_desc': 'विस्तृत प्रोफाइल और इतिहास के साथ सभी किसानों को जोड़ें, संपादित करें और ट्रैक करें।',
            'modal_farmer_management_feature1': 'किसान विवरण सहेजें: नाम, फोन नंबर, गांव',
            'modal_farmer_management_feature2': 'नाम या ID नंबर से तेजी से किसान खोजें',
            'modal_farmer_management_feature3': 'प्रत्येक किसान की डिलीवरी का पूरा इतिहास देखें',
            'modal_farmer_management_feature4': 'कई किसानों का कुशलता से प्रबंधन करें',
            'modal_farmer_management_feature5': 'किसान प्रदर्शन और गुणवत्ता रुझान ट्रैक करें',
            'modal_collection_entry_title': 'संग्रह एंट्री',
            'modal_collection_entry_desc': 'मात्रा, FAT, SNF और दर के साथ दूध की डिलीवरी रिकॉर्ड करें।',
            'modal_collection_entry_feature1': 'अपने फोन पर किसानों से दूध की डिलीवरी रिकॉर्ड करें',
            'modal_collection_entry_feature2': 'विवरण दर्ज करें: वजन, FAT प्रतिशत, SNF प्रतिशत',
            'modal_collection_entry_feature3': 'व्यस्त संग्रह घंटों के दौरान तेजी से एंट्री',
            'modal_collection_entry_feature4': 'रीयल-टाइम डेटा सत्यापन',
            'modal_collection_entry_feature5': 'स्वचालित गुणवत्ता गणना',
            'modal_wallet_payments_title': 'वॉलेट और भुगतान',
            'modal_wallet_payments_desc': 'ऐप इस्तेमाल करने के लिए वॉलेट या सदस्यता योजना का उपयोग करें।',
            // 'modal_wallet_payments_feature1': 'किसानों को देय धनराशि ट्रैक करने के लिए डिजिटल वॉलेट',
            'modal_wallet_payments_feature2': 'ऑनलाइन भुगतान (UPI/कार्ड) का उपयोग करके अपने वॉलेट में पैसे जोड़ें',
            'modal_wallet_payments_feature3': 'रिचार्ज करने पर बोनस पैसे पाएं (10% अतिरिक्त ऑफर)',
            'modal_wallet_payments_feature4': 'किसान अपना शेष और भुगतान इतिहास देख सकते हैं',
            'modal_wallet_payments_feature5': 'तत्काल भुगतान प्रसंस्करण और सूचनाएं',
            'modal_shift_management_title': 'शिफ्ट प्रबंधन',
            'modal_shift_management_desc': 'सुबह और शाम की शिफ्ट को आसानी से अलग करके प्रबंधित करें।',
            'modal_shift_management_feature1': 'सुबह और शाम की दूध संग्रह के लिए अलग-अलग एंट्री',
            'modal_shift_management_feature2': 'ट्रैक करें कि दूध किस शिफ्ट में डिलीवर किया गया',
            'modal_shift_management_feature3': 'शिफ्ट-वार रिपोर्टिंग और विश्लेषण',
            'modal_shift_management_feature4': 'विभिन्न शिफ्टों के लिए अलग-अलग मूल्य निर्धारण प्रबंधित करें',
            'modal_shift_management_feature5': 'आसान शिफ्ट स्विचिंग और ट्रैकिंग',
            'modal_reports_bills_title': 'रिपोर्ट और बिल',
            'modal_reports_bills_desc': 'किसी भी तिथि सीमा, किसान या शिफ्ट के लिए व्यापक PDF/Excel रिपोर्ट और बिल तैयार करें।',
            'modal_reports_bills_feature1': 'किसानों के लिए PDF बिल जेनरेट करें',
            'modal_reports_bills_feature2': 'किसी भी तिथि सीमा के लिए रिपोर्ट बनाएं (दैनिक, साप्ताहिक, मासिक)',
            'modal_reports_bills_feature3': 'WhatsApp के माध्यम से रिपोर्ट डाउनलोड और साझा करें',
            'modal_reports_bills_feature4': 'कुल एकत्र दूध, कुल भुगतान राशि देखें',
            'modal_reports_bills_feature5': 'अनुकूलन योग्य रिपोर्ट टेम्पलेट और प्रारूप',
            'modal_multi_language_title': 'बहुभाषी समर्थन',
            'modal_multi_language_desc': 'कई क्षेत्रीय भाषाओं के समर्थन के साथ अपनी पसंदीदा भाषा में ऐप का उपयोग करें।',
            'modal_multi_language_feature1': 'अंग्रेजी',
            'modal_multi_language_feature2': 'हिंदी (हिन्दी)',
            'modal_multi_language_feature3': 'पंजाबी (ਪੰਜਾਬੀ)',
            'modal_multi_language_feature4': 'कन्नड़ (ಕನ್ನಡ)',
            'modal_multi_language_feature5': 'ऐप के भीतर आसान भाषा स्विचिंग',
            'modal_data_backup_title': 'डेटा बैकअप और सुरक्षा',
            'modal_data_backup_desc': 'स्वचालित बैकअप और पुनर्प्राप्ति विकल्पों के साथ सारा डेटा सुरक्षित रूप से क्लाउड में संग्रहीत है।',
            'modal_data_backup_feature1': 'सारा डेटा सुरक्षित रूप से क्लाउड में संग्रहीत है',
            'modal_data_backup_feature2': 'किसी भी डिवाइस से अपना डेटा एक्सेस करें',
            'modal_data_backup_feature3': 'अगर आप फोन बदलते हैं, तो आपका डेटा अभी भी वहां है',
            'modal_data_backup_feature4': 'कागजी रिकॉर्ड खोने का कोई डर नहीं',
            'modal_data_backup_feature5': 'स्वचालित बैकअप और पुनर्प्राप्ति विकल्प',
            'benefits_ready_text': 'इन लाभों का अनुभव करने के लिए तैयार हैं?',
            'benefits_rating': '4.9/5 रेटिंग',
            'benefits_subtitle': 'दुधिया को क्यों चुनें?',
            'benefits_title': 'कुशलता और सटीक कृषि का संगम',
            'benefit1_title': 'रोज़ाना घंटे बचाएं',
            'benefit1_desc': 'स्वचालित गणना मैनुअल काम को समाप्त कर देती है और 99% त्रुटियां कम कर देती है।',
            'benefit2_title': 'भरोसा बनाएं',
            'benefit2_desc': 'पारदर्शी डिजिटल रिकॉर्ड आपके किसानों के साथ विश्वास पैदा करते हैं।',
            'benefit3_title': 'व्यवसाय को तेज़ी से बढ़ाएं',
            'benefit3_desc': 'उसी टीम के आकार के साथ 10x अधिक किसानों का प्रबंधन करें।',
            'whois_badge': 'डेयरी में सभी के लिए',
            'whois_title': 'दुधिया किसके लिए है?',
            'whois_subtitle': 'अपनी भूमिका चुनें और जानें कि दुधिया आपके लिए डेयरी प्रबंधन को कैसे सरल बनाता है',
            'whois_card1_role': 'प्रबंधक भूमिका',
            'whois_card1_title': 'संग्रह केंद्र',
            'whois_card1_desc': 'क्या आप एक खरीदार हैं जो दूध संग्रह केंद्र चलाते हैं? हमारे शक्तिशाली Android ऐप या वेब ऐप के साथ 10 से 1000+ किसानों का प्रबंधन करें। संग्रह रिकॉर्ड करें, दरें स्वचालित रूप से गणना करें, और तत्काल रिपोर्ट तैयार करें।',
            'whois_card1_feature1_title': 'सप्लायर जोड़ें और प्रबंधित करें',
            'whois_card1_feature1_desc': 'ऐप में किसान प्रोफाइल बनाएं',
            'whois_card1_feature2_title': 'संग्रह रिकॉर्ड करें',
            'whois_card1_feature2_desc': 'ऑटो FAT/SNF गणना के साथ दूध डेटा दर्ज करें',
            'whois_card1_feature3_title': 'रिपोर्ट तैयार करें और साझा करें',
            'whois_card1_feature3_desc': 'WhatsApp के माध्यम से PDF/Excel बिल',
            'whois_card1_desc_short': 'संग्रह प्रबंधित करें, दरें स्वचालित करें और तेज़ रिपोर्ट बनाएं।',
            'whois_card1_feat_short1': 'सप्लायर जोड़ें',
            'whois_card1_feat_short2': 'रिपोर्ट बनाएं',
            'whois_card2_role': 'दर्शक भूमिका',
            'whois_card2_title': 'डेयरी किसान',
            'whois_card2_desc': 'क्या आप एक सप्लायर हैं जो दूध पहुंचाते हैं? हमारे मोबाइल ऐप का उपयोग अपनी दैनिक डिलीवरी, कमाई देखने और अपने संग्रह केंद्र द्वारा साझा की गई रिपोर्ट तक पहुंचने के लिए करें - सब एक ही जगह पर।',
            'whois_card2_feature1_title': 'जुड़ी डेयरियां देखें',
            'whois_card2_feature1_desc': 'ऐप में सभी संग्रह केंद्र देखें',
            'whois_card2_feature2_title': 'अपने संग्रह देखें',
            'whois_card2_feature2_desc': 'दैनिक लॉग और दूध की दरें जांचें',
            'whois_card2_feature3_title': 'अपनी कमाई ट्रैक करें',
            'whois_card2_feature3_desc': 'वॉलेट और रिपोर्ट रीयल-टाइम में देखें',
            'whois_card2_desc_short': 'डिलिवरी और वॉलेट बैलेंस एक जगह देखें।',
            'whois_card2_feat_short1': 'कलेक्शन देखें',
            'whois_card2_feat_short2': 'कमाई ट्रैक करें',
            'whois_card3_role': 'एंटरप्राइज भूमिका',
            'whois_card3_title': 'सहकारी समितियां और सोसाइटी',
            'whois_card3_desc': 'कई संग्रह केंद्र प्रबंधित कर रहे हैं? हमारा वेब ऐप आपको एक केंद्रीयृत डैशबोर्ड देता है जिससे आप सभी स्थानों की निगरानी कर सकते हैं, संकलित विश्लेषण देख सकते हैं, और पहुंच प्रबंधित कर सकते हैं।',
            'whois_card3_feature1_title': 'मल्टी-सेंटर डैशबोर्ड',
            'whois_card3_feature1_desc': 'वेब ऐप के माध्यम से सभी केंद्रों की निगरानी करें',
            'whois_card3_feature2_title': 'संकलित रिपोर्ट',
            'whois_card3_feature2_desc': 'सभी केंद्रों में संयुक्त विश्लेषण',
            'whois_card3_feature3_title': 'भूमिका-आधारित पहुंच',
            'whois_card3_feature3_desc': 'प्रति केंद्र प्रबंधक नियुक्त करें',
            'whois_card3_desc_short': 'केंद्रीय डैशबोर्ड से कई केंद्र देखें।',
            'whois_card3_feat_short1': 'संकलित रिपोर्ट',
            'whois_card3_feat_short2': 'रोल एक्सेस',
            'whois_buyer_note': 'खरीदार ऐप/वेब के माध्यम से प्रबंधित करते हैं',
            'whois_supplier_note': 'सप्लायर मोबाइल ऐप के माध्यम से देखते हैं',
            'whois_cta_title': 'शुरू करने के लिए तैयार हैं?',
            'whois_cta_desc': 'चलते-फिरते उपयोग के लिए दुधिया Android ऐप डाउनलोड करें या किसी भी डिवाइस से बड़ी स्क्रीन वाले वेब ऐप का उपयोग करें।',
            'faq_title': 'अक्सर पूछे जाने वाले प्रश्न',
            'faq_subtitle': 'दुधिया के बारे में आपको जो कुछ भी जानने की जरूरत है',
            'faq_q1': 'दुधिया की कीमत क्या है?',
            'faq_q2': 'क्या मेरा डेटा सुरक्षित है और बैकअप है?',
            'faq_q4': 'मैं खरीदार और सप्लायर भूमिकाओं के बीच कैसे स्विच करूं?',
            'faq_q5': 'मैं किस तरह की रिपोर्ट तैयार कर सकता हूं?',
            'faq_a1_p1': 'सप्लायर्स (किसानों) के लिए: पूरी तरह से मुफ्त। सप्लायर्स बिना किसी लागत के अपनी दूध की डिलीवरी, कमाई देख सकते हैं और अपनी प्रोफाइल प्रबंधित कर सकते हैं।',
            'faq_a1_p2': 'खरीदारों (संग्रह केंद्रों) के लिए: पहला महीना मुफ्त। परीक्षण के बाद, आपके संग्रह मात्रा और वॉलेट फीचर्स के आधार पर सब्सक्रिप्शन प्लान उपलब्ध हैं।',
            'faq_a2': 'हाँ, आपका डेटा स्वचालित बैकअप के साथ क्लाउड में सुरक्षित रूप से संग्रहीत है। भले ही आप अपना फोन खो दें या डिवाइस बदलें, आपका डेटा सुरक्षित रहता है और जब आप लॉग इन करते हैं तो तुरंत एक्सेस किया जा सकता है।',
            'faq_a4': 'आप आसानी से ऐप सेटिंग्स से भूमिकाएं बदल सकते हैं। अपनी प्रोफाइल पर टैप करें, "भूमिका बदलें" चुनें, और खरीदार (संग्रह केंद्र) या सप्लायर (किसान) मोड के बीच चुनें। प्रत्येक भूमिका का अपना डैशबोर्ड और फीचर्स हैं।',
            'faq_a5': 'दुधिया आपको व्यापक रिपोर्ट तैयार करने की अनुमति देता है: संग्रह रिपोर्ट (दैनिक, साप्ताहिक, मासिक), किसान वॉलेट स्टेटमेंट, भुगतान सारांश, और शिफ्ट-वार रिपोर्ट। सभी रिपोर्ट PDF या Excel के रूप में निर्यात की जा सकती हैं और WhatsApp के माध्यम से तुरंत साझा की जा सकती हैं।',
            'free_trial_text': 'ऐप डाउनलोड करें और आज ही अपना निःशुल्क परीक्षण शुरू करें — कोई क्रेडिट कार्ड आवश्यक नहीं!',
            'android_version': 'Android 5.0+',
            'download_title': 'अपनी डेयरी में बदलाव की शुरुआत करें',
            'download_subtitle': 'दुधिया के साथ अपना व्यवसाय बदल रहे 10,000+ डेयरी पेशेवरों से जुड़ें',
            'scan_to_download': 'डाउनलोड करने के लिए स्कैन करें',
            'download_for': 'इसके लिए डाउनलोड करें',
            'download_android': 'एंड्रॉइड',
            'version_info': 'एंड्रॉइड 5.0 और उससे ऊपर के साथ संगत',
            'version_number': 'संस्करण: 1.0.0',
            'version_size': 'आकार: 75MB',
            'testimonials_title': 'डेयरी समुदायों द्वारा विश्वसनीय',
            'testimonials_subtitle': 'देखें कि दुधिया संग्रह केंद्र मालिकों और किसानों के जीवन में कैसा असली अंतर ला रहा है।',
            'testimonial1_text': 'बहुभाषी समर्थन एक जीवनरक्षक है। हमारे किसान अपनी भाषा में अपना डेटा देखकर कहीं अधिक आत्मविश्वास महसूस करते हैं।',
            'testimonial1_name': 'आनंद देशमुख',
            'testimonial1_title': 'क्षेत्रीय संग्रह प्रमुख',
            'testimonial2_text': 'दुधिया से पहले 500+ ग्राहकों का प्रबंधन करना एक दुःस्वप्न था। अब सब कुछ स्वचालित और पारदर्शी है।',
            'testimonial2_name': 'मीरा पटेल',
            'testimonial2_title': 'डेयरी उद्यमी',
            'testimonial3_text': 'वॉलेट सिस्टम अविश्वसनीय है। किसान अपनी कमाई लाइव ट्रैक कर सकते हैं, जिससे हमारे केंद्र में बहुत भरोसा बढ़ा है।',
            'testimonial3_name': 'सुरेश जी.',
            'testimonial3_title': 'किसान संघ प्रतिनिधि',
            'testimonial3_org': 'श्री कृष्णा डेयरी • मध्य प्रदेश',
            'testimonial4_text': 'मैं भुगतान की गणना में घंटे बिताता था। अब दुधिया इसे स्वचालित रूप से सही ढंग से करता है।',
            'testimonial4_name': 'राजेश शर्मा',
            'testimonial4_title': 'संग्रह केंद्र मालिक',
            'testimonial4_org': 'बालाजी डेयरी • राजस्थान',
            'testimonial5_text': 'दुधिया की सहकारी विशेषताओं ने हमारे कई केंद्रों में संचालन को सुव्यवस्थित किया है। साझा डेटा गेम-चेंजर है।',
            'testimonial5_name': 'प्रिया',
            'testimonial5_title': 'सहकारी प्रबंधक',
            'testimonial5_org': 'कर्नाटक डेयरी कोऑपरेटिव • कर्नाटक',
            'testimonial6_text': 'विश्लेषण ने मेरी दैनिक संग्रह को 40% बढ़ाने में मदद की। हमारी पूरी टीम के लिए उपयोग करने में बहुत आसान।',
            'testimonial6_name': 'विक्रम सिंह',
            'testimonial6_title': 'डेयरी व्यवसाय मालिक',
            'testimonial6_org': 'पंजाब मिल्क यूनियन • पंजाब',
            'contact_title': 'संपर्क करें',
            'contact_subtitle': 'दुधिया के साथ अपनी डेयरी स्थापित करने के बारे में प्रश्न हैं? हमारी विशेषज्ञों की टीम परिवर्तन के हर कदम पर आपकी सहायता के लिए तैयार है।',
            'contact_phone_label': 'हमें कॉल करें',
            'contact_email_label': 'ईमेल सपोर्ट',
            'contact_address_label': 'कार्यालय देखें',
            'contact_form_name_label': 'आपका नाम',
            'contact_form_email_label': 'ईमेल पता',
            'contact_form_dairy_label': 'डेयरी का नाम',
            'contact_form_message_label': 'संदेश',
            'contact_form_submit': 'संदेश भेजें',
            'footer_description': 'अगली पीढ़ी के डेयरी किसानों के लिए बनाया गया दुनिया का सबसे उन्नत स्मार्ट डेयरी प्रबंधन पारिस्थितिकी।',
            'footer_quicklinks_title': 'त्वरित लिंक',
            'footer_link_features': 'विशेषताएं',
            'footer_link_benefits': 'लाभ',
            'footer_link_download': 'डाउनलोड',
            'footer_link_contact': 'संपर्क',
            'footer_link_pricing': 'मूल्य निर्धारण',
            'footer_link_supplier': 'आपूर्तिकर्ता',
            'footer_link_buyer': 'खरीदार',
            'footer_explore_title': 'कार्यप्रवाह',
            'footer_company_title': 'कंपनी',
            'footer_link_about': 'हमारे बारे में',
            'footer_link_faq': 'अक्सर पूछे जाने वाले प्रश्न',
            'footer_link_terms': 'सेवा की शर्तें',
            'footer_link_privacy': 'गोपनीयता नीति',
            'footer_newsletter_title': 'न्यूज़लेटर',
            'footer_newsletter_desc': 'नवीनतम डेयरी उद्योग अपडेट्स अपने इनबॉक्स में प्राप्त करें।',
            'footer_newsletter_placeholder': 'ईमेल',
            'footer_powered': 'द्वारा संचालित',
            'footer_copyright': '© 2026 दुधिया (Milk Collection Management System)। सभी अधिकार सुरक्षित।',
            'footer_bottom_terms': 'शर्तें',
            'footer_bottom_refund': 'रिफंड',
            'footer_bottom_terms_of_use': 'उपयोग की शर्तें',
            'footer_bottom_privacy': 'गोपनीयता',
            'section_features': 'मुख्य विशेषताएं',
            'section_benefits': 'दुधिया को क्यों चुनें?',
            'section_download': 'ऐप डाउनलोड करें',
            'section_testimonials': 'हमारे उपयोगकर्ता क्या कहते हैं',
            'section_contact': 'संपर्क करें',
            'footer_tagline': 'स्मार्ट डेयरी प्रबंधन समाधान',
            'footer_quicklinks': 'त्वरित लिंक',
            'footer_connect': 'हमारे से जुड़ें',
            'modal_close': 'बंद करें',
            'modal_key_features': 'मुख्य विशेषताएं',
            'modal_try_feature': 'इस सुविधा को आज़माएं',
            'still_have_questions': 'अभी भी सवाल हैं?',
            'ask_anything_text': 'जवाब नहीं मिल रहा? हमारी टीम आपकी मदद के लिए तैयार है!',
            'ask_on_whatsapp': 'WhatsApp पर पूछें',
            'call_us': 'कॉल करें',
            'quick_response_text': 'तुरंत सहायता! हम मिनटों में जवाब देते हैं, घंटों में नहीं',
            'plans_badge': 'प्लान और सब्सक्रिप्शन',
            'plans_title': 'आपकी <span class="text-primary" style="color: #00288e;">डेयरी</span> के लिए आसान योजनाएँ',
            'plans_subtitle': 'मुफ्त में शुरू करें और जैसे-जैसे आपका व्यवसाय बढ़े, वैसे-वैसे आगे बढ़ें',
            'plan_free_title': 'पहला महीना FREE',
            'plan_free_duration': '/पहला महीना',
            'plan_feature_all': 'सभी प्रीमियम फीचर्स शामिल',
            'plan_feature_suppliers_unlimited': 'सप्लायर की कोई सीमा नहीं',
            'plan_feature_support': 'प्राथमिकता 24/7 सहायता',
            'btn_start_free': 'फ्री में शुरू करें',
            'plan_monthly_title': 'मासिक प्लान',
            'plan_monthly_duration': '/महीना',
            'plan_monthly_desc': 'बढ़ते संग्रह केंद्रों के लिए आदर्श',
            'plan_feature_suppliers_limit': 'असीमित सप्लायर',
            'plan_feature_wallet_recharge': 'वॉलेट रिचार्ज सुविधा',
            'plan_feature_wallet_recharge_desc': 'अगर आपका मंथली प्लान खत्म हो गया है, तो न्यूनतम ₹10 से वॉलेट रिचार्ज करके अपना काम तुरंत चालू रखें।',
            'plan_feature_reports': 'PDF रिपोर्ट',
            'plan_feature_support_standard': 'स्टैंडर्ड सहायता',
            'btn_choose_plan': 'इस प्लान के साथ शुरू करें',
            'plan_yearly_title': 'वार्षिक प्लान',
            'plan_yearly_subtitle': 'सबसे किफायती समाधान',
            'plan_yearly_price': '₹9,999',
            'plan_yearly_duration': '/वर्ष',
            'plan_yearly_desc': 'अधिकतम बचत के साथ पूरे वर्ष के लिए पूर्ण डेयरी प्रबंधन।',
            'plan_feature_save': '₹789 प्रति वर्ष बचाएं',
            'plan_feature_suppliers_unlimited': 'असीमित सप्लायर',
            'plan_feature_priority_support': 'प्राथमिकता 24/7 सहायता',
            'btn_get_yearly': 'इस प्लान के साथ शुरू करें',
            'plan_wallet_title': 'वॉलेट रिचार्ज',
            'plan_wallet_min_recharge': 'न्यूनतम रिचार्ज',
            'plan_wallet_rate_desc': '₹0.0125 / किग्रा संकलन शुल्क',
            'plan_wallet_feature1': 'असीमित सप्लायर',
            'plan_wallet_feature2': 'उपयोग के अनुसार भुगतान (कोई निश्चित मासिक शुल्क नहीं)',
            'plan_wallet_feature3': '100 किग्रा दूध पर केवल ₹1.25 शुल्क',
            'plan_wallet_feature4': 'वॉलेट बैलेंस कभी एक्सपायर नहीं होता',
            'btn_start_wallet': 'वॉलेट के साथ शुरू करें',
            'plan_sub_card_title': 'सब्सक्रिप्शन प्लान',
            'plan_sub_card_subtitle': 'आपकी डेयरी के लिए मासिक और वार्षिक सब्सक्रिप्शन विकल्प',
            'plan_sub_feat1': 'मासिक और वार्षिक फ्लैट दरें',
            'plan_sub_feat2': 'असीमित कलेक्शन और सप्लायर',
            'plan_sub_feat3': 'समर्पित सहायता और PDF रिपोर्ट',
            'btn_know_more': 'और जानें',
            'modal_sub_heading': 'सब्सक्रिप्शन प्लान',
            'modal_sub_subheading': 'अपनी डेयरी संग्रह केंद्र के लिए सबसे उपयुक्त सब्सक्रिप्शन प्लान चुनें।',
            'modal_contact_title': 'सब्सक्रिप्शन लेने के लिए संपर्क करें',
            'modal_contact_desc': 'अपनी सदस्यता योजना तुरंत सक्रिय करने के लिए हमारी टीम को कॉल या व्हाट्सएप करें।',
            'modal_btn_call': 'कॉल करें',
            'modal_btn_whatsapp': 'व्हाट्सएप करें',
            'badge_free': 'मुफ्त',
            'badge_flexible': 'अनुकूलनीय',
            'badge_popular': 'लोकप्रिय',
            'badge_best_value': 'सर्वश्रेष्ठ मूल्य',
            'pricing_page_title': 'दुधिया - प्लान और मूल्य निर्धारण तुलना',
            'pricing_hero_badge': '100% पारदर्शी बिलिंग',
            'pricing_hero_title': 'अपनी डेयरी के लिए सबसे सही प्लान चुनें',
            'pricing_hero_subtitle': 'चाहे आप मासिक सब्सक्रिप्शन पसंद करें या उपयोग-के-अनुसार वॉलेट रिचार्ज, हमारे पास दोनों विकल्प हैं।',
            'pricing_free_desc': 'एक पूरे महीने के लिए सभी प्रीमियम सुविधाओं को पूरी तरह से मुफ्त में आज़माएं।',
            'pricing_badge_popular': 'लोकप्रिय',
            'pricing_badge_value': 'सर्वोत्तम मूल्य',
            'pricing_badge_flexible': 'अनुकूलनीय',
            'pricing_wallet_desc_short': 'संकलन किए गए दूध के वजन प्रति किलोग्राम के हिसाब से भुगतान करें। जरूरत पड़ने पर ही रिचार्ज करें।',
            'pricing_compare_title': 'विस्तृत सुविधाओं की तुलना',
            'pricing_compare_subtitle': 'अपने डेयरी व्यवसाय के लिए सही प्लान खोजने के लिए सभी प्लान की एक साथ तुलना करें।',
            'pricing_table_header_features': 'विशेषताएं',
            'pricing_row_cost': 'सब्सक्रिप्शन लागत',
            'pricing_row_min_deposit': 'न्यूनतम जमा/सेटअप',
            'pricing_row_pay_as_you_go': 'उपयोग के अनुसार भुगतान (प्रति किग्रा)',
            'pricing_row_reports': 'विस्तृत PDF और Excel रिपोर्ट',
            'pricing_row_backup': 'स्वचालित क्लाउड बैकअप',
            'pricing_row_shift': 'शिफ्ट प्रबंधन (सुबह/शाम)',
            'pricing_row_support': 'ग्राहक सहायता',
            'pricing_info_title': 'अक्सर पूछे जाने वाले प्रश्न',
            'pricing_q1': 'क्या मैं कभी भी प्लान बदल सकता हूँ?',
            'pricing_a1': 'हाँ! आप अपने डैशबोर्ड सेटिंग्स के माध्यम से किसी भी समय फ्री ट्रायल से मासिक, वार्षिक या वॉलेट रिचार्ज में अपग्रेड कर सकते हैं।',
            'pricing_q2': 'वॉलेट रिचार्ज प्लान मुझसे कैसे शुल्क लेता है?',
            'pricing_a2': 'वॉलेट प्लान में, कोई निश्चित मासिक लागत नहीं होती है। आप संकलित दूध पर केवल ₹0.0125 प्रति किलोग्राम भुगतान करते हैं। उदाहरण के लिए, यदि आप 100 किलोग्राम दूध संकलित करते हैं, तो आपके वॉलेट बैलेंस से केवल ₹1.25 काटा जाता है। आप सेवाओं का उपयोग जारी रखने के लिए कम से कम ₹10 से रिचार्ज कर सकते हैं।',
            'pricing_q3': 'क्या मेरे वॉलेट का बैलेंस समाप्त हो जाता है?',
            'pricing_a3': 'नहीं! आपके वॉलेट बैलेंस की वैधता लाइफटाइम है और यह कभी समाप्त नहीं होगी, भले ही आपका संकलन केंद्र मौसमी बंद समय के दौरान बंद रहे।',
            'btn_pricing_know_more': 'प्लान और सुविधाओं की तुलना करें',
            'calc_title': 'योजना चयन कैलकुलेटर',
            'calc_subtitle': 'यह जानने के लिए कि फ्लैट-रेट मासिक प्लान या उपयोग-के-अनुसार वॉलेट रिचार्ज में से कौन सा सस्ता है, अपना मासिक दूध संकलन दर्ज करें।',
            'calc_label_milk': 'अनुमानित मासिक दूध संकलन (किग्रा में)',
            'calc_sub_flat_cost': 'निश्चित मासिक शुल्क',
            'calc_sub_usage_cost': '₹0.0125 / किग्रा पर शुल्क लिया गया',
            'hire_personnel_tag': 'पेशेवर सेवा',
            'hire_personnel_title': 'क्या आप खुद संग्रह नहीं करना चाहते?',
            'hire_personnel_subtitle': 'अपने दूध के संग्रह को कुशलता से संभालने के लिए एक प्रशिक्षित ऑपरेटर या व्यक्ति किराए पर लें',
            'hire_personnel_card1_title': 'संग्रह के लिए व्यक्ति किराए पर लें',
            'hire_personnel_card1_desc': 'विश्वसनीय संग्रह कर्मचारी प्राप्त करें जो दुधिया ऐप का उपयोग करने के लिए प्रशिक्षित हैं और आपके दैनिक दूध संग्रह को कुशलता से प्रबंधित करते हैं।',
            'hire_personnel_card2_title': 'लागत अनुमान',
            'hire_personnel_card2_desc': 'मूल्य आमतौर पर ₹500 से ₹3,000-₹4,000 प्रति माह तक होता है, यह औसत दैनिक संग्रह की संख्या और आवश्यक कार्य की मात्रा के आधार पर भिन्न होता है।',
            'hire_personnel_card3_title': 'दुधिया सहायता से संपर्क करें',
            'hire_personnel_card3_desc': 'एक अनुकूलित उद्धरण प्राप्त करने और अपने क्षेत्र में विश्वसनीय संग्रह कर्मचारियों से जुड़ने के लिए हमसे संपर्क करें।',
            'hire_personnel_call': 'कॉल',
            'hire_personnel_whatsapp': 'व्हाट्सएप NetPy',
            'hire_personnel_cta_title': 'हम आपको सही व्यक्ति खोजने में मदद करेंगे',
            'hire_personnel_cta_desc': 'हम आपको अपने स्थानीय क्षेत्र में प्रशिक्षित, विश्वसनीय संग्रह कर्मचारियों से जोड़ते हैं जो पहले से ही दुधिया ऐप से परिचित हैं।',
            'hire_personnel_cta_button': 'आज ही शुरू करें',
            'hero_badge_tag': '3 लचीले पार्टनरशिप अवसर उपलब्ध',
            'hero_main_title': '<span class="text-yellow-300 underline decoration-yellow-400/40 underline-offset-8">दुधिया</span> के साथ पार्टनर बनें — अपना बिजनेस बढ़ाएं',
            'hero_main_subtitle': 'तेजी से बढ़ते डेयरी टेक क्षेत्र में नियमित आय अर्जित करें। 3 लाभदायक विकल्पों में से चुनें: सेल्स पार्टनर, डेटा एंट्री ऑपरेटर, या इंडिपेंडेंट डीलर।',
            'btn_explore_roles': '3 रोल देखें',
            'btn_whatsapp_inquiry': 'व्हाट्सएप करें',
            'pill_high_payout': 'उच्च नियमित कमाई',
            'pill_zero_risk': 'जीरो रिस्क और निवेश विकल्प',
            'pill_full_training': 'पूर्ण ट्रेनिंग और मार्केटिंग सहायता',
            'card_opportunity_header': '₹50,000+ प्रति माह तक कमाएं',
            'card_opportunity_title': 'अपना पार्टनरशिप लक्ष्य चुनें',
            'mini_role1_title': '1. सेल्स पार्टनर',
            'mini_role1_desc': 'डेयरी को रेफर करें और 10% कमीशन पाएं',
            'mini_role2_title': '2. डेटा एंट्री ऑपरेटर',
            'mini_role2_desc': 'आवंटित डेयरियों को संचालित करें और प्रति डेयरी भुगतान पाएं',
            'mini_role3_title': '3. फ्रेंचाइज डीलर',
            'mini_role3_desc': 'पूरा क्षेत्र नेटवर्क और 50%+ प्रॉफिट मार्जिन',
            'roles_section_badge': 'काम करने और कमाने के 3 तरीके',
            'roles_section_title': 'अपना पार्टनरशिप रोल चुनें',
            'roles_section_subtitle': 'चाहे आप स्थानीय संग्रह केंद्रों को रेफर करना चाहते हों, डेयरी मालिकों के लिए दैनिक डेटा एंट्री संचालित करना चाहते हों, या पूरा डीलरशिप नेटवर्क चलाना चाहते हों — हमारे पास आपके लिए सही अवसर है।',
            'role1_badge': '10% कमीशन + बोनस',
            'role1_title': '1. सेल्स पार्टनर',
            'role1_subtitle': 'सेल्स पर्सन / सलाहकार बनें',
            'role1_desc': 'स्थानीय डेयरी संग्रह केंद्रों को दुधिया ऐप और वेब पोर्टल से जोड़ें। डेयरी मालिकों को अपना व्यवसाय डिजिटल करने में मदद करें और आकर्षक भुगतान कमाएं।',
            'role1_earning_label': 'संभावित कमाई:',
            'role1_earning_val': '10% आजीवन कमीशन + ₹500 बोनस / डेयरी',
            'role1_feat1': 'प्रति डेयरी सब्सक्रिप्शन पर 10% तुरंत छूट / कमीशन',
            'role1_feat2': 'हर महीने डेयरी रिचार्ज पर आवर्ती कमीशन',
            'role1_feat3': 'पूरा ऐप डेमो और मार्केटिंग सामग्री उपलब्ध',
            'role1_btn': 'सेल्स पार्टनर बनें',
            'role2_badge': 'प्रति डेयरी गारंटीकृत मासिक भुगतान',
            'role2_title': '2. डेटा एंट्री ऑपरेटर',
            'role2_subtitle': 'डेयरियों के लिए दूध संग्रह संचालित करें',
            'role2_desc': 'दुधिया या डेयरी मालिकों द्वारा 2, 5 या अधिक स्थानीय डेयरियों को संचालित करने का अवसर पाएं। दैनिक सुबह और शाम के दूध संग्रह की प्रविष्टि करें और PDF बिल जनरेट करें।',
            'role2_earning_label': 'संभावित कमाई:',
            'role2_earning_val': '₹1,500 – ₹3,000 प्रति डेयरी / माह कमाएं',
            'role2_feat1': 'स्थानीय या रिमोट रूप से आवंटित डेयरियों पर काम करें',
            'role2_feat2': 'प्रबंधित प्रति डेयरी गारंटीकृत मासिक भुगतान',
            'role2_feat3': 'कोई सॉफ्टवेयर निवेश आवश्यक नहीं',
            'role2_btn': 'ऑपरेटर बनें',
            'role3_badge': '⭐ अधिकतम कमाई और नियंत्रण',
            'role3_title': '3. फ्रेंचाइज डीलर',
            'role3_subtitle': 'अपने स्थानीय क्षेत्र के सॉफ्टवेयर मालिक बनें',
            'role3_desc': 'अपने ब्लॉक या जिले में एक पूरा दुधिया सॉफ्टवेयर फ्रेंचाइज चलाएं। सीधे डेयरियां जोड़ें, डेयरी मालिकों से सीधे भुगतान लें, और दुधिया को थोक प्लेटफॉर्म शुल्क दें।',
            'role3_earning_label': 'संभावित कमाई:',
            'role3_earning_val': '50%+ प्रॉफिट मार्जिन रखें (₹50,000+ / माह कमाएं)',
            'role3_feat1': 'पूर्ण क्षेत्र स्वामित्व और ग्राहक नियंत्रण',
            'role3_feat2': 'डेयरी मालिकों से सीधा भुगतान संग्रह',
            'role3_feat3': 'समर्पित 24/7 तकनीकी सहायता और ब्रांडिंग किट',
            'role3_btn': 'डीलर बनें',
            'matrix_title': 'रोल तुलना और आय अवलोकन',
            'matrix_subtitle': 'मुख्य विशेषताओं, आवश्यक प्रयास और भुगतान संरचनाओं की तुलना करें',
            'th_feature': 'सुविधा / मापदंड',
            'th_role1': 'सेल्स पार्टनर',
            'th_role2': 'ऑपरेटर',
            'th_role3': 'फ्रेंचाइज डीलर',
            'tr1_label': 'मुख्य उद्देश्य',
            'tr1_role1': 'डेयरियों को रेफर और ऑनबोर्ड करें',
            'tr1_role2': 'दैनिक संग्रह दर्ज करें',
            'tr1_role3': 'क्षेत्र नेटवर्क चलाएं',
            'tr2_label': 'आवश्यक निवेश',
            'tr2_role1': '₹0 (शून्य)',
            'tr2_role2': '₹0 (शून्य)',
            'tr2_role3': 'कम थोक दर',
            'tr3_label': 'मासिक कमाई सीमा',
            'tr3_role1': '₹5,000 – ₹20,000',
            'tr3_role2': '₹10,000 – ₹25,000',
            'tr3_role3': '₹50,000 – ₹1,50,000+',
            'tr4_label': 'समय प्रतिबद्धता',
            'tr4_role1': 'लचीला / पार्ट-टाइम',
            'tr4_role2': 'दैनिक 1-2 घंटे',
            'tr4_role3': 'पूर्ण व्यवसाय स्वामित्व',
            'tr5_label': 'सहायता और प्रशिक्षण',
            'tr5_role1': 'ऐप डेमो और मार्केटिंग किट',
            'tr5_role2': 'पूर्ण ऑपरेटर प्रशिक्षण',
            'tr5_role3': 'प्राथमिकता 24/7 मैनेजर',
            'how_title': '4 आसान चरणों में शुरुआत करें',
            'how_subtitle': '24 घंटे से भी कम समय में दुधिया के साथ कमाई शुरू करें',
            'step1_title': 'अपना रोल चुनें',
            'step1_desc': 'चुनें कि आप सेल्स पार्टनर, ऑपरेटर या डीलर बनना चाहते हैं।',
            'step2_title': 'हमारी टीम से संपर्क करें',
            'step2_desc': 'व्हाट्सएप या डायरेक्ट कॉल के माध्यम से हमारी टीम से संपर्क करें।',
            'step3_title': 'मुफ्त ट्रेनिंग प्राप्त करें',
            'step3_desc': 'पूरा सॉफ्टवेयर डेमो, प्रशिक्षण और मार्केटिंग मार्गदर्शन प्राप्त करें।',
            'step4_title': 'कमाई शुरू करें',
            'step4_desc': 'डेयरियों को ऑनबोर्ड करें या डेटा एंट्री करें और अपना मासिक भुगतान प्राप्त करें।',
            'form_badge': 'त्वरित पंजीकरण',
            'form_title': 'पार्टनर या डीलर बनने के लिए आवेदन करें',
            'form_subtitle': 'अपना विवरण भरें और हमारी टीम 2 घंटे के भीतर आपसे संपर्क करेगी।',
            'label_name': 'पूरा नाम *',
            'label_phone': 'फोन / मोबाइल नंबर *',
            'label_city': 'शहर / जिला *',
            'label_role': 'पसंदीदा रोल चुनें *',
            'label_message': 'अतिरिक्त संदेश (वैकल्पिक)',
            'btn_submit_application': 'आवेदन जमा करें',
            'multirole_badge': 'ऑल-इन-वन मल्टी-रोल सुविधा',
            'multirole_title': 'क्या मैं एक साथ सभी 3 रोल में काम कर सकता हूँ? <span class="text-yellow-200">हाँ!</span>',
            'multirole_desc': 'आप किसी एक रोल तक सीमित नहीं हैं! अपनी आय के स्रोतों को गुणा करने के लिए सेल्स पार्टनरशिप (डेयरी रेफर करना), डेटा एंट्री ऑपरेटर (भुगतान के लिए दूध संग्रह प्रबंधित करना), और टेरिटरी डीलरशिप को एक साथ जोड़ें।',
            'multirole_point1': 'विभिन्न आय के स्रोत',
            'multirole_point2': 'अधिकतम मासिक लाभ',
            'multirole_point3': 'एकल एकीकृत खाता',
            'multirole_btn': 'मल्टी-रोल पार्टनर के लिए आवेदन करें',
            'btn_whatsapp_ask': 'WhatsApp पर पूछें',
            'btn_call_us': 'कॉल करें',
            'contact_subtext_instant': 'तुरंत सहायता! हम मिनटों में जवाब देते हैं, घंटों में नहीं',
            'training_badge_tag': 'मुफ्त 1-ऑन-1 और ग्रुप मास्टरक्लास',
            'training_title': 'संपूर्ण दुधिया सॉफ्टवेयर प्रशिक्षण',
            'training_desc': 'अपने ग्राहकों का प्रभावी ढंग से समर्थन करने के लिए दुधिया प्लेटफॉर्म में महारत हासिल करें। हमारे विशेषज्ञ आपको सिखाएंगे कि दूध संग्रह केंद्र कैसे स्थापित करें, किसान डेटाबेस कैसे प्रबंधित करें, FAT/SNF गणना को कैसे स्वचालित करें, और एक-क्लिक भुगतान रिपोर्ट कैसे उत्पन्न करें।',
            'train_topic1_title': 'दूध संग्रह केंद्र स्थापना',
            'train_topic1_desc': 'संपूर्ण सॉफ्टवेयर और रेट चार्ट कॉन्फ़िगरेशन',
            'train_topic2_title': 'किसान डेटाबेस प्रबंधन',
            'train_topic2_desc': 'किसान, पासबुक और अग्रिम प्रबंधित करें',
            'train_topic3_title': 'FAT/SNF स्वचालित गणना',
            'train_topic3_desc': 'ऑटो दूध परीक्षण और मूल्य निर्धारण गणना',
            'train_topic4_title': '1-क्लिक PDF रिपोर्ट',
            'train_topic4_desc': 'त्वरित बिलिंग, शिफ्ट सारांश और रिपोर्ट',
            'badge_cert': '100% मुफ्त पार्टनर सर्टिफिकेशन',
            'btn_call_training': 'प्रशिक्षण के लिए कॉल करें',
            'training_badge_support': 'विशेषज्ञ सहायता',
            'training_badge_sub': '24/7 उपलब्ध',
            'placeholder_name': 'अपना पूरा नाम दर्ज करें',
            'placeholder_phone': '10-अंकों का मोबाइल नंबर',
            'placeholder_city': 'अपना शहर / जिला दर्ज करें',
            'placeholder_message': 'अपने अनुभव या अपने क्षेत्र में डेयरियों की संख्या के बारे में बताएं...',
            'option_role_1': '1. सेल्स पार्टनर / रेफरल एजेंट (10% कमीशन)',
            'option_role_2': '2. डेटा एंट्री ऑपरेटर (प्रति डेयरी तय भुगतान)',
            'option_role_3': '3. फ्रैंचाइज डीलर (संपूर्ण सॉफ्टवेयर नेटवर्क)',
            'option_role_4': '4. सभी 3 रोल एक साथ / ऑल-इन-वन मल्टी-रोल पार्टनर (अधिकतम आय)',
            'contact_section_badge': 'त्वरित सहायता',
            'contact_section_title': 'कोई सवाल है या मदद चाहिए? तुरंत हमसे बात करें',
            'contact_section_subtitle': 'हमारे पार्टनर विशेषज्ञ आपको रोल, कमाई और ऑनबोर्डिंग प्रक्रिया समझने में मदद करने के लिए उपलब्ध हैं।',
            'contact_card_wa_title': 'WhatsApp पर चैट करें',
            'contact_card_wa_desc': 'हमारी सपोर्ट टीम से अपने सभी सवालों के तुरंत जवाब पाएं।',
            'contact_card_call_title': 'हमारे पार्टनर मैनेजर को कॉल करें',
            'contact_card_call_desc': 'सुबह 9:00 बजे से रात 8:00 बजे तक सीधा 1-ऑन-1 फोन परामर्श।',
            'dealer_sub_badge': 'डेयरी संग्रह केंद्रों और डीलरों के लिए सॉफ्टवेयर प्लान',
            'dealer_sub_title': 'दुधिया सॉफ्टवेयर के लिए सबसे उपयुक्त प्लान चुनें',
            'dealer_sub_subtitle': 'दुधिया डेयरी कलेक्शन सॉफ्टवेयर इस्तेमाल करने वाली डेयरियों के लिए किफायती प्लान।',
            'dealer_plan_freetrial_title': 'मुफ्त ट्रायल',
            'dealer_plan_freetrial_price': 'FREE',
            'dealer_plan_freetrial_dur': '1 महीने के लिए',
            'dealer_plan_monthly_title': 'मासिक प्लान',
            'dealer_plan_monthly_price': '₹899',
            'dealer_plan_monthly_orig': '₹999',
            'dealer_plan_monthly_unit': 'प्रति डेयरी/संग्रह केंद्र',
            'dealer_plan_yearly_title': 'वार्षिक प्लान',
            'dealer_plan_yearly_price': '₹9,999',
            'dealer_plan_yearly_orig': '₹10,999',
            'dealer_plan_yearly_unit': 'असीमित डेयरी/संग्रह केंद्र',
            'feat_1_center': '1 डेयरी/संग्रह केंद्र',
            'feat_basic_analytics': 'बेसिक रिपोर्टिंग और एनालिटिक्स',
            'feat_std_support': 'स्टैंडर्ड कस्टमर सपोर्ट',
            'feat_basic_training': 'बेसिक ट्रेनिंग सामग्री',
            'feat_flex_center': 'लचीले केंद्र विकल्प',
            'feat_center_mgmt': 'संग्रह केंद्र प्रबंधन',
            'feat_adv_analytics': 'एडवांस्ड रिपोर्टिंग और एनालिटिक्स',
            'feat_prio_support': 'प्राथमिकता कस्टमर सपोर्ट',
            'feat_training_onboard': 'ट्रेनिंग और ऑनबोर्डिंग शामिल',
            'feat_mktg_materials': 'मार्केटिंग सामग्री प्रदान की जाएगी',
            'btn_get_started': 'इस प्लान से शुरुआत करें',
            'dealer_plan_contact_title': 'सब्सक्रिप्शन लेने के लिए संपर्क करें',
            'dealer_plan_contact_sub': 'अपनी सदस्यता योजना तुरंत सक्रिय करने के लिए हमारी टीम को कॉल या व्हाट्सएप करें।'
        },
        'pa': {
            'nav_home': 'ਮੁੱਖ ਪੰਨਾ',
            'nav_features': 'ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ',
            'nav_benefits': 'ਲਾਭ',
            'nav_download': 'ਡਾਊਨਲੋਡ',
            'nav_about': 'ਸਾਡੇ ਬਾਰੇ',
            'nav_partner': 'ਪਾਰਟਨਰ/ਡੀਲਰ',
            'nav_pricing': 'ਕੀਮਤਾਂ',
            'nav_contact': 'ਸੰਪਰਕ',
            'nav_login': 'ਲਾਗਇਨ',
            'nav_dashboard': 'ਡੈਸ਼ਬੋਰਡ',
            'select_language': 'ਭਾਸ਼ਾ ਚੁਣੋ',
            'hero_badge': 'ਪਹਿਲਾ ਮਹੀਨਾ FREE • ₹500 ਬੋਨਸ',
            'hero_title': 'ਦੁੱਧ ਸੰਗ੍ਰਹਿ ਕੇਂਦਰਾਂ ਲਈ ਭਾਰਤ ਦਾ #1 ਐਪ',
            'hero_title_part1': 'ਭਾਰਤ ਦਾ ',
            'hero_title_part2': '#1 ਐਪ',
            'hero_title_part3': ' ਦੁੱਧ ਸੰਗ੍ਰਹਿ ਕੇਂਦਰਾਂ ਲਈ',
            'hero_subtitle': 'ਕਾਗਜ਼ ਦੇ ਰਜਿਸਟਰ ਅਤੇ ਕੈਲਕੁਲੇਟਰਾਂ ਨੂੰ ਬਦਲੋ। ਕਿਸਾਨਾਂ ਦੇ ਦੁੱਧ ਦੀ ਡਿਲੀਵਰੀ ਰਿਕਾਰਡ ਕਰੋ, FAT/SNF ਭੁਗਤਾਨ ਆਟੋ-ਕੈਲਕੂਲੇਟ ਕਰੋ, ਅਤੇ ਰਿਪੋਰਟ ਤਿਆਰ ਕਰੋ — ਸਭ ਕੁਝ ਤੁਹਾਡੇ ਫੋਨ ਤੋਂ। 10,000+ ਡੇਅਰੀ ਕੇਂਦਰਾਂ ਦੁਆਰਾ ਵਰਤਿਆ ਜਾਂਦਾ ਹੈ।',
            'btn_download': 'ਮੋਬਾਈਲ ਐਪ ਡਾਊਨਲੋਡ ਕਰੋ',
            'btn_explore': 'ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ ਦੇਖੋ',
            'workflow_buyer_label': 'ਖਰੀਦਦਾਰਾਂ ਲਈ (ਸੰਗ੍ਰਹਿ ਕੇਂਦਰ)',
            'workflow_buyer_step1_title': 'ਸਪਲਾਇਰ ਜੋੜੋ',
            'workflow_buyer_step1_desc': 'ਡੇਅਰੀ ਕਿਸਾਨਾਂ ਨੂੰ ਜੋੜੋ',
            'workflow_buyer_step1_title_full': 'ਸਪਲਾਇਰ ਜੋੜੋ',
            'workflow_buyer_step1_desc_full': 'ਵਿਸਥਾਰਿਤ ਪ੍ਰੋਫਾਈਲਾਂ ਨਾਲ ਡੇਅਰੀ ਕਿਸਾਨਾਂ ਨੂੰ ਆਪਣੇ ਸੰਗ੍ਰਹਿ ਕੇਂਦਰ ਨਾਲ ਜੋੜੋ',
            'workflow_buyer_step2_title': 'ਸੰਗ੍ਰਹਿ ਕਰੋ',
            'workflow_buyer_step2_desc': 'ਪ੍ਰੋ ਰੇਟਾ ਅਤੇ ਸਟੈਂਡਰਡ',
            'workflow_buyer_step2_title_full': 'ਸੰਗ੍ਰਹਿ ਕਰੋ',
            'workflow_buyer_step2_desc_full': 'ਆਟੋ-ਕੈਲਕੂਲੇਟਡ FAT, SNF ਅਤੇ ਦਰਾਂ ਨਾਲ ਦੁੱਧ ਦੀ ਡਿਲੀਵਰੀ ਰਿਕਾਰਡ ਕਰੋ',
            'workflow_buyer_step3_title': 'ਰਿਪੋਰਟਾਂ ਤਿਆਰ ਕਰੋ',
            'workflow_buyer_step3_desc': 'ਸਪਲਾਇਰ ਜਾਂ ਸਭ ਦੇ ਅਨੁਸਾਰ',
            'workflow_buyer_step3_title_full': 'ਰਿਪੋਰਟਾਂ ਤਿਆਰ ਕਰੋ',
            'workflow_buyer_step3_desc_full': 'ਕਿਸੇ ਵੀ ਮਿਤੀ ਰੇਂਜ, ਸਪਲਾਇਰ ਜਾਂ ਸ਼ਿਫਟ ਲਈ PDF/Excel ਰਿਪੋਰਟਾਂ ਬਣਾਓ',
            'workflow_buyer_title': 'ਸਰਲ 3-ਕਦਮ ਵਰਕਫਲੋ',
            'workflow_buyer_subtitle': 'ਸਾਡੀ ਸੁਵਿਧਾ ਪ੍ਰਕਿਰਿਆ ਨਾਲ ਆਪਣੇ ਸੰਗ੍ਰਹਿ ਕੇਂਦਰ ਨੂੰ ਕੁਸ਼ਲਤਾ ਨਾਲ ਪ੍ਰਬੰਧਿਤ ਕਰੋ',
            'workflow_supplier_label': 'ਸਪਲਾਇਰਾਂ ਲਈ (ਕਿਸਾਨ)',
            'workflow_supplier_step1_title': 'ਜੁੜੀਆਂ ਡੇਅਰੀਆਂ ਦੇਖੋ',
            'workflow_supplier_step1_desc': 'ਸਾਰੇ ਖਰੀਦਦਾਰ ਦੇਖੋ',
            'workflow_supplier_step1_title_full': 'ਜੁੜੀਆਂ ਡੇਅਰੀਆਂ ਦੇਖੋ',
            'workflow_supplier_step1_desc_full': 'ਉਹ ਸਾਰੇ ਸੰਗ੍ਰਹਿ ਕੇਂਦਰ ਦੇਖੋ ਜਿਨ੍ਹਾਂ ਨਾਲ ਤੁਸੀਂ ਜੁੜੇ ਹੋ',
            'workflow_supplier_step2_title': 'ਸੰਗ੍ਰਹਿ ਦੇਖੋ',
            'workflow_supplier_step2_desc': 'ਖਾਸ ਖਰੀਦਦਾਰ ਦੇ ਅਨੁਸਾਰ',
            'workflow_supplier_step2_title_full': 'ਸੰਗ੍ਰਹਿ ਦੇਖੋ',
            'workflow_supplier_step2_desc_full': 'ਖਾਸ ਖਰੀਦਦਾਰ ਦੁਆਰਾ ਆਪਣੀ ਦੁੱਧ ਦੀ ਡਿਲੀਵਰੀ ਚੈੱਕ ਕਰੋ',
            'workflow_supplier_step3_title': 'ਰਿਪੋਰਟਾਂ ਤਿਆਰ ਕਰੋ',
            'workflow_supplier_step3_desc': 'ਡਾਊਨਲੋਡ ਅਤੇ ਸਾਂਝਾ ਕਰੋ',
            'workflow_supplier_step3_title_full': 'ਰਿਪੋਰਟਾਂ ਅਤੇ ਕਮਾਈ ਦੇਖੋ',
            'workflow_supplier_step3_desc_full': 'ਖਰੀਦਦਾਰਾਂ ਦੁਆਰਾ ਸਾਂਝੀਆਂ ਕੀਤੀਆਂ ਰਿਪੋਰਟਾਂ ਦੇਖੋ ਅਤੇ ਆਪਣੀ ਕਮਾਈ ਟਰੈਕ ਕਰੋ',
            'workflow_supplier_title': 'ਸਰਲ 3-ਕਦਮ ਵਰਕਫਲੋ',
            'workflow_supplier_subtitle': 'ਸਾਡੇ ਕਿਸਾਨ-ਅਨੁਕੂਲ ਸਿਸਟਮ ਨਾਲ ਆਪਣੀ ਦੁੱਧ ਦੀ ਡਿਲੀਵਰੀ ਅਤੇ ਕਮਾਈ ਟਰੈਕ ਕਰੋ',
            'farmer_details': 'ਕਿਸਾਨ ਵੇਰਵੇ',
            'contact_info': 'ਸੰਪਰਕ ਜਾਣਕਾਰੀ',
            'pro_rata': 'ਪ੍ਰੋ ਰੇਟਾ',
            'standard': 'ਸਟੈਂਡਰਡ',
            'pdf_bills': 'PDF ਬਿਲ੍ਸ',
            'excel_export': 'ਐਕਸਲ ਐਕਸਪੋਰਟ',
            'all_buyers': 'ਸਾਰੇ ਖਰੀਦਦਾਰ',
            'status': 'ਸਥਿਤੀ',
            'daily_logs': 'ਰੋਜ਼ਾਨਾ ਲੌਗਜ਼',
            'rates': 'ਦਰਾਂ',
            'view_reports': 'ਰਿਪੋਰਟਾਂ ਦੇਖੋ',
            'track_earnings': 'ਕਮਾਈ ਟਰੈਕ ਕਰੋ',
            'free_for_first_month': 'ਪਹਿਲੇ ਮਹੀਨੇ ਲਈ ਪੂਰੀ ਤਰ੍ਹਾਂ ਮੁਫਤ',
            'free_for_lifetime': 'ਆਜੀਵਨ ਮੁਫਤ!',
            'btn_download': 'ਮੋਬਾਈਲ ਐਪ ਡਾਊਨਲੋਡ ਕਰੋ',
            'use_web_app': 'ਵੈੱਬ ਐਪ ਦੀ ਵਰਤੋਂ ਕਰੋ',
            'first_month_free': 'ਪਹਿਲਾ ਮਹੀਨਾ FREE',
            'no_credit_card': 'ਕੋਈ ਕ੍ਰੈਡਿਟ ਕਾਰਡ ਨਹੀਂ',
            'support_24_7': '24/7 ਸਹਾਇਤਾ',
            'about_card_how_desc': 'ਸਰਲ 3-ਕਦਮ ਡਿਜੀਟਲ ਵਰਕਫਲੋ ਜੋ ਰੋਜ਼ਾਨਾ ਘੰਟੇ ਬਚਾਉਂਦਾ ਹੈ',
            'about_card_why_title': 'ਕਿਉਂ ਚੁਣੋ',
            'about_card_why_desc': 'ਸਮਾਂ ਬਚਾਓ, ਗਲਤੀਆਂ ਘਟਾਓ, ਵਪਾਰ ਨੂੰ ਤੇਜ਼ੀ ਨਾਲ ਵਧਾਓ',
            'watch_demo': 'ਡੈਮੋ ਦੇਖੋ ਅਤੇ ਹੋਰ ਜਾਣੋ',
            'demo_duration': '2-ਮਿੰਟ ਦਾ ਡੈਮੋ ਵੀਡੀਓ',
            'whatis_title': 'ਦੁਧੀਆ ਕੀ ਹੈ?',
            'whatis_subtitle': 'ਸਮਾਰਟ ਐਪ ਜੋ ਦੁੱਧ ਸੰਗ੍ਰਹਿ ਪ੍ਰਬੰਧਨ ਲਈ ਤੁਹਾਡੇ ਕਾਗਜ਼ ਦੇ ਰਜਿਸਟਰ ਅਤੇ ਮੈਨੂਅਲ ਕੈਲਕੂਲੇਸ਼ਨ ਨੂੰ ਬਦਲ ਦਿੰਦਾ ਹੈ।',
            'whatis_without_title': 'ਦੁਧੀਆ ਤੋਂ ਬਿਨਾਂ',
            'whatis_without_point1': 'ਮੈਨੂਅਲ ਰਜਿਸਟਰ ਗੁਆਚ ਜਾਂਦੇ ਹਨ ਜਾਂ ਨੁਕਸਾਨਦੇਹ ਹੁੰਦੇ ਹਨ',
            'whatis_without_point2': 'FAT/SNF ਕੈਲਕੂਲੇਸ਼ਨ ਵਿੱਚ ਕੈਲਕੂਲੇਟਰ ਗਲਤੀਆਂ',
            'whatis_without_point3': 'ਕਿਸਾਨਾਂ ਨਾਲ ਭੁਗਤਾਨ ਝਗੜੇ',
            'whatis_without_point4': 'ਮੈਨੂਅਲ ਰਿਪੋਰਟਿੰਗ ਵਿੱਚ ਘੰਟੇ ਬਿਤਾਏ',
            'whatis_with_title': 'ਦੁਧੀਆ ਨਾਲ',
            'whatis_with_point1': 'ਕਲਾਉਡ ਬੈਕਅਪ ਨਾਲ ਡਿਜੀਟਲ ਰਿਕਾਰਡ',
            'whatis_with_point2': 'ਆਟੋਮੈਟਿਕ FAT/SNF ਕੈਲਕੂਲੇਸ਼ਨ',
            'whatis_with_point3': 'ਹਰ ਕਿਸਾਨ ਲਈ ਪਾਰਦਰਸ਼ੀ ਵਾਲੇਟ',
            'whatis_with_point4': 'ਇੱਕ-ਕਲਿੱਕ PDF/Excel ਰਿਪੋਰਟਾਂ',
            'about_title': 'ਦੁਧੀਆ ਬਾਰੇ',
            'about_subtitle': 'ਇੱਕ ਸ਼ਕਤੀਸ਼ਾਲੀ ਐਪ ਵਿੱਚ ਤੁਹਾਡਾ ਪੂਰਾ ਡੇਅਰੀ ਪ੍ਰਬੰਧਨ ਹੱਲ',
            'about_card_what_title': 'ਕੀ ਹੈ',
            'about_card_what_desc': 'ਦੁੱਧ ਸੰਗ੍ਰਹਿ ਪ੍ਰਬੰਧਨ ਲਈ ਨਵੀਨਤਮ ਤਕਨਾਲੋਜੀ ਨਾਲ ਸਮਾਰਟ ਐਪ',
            'about_card_who_title': 'ਕਿਸ ਲਈ',
            'about_card_who_desc': 'ਸੰਗ੍ਰਹਿ ਕੇਂਦਰ ਅਤੇ ਡੇਅਰੀ ਕਿਸਾਨ ਇੱਕਠੇ ਕੰਮ ਕਰਦੇ ਹਨ',
            'about_card_how_title': 'ਕਿਵੇਂ ਕੰਮ ਕਰਦਾ ਹੈ',
            'about_card_how_desc': 'ਸਰਲ 3-ਕਦਮ ਡਿਜੀਟਲ ਵਰਕਫਲੋ ਜੋ ਰੋਜ਼ਾਨਾ ਘੰਟੇ ਬਚਾਉਂਦਾ ਹੈ',
            'about_card_why_title': 'ਕਿਉਂ ਚੁਣੋ',
            'about_card_why_desc': 'ਸਮਾਂ ਬਚਾਓ, ਗਲਤੀਆਂ ਘਟਾਓ, ਕਾਰੋਬਾਰ ਨੂੰ ਤੇਜ਼ੀ ਨਾਲ ਵਧਾਓ',
            'features_title': 'ਤੁਹਾਡੀ ਡੇਅਰੀ ਚਲਾਉਣ ਲਈ ਹਰ ਚੀਜ਼ ਜੋ ਤੁਹਾਨੂੰ ਚਾਹੀਦੀ ਹੈ',
            'feature1_title': 'ਦੁੱਧ ਕੈਲਕੁਲੇਟਰ',
            'feature1_desc': 'FAT, SNF ਅਤੇ ਵਾਲੀਅਮ ਦੇ ਆਧਾਰ ਤੇ ਦੁੱਧ ਦਾ ਮੁੱਲ ਤੁਰੰਤ ਕੈਲਕੂਲੇਟ ਕਰੋ।',
            'feature2_title': 'ਕਿਸਾਨ ਪ੍ਰਬੰਧਨ',
            'feature2_desc': 'ਵਿਸਥਾਰਿਤ ਪ੍ਰੋਫਾਈਲਾਂ ਅਤੇ ਇਤਿਹਾਸ ਨਾਲ ਆਪਣੇ ਸਾਰੇ ਕਿਸਾਨਾਂ ਨੂੰ ਜੋੜੋ, ਸੰਪਾਦਿਤ ਕਰੋ ਅਤੇ ਟਰੈਕ ਕਰੋ।',
            'feature3_title': 'ਸੰਗ੍ਰਹਿ ਐਂਟਰੀ',
            'feature3_desc': 'ਮਾਤਰਾ, FAT, SNF ਅਤੇ ਰੇਟ ਨਾਲ ਦੁੱਧ ਦੀ ਡਿਲੀਵਰੀ ਰਿਕਾਰਡ ਕਰੋ।',
            'feature4_title': 'ਵਾਲਿਟ ਅਤੇ ਮੈਂਬਰਸ਼ਿਪ',
            'feature4_desc': 'ਵਾਲਿਟ ਰੀਚਾਰਜ ਜਾਂ ਸਬਸਕ੍ਰਿਪਸ਼ਨ ਯੋਜਨਾਵਾਂ ਨਾਲ ਐਪ ਦੀ ਵਰਤੋਂ ਜਾਰੀ ਰੱਖੋ।',
            'feature5_title': 'ਸ਼ਿਫਟ ਪ੍ਰਬੰਧਨ',
            'feature5_desc': 'ਸਵੇਰ ਅਤੇ ਸ਼ਾਮ ਦੀ ਸ਼ਿਫਟ ਨੂੰ ਸੌਖਿਆਂ ਨਾਲ ਵੱਖ ਕਰਕੇ ਸੰਭਾਲੋ।',
            'feature6_title': 'ਰਿਪੋਰਟਾਂ ਅਤੇ ਬਿਲਸ',
            'feature6_desc': 'ਕਿਸੇ ਵੀ ਮਿਤੀ ਰੇਂਜ, ਕਿਸਾਨ ਜਾਂ ਸ਼ਿਫਟ ਲਈ ਵਿਆਪਕ PDF/Excel ਰਿਪੋਰਟਾਂ ਅਤੇ ਬਿਲ ਤਿਆਰ ਕਰੋ।',
            'feature7_title': 'ਬਹੁਭਾਸ਼ੀ ਸਮਰਥਨ',
            'feature7_desc': 'ਆਪਣੀ ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ ਵਿੱਚ ਐਪ ਦੀ ਵਰਤੋਂ ਕਰੋ। ਅੰਗਰੇਜ਼ੀ, ਹਿੰਦੀ, ਪੰਜਾਬੀ ਅਤੇ ਕੰਨੜ ਦਾ ਸਮਰਥਨ।',
            'feature8_title': 'ਡੇਟਾ ਬੈਕਅਪ ਅਤੇ ਸੁਰੱਖਿਆ',
            'feature8_desc': 'ਸਵੈਚਾਲਿਤ ਬੈਕਅਪ ਅਤੇ ਰਿਕਵਰੀ ਵਿਕਲਪਾਂ ਨਾਲ ਸਾਰਾ ਡੇਟਾ ਸੁਰੱਖਿਅਤ ਢੰਗ ਨਾਲ ਕਲਾਉਡ ਵਿੱਚ ਸਟੋਰ ਕੀਤਾ ਗਿਆ ਹੈ।',
            'plans_badge': 'ਪਲਾਨ ਅਤੇ ਸਬਸਕ੍ਰਿਪਸ਼ਨ',
            'plans_title': 'ਤੁਹਾਡੀ <span class="text-primary" style="color: #00288e;">ਡੇਅਰੀ</span> ਲਈ ਆਸਾਨ ਯੋਜਨਾਵਾਂ',
            'plans_subtitle': 'ਮੁਫਤ ਵਿੱਚ ਸ਼ੁਰੂ ਕਰੋ ਅਤੇ ਜਿਵੇਂ-ਜਿਵੇਂ ਤੁਹਾਡਾ ਕਾਰੋਬਾਰ ਵਧੇ, ਅੱਗੇ ਵਧੋ',
            'plan_free_title': 'ਪਹਿਲਾ ਮਹੀਨਾ FREE',
            'plan_free_duration': '/ਪਹਿਲਾ ਮਹੀਨਾ',
            'plan_feature_all': 'ਸਾਰੇ ਪ੍ਰੀਮੀਅਮ ਫੀਚਰ ਸ਼ਾਮਲ',
            'plan_feature_suppliers_unlimited': 'ਸਪਲਾਇਰਾਂ ਦੀ ਕੋਈ ਸੀਮਾ ਨਹੀਂ',
            'plan_feature_support': '24/7 ਸਹਾਇਤਾ',
            'btn_start_free': 'ਮੁਫਤ ਵਿੱਚ ਸ਼ੁਰੂ ਕਰੋ',
            'plan_monthly_title': 'ਮਾਸਿਕ ਪਲਾਨ',
            'plan_monthly_duration': '/ਮਹੀਨਾ',
            'plan_monthly_desc': 'ਵਧ ਰਹੇ ਸੰਗ੍ਰਹਿ ਕੇਂਦਰਾਂ ਲਈ ਆਦਰਸ਼',
            'plan_feature_suppliers_limit': 'ਸਪਲਾਇਰਾਂ ਦੀ ਕੋਈ ਸੀਮਾ ਨਹੀਂ',
            'plan_feature_wallet_recharge': 'ਵਾਲਿਟ ਰੀਚਾਰਜ ਸੁਵਿਧਾ',
            'plan_feature_wallet_recharge_desc': 'ਜੇਕਰ ਮਹੀਨਾਵਾਰ ਪਲਾਨ ਖਤਮ ਹੋ ਗਿਆ ਹੈ, ਤਾਂ ਘੱਟੋ-ਘੱਟ ₹10 ਦਾ ਵਾਲਿਟ ਰੀਚਾਰਜ ਕਰਕੇ ਆਪਣਾ ਕੰਮ ਚਾਲੂ ਰੱਖੋ।',
            'plan_feature_reports': 'PDF ਰਿਪੋਰਟਾਂ',
            'btn_choose_plan': 'ਇਸ ਪਲਾਨ ਨਾਲ ਸ਼ੁਰੂ ਕਰੋ',
            'plan_yearly_title': 'ਸਾਲਾਨਾ ਪਲਾਨ',
            'plan_yearly_subtitle': 'ਸਭ ਤੋਂ ਵਧੀਆ ਮੁੱਲ',
            'plan_yearly_price': '₹3999',
            'plan_yearly_duration': '/ਸਾਲ',
            'plan_yearly_desc': 'ਪੂਰੇ ਸਾਲ ਲਈ ਮੁਕੰਮਲ ਡੇਅਰੀ ਪ੍ਰਬੰਧਨ ਅਤੇ ਵੱਡੀ ਬਚਤ।',
            'plan_feature_save': 'ਸਾਲਾਨਾ ₹1989 ਬਚਾਓ',
            'plan_feature_priority_support': 'ਪਹਿਲ ਦੇ ਅਧਾਰ ਤੇ 24/7 ਸਹਾਇਤਾ',
            'btn_get_yearly': 'ਇਸ ਪਲਾਨ ਨਾਲ ਸ਼ੁਰੂ ਕਰੋ',
            'plan_wallet_title': 'ਵਾਲਿਟ ਰੀਚਾਰਜ',
            'plan_wallet_min_recharge': 'ਘੱਟੋ-ਘੱਟ ਰੀਚਾਰਜ',
            'plan_wallet_rate_desc': '₹0.0125 / ਕਿਲੋਗ੍ਰਾਮ ਸੰਗ੍ਰਹਿ',
            'plan_wallet_feature1': 'ਸਪਲਾਇਰਾਂ ਦੀ ਕੋਈ ਸੀਮਾ ਨਹੀਂ',
            'plan_wallet_feature2': 'ਵਰਤੋਂ ਦੇ ਅਨੁਸਾਰ ਭੁਗਤਾਨ (ਕੋਈ ਮਾਸਿਕ ਫੀਸ ਨਹੀਂ)',
            'plan_wallet_feature3': '100 ਕਿਲੋਗ੍ਰਾਮ ਦੁੱਧ ਤੇ ਸਿਰਫ ₹1.25 ਚਾਰਜ',
            'plan_wallet_feature4': 'ਵਾਲਿਟ ਬੈਲੇਂਸ ਕਦੇ ਖਤਮ ਨਹੀਂ ਹੁੰਦਾ',
            'btn_start_wallet': 'ਵਾਲਿਟ ਨਾਲ ਸ਼ੁਰੂ ਕਰੋ',
            'pricing_page_title': 'ਡੁਧਿਆ - ਪਲਾਨ ਅਤੇ ਕੀਮਤਾਂ ਦੀ ਤੁਲਨਾ',
            'pricing_hero_badge': '100% ਪਾਰਦਰਸ਼ੀ ਬਿਲਿੰਗ',
            'pricing_hero_title': 'ਆਪਣੀ ਡੇਅਰੀ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਪਲਾਨ ਚੁਣੋ',
            'pricing_hero_subtitle': 'ਭਾਵੇਂ ਤੁਸੀਂ ਮਾਸਿਕ ਸਬਸਕ੍ਰਿਪਸ਼ਨ ਚਾਹੁੰਦੇ ਹੋ ਜਾਂ ਵਰਤੋਂ-ਅਨੁਸਾਰ ਵਾਲਿਟ ਰੀਚਾਰਜ, ਸਾਡੇ ਕੋਲ ਦੋਵੇਂ ਵਿਕਲਪ ਹਨ।',
            'pricing_free_desc': 'ਇੱਕ ਪੂਰੇ ਮਹੀਨੇ ਲਈ ਸਾਰੀਆਂ ਪ੍ਰੀਮੀਅਮ ਸੁਵਿਧਾਵਾਂ ਨੂੰ ਪੂਰੀ ਤਰ੍ਹਾਂ ਮੁਫਤ ਵਿੱਚ ਅਜ਼ਮਾਓ।',
            'pricing_badge_popular': 'ਲੋਕਪ੍ਰਿਯ',
            'pricing_badge_value': 'ਸਭ ਤੋਂ ਵਧੀਆ ਮੁੱਲ',
            'pricing_badge_flexible': 'ਲਚਕਦਾਰ',
            'pricing_wallet_desc_short': 'ਇਕੱਠੇ ਕੀਤੇ ਦੁੱਧ ਦੇ ਪ੍ਰਤੀ ਕਿਲੋਗ੍ਰਾਮ ਦੇ ਹਿਸਾਬ ਨਾਲ ਭੁਗਤਾਨ ਕਰੋ। ਲੋੜ ਪੈਣ ਤੇ ਹੀ ਰੀਚਾਰਜ ਕਰੋ।',
            'pricing_compare_title': 'ਵਿਸਤ੍ਰਿਤ ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ ਦੀ ਤੁਲਨਾ',
            'pricing_compare_subtitle': 'ਆਪਣੇ ਡੇਅਰੀ ਕਾਰੋਬਾਰ ਲਈ ਸਹੀ ਪਲਾਨ ਲੱਭਣ ਲਈ ਸਾਰੇ ਪਲਾਨ ਦੀ ਤੁਲਨਾ ਕਰੋ।',
            'pricing_table_header_features': 'ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ',
            'pricing_row_cost': 'ਸਬਸਕ੍ਰਿਪਸ਼ਨ ਲਾਗਤ',
            'pricing_row_min_deposit': 'ਘੱਟੋ-ਘੱਟ ਜਮ੍ਹਾ/ਸੈੱਟਅੱਪ',
            'pricing_row_pay_as_you_go': 'ਵਰਤੋਂ ਦੇ ਅਨੁਸਾਰ ਭੁਗਤਾਨ (ਪ੍ਰਤੀ ਕਿਲੋਗ੍ਰਾਮ)',
            'pricing_row_reports': 'ਵਿਸਤ੍ਰਿਤ PDF ਅਤੇ Excel ਰਿਪੋਰਟਾਂ',
            'pricing_row_backup': 'ਸਵੈਚਾਲਿਤ ਕਲਾਉਡ ਬੈਕਅਪ',
            'pricing_row_shift': 'ਸ਼ਿਫਟ ਪ੍ਰਬੰਧਨ (ਸਵੇਰ/ਸ਼ਾਮ)',
            'pricing_row_support': 'ਗਾਹਕ ਸਹਾਇਤਾ',
            'pricing_info_title': 'ਅਕਸਰ ਪੁੱਛੇ ਜਾਣ ਵਾਲੇ ਸਵਾਲ',
            'pricing_q1': 'ਕੀ ਮੈਂ ਕਦੇ ਵੀ ਪਲਾਨ ਬਦਲ ਸਕਦਾ ਹਾਂ?',
            'pricing_a1': 'ਹਾਂ! ਤੁਸੀਂ ਆਪਣੇ ਡੈਸ਼ਬੋਰਡ ਸੈਟਿੰਗਾਂ ਰਾਹੀਂ ਕਿਸੇ ਵੀ ਸਮੇਂ ਮੁਫਤ ਟ੍ਰਾਇਲ ਤੋਂ ਮਾਸਿਕ, ਸਾਲਾਨਾ ਜਾਂ ਵਾਲਿਟ ਰੀਚਾਰਜ ਵਿੱਚ ਅਪਗ੍ਰੇਡ ਕਰ ਸਕਦੇ ਹੋ।',
            'pricing_q2': 'ਵਾਲਿਟ ਰੀਚਾਰਜ ਪਲਾਨ ਮੇਰੇ ਤੋਂ ਕਿਵੇਂ ਚਾਰਜ ਲੈਂਦਾ ਹੈ?',
            'pricing_a2': 'ਵਾਲਿਟ ਪਲਾਨ ਵਿੱਚ, ਕੋਈ ਨਿਸ਼ਚਿਤ ਮਾਸਿਕ ਲਾਗਤ ਨਹੀਂ। ਤੁਸੀਂ ਇਕੱਠੇ ਕੀਤੇ ਦੁੱਧ ਤੇ ਸਿਰਫ ₹0.0125 ਪ੍ਰਤੀ ਕਿਲੋਗ੍ਰਾਮ ਭੁਗਤਾਨ ਕਰਦੇ ਹੋ। ਉਦਾਹਰਨ ਲਈ, ਜੇ ਤੁਸੀਂ 100 ਕਿਲੋਗ੍ਰਾਮ ਦੁੱਧ ਇਕੱਠਾ ਕਰਦੇ ਹੋ, ਤਾਂ ਤੁਹਾਡੇ ਵਾਲਿਟ ਬੈਲੇਂਸ ਵਿੱਚੋਂ ਸਿਰਫ ₹1.25 ਕੱਟੇ ਜਾਂਦੇ ਹਨ। ਤੁਸੀਂ ਸੇਵਾਵਾਂ ਦੀ ਵਰਤੋਂ ਜਾਰੀ ਰੱਖਣ ਲਈ ਘੱਟੋ-ਘੱਟ ₹10 ਨਾਲ ਰੀਚਾਰਜ ਕਰ ਸਕਦੇ ਹੋ।',
            'pricing_q3': 'ਕੀ ਮੇਰਾ ਵਾਲਿਟ ਬੈਲੇਂਸ ਖਤਮ ਹੋ ਜਾਂਦਾ ਹੈ?',
            'pricing_a3': 'ਨਹੀਂ! ਤੁਹਾਡੇ ਵਾਲਿਟ ਬੈਲੇਂਸ ਦੀ ਵੈਧਤਾ ਲਾਈਫਟਾਈਮ ਹੈ ਅਤੇ ਇਹ ਕਦੇ ਖਤਮ ਨਹੀਂ ਹੋਵੇਗੀ, ਭਾਵੇਂ ਤੁਹਾਡਾ ਕੇਂਦਰ ਮੌਸਮੀ ਬੰਦ ਹੋਣ ਦੌਰਾਨ ਬੰਦ ਰਹੇ।',
            'btn_pricing_know_more': 'ਪਲਾਨ ਅਤੇ ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ ਦੀ ਤੁਲਨਾ ਕਰੋ',
            'calc_title': 'ਯੋਜਨਾ ਚੋਣ ਕੈਲਕੁਲੇਟਰ',
            'calc_subtitle': 'ਇਹ ਜਾਣਨ ਲਈ ਕਿ ਫਲੈਟ-ਰੇਟ ਮਾਸਿਕ ਪਲਾਨ ਜਾਂ ਵਰਤੋਂ-ਅਨੁਸਾਰ ਵਾਲਿਟ ਰੀਚਾਰਜ ਵਿੱਚੋਂ ਕਿਹੜਾ ਸਸਤਾ ਹੈ, ਆਪਣੀ ਮਾਸਿਕ ਦੁੱਧ ਦੀ ਮਾਤਰਾ ਦਰਜ ਕਰੋ।',
            'calc_label_milk': 'ਅਨੁਮਾਨਿਤ ਮਾਸਿਕ ਦੁੱਧ ਦੀ ਮਾਤਰਾ (ਕਿਲੋਗ੍ਰਾਮ ਵਿੱਚ)',
            'calc_sub_flat_cost': 'ਨਿਸ਼ਚਿਤ ਮਾਸਿਕ ਫੀਸ',
            'calc_sub_usage_cost': '₹0.0125 / ਕਿਲੋਗ੍ਰਾਮ ਤੇ ਚਾਰਜ ਕੀਤਾ ਗਿਆ',
            'btn_call_us': 'ਹਮੇਂ ਅੱਜ ਕਾਲ ਕਰੋ',
            'btn_use_web_app': 'ਵੈੱਬ ਐਪ ਦੀ ਵਰਤੋਂ ਕਰੋ',
            'btn_contact_us': 'ਸਾਡੇ ਨਾਲ ਸੰਪਰਕ ਕਰੋ',
            // Modal feature data
            'modal_milk_calculator_title': 'ਦੁੱਧ ਕੈਲਕੁਲੇਟਰ',
            'modal_milk_calculator_desc': 'FAT, SNF ਅਤੇ ਵਾਲੀਅਮ ਦੇ ਆਧਾਰ ਤੇ ਦੁੱਧ ਦਾ ਮੁੱਲ ਤੁਰੰਤ ਕੈਲਕੂਲੇਟ ਕਰੋ।',
            'modal_milk_calculator_feature1': 'ਵੇਰਵਾ ਦਾਖਲ ਕਰੋ: ਭਾਰ, FAT ਪ੍ਰਤੀਸ਼ਤ, SNF ਪ੍ਰਤੀਸ਼ਤ',
            'modal_milk_calculator_feature2': 'ਹੁਣ ਖੁੰਝਣ ਵਾਲੇ ਪੇਪਰ ਰਜਿਸਟਰ ਨਹੀਂ',
            'modal_milk_calculator_feature3': 'ਆਟੋਮੈਟਿਕ ਬੈਕਅਪ ਨਾਲ ਡਿਜੀਟਲ ਰਿਕਾਰਡ',
            'modal_milk_calculator_feature4': 'ਸਮਾਰਟ ਸੁਝਾਵਾਂ ਨਾਲ ਆਸਾਨ ਡੇਟਾ ਐਂਟਰੀ',
            'modal_milk_calculator_feature5': 'ਰੀਅਲ-ਟਾਈਮ ਪੁਸ਼ਟੀਕਰਨ ਅਤੇ ਗਲਤੀ ਰੋਕਥਾਮ',
            'modal_farmer_management_title': 'ਕਿਸਾਨ (ਸਪਲਾਇਰ) ਪ੍ਰਬੰਧਨ',
            'modal_farmer_management_desc': 'ਵਿਸਥਾਰਿਤ ਪ੍ਰੋਫਾਈਲਾਂ ਅਤੇ ਇਤਿਹਾਸ ਨਾਲ ਆਪਣੇ ਸਾਰੇ ਕਿਸਾਨਾਂ ਨੂੰ ਜੋੜੋ, ਸੰਪਾਦਿਤ ਕਰੋ ਅਤੇ ਟਰੈਕ ਕਰੋ।',
            'modal_farmer_management_feature1': 'ਕਿਸਾਨ ਵੇਰਵਾ ਸੇਵ ਕਰੋ: ਨਾਮ, ਫੋਨ ਨੰਬਰ, ਪਿੰਡ',
            'modal_farmer_management_feature2': 'ਨਾਮ ਜਾਂ ID ਨੰਬਰ ਨਾਲ ਤੇਜ਼ੀ ਨਾਲ ਕਿਸਾਨ ਖੋਜੋ',
            'modal_farmer_management_feature3': 'ਹਰ ਕਿਸਾਨ ਦੀ ਡਿਲੀਵਰੀ ਦਾ ਪੂਰਾ ਇਤਿਹਾਸ ਵੇਖੋ',
            'modal_farmer_management_feature4': 'ਕਈ ਕਿਸਾਨਾਂ ਦਾ ਕੁਸ਼ਲਤਾ ਨਾਲ ਪ੍ਰਬੰਧਨ ਕਰੋ',
            'modal_farmer_management_feature5': 'ਕਿਸਾਨ ਪ੍ਰਦਰਸ਼ਨ ਅਤੇ ਗੁਣਵੱਤਾ ਰੁਝਾਨ ਟਰੈਕ ਕਰੋ',
            'modal_collection_entry_title': 'ਸੰਗ੍ਰਹਿ ਐਂਟਰੀ',
            'modal_collection_entry_desc': 'ਮਾਤਰਾ, FAT, SNF ਅਤੇ ਰੇਟ ਨਾਲ ਦੁੱਧ ਦੀ ਡਿਲੀਵਰੀ ਰਿਕਾਰਡ ਕਰੋ।',
            'modal_collection_entry_feature1': 'ਆਪਣੇ ਫੋਨ \'ਤੇ ਕਿਸਾਨਾਂ ਤੋਂ ਦੁੱਧ ਦੀ ਡਿਲੀਵਰੀ ਰਿਕਾਰਡ ਕਰੋ',
            'modal_collection_entry_feature2': 'ਵੇਰਵਾ ਦਾਖਲ ਕਰੋ: ਭਾਰ, FAT ਪ੍ਰਤੀਸ਼ਤ, SNF ਪ੍ਰਤੀਸ਼ਤ',
            'modal_collection_entry_feature3': 'ਰੁਝੇਵੇਂ ਸੰਗ੍ਰਹਿ ਘੰਟਿਆਂ ਦੌਰਾਨ ਤੇਜ਼ੀ ਨਾਲ ਐਂਟਰੀ',
            'modal_collection_entry_feature4': 'ਰੀਅਲ-ਟਾਈਮ ਡੇਟਾ ਪੁਸ਼ਟੀਕਰਨ',
            'modal_collection_entry_feature5': 'ਆਟੋਮੈਟਿਕ ਗੁਣਵੱਤਾ ਕੈਲਕੂਲੇਸ਼ਨ',
            'modal_wallet_payments_title': 'ਵਾਲੇਟ ਅਤੇ ਭੁਗਤਾਨ',
            'modal_wallet_payments_desc': 'ਵਾਲਿਟ ਰੀਚਾਰਜ ਜਾਂ ਸਬਸਕ੍ਰਿਪਸ਼ਨ ਯੋਜਨਾਵਾਂ ਨਾਲ ਐਪ ਦੀ ਵਰਤੋਂ ਜਾਰੀ ਰੱਖੋ।',
            // 'modal_wallet_payments_feature1': 'ਕਿਸਾਨਾਂ ਨੂੰ ਦੇਣ ਵਾਲੇ ਪੈਸੇ ਟਰੈਕ ਕਰਨ ਲਈ ਡਿਜੀਟਲ ਵਾਲੇਟ',
            'modal_wallet_payments_feature2': 'ਆਨਲਾਈਨ ਭੁਗਤਾਨ (UPI/ਕਾਰਡ) ਦੀ ਵਰਤੋਂ ਕਰਕੇ ਆਪਣੇ ਵਾਲੇਟ ਵਿੱਚ ਪੈਸੇ ਜੋੜੋ',
            'modal_wallet_payments_feature3': 'ਰੀਚਾਰਜ ਕਰਨ \'ਤੇ ਬੋਨਸ ਪੈਸੇ ਪਾਓ (10% ਵਾਧੂ ਆਫਰਾਂ)',
            'modal_wallet_payments_feature4': 'ਕਿਸਾਨ ਆਪਣਾ ਬਕਾਇਆ ਅਤੇ ਭੁਗਤਾਨ ਇਤਿਹਾਸ ਵੇਖ ਸਕਦੇ ਹਨ',
            'modal_wallet_payments_feature5': 'ਤੁਰੰਤ ਭੁਗਤਾਨ ਪ੍ਰੋਸੈਸਿੰਗ ਅਤੇ ਸੂਚਨਾਵਾਂ',
            'modal_shift_management_title': 'ਸ਼ਿਫਟ ਪ੍ਰਬੰਧਨ',
            'modal_shift_management_desc': 'ਸਵੇਰ ਅਤੇ ਸ਼ਾਮ ਦੀ ਸ਼ਿਫਟ ਨੂੰ ਸੌਖਿਆਂ ਨਾਲ ਵੱਖ ਕਰਕੇ ਸੰਭਾਲੋ।',
            'modal_shift_management_feature1': 'ਸਵੇਰ ਅਤੇ ਸ਼ਾਮ ਦੀ ਦੁੱਧ ਸੰਗ੍ਰਹਿ ਲਈ ਵੱਖਰੀਆਂ ਐਂਟਰੀਆਂ',
            'modal_shift_management_feature2': 'ਟਰੈਕ ਕਰੋ ਕਿ ਦੁੱਧ ਕਿਸ ਸ਼ਿਫਟ ਵਿੱਚ ਡਿਲੀਵਰ ਕੀਤਾ ਗਿਆ',
            'modal_shift_management_feature3': 'ਸ਼ਿਫਟ-ਵਾਰ ਰਿਪੋਰਟਿੰਗ ਅਤੇ ਵਿਸ਼ਲੇਸ਼ਣ',
            'modal_shift_management_feature4': 'ਵੱਖਰੀਆਂ ਸ਼ਿਫਟਾਂ ਲਈ ਵੱਖਰੀਆਂ ਕੀਮਤਾਂ ਪ੍ਰਬੰਧਿਤ ਕਰੋ',
            'modal_shift_management_feature5': 'ਆਸਾਨ ਸ਼ਿਫਟ ਸਵਿਚਿੰਗ ਅਤੇ ਟਰੈਕਿੰਗ',
            'modal_reports_bills_title': 'ਰਿਪੋਰਟਾਂ ਅਤੇ ਬਿਲਸ',
            'modal_reports_bills_desc': 'ਕਿਸੇ ਵੀ ਮਿਤੀ ਰੇਂਜ, ਕਿਸਾਨ ਜਾਂ ਸ਼ਿਫਟ ਲਈ ਵਿਆਪਕ PDF/Excel ਰਿਪੋਰਟਾਂ ਅਤੇ ਬਿਲ ਤਿਆਰ ਕਰੋ।',
            'modal_reports_bills_feature1': 'ਕਿਸਾਨਾਂ ਲਈ PDF ਬਿਲ ਤਿਆਰ ਕਰੋ',
            'modal_reports_bills_feature2': 'ਕਿਸੇ ਵੀ ਮਿਤੀ ਰੇਂਜ ਲਈ ਰਿਪੋਰਟਾਂ ਬਣਾਓ (ਰੋਜ਼ਾਨਾ, ਹਫ਼ਤਾਵਾਰੀ, ਮਹੀਨਾਵਾਰੀ)',
            'modal_reports_bills_feature3': 'WhatsApp ਰਾਹੀਂ ਰਿਪੋਰਟਾਂ ਡਾਊਨਲੋਡ ਅਤੇ ਸਾਂਝੀਆਂ ਕਰੋ',
            'modal_reports_bills_feature4': 'ਕੁੱਲ ਇਕੱਠਾ ਕੀਤਾ ਦੁੱਧ, ਕੁੱਲ ਭੁਗਤਾਨ ਰਕਮ ਵੇਖੋ',
            'modal_reports_bills_feature5': 'ਅਨੁਕੂਲਨਯੋਗ ਰਿਪੋਰਟ ਟੈਂਪਲੇਟ ਅਤੇ ਫਾਰਮੈਟ',
            'modal_multi_language_title': 'ਬਹੁ-ਭਾਸ਼ਾ ਸਮਰਥਨ',
            'modal_multi_language_desc': 'ਕਈ ਖੇਤਰੀ ਭਾਸ਼ਾਵਾਂ ਦੇ ਸਮਰਥਨ ਨਾਲ ਆਪਣੀ ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ ਵਿੱਚ ਐਪ ਦੀ ਵਰਤੋਂ ਕਰੋ।',
            'modal_multi_language_feature1': 'ਅੰਗਰੇਜ਼ੀ',
            'modal_multi_language_feature2': 'ਹਿੰਦੀ (हिन्दी)',
            'modal_multi_language_feature3': 'ਪੰਜਾਬੀ (ਪੰਜਾਬੀ)',
            'modal_multi_language_feature4': 'ਕੰਨੜ (ಕನ್ನಡ)',
            'modal_multi_language_feature5': 'ਐਪ ਦੇ ਅੰਦਰ ਆਸਾਨ ਭਾਸ਼ਾ ਸਵਿਚਿੰਗ',
            'modal_data_backup_title': 'ਡੇਟਾ ਬੈਕਅਪ ਅਤੇ ਸੁਰੱਖਿਆ',
            'modal_data_backup_desc': 'ਆਟੋਮੈਟਿਕ ਬੈਕਅਪ ਅਤੇ ਰਿਕਵਰੀ ਵਿਕਲਪਾਂ ਨਾਲ ਸਾਰਾ ਡੇਟਾ ਸੁਰੱਖਿਅਤ ਢੰਗ ਨਾਲ ਕਲਾਉਡ ਵਿੱਚ ਸਟੋਰ ਕੀਤਾ ਗਿਆ ਹੈ।',
            'modal_data_backup_feature1': 'ਸਾਰਾ ਡੇਟਾ ਸੁਰੱਖਿਅਤ ਢੰਗ ਨਾਲ ਕਲਾਉਡ ਵਿੱਚ ਸਟੋਰ ਹੈ',
            'modal_data_backup_feature2': 'ਕਿਸੇ ਵੀ ਡਿਵਾਈਸ ਤੋਂ ਆਪਣਾ ਡੇਟਾ ਐਕਸੈਸ ਕਰੋ',
            'modal_data_backup_feature3': 'ਜੇ ਤੁਸੀਂ ਫੋਨ ਬਦਲਦੇ ਹੋ, ਤਾਂ ਤੁਹਾਡਾ ਡੇਟਾ ਅਜੇ ਵੀ ਉੱਥੇ ਹੈ',
            'modal_data_backup_feature4': 'ਪੇਪਰ ਰਿਕਾਰਡ ਗੁਆਉਣ ਦਾ ਕੋਈ ਡਰ ਨਹੀਂ',
            'modal_data_backup_feature5': 'ਆਟੋਮੈਟਿਕ ਬੈਕਅਪ ਅਤੇ ਰਿਕਵਰੀ ਵਿਕਲਪ',
            'benefits_ready_text': 'ਇਹ ਲਾਭਾਂ ਦਾ ਅਨੁਭਵ ਕਰਨ ਲਈ ਤਿਆਰ ਹੋ?',
            'whois_badge': 'ਡੇਅਰੀ ਵਿੱਚ ਸਾਰਿਆਂ ਲਈ',
            'whois_title': 'ਦੁਧੀਆ ਕਿਸ ਲਈ ਹੈ?',
            'whois_subtitle': 'ਆਪਣੀ ਭੂਮਿਕਾ ਚੁਣੋ ਅਤੇ ਜਾਣੋ ਕਿ ਦੁਧੀਆ ਤੁਹਾਡੇ ਲਈ ਡੇਅਰੀ ਪ੍ਰਬੰਧਨ ਨੂੰ ਕਿਵੇਂ ਸੌਖਾ ਬਣਾਉਂਦਾ ਹੈ',
            'whois_card1_role': 'ਮੈਨੇਜਰ ਭੂਮਿਕਾ',
            'whois_card1_title': 'ਸੰਗ੍ਰਹਿ ਕੇਂਦਰ',
            'whois_card1_desc': 'ਕੀ ਤੁਸੀਂ ਇੱਕ ਖਰੀਦਦਾਰ ਹੋ ਜੋ ਦੁੱਧ ਸੰਗ੍ਰਹਿ ਕੇਂਦਰ ਚਲਾਉਂਦੇ ਹੋ? ਸਾਡੇ ਸ਼ਕਤੀਸ਼ਾਲੀ Android ਐਪ ਜਾਂ ਵੈੱਬ ਐਪ ਨਾਲ 10 ਤੋਂ 1000+ ਕਿਸਾਨਾਂ ਦਾ ਪ੍ਰਬੰਧਨ ਕਰੋ। ਸੰਗ੍ਰਹਿ ਰਿਕਾਰਡ ਕਰੋ, ਦਰਾਂ ਆਟੋਮੈਟਿਕ ਗਣਨਾ ਕਰੋ, ਅਤੇ ਤੁਰੰਤ ਰਿਪੋਰਟਾਂ ਤਿਆਰ ਕਰੋ।',
            'whois_card1_feature1_title': 'ਸਪਲਾਇਰ ਜੋੜੋ ਅਤੇ ਪ੍ਰਬੰਧਿਤ ਕਰੋ',
            'whois_card1_feature1_desc': 'ਐਪ ਵਿੱਚ ਕਿਸਾਨ ਪ੍ਰੋਫਾਈਲ ਬਣਾਓ',
            'whois_card1_feature2_title': 'ਸੰਗ੍ਰਹਿ ਰਿਕਾਰਡ ਕਰੋ',
            'whois_card1_feature2_desc': 'ਆਟੋ FAT/SNF ਗਣਨਾ ਨਾਲ ਦੁੱਧ ਡੇਟਾ ਦਾਖਲ ਕਰੋ',
            'whois_card1_feature3_title': 'ਰਿਪੋਰਟਾਂ ਤਿਆਰ ਕਰੋ ਅਤੇ ਸਾਂਝੀਆਂ ਕਰੋ',
            'whois_card1_feature3_desc': 'WhatsApp ਰਾਹੀਂ PDF/Excel ਬਿਲ',
            'whois_card1_desc_short': 'ਸੰਗ੍ਰਹਿ ਪ੍ਰਬੰਧ ਕਰੋ, ਦਰਾਂ ਆਟੋਮੈਟਿਕ ਕਰੋ ਅਤੇ ਰਿਪੋਰਟ ਤਿਆਰ ਕਰੋ।',
            'whois_card1_feat_short1': 'ਸਪਲਾਇਰ ਜੋੜੋ',
            'whois_card1_feat_short2': 'ਰਿਪੋਰਟ ਬਣਾਓ',
            'whois_card2_role': 'ਦਰਸ਼ਕ ਭੂਮਿਕਾ',
            'whois_card2_title': 'ਡੇਅਰੀ ਕਿਸਾਨ',
            'whois_card2_desc': 'ਕੀ ਤੁਸੀਂ ਇੱਕ ਸਪਲਾਇਰ ਹੋ ਜੋ ਦੁੱਧ ਪਹੁੰਚਾਉਂਦੇ ਹੋ? ਆਪਣੇ ਮੋਬਾਈਲ ਐਪ ਦੀ ਵਰਤੋਂ ਕਰਕੇ ਆਪਣੀ ਰੋਜ਼ਾਨਾ ਡਿਲੀਵਰੀ, ਕਮਾਈ ਵੇਖੋ, ਅਤੇ ਆਪਣੇ ਸੰਗ੍ਰਹਿ ਕੇਂਦਰ ਦੁਆਰਾ ਸਾਂਝੀਆਂ ਕੀਤੀਆਂ ਰਿਪੋਰਟਾਂ ਤੱਕ ਪਹੁੰਚੋ - ਸਭ ਇੱਕ ਜਗ੍ਹਾ ਤੇ।',
            'whois_card2_feature1_title': 'ਜੁੜੀਆਂ ਡੇਅਰੀਆਂ ਵੇਖੋ',
            'whois_card2_feature1_desc': 'ਐਪ ਵਿੱਚ ਸਾਰੇ ਸੰਗ੍ਰਹਿ ਕੇਂਦਰ ਵੇਖੋ',
            'whois_card2_feature2_title': 'ਆਪਣੇ ਸੰਗ੍ਰਹਿ ਵੇਖੋ',
            'whois_card2_feature2_desc': 'ਰੋਜ਼ਾਨਾ ਲਾਗ ਅਤੇ ਦੁੱਧ ਦਰਾਂ ਚੈੱਕ ਕਰੋ',
            'whois_card2_feature3_title': 'ਆਪਣੀ ਕਮਾਈ ਟਰੈਕ ਕਰੋ',
            'whois_card2_feature3_desc': 'ਵਾਲੇਟ ਅਤੇ ਰਿਪੋਰਟਾਂ ਰੀਅਲ-ਟਾਈਮ ਵਿੱਚ ਵੇਖੋ',
            'whois_card2_desc_short': 'ਡਿਲਿਵਰੀਆਂ ਅਤੇ ਵੈਲਟ ਬੈਲੈਂਸ ਇਕੱਠੇ ਵੇਖੋ।',
            'whois_card2_feat_short1': 'ਕਲੈਕਸ਼ਨ ਦੇਖੋ',
            'whois_card2_feat_short2': 'ਕਮਾਈ ਟਰੈਕ ਕਰੋ',
            'whois_card3_role': 'ਐਂਟਰਪ੍ਰਾਈਜ਼ ਭੂਮਿਕਾ',
            'whois_card3_title': 'ਸਹਿਕਾਰੀ ਸਮਿਤੀਆਂ ਅਤੇ ਸੁਸਾਇਟੀਆਂ',
            'whois_card3_desc': 'ਕਈ ਸੰਗ੍ਰਹਿ ਕੇਂਦਰਾਂ ਦਾ ਪ੍ਰਬੰਧਨ ਕਰ ਰਹੇ ਹੋ? ਸਾਡਾ ਵੈੱਬ ਐਪ ਤੁਹਾਨੂੰ ਇੱਕ ਕੇਂਦਰੀਕ੍ਰਿਤ ਡੈਸ਼ਬੋਰਡ ਦਿੰਦਾ ਹੈ ਜਿਸ ਨਾਲ ਤੁਸੀਂ ਸਾਰੇ ਟਿਕਾਣਿਆਂ ਦੀ ਨਿਗਰਾਨੀ ਕਰ ਸਕਦੇ ਹੋ, ਸੰਕਲਿਤ ਵਿਸ਼ਲੇਸ਼ਣ ਵੇਖ ਸਕਦੇ ਹੋ, ਅਤੇ ਪਹੁੰਚ ਪ੍ਰਬੰਧਿਤ ਕਰ ਸਕਦੇ ਹੋ।',
            'whois_card3_feature1_title': 'ਮਲਟੀ-ਸੈਂਟਰ ਡੈਸ਼ਬੋਰਡ',
            'whois_card3_feature1_desc': 'ਵੈੱਬ ਐਪ ਰਾਹੀਂ ਸਾਰੇ ਕੇਂਦਰਾਂ ਦੀ ਨਿਗਰਾਨੀ ਕਰੋ',
            'whois_card3_feature2_title': 'ਸੰਕਲਿਤ ਰਿਪੋਰਟਾਂ',
            'whois_card3_feature2_desc': 'ਸਾਰੇ ਕੇਂਦਰਾਂ ਵਿੱਚ ਸੰਯੁਕਤ ਵਿਸ਼ਲੇਸ਼ਣ',
            'whois_card3_feature3_title': 'ਭੂਮਿਕਾ-ਅਧਾਰਤ ਪਹੁੰਚ',
            'whois_card3_feature3_desc': 'ਪ੍ਰਤੀ ਕੇਂਦਰ ਮੈਨੇਜਰ ਨਿਯੁਕਤ ਕਰੋ',
            'whois_card3_desc_short': 'ਕੇਂਦਰੀ ਡੈਸ਼ਬੋਰਡ ਨਾਲ ਬਹੁਤ ਸਾਰੇ ਕੇਂਦਰ ਨਿਗਰਾਨੀ ਕਰੋ।',
            'whois_card3_feat_short1': 'ਸੰਯੁਕਤ ਰਿਪੋਰਟਾਂ',
            'whois_card3_feat_short2': 'ਰੋਲ ਪਹੁੰਚ',
            'whois_buyer_note': 'ਖਰੀਦਦਾਰ ਐਪ/ਵੈੱਬ ਰਾਹੀਂ ਪ੍ਰਬੰਧਿਤ ਕਰਦੇ ਹਨ',
            'whois_supplier_note': 'ਸਪਲਾਇਰ ਮੋਬਾਈਲ ਐਪ ਰਾਹੀਂ ਵੇਖਦੇ ਹਨ',
            'whois_cta_title': 'ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਤਿਆਰ ਹੋ?',
            'whois_cta_desc': 'ਚੱਲਦੇ-ਫਿਰਦੇ ਵਰਤੋਂ ਲਈ ਦੁਧੀਆ Android ਐਪ ਡਾਊਨਲੋਡ ਕਰੋ ਜਾਂ ਕਿਸੇ ਵੀ ਡਿਵਾਈਸ ਤੋਂ ਵੱਡੀ ਸਕ੍ਰੀਨ ਵਾਲੇ ਵੈੱਬ ਐਪ ਦੀ ਵਰਤੋਂ ਕਰੋ।',
            'faq_title': 'ਅਕਸਰ ਪੁੱਛੇ ਜਾਂਦੇ ਸਵਾਲ',
            'faq_a1_p1': 'ਸਰਬਰਾਜੁਦਾਰਾਂ (ਕਿਸਾਨਾਂ) ਲਈ: ਪੂਰੀ ਤਰ੍ਹਾਂ ਮੁਫਤ। ਸਰਬਰਾਜੁਦਾਰ ਬਿਨਾਂ ਕਿਸੇ ਕੀਮਤ ਦੇ ਆਪਣੇ ਦੁੱਧ ਦੀ ਸਪਲਾਈ, ਕਮਾਈ ਦੇਖ ਸਕਦੇ ਹਨ ਅਤੇ ਆਪਣੀ ਪ੍ਰੋਫਾਈਲ ਪ੍ਰਬੰਧਿਤ ਕਰ ਸਕਦੇ ਹਨ।',
            'faq_a1_p2': 'ਖਰੀਦਦਾਰਾਂ (ਸੰਗ੍ਰਹਿ ਕੇਂਦਰਾਂ) ਲਈ: ਪਹਿਲਾ ਮਹੀਨਾ ਮੁਫਤ। ਟ੍ਰਾਇਲ ਤੋਂ ਬਾਅਦ, ਤੁਹਾਡੀ ਸੰਗ੍ਰਹਿ ਮਾਤਰਾ ਅਤੇ ਵਾਲੇਟ ਫੀਚਰਾਂ ਦੇ ਅਧਾਰ ਤੇ ਸਬਸਕ੍ਰਿਪਸ਼ਨ ਪਲਾਨ ਉਪਲਬਧ ਹਨ।',
            'faq_a2': 'ਹਾਂ, ਤੁਹਾਡਾ ਡੇਟਾ ਆਟੋਮੈਟਿਕ ਬੈਕਅਪ ਨਾਲ ਕਲਾਉਡ ਵਿੱਚ ਸੁਰੱਖਿਅਤ ਢੰਗ ਨਾਲ ਸਟੋਰ ਹੈ। ਭਾਵੇਂ ਤੁਸੀਂ ਆਪਣਾ ਫੋਨ ਗੁਆਚ ਦਿੱਤੋ ਜਾਂ ਡਿਵਾਈਸ ਬਦਲੀਓ, ਤੁਹਾਡਾ ਡੇਟਾ ਸੁਰੱਖਿਅਤ ਰਹਿੰਦਾ ਹੈ ਅਤੇ ਜਦੋਂ ਤੁਸੀਂ ਲਾਗਇਨ ਕਰਦੇ ਹੋ ਤਾਂ ਤੁਰੰਤ ਪਹੁੰਚਿਆ ਜਾ ਸਕਦਾ ਹੈ।',
            'faq_a4': 'ਤੁਸੀਂ ਆਸਾਨੀ ਨਾਲ ਐਪ ਸੈਟਿੰਗਾਂ ਤੋਂ ਰੋਲਾਂ ਬਦਲ ਸਕਦੇ ਹੋ। ਆਪਣੀ ਪ੍ਰੋਫਾਈਲ ਤੇ ਟੈਪ ਕਰੋ, "ਰੋਲ ਬਦਲੋ" ਚੁਣੋ, ਅਤੇ ਖਰੀਦਦਾਰ (ਸੰਗ੍ਰਹਿ ਕੇਂਦਰ) ਜਾਂ ਸਰਬਰਾਜੁਦਾਰ (ਕਿਸਾਨ) ਮੋਡ ਦੇ ਵਿਚਕਾਰ ਚੁਣੋ। ਹਰੇਕ ਰੋਲ ਦਾ ਆਪਣਾ ਡੈਸ਼ਬੋਰਡ ਅਤੇ ਫੀਚਰ ਹਨ।',
            'faq_a5': 'ਦੁਧੀਆ ਤੁਹਾਨੂੰ ਵਿਆਪਕ ਰਿਪੋਰਟਾਂ ਬਣਾਉਣ ਲਈ ਮਦਦ ਕਰਦਾ ਹੈ: ਸੰਗ੍ਰਹਿ ਰਿਪੋਰਟਾਂ (ਰੋਜ਼ਾਨਾ, ਹਫ਼ਤਾਵਾਰੀ, ਮਹੀਨਾਵਾਰੀ), ਕਿਸਾਨ ਵਾਲੇਟ ਸਟੇਟਮੈਂਟ, ਭੁਗਤਾਨ ਸਾਰ, ਅਤੇ ਸ਼ਿਫਟ-ਵਾਰ ਰਿਪੋਰਟਾਂ। ਸਾਰੀਆਂ ਰਿਪੋਰਟਾਂ PDF ਜਾਂ Excel ਦੇ ਰੂਪ ਵਿੱਚ ਐਕਸਪੋਰਟ ਕੀਤੀਆਂ ਜਾ ਸਕਦੀਆਂ ਹਨ ਅਤੇ WhatsApp ਰਾਹੀਂ ਤੁਰੰਤ ਸਾਂਝੀਆਂ ਜਾ ਸਕਦੀਆਂ ਹਨ।',
            'free_trial_text': 'ਐਪ ਡਾਊਨਲੋਡ ਕਰੋ ਅਤੇ ਅੱਜ ਹੀ ਆਪਣਾ ਮੁਫਤ ਟ੍ਰਾਇਲ ਸ਼ੁਰੂ ਕਰੋ — ਕੋਈ ਕ੍ਰੈਡਿਟ ਕਾਰਡ ਲੋੜੀਂਦੀ ਨਹੀਂ!',
            'android_version': 'Android 5.0+',
            'modal_close': 'ਬੰਦ ਕਰੋ',
            'modal_key_features': 'ਮੁੱਖ ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ',
            'modal_try_feature': 'ਇਹ ਫੀਚਰ ਨੂੰ ਆਜ਼ਮਾਓ',
            'benefits_rating': '4.9/5 ਰੇਟਿੰਗ',
            'benefits_subtitle': 'ਦੁਧੀਆ ਨੂੰ ਕਿਉਂ ਚੁਣੀਏ?',
            'benefits_title': 'ਕੁਸ਼ਲਤਾ ਮਿਲਦੀ ਹੈ ਸਟੀਕ ਖੇਤੀ ਨਾਲ',
            'benefit1_title': 'ਰੋਜ਼ਾਨਾ ਘੰਟੇ ਬਚਾਓ',
            'benefit1_desc': 'ਆਟੋਮੈਟਿਡ ਕੈਲਕੂਲੇਸ਼ਨ ਮੈਨੂਅਲ ਕੰਮ ਖਤਮ ਕਰਦੀ ਹੈ ਅਤੇ 99% ਗਲਤੀਆਂ ਘਟਾਉਂਦੀ ਹੈ।',
            'benefit2_title': 'ਭਰੋਸਾ ਬਣਾਓ',
            'benefit2_desc': 'ਪਾਰਦਰਸ਼ੀ ਡਿਜੀਟਲ ਰਿਕਾਰਡ ਤੁਹਾਡੇ ਕਿਸਾਨਾਂ ਨਾਲ ਭਰੋਸਾ ਪੈਦਾ ਕਰਦੇ ਹਨ।',
            'benefit3_title': 'ਆਪਣਾ ਕਾਰੋਬਾਰ ਵਧਾਓ',
            'benefit3_desc': 'ਉਸੇ ਟੀਮ ਦੇ ਆਕਾਰ ਨਾਲ 10x ਵੱਧ ਕਿਸਾਨਾਂ ਦਾ ਪ੍ਰਬੰਧਨ ਕਰੋ।',
            'download_badge': 'ਹੁਣ v2.0 ਲਾਈਵ ਹੈ',
            'download_title': 'ਆਪਣੇ ਡੇਅਰੀ ਓਪਰੇਸ਼ਨਾਂ ਵਿੱਚ ਇਨਕਲਾਬ ਲਿਆਓ',
            'download_subtitle': '10,000+ ਡੇਅਰੀ ਪੇਸ਼ੇਵਰਾਂ ਨਾਲ ਜੁੜੋ ਜੋ ਦੁਧੀਆ ਨਾਲ ਆਪਣਾ ਕਾਰੋਬਾਰ ਬਦਲ ਰਹੇ ਹਨ',
            'scan_to_download': 'ਡਾਊਨਲੋਡ ਕਰਨ ਲਈ ਸਕੈਨ ਕਰੋ',
            'download_for': 'ਇਸ ਲਈ ਡਾਊਨਲੋਡ ਕਰੋ',
            'download_android': 'ਐਂਡਰਾਇਡ',
            'version_info': 'ਐਂਡਰਾਇਡ 5.0 ਅਤੇ ਇਸ ਤੋਂ ਉੱਪਰ ਦੇ ਨਾਲ ਅਨੁਕੂਲ',
            'version_number': 'ਵਰਜਨ: 1.0.0',
            'version_size': 'ਸਾਈਜ਼: 75MB',
            'testimonials_title': 'ਡੇਅਰੀ ਕਮਿਊਨਟੀਆਂ ਦੁਆਰਾ ਭਰੋਸੇਮੰਦ',
            'testimonials_subtitle': 'ਵੇਖੋ ਕਿ ਦੁਧੀਆ ਸੰਗ੍ਰਹਿ ਕੇਂਦਰ ਮਾਲਕਾਂ ਅਤੇ ਕਿਸਾਨਾਂ ਦੀ ਜ਼ਿੰਦਗੀ ਵਿੱਚ ਕਿਵੇਂ ਅਸਲੀ ਫਰਕ ਲਿਆ ਰਿਹਾ ਹੈ।',
            'testimonial1_text': 'ਬਹੁ-ਭਾਸ਼ਾਈ ਸਮਰਥਨ ਇੱਕ ਜੀਵਨ-ਰੱਖਕ ਹੈ। ਸਾਡੇ ਕਿਸਾਨ ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਆਪਣਾ ਡੇਟਾ ਵੇਖਕੇ ਬਹੁਤ ਜ਼ਿਆਦਾ ਆਤਮਵਿਸ਼ਵਾਸ ਮਹਿਸੂਸ ਕਰਦੇ ਹਨ।',
            'testimonial1_name': 'ਆਨੰਦ ਦੇਸ਼ਮੁੱਖ',
            'testimonial1_title': 'ਖੇਤਰੀ ਸੰਗ੍ਰਹਿ ਮੁਖੀ',
            'testimonial2_text': '500+ ਗਾਹਕਾਂ ਦਾ ਪ੍ਰਬੰਧਨ ਦੁਧੀਆ ਤੋਂ ਪਹਿਲਾਂ ਇੱਕ ਬੁਰਾ ਸੁਪਨਾ ਸੀ। ਹੁਣ ਸਭ ਕੁਝ ਆਟੋਮੈਟਿਡ ਅਤੇ ਪਾਰਦਰਸ਼ੀ ਹੈ।',
            'testimonial2_name': 'ਮੀਰਾ ਪਟੇਲ',
            'testimonial2_title': 'ਡੇਅਰੀ ਉਦਮੀ',
            'testimonial3_text': 'ਵਾਲੇਟ ਸਿਸਟਮ ਅਵਿਸ਼ਵਾਸਨੀਯ ਹੈ। ਕਿਸਾਨ ਆਪਣੀ ਕਮਾਈ ਲਾਈਵ ਟਰੈਕ ਕਰ ਸਕਦੇ ਹਨ, ਜਿਸ ਨੇ ਸਾਡੇ ਕੇਂਦਰ ਵਿੱਚ ਬਹੁਤ ਭਰੋਸਾ ਬਣਾਇਆ ਹੈ।',
            'testimonial3_name': 'ਸੁਰੇਸ਼ ਜੀ',
            'testimonial3_title': 'ਕਿਸਾਨ ਯੂਨੀਅਨ ਪ੍ਰਤੀਨਿਧੀ',
            'testimonial3_org': 'ਸ਼੍ਰੀ ਕ੍ਰਿਸ਼ਨਾ ਡੇਅਰੀ • ਮੱਧ ਪ੍ਰਦੇਸ਼',
            'testimonial4_text': 'ਮੈਂ ਭੁਗਤਾਨਾਂ ਦੀ ਲੇਖਾ-ਜੋਖਾ ਕਰਨ ਵਿੱਚ ਘੰਟੇ ਲਾਂਦਾ ਸੀ। ਹੁਣ ਦੁਧੀਆ ਇਹ ਵਿੱਚ ਪੂਰੀ ਸਟਿਕਤਾ ਨਾਲ ਆਟੋਮੈਟਿਕ ਕਰਦਾ ਹੈ।',
            'testimonial4_name': 'ਰਾਜੇਸ਼ ਸ਼ਰਮਾ',
            'testimonial4_title': 'ਸੰਗ੍ਰਹਿ ਕੇਂਦਰ ਮਾਲਿਕ',
            'testimonial4_org': 'ਬਾਲਾਜੀ ਡੇਅਰੀ • ਰਾਜਸਥਾਨ',
            'testimonial5_text': "ਦੁਧੀਆ ਦੀਆਂ ਸਹਿਕਾਰੀ ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ ਨੇ ਸਾਡੇ ਕਈ ਕੇਂਦਰਾਂ ਵਿੱਚ ਓਪਰੇਸ਼ਨ ਨੂੰ ਸਧਾਰਿਆ ਹੈ। ਸਾਂਝਾ ਡੇਟਾ ਇੱਕ ਗੇਮ-ਚੇਂਜਰ ਹੈ।",
            'testimonial5_name': 'ਪ੍ਰਿਆ',
            'testimonial5_title': 'ਸਹਿਕਾਰੀ ਪ੍ਰਬੰਧਕ',
            'testimonial5_org': 'ਕਾਰਨਾਟਕ ਡੇਅਰੀ ਕੋਆਪਰੇਟਿਵ • ਕਾਰਨਾਟਕ',
            'testimonial6_text': 'ਵਿਸ਼ਲੇਸ਼ਣ ਨੇ ਮੇਰੇ ਰੋਜ਼ਾਨਾ ਸੰਗ੍ਰਹਿ ਨੂੰ 40% ਵੱਧ ਕਰਨ ਵਿੱਚ ਮਦਦ ਕੀਤੀ। ਸਾਡੇ ਸਾਰੇ ਟੀਮ ਲਈ ਵਰਤਣ ਵਿੱਚ ਬਹੁਤ ਆਸਾਨ।',
            'testimonial6_name': 'ਵਿਕਰਮ ਸਿੰਘ',
            'testimonial6_title': 'ਡੇਅਰੀ ਕਾਰੋਬਾਰ ਮਾਲਿਕ',
            'testimonial6_org': 'ਪੰਜਾਬ ਮਿਲਕ ਯੂਨੀਅਨ • ਪੰਜਾਬ',
            'contact_title': 'ਸੰਪਰਕ ਕਰੋ',
            'contact_subtitle': 'ਦੁਧੀਆ ਨਾਲ ਆਪਣੀ ਡੇਅਰੀ ਸੈਟ ਅਪ ਕਰਨ ਬਾਰੇ ਸਵਾਲ ਹਨ? ਸਾਡੀ ਮਾਹਰਾਂ ਦੀ ਟੀਮ ਤਬਦੀਲੀ ਦੇ ਹਰ ਕਦਮ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਲਈ ਤਿਆਰ ਹੈ।',
            'contact_phone_label': 'ਸਾਡੇ ਨੂੰ ਕਾਲ ਕਰੋ',
            'contact_email_label': 'ਈਮੇਲ ਸਪੋਰਟ',
            'contact_address_label': 'ਦਫਤਰ ਵੇਖੋ',
            'contact_form_name_label': 'ਤੁਹਾਡਾ ਨਾਮ',
            'contact_form_name_placeholder': 'ਰਾਜੇਸ਼ ਕੁਮਾਰ',
            'contact_form_email_label': 'ਈਮੇਲ ਪਤਾ',
            'contact_form_email_placeholder': 'rajesh@example.com',
            'contact_form_dairy_label': 'ਡੇਅਰੀ ਦਾ ਨਾਮ',
            'contact_form_dairy_placeholder': 'ਸੂਰਜਮੁਖੀ ਡੇਅਰੀ',
            'contact_form_message_label': 'ਸੰਦੇਸ਼',
            'contact_form_message_placeholder': 'ਅਸੀਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੇ ਹਾਂ?',
            'contact_form_submit': 'ਸੰਦੇਸ਼ ਭੇਜੋ',
            'footer_description': 'ਅਗਲੀ ਪੀੜ੍ਹੀ ਦੇ ਡੇਅਰੀ ਕਿਸਾਨਾਂ ਲਈ ਬਣਾਇਆ ਗਿਆ ਦੁਨੀਆ ਦਾ ਸਭ ਤੋਂ ਉੱਨਤ ਸਮਾਰਟ ਡੇਅਰੀ ਪ੍ਰਬੰਧਨ ਇਕੋਸਿਸਟਮ।',
            'footer_quicklinks_title': 'ਤੇਜ਼ ਲਿੰਕ',
            'footer_link_features': 'ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ',
            'footer_link_benefits': 'ਲਾਭ',
            'footer_link_download': 'ਡਾਊਨਲੋਡ',
            'footer_link_contact': 'ਸੰਪਰਕ',
            'footer_link_pricing': 'ਕੀਮਤ',
            'footer_link_supplier': 'ਸਪਲਾਇਰ',
            'footer_link_buyer': 'ਖਰੀਦਦਾਰ',
            'footer_explore_title': 'ਕਾਰਜ ਪ੍ਰਵਾਹ',
            'footer_company_title': 'ਕੰਪਨੀ',
            'footer_link_about': 'ਸਾਡੇ ਬਾਰੇ',
            'footer_link_faq': 'ਅਕਸਰ ਪੁੱਛੇ ਜਾਂਦੇ ਸਵਾਲ',
            'footer_link_terms': 'ਸੇਵਾ ਦੀਆਂ ਸ਼ਰਤਾਂ',
            'footer_link_privacy': 'ਪ੍ਰਾਈਵੇਸੀ ਪਾਲਿਸੀ',
            'footer_newsletter_title': 'ਨਿਊਜ਼ਲੈਟਰ',
            'footer_newsletter_desc': 'ਤਾਜ਼ਾ ਡੇਅਰੀ ਇੰਡਸਟਰੀ ਅਪਡੇਟਸ ਆਪਣੇ ਇਨਬਾਕਸ ਵਿੱਚ ਪ੍ਰਾਪਤ ਕਰੋ।',
            'footer_newsletter_placeholder': 'ਈਮੇਲ',
            'footer_powered': 'ਦੁਆਰਾ ਸੰਚਾਲਿਤ',
            'footer_copyright': '© 2026 ਦੁਧੀਆ (Milk Collection Management System)। ਸਾਰੇ ਹੱਕ ਰਾਖਵੇਂ ਹਨ।',
            'footer_bottom_terms': 'ਸ਼ਰਤਾਂ',
            'footer_bottom_refund': 'ਰਿਫੰਡ',
            'footer_bottom_terms_of_use': 'ਵਰਤੋਂ ਦੀਆਂ ਸ਼ਰਤਾਂ',
            'footer_bottom_privacy': 'ਪ੍ਰਾਈਵੇਸੀ',
            'whois_title': 'ਦੁਧੀਆ ਕਿਸ ਲਈ ਹੈ?',
            'whois_subtitle': 'ਖਾਸ ਤੌਰ ਤੇ ਭਾਰਤੀ ਡੇਅਰੀ ਇਕੋਸਿਸਟਮ ਲਈ ਬਣਾਇਆ ਗਿਆ',
            'whois_card1_title': 'ਸੰਗ੍ਰਹਿ ਕੇਂਦਰ',
            'whois_card1_desc': 'ਰੋਜ਼ਾਨਾ ਸਵੇਰ ਅਤੇ ਸ਼ਾਮ ਦੀ ਸ਼ਿਫਟ ਨਾਲ 10 ਤੋਂ 1000+ ਕਿਸਾਨਾਂ ਦਾ ਪ੍ਰਬੰਧਨ ਕਰਨ ਵਾਲੇ ਦੁੱਧ ਸੰਗ੍ਰਹਿ ਕੇਂਦਰਾਂ ਲਈ ਬਿਲਕੁਲ ਸਹੀ।',
            'whois_card1_point1': 'ਰੋਜ਼ਾਨਾ ਸੰਗ੍ਰਹਿ ਐਂਟਰੀ',
            'whois_card1_point2': 'ਆਟੋਮੈਟਿਕ ਰੇਟ ਕੈਲਕੂਲੇਸ਼ਨ',
            'whois_card1_point3': 'ਕਿਸਾਨ-ਵਾਰ ਰਿਪੋਰਟਾਂ',
            'whois_card2_title': 'ਡੇਅਰੀ ਕਿਸਾਨ',
            'whois_card2_desc': 'ਉਨ੍ਹਾਂ ਵਿਅਕਤੀਗਤ ਕਿਸਾਨਾਂ ਅਤੇ ਸਹਿਕਾਰੀ ਸਮਾਜਾਂ ਲਈ ਆਦਰਸ਼ ਜੋ ਸੰਗ੍ਰਹਿ ਕੇਂਦਰਾਂ ਨੂੰ ਦੁੱਧ ਸਪਲਾਈ ਕਰਦੇ ਹਨ।',
            'whois_card2_point1': 'ਆਪਣੇ ਸਾਰੇ ਸੰਗ੍ਰਹਿ ਵੇਖੋ',
            'whois_card2_point2': 'ਵਾਲੇਟ ਬਕਾਇਆ ਲਾਈਵ ਟਰੈਕ ਕਰੋ',
            'whois_card2_point3': 'ਭੁਗਤਾਨ ਇਤਿਹਾਸ ਵੇਖੋ',
            'whois_card3_title': 'ਡੇਅਰੀ ਸਹਿਕਾਰੀ ਸਮਾਜ',
            'whois_card3_desc': 'ਕਈ ਕੇਂਦਰਾਂ ਦਾ ਪ੍ਰਬੰਧਨ ਕਰਨ ਵਾਲੇ ਵੱਡੇ ਪੱਧਰ ਦੇ ਡੇਅਰੀ ਯੂਨੀਅਨਾਂ ਅਤੇ ਸਹਿਕਾਰੀ ਸਮਾਜਾਂ ਲਈ ਡਿਜ਼ਾਇਨ ਕੀਤਾ ਗਿਆ।',
            'whois_card3_point1': 'ਮਲਟੀ-ਸੈਂਟਰ ਡੈਸ਼ਬੋਰਡ',
            'whois_card3_point2': 'ਇਕੱਠਾ ਵਿਸ਼ਲੇਸ਼ਣ',
            'whois_card3_point3': 'ਭੂਮਿਕਾ-ਅਧਾਰਿਤ ਐਕਸੈਸ',
            'faq_title': 'ਅਕਸਰ ਪੁੱਛੇ ਜਾਂਦੇ ਸਵਾਲ',
            'faq_subtitle': 'ਦੁਧੀਆ ਬਾਰੇ ਤੁਹਾਨੂੰ ਜੋ ਕੁਝ ਵੀ ਜਾਣਨ ਦੀ ਲੋੜ ਹੈ',
            'faq_q1': 'ਦੁਧੀਆ ਦੀ ਕੀਮਤ ਕੀ ਹੈ?',
            'faq_q2': 'ਕੀ ਮੇਰਾ ਡੇਟਾ ਸੁਰੱਖਿਅਤ ਅਤੇ ਬੈਕਅਪ ਹੈ?',
            'faq_q4': 'ਮੈਂ ਖਰੀਦਦਾਰ ਅਤੇ ਸਪਲਾਇਰ ਭੂਮਿਕਾਵਾਂ ਵਿਚਕਾਰ ਕਿਵੇਂ ਸਵਿੱਚ ਕਰਾਂ?',
            'faq_q5': 'ਮੈਂ ਕਿਸ ਤਰ੍ਹਾਂ ਦੀਆਂ ਰਿਪੋਰਟਾਂ ਤਿਆਰ ਕਰ ਸਕਦਾ ਹਾਂ?',
            'section_features': 'ਮੁੱਖ ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ',
            'section_benefits': 'ਦੁਧੀਆ ਨੂੰ ਕਿਉਂ ਚੁਣੀਏ?',
            'section_download': 'ਐਪ ਡਾਊਨਲੋਡ ਕਰੋ',
            'section_testimonials': 'ਸਾਡੇ ਉਪਭੋਗਤਾ ਕੀ ਕਹਿੰਦੇ ਹਨ',
            'section_contact': 'ਸੰਪਰਕ ਕਰੋ',
            'footer_tagline': 'ਸਮਾਰਟ ਡੇਅਰੀ ਪ੍ਰਬੰਧਨ ਹੱਲ',
            'footer_quicklinks': 'ਤੇਜ਼ ਲਿੰਕ',
            'footer_connect': 'ਸਾਡੇ ਨਾਲ ਜੁੜੋ',
            'still_have_questions': 'ਹਾਲੇ ਵੀ ਸਵਾਲ ਹਨ?',
            'ask_anything_text': 'ਜਵਾਬ ਨਹੀਂ ਮਿਲ ਰਿਹਾ? ਸਾਡੀ ਟੀਮ ਤੁਹਾਡੀ ਮਦਦ ਲਈ ਤਿਆਰ ਹੈ!',
            'ask_on_whatsapp': 'WhatsApp ਤੇ ਪੁੱਛੋ',
            'call_us': 'ਸਾਨੂੰ ਕਾਲ ਕਰੋ',
            'quick_response_text': 'ਤੁਰੰਤ ਸਹਾਇਤਾ! ਅਸੀਂ ਮਿੰਟਾਂ ਵਿੱਚ ਜਵਾਬ ਦਿੰਦੇ ਹਾਂ, ਘੰਟਿਆਂ ਵਿੱਚ ਨਹੀਂ',
            'hire_personnel_tag': 'ਪੇਸ਼ੇਵਰ ਸੇਵਾ',
            'hire_personnel_title': 'ਕੀ ਤੁਸੀਂ ਖੁਦ ਇਕੱਠਾ ਕਰਨਾ ਨਹੀਂ ਚਾਹੁੰਦੇ?',
            'hire_personnel_subtitle': 'ਆਪਣੇ ਦੁੱਧ ਦੇ ਇਕੱਠਾ ਨੂੰ ਕੁਸ਼ਲਤਾ ਨਾਲ ਸੰਭਾਲਣ ਲਈ ਇੱਕ ਸਿਖਲਾਈ ਪ੍ਰਾਪਤ ਓਪਰੇਟਰ ਜਾਂ ਵਿਅਕਤੀ ਕਿਰਾਏ ਤੇ ਲਵੋ',
            'hire_personnel_card1_title': 'ਇਕੱਠਾ ਲਈ ਵਿਅਕਤੀ ਕਿਰਾਏ ਤੇ ਲਵੋ',
            'hire_personnel_card1_desc': 'ਭਰੋਸੇਯੋਗ ਇਕੱਠਾ ਕਰਮਚਾਰੀ ਪ੍ਰਾਪਤ ਕਰੋ ਜੋ ਦੁਧੀਆ ਐਪ ਦੀ ਵਰਤੋਂ ਕਰਨ ਲਈ ਸਿਖਲਾਈ ਪ੍ਰਾਪਤ ਹਨ ਅਤੇ ਤੁਹਾਡੇ ਰੋਜ਼ਾਨਾ ਦੁੱਧ ਇਕੱਠਾ ਨੂੰ ਕੁਸ਼ਲਤਾ ਨਾਲ ਪ੍ਰਬੰਧਿਤ ਕਰਦੇ ਹਨ।',
            'hire_personnel_card2_title': 'ਲਾਗਤ ਅਨੁਮਾਨ',
            'hire_personnel_card2_desc': 'ਕੀਮਤ ਆਮ ਤੌਰ ਤੇ ₹500 ਤੋਂ ₹3,000-₹4,000 ਪ੍ਰਤੀ ਮਹੀਨਾ ਤੱਕ ਹੁੰਦੀ ਹੈ, ਇਹ ਔਸਤ ਰੋਜ਼ਾਨਾ ਇਕੱਠਾ ਦੀ ਗਿਣਤੀ ਅਤੇ ਲੋੜੀਂਦੇ ਕੰਮ ਦੀ ਮਾਤਰਾ ਦੇ ਅਧਾਰ ਤੇ ਵੱਖਰੀ ਹੁੰਦੀ ਹੈ।',
            'hire_personnel_card3_title': 'ਦੁਧੀਆ ਸਹਾਇਤਾ ਨਾਲ ਸੰਪਰਕ ਕਰੋ',
            'hire_personnel_card3_desc': 'ਇੱਕ ਅਨੁਕੂਲਿਤ ਹਵਾਲਾ ਪ੍ਰਾਪਤ ਕਰਨ ਅਤੇ ਆਪਣੇ ਖੇਤਰ ਵਿੱਚ ਭਰੋਸੇਯੋਗ ਇਕੱਠਾ ਕਰਮਚਾਰੀਆਂ ਨਾਲ ਜੁੜਨ ਲਈ ਸਾਡੇ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।',
            'hire_personnel_call': 'ਕਾਲ',
            'hire_personnel_whatsapp': 'ਵ੍ਹਾਟਸਐਪ ਨੈੱਟਪੀ',
            'hire_personnel_cta_title': 'ਅਸੀਂ ਤੁਹਾਨੂੰ ਸਹੀ ਵਿਅਕਤੀ ਲੱਭਣ ਵਿੱਚ ਮਦਦ ਕਰਾਂਗੇ',
            'hire_personnel_cta_desc': 'ਅਸੀਂ ਤੁਹਾਨੂੰ ਆਪਣੇ ਸਥਾਨਕ ਖੇਤਰ ਵਿੱਚ ਸਿਖਲਾਈ ਪ੍ਰਾਪਤ, ਭਰੋਸੇਯੋਗ ਇਕੱਠਾ ਕਰਮਚਾਰੀਆਂ ਨਾਲ ਜੋੜਦੇ ਹਾਂ ਜੋ ਪਹਿਲਾਂ ਹੀ ਦੁਧੀਆ ਐਪ ਨਾਲ ਜਾਣੂ ਹਨ।',
            'hire_personnel_cta_button': 'ਅੱਜ ਹੀ ਸ਼ੁਰੂ ਕਰੋ',
            'plan_sub_card_title': 'ਸਬਸਕ੍ਰਿਪਸ਼ਨ ਪਲਾਨ',
            'plan_sub_card_subtitle': 'ਤੁਹਾਡੀ ਡੇਅਰੀ ਲਈ ਮਾਸਿਕ ਅਤੇ ਸਾਲਾਨਾ ਸਬਸਕ੍ਰਿਪਸ਼ਨ ਵਿਕਲਪ',
            'plan_sub_feat1': 'ਮਾਸਿਕ ਅਤੇ ਸਾਲਾਨਾ ਫਲੈਟ ਦਰਾਂ',
            'plan_sub_feat2': 'ਅਸੀਮਤ ਕਲੈਕਸ਼ਨ ਅਤੇ ਸਪਲਾਇਰ',
            'plan_sub_feat3': 'ਸਮਰਪਿਤ ਸਹਾਇਤਾ ਅਤੇ PDF ਰਿਪੋਰਟਾਂ',
            'btn_know_more': 'ਹੋਰ ਜਾਣੋ',
            'modal_sub_heading': 'ਸਬਸਕ੍ਰਿਪਸ਼ਨ ਪਲਾਨ',
            'modal_sub_subheading': 'ਆਪਣੇ ਡੇਅਰੀ ਸੰਗ੍ਰਹਿ ਕੇਂਦਰ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਸਬਸਕ੍ਰਿਪਸ਼ਨ ਪਲਾਨ ਚੁਣੋ।',
            'modal_contact_title': 'ਸਬਸਕ੍ਰਿਪਸ਼ਨ ਲੈਣ ਲਈ ਸੰਪਰਕ ਕਰੋ',
            'modal_contact_desc': 'ਆਪਣਾ ਸਬਸਕ੍ਰਿਪਸ਼ਨ ਪਲਾਨ ਤੁਰੰਤ ਸਰਗਰਮ ਕਰਨ ਲਈ ਸਾਡੀ ਟੀਮ ਨੂੰ ਕਾਲ ਜਾਂ ਵਟਸਐਪ ਕਰੋ।',
            'modal_btn_call': 'ਕਾਲ ਕਰੋ',
            'modal_btn_whatsapp': 'WhatsApp ਕਰੋ',
            'badge_free': 'ਮੁਫਤ',
            'badge_flexible': 'ਲਚਕਦਾਰ',
            'badge_popular': 'ਲੇਕਪ੍ਰਿਯ',
            'badge_best_value': 'ਸਭ ਤੋਂ ਵਧੀਆ ਮੁੱਲ',
            'page_title': 'ਪਾਰਟਨਰ ਜਾਂ ਡੀਲਰ ਬਣੋ | ਦੁਧੀਆ ਸਮਾਰਟ ਡੇਅਰੀ ਟੈਕ',
            'meta_description': 'ਸੇਲਜ਼ ਪਾਰਟਨਰ, ਡਾਟਾ ਐਂਟਰੀ ਓਪਰੇਟਰ, ਜਾਂ ਫ੍ਰੈਂਚਾਈਜ਼ ਡੀਲਰ ਵਜੋਂ ਦੁਧੀਆ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਵੋ। ਸਥਾਨਕ ਡੇਅਰੀ ਕੇਂਦਰਾਂ ਨੂੰ ਸ਼ਕਤੀਸ਼ਾਲੀ ਬਣਾ ਕੇ ਉੱਚ ਮਾਸਿਕ ਆਮਦਨ ਕਮਾਓ।',
            'hero_badge_tag': '3 ਲਚਕਦਾਰ ਭਾਈਵਾਲੀ ਭੂਮਿਕਾਵਾਂ ਉਪਲਬਧ ਹਨ',
            'hero_main_title': 'ਦੁਧੀਆ ਨਾਲ ਪਾਰਟਨਰ ਬਣੋ — ਆਪਣਾ ਕਾਰੋਬਾਰ ਬਣਾਓ',
            'hero_main_subtitle': 'ਤੇਜ਼ੀ ਨਾਲ ਵਧ ਰਹੇ ਡੇਅਰੀ ਤਕਨਾਲੋਜੀ ਖੇਤਰ ਵਿੱਚ ਸਥਿਰ ਆਮਦਨ ਕਮਾਓ। 3 ਲਾਭਦਾਇਕ ਰਸਤਿਆਂ ਵਿੱਚੋਂ ਚੁਣੋ: ਸੇਲਜ਼ ਪਾਰਟਨਰ, ਡਾਟਾ ਐਂਟਰੀ ਓਪਰੇਟਰ, ਜਾਂ ਸੁਤੰਤਰ ਡੀਲਰ।',
            'btn_explore_roles': '3 ਭੂਮਿਕਾਵਾਂ ਦੇਖੋ',
            'btn_whatsapp_inquiry': 'WhatsApp ਤੇ ਗੱਲ ਕਰੋ',
            'pill_high_payout': 'ਉੱਚ ਮਾਸਿਕ ਕਮਿਸ਼ਨ',
            'pill_zero_risk': 'ਜ਼ੀਰੋ ਜੋਖਮ ਅਤੇ ਨਿਵੇਸ਼ ਵਿਕਲਪ',
            'pill_full_training': 'ਪੂਰੀ ਸਿਖਲਾਈ ਅਤੇ ਮਾਰਕੀਟਿੰਗ ਸਹਾਇਤਾ',
            'card_opportunity_header': '₹50,000+ / ਮਹੀਨਾ ਤੱਕ ਕਮਾਓ',
            'card_opportunity_title': 'ਆਪਣਾ ਭਾਈਵਾਲੀ ਟੀਚਾ ਚੁਣੋ',
            'mini_role1_title': '1. ਸੇਲਜ਼ ਪਾਰਟਨਰ',
            'mini_role1_desc': 'ਡੇਅਰੀਆਂ ਦੀ ਸਿਫ਼ਾਰਸ਼ ਕਰੋ ਅਤੇ 10% ਕਮਿਸ਼ਨ ਕਮਾਓ',
            'mini_role2_title': '2. ਡਾਟਾ ਐਂਟਰੀ ਓਪਰੇਟਰ',
            'mini_role2_desc': 'ਡੇਅਰੀਆਂ ਦਾ ਪ੍ਰਬੰਧਨ ਕਰੋ ਅਤੇ ਪ੍ਰਤੀ ਡੇਅਰੀ ਭੁਗਤਾਨ ਪ੍ਰਾਪਤ ਕਰੋ',
            'mini_role3_title': '3. ਫ੍ਰੈਂਚਾਈਜ਼ ਡੀਲਰ',
            'mini_role3_desc': 'ਪੂਰਾ ਖੇਤਰੀ ਨੈੱਟਵਰਕ ਅਤੇ 50%+ ਮੁਨਾਫਾ ਮਾਰਜਿਨ',
            'roles_section_badge': 'ਕੰਮ ਕਰਨ ਅਤੇ ਕਮਾਉਣ ਦੇ 3 ਤਰੀਕੇ',
            'roles_section_title': 'ਆਪਣੀ ਪਾਰਟਨਰਸ਼ਿਪ ਭੂਮਿਕਾ ਚੁਣੋ',
            'roles_section_subtitle': 'ਭਾਵੇਂ ਤੁਸੀਂ ਸਥਾਨਕ ਸੰਗ੍ਰਹਿ ਕੇਂਦਰਾਂ ਦੀ ਸਿਫ਼ਾਰਸ਼ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ, ਡੇਅਰੀ ਮਾਲਕਾਂ ਲਈ ਰੋਜ਼ਾਨਾ ਡਾਟਾ ਐਂਟਰੀ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ, ਜਾਂ ਪੂਰੀ ਡੀਲਰਸ਼ਿਪ ਚਲਾਉਣਾ ਚਾਹੁੰਦੇ ਹੋ — ਸਾਡੇ ਕੋਲ ਤੁਹਾਡੇ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਮੌਕਾ ਹੈ।',
            'role1_badge': '10% ਕਮਿਸ਼ਨ + ਬੋਨਸ',
            'role1_title': '1. ਸੇਲਜ਼ ਪਾਰਟਨਰ',
            'role1_subtitle': 'ਸੇਲਜ਼ ਪਰਸਨ / ਸਲਾਹਕਾਰ ਬਣੋ',
            'role1_desc': 'ਸਥਾਨਕ ਦੁੱਧ ਸੰਗ੍ਰਹਿ ਕੇਂਦਰਾਂ ਨੂੰ ਦੁਧੀਆ ਐਪ ਅਤੇ ਵੈੱਬ ਪੋਰਟਲ ਨਾਲ ਜਾਣੂ ਕਰਵਾਓ। ਡੇਅਰੀ ਮਾਲਕਾਂ ਦੇ ਕਾਰੋਬਾਰ ਨੂੰ ਡਿਜੀਟਲ ਬਣਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰੋ ਅਤੇ ਆਮਦਨ ਕਮਾਓ।',
            'role1_earning_label': 'ਸੰਭਾਵਿਤ ਆਮਦਨ:',
            'role1_earning_val': '10% ਲਾਈਫਟਾਈਮ ਕਮਿਸ਼ਨ + ₹500 ਬੋਨਸ / ਡੇਅਰੀ',
            'role1_feat1': 'ਪ੍ਰਤੀ ਡੇਅਰੀ ਸਬਸਕ੍ਰਿਪਸ਼ਨ 10% ਤੁਰੰਤ ਛੋਟ / ਕਮਿਸ਼ਨ',
            'role1_feat2': 'ਹਰ ਮਹੀਨੇ ਡੇਅਰੀ ਰੀਚਾਰਜ ਤੇ ਲਗਾਤਾਰ ਕਮਿਸ਼ਨ',
            'role1_feat3': 'ਪੂਰਾ ਐਪ ਡੈਮੋ ਅਤੇ ਮਾਰਕੀਟਿੰਗ ਸਮੱਗਰੀ ਉਪਲਬਧ',
            'role1_btn': 'ਸੇਲਜ਼ ਪਾਰਟਨਰ ਬਣੋ',
            'role2_badge': 'ਗਾਰੰਟੀਸ਼ੁਦਾ ਪ੍ਰਤੀ ਡੇਅਰੀ ਭੁਗਤਾਨ',
            'role2_title': '2. ਡਾਟਾ ਐਂਟਰੀ ਓਪਰੇਟਰ',
            'role2_subtitle': 'ਡੇਅਰੀਆਂ ਲਈ ਦੁੱਧ ਸੰਗ੍ਰਹਿ ਸੰਭਾਲੋ',
            'role2_desc': 'ਦੁਧੀਆ ਜਾਂ ਡੇਅਰੀ ਮਾਲਕਾਂ ਦੁਆਰਾ 2, 5 ਜਾਂ ਹੋਰ ਸਥਾਨਕ ਡੇਅਰੀਆਂ ਪ੍ਰਾਪਤ ਕਰੋ। ਰੋਜ਼ਾਨਾ ਸਵੇਰੇ-ਸ਼ਾਮ ਦੁੱਧ ਸੰਗ੍ਰਹਿ ਦਾ ਇੰਦਰਾਜ਼ ਕਰੋ ਅਤੇ PDF ਬਿੱਲ ਤਿਆਰ ਕਰੋ।',
            'role2_earning_label': 'ਸੰਭਾਵਿਤ ਆਮਦਨ:',
            'role2_earning_val': '₹1,500 – ₹3,000 ਪ੍ਰਤੀ ਡੇਅਰੀ / ਮਹੀਨਾ ਕਮਾਓ',
            'role2_feat1': 'ਸਥਾਨਕ ਜਾਂ ਰਿਮੋਟਲੀ ਡੇਅਰੀਆਂ ਤੇ ਕੰਮ ਕਰੋ',
            'role2_feat2': 'ਪ੍ਰਬੰਧਿਤ ਡੇਅਰੀ ਤੇ ਗਾਰੰਟੀਸ਼ੁਦਾ ਮਾਸਿਕ ਭੁਗਤਾਨ',
            'role2_feat3': 'ਜ਼ੀਰੋ ਸੌਫਟਵੇਅਰ ਨਿਵੇਸ਼ ਦੀ ਲੋੜ',
            'role2_btn': 'ਓਪਰੇਟਰ ਬਣੋ',
            'role3_badge': '⭐ ਵੱਧ ਤੋਂ ਵੱਧ ਕਮਾਈ ਅਤੇ ਨਿਯੰਤਰਣ',
            'role3_title': '3. ਫ੍ਰੈਂਚਾਈਜ਼ ਡੀਲਰ',
            'role3_subtitle': 'ਆਪਣੇ ਸਥਾਨਕ ਖੇਤਰ ਦੇ ਮਾਲਕ ਬਣੋ',
            'role3_desc': 'ਆਪਣੇ ਬਲਾਕ ਜਾਂ ਜ਼ਿਲ੍ਹੇ ਵਿੱਚ ਦੁਧੀਆ ਸੌਫਟਵੇਅਰ ਫ੍ਰੈਂਚਾਈਜ਼ ਚਲਾਓ। ਡੇਅਰੀਆਂ ਜੋੜੋ, ਡੇਅਰੀ ਮਾਲਕਾਂ ਤੋਂ ਸਿੱਧਾ ਭੁਗਤਾਨ ਲਓ, ਅਤੇ ਹੋਲਸੇਲ ਦਰਾਂ ਤੇ ਭੁਗਤਾਨ ਕਰੋ।',
            'role3_earning_label': 'ਸੰਭਾਵਿਤ ਆਮਦਨ:',
            'role3_earning_val': '50%+ ਮੁਨਾਫਾ ਮਾਰਜਿਨ (₹50,000+ / ਮਹੀਨਾ ਕਮਾਓ)',
            'role3_feat1': 'ਪੂਰੀ ਖੇਤਰੀ ਮਾਲਕੀ ਅਤੇ ਗਾਹਕ ਨਿਯੰਤਰਣ',
            'role3_feat2': 'ਡੇਅਰੀ ਮਾਲਕਾਂ ਤੋਂ ਸਿੱਧਾ ਭੁਗਤਾਨ ਸੰਗ੍ਰਹਿ',
            'role3_feat3': '24/7 ਤਕਨੀਕੀ ਸਹਾਇਤਾ ਅਤੇ ਬ੍ਰਾਂਡਿੰਗ ਕਿੱਟ',
            'role3_btn': 'ਡੀਲਰ ਬਣੋ',
            'multirole_badge': 'ਆਲ-ਇਨ-ਵਨ ਮਲਟੀ-ਰੋਲ ਸੁਵਿਧਾ',
            'multirole_title': 'ਕੀ ਮੈਂ ਇੱਕੋ ਸਮੇਂ ਸਾਰੀਆਂ 3 ਭੂਮਿਕਾਵਾਂ ਵਿੱਚ ਕੰਮ ਕਰ ਸਕਦਾ ਹਾਂ? <span class="text-orange-600">ਹਾਂ!</span>',
            'multirole_desc': 'ਤੁਸੀਂ ਸਿਰਫ਼ ਇੱਕ ਭੂਮਿਕਾ ਤੱਕ ਸੀਮਿਤ ਨਹੀਂ ਹੋ! ਆਪਣੀ ਆਮਦਨ ਵਧਾਉਣ ਲਈ ਸੇਲਜ਼ ਪਾਰਟਨਰਸ਼ਿਪ, ਡਾਟਾ ਐਂਟਰੀ ਓਪਰੇਸ਼ਨ, ਅਤੇ ਡੀਲਰਸ਼ਿਪ ਨੂੰ ਇਕੱਠਾ ਕਰੋ।',
            'multirole_point1': 'ਵੱਖ-ਵੱਖ ਆਮਦਨ ਦੇ ਸਰੋਤ',
            'multirole_point2': 'ਵੱਧ ਤੋਂ ਵੱਧ ਮਾਸਿਕ ਲਾਭ',
            'multirole_point3': 'ਇੱਕੋ ਏਕੀਕ੍ਰਿਤ ਖਾਤਾ',
            'multirole_btn': 'ਮਲਟੀ-ਰੋਲ ਪਾਰਟਨਰ ਲਈ ਅਪਲਾਈ ਕਰੋ',
            'matrix_title': 'ਭੂਮਿਕਾ ਤੁਲਨਾ ਅਤੇ ਕਮਾਈ ਦਾ ਵੇਰਵਾ',
            'matrix_subtitle': 'ਮੁੱਖ ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ, ਲੋੜੀਂਦੀ ਮਿਹਨਤ, ਅਤੇ ਭੁਗਤਾਨ ਦੀ ਤੁਲਨਾ ਕਰੋ',
            'th_feature': 'ਵਿਸ਼ੇਸ਼ਤਾ / ਪੈਰਾਮੀਟਰ',
            'th_role1': 'ਸੇਲਜ਼ ਪਾਰਟਨਰ',
            'th_role2': 'ਓਪਰੇਟਰ',
            'th_role3': 'ਫ੍ਰੈਂਚਾਈਜ਼ ਡੀਲਰ',
            'tr1_label': 'ਮੁੱਖ ਉਦੇਸ਼',
            'tr1_role1': 'ਡੇਅਰੀਆਂ ਜੋੜੋ',
            'tr1_role2': 'ਰੋਜ਼ਾਨਾ ਸੰਗ੍ਰਹਿ ਇੰਦਰਾਜ਼ ਕਰੋ',
            'tr1_role3': 'ਖੇਤਰੀ ਨੈੱਟਵਰਕ ਚਲਾਓ',
            'tr2_label': 'ਨਿਵੇਸ਼ ਦੀ ਲੋੜ',
            'tr2_role1': '₹0 (ਜ਼ੀਰੋ)',
            'tr2_role2': '₹0 (ਜ਼ੀਰੋ)',
            'tr2_role3': 'ਘੱਟ ਹੋਲਸੇਲ ਦਰ',
            'tr3_label': 'ਮਾਸਿਕ ਕਮਾਈ',
            'tr3_role1': '₹5,000 – ₹20,000',
            'tr3_role2': '₹10,000 – ₹25,000',
            'tr3_role3': '₹50,000 – ₹1,50,000+',
            'tr4_label': 'ਸਮਾਂ',
            'tr4_role1': 'ਲਚਕਦਾਰ / ਪਾਰਟ-ਟਾਈਮ',
            'tr4_role2': '1-2 ਘੰਟੇ ਰੋਜ਼ਾਨਾ ਸ਼ਿਫਟ',
            'tr4_role3': 'ਪੂਰਾ ਕਾਰੋਬਾਰ',
            'tr5_label': 'ਸਹਾਇਤਾ ਅਤੇ ਸਿਖਲਾਈ',
            'tr5_role1': 'ਐਪ ਡੈਮੋ ਅਤੇ ਮਾਰਕੀਟਿੰਗ ਕਿੱਟ',
            'tr5_role2': 'ਪੂਰੀ ਓਪਰੇਟਰ ਸਿਖਲਾਈ',
            'tr5_role3': 'ਪ੍ਰਾਇਓਰਟੀ 24/7 ਮੈਨੇਜਰ',
            'training_badge_tag': 'ਮੁਫਤ 1-ਆਨ-1 ਅਤੇ ਗਰੁੱਪ ਮਾਸਟਰਕਲਾਸ',
            'training_title': 'ਸੰਪੂਰਨ ਦੁਧੀਆ ਸੌਫਟਵੇਅਰ ਸਿਖਲਾਈ',
            'training_desc': 'ਆਪਣੇ ਗਾਹਕਾਂ ਦੀ ਸਹਾਇਤਾ ਲਈ ਦੁਧੀਆ ਪਲੇਟਫਾਰਮ ਵਿੱਚ ਮਹਾਰਤ ਹਾਸਲ ਕਰੋ। ਸਾਡੇ ਮਾਹਰ ਤੁਹਾਨੂੰ ਦੁੱਧ ਸੰਗ੍ਰਹਿ ਕੇਂਦਰ ਸਥਾਪਿਤ ਕਰਨਾ, ਕਿਸਾਨ ਡਾਟਾਬੇਸ ਸੰਭਾਲਣਾ, FAT/SNF ਗਣਨਾ ਅਤੇ PDF ਰਿਪੋਰਟਾਂ ਤਿਆਰ ਕਰਨਾ ਸਿਖਾਉਣਗੇ।',
            'train_topic1_title': 'ਡੇਅਰੀ ਕੇਂਦਰ ਸਥਾਪਨਾ',
            'train_topic1_desc': 'ਸੰਪੂਰਨ ਸੌਫਟਵੇਅਰ ਅਤੇ ਰੇਟ ਚਾਰਟ ਕੌਂਫਿਗਰੇਸ਼ਨ',
            'train_topic2_title': 'ਕਿਸਾਨ ਡਾਟਾਬੇਸ ਪ੍ਰਬੰਧਨ',
            'train_topic2_desc': 'ਕਿਸਾਨ, ਪਾਸਬੁੱਕ ਅਤੇ ਅਗਲੇਰੀ ਰਕਮ ਸੰਭਾਲੋ',
            'train_topic3_title': 'FAT/SNF ਆਟੋਮੇਸ਼ਨ',
            'train_topic3_desc': 'ਆਟੋ ਦੁੱਧ ਟੈਸਟਿੰਗ ਅਤੇ ਕੀਮਤ ਗਣਨਾ',
            'train_topic4_title': '1-ਕਲਿੱਕ PDF ਰਿਪੋਰਟਾਂ',
            'train_topic4_desc': 'ਤੁਰੰਤ ਬਿਲਿੰਗ, ਸ਼ਿਫਟ ਸਾਰਾਂਸ਼ ਅਤੇ ਰਿਪੋਰਟਾਂ',
            'badge_cert': '100% ਮੁਫਤ ਪਾਰਟਨਰ ਸਰਟੀਫਿਕੇਸ਼ਨ',
            'btn_call_training': 'ਸਿਖਲਾਈ ਲਈ ਕਾਲ ਕਰੋ',
            'training_badge_support': 'ਮਾਹਰ ਸਹਾਇਤਾ',
            'training_badge_sub': '24/7 ਉਪਲਬਧ',
            'how_title': '4 ਆਸਾਨ ਕਦਮਾਂ ਵਿੱਚ ਸ਼ੁਰੂ ਕਰੋ',
            'how_subtitle': '24 ਘੰਟਿਆਂ ਤੋਂ ਘੱਟ ਸਮੇਂ ਵਿੱਚ ਦੁਧੀਆ ਨਾਲ ਕਮਾਈ ਸ਼ੁਰੂ ਕਰੋ',
            'step1_title': 'ਆਪਣੀ ਭੂਮਿਕਾ ਚੁਣੋ',
            'step1_desc': 'ਚੁਣੋ ਕਿ ਤੁਸੀਂ ਸੇਲਜ਼ ਪਾਰਟਨਰ, ਓਪਰੇਟਰ, ਜਾਂ ਡੀਲਰ ਬਣਨਾ ਚਾਹੁੰਦੇ ਹੋ।',
            'step2_title': 'ਸਾਡੀ ਟੀਮ ਨਾਲ ਸੰਪਰਕ ਕਰੋ',
            'step2_desc': 'ਵਟਸਐਪ ਜਾਂ ਕਾਲ ਰਾਹੀਂ ਸਾਡੀ ਟੀਮ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।',
            'step3_title': 'ਮੁਫਤ ਸਿਖਲਾਈ ਪ੍ਰਾਪਤ ਕਰੋ',
            'step3_desc': 'ਪੂਰਾ ਸੌਫਟਵੇਅਰ ਡੈਮੋ, ਸਿਖਲਾਈ ਅਤੇ ਮਾਰਕੀਟਿੰਗ ਮਾਰਗਦਰਸ਼ਨ ਪ੍ਰਾਪਤ ਕਰੋ।',
            'step4_title': 'ਕਮਾਈ ਸ਼ੁਰੂ ਕਰੋ',
            'step4_desc': 'ਡੇਅਰੀਆਂ ਸ਼ਾਮਲ ਕਰੋ ਜਾਂ ਡਾਟਾ ਐਂਟਰੀ ਕਰੋ ਅਤੇ ਮਾਸਿਕ ਭੁਗਤਾਨ ਪ੍ਰਾਪਤ ਕਰੋ।',
            'btn_whatsapp_ask': 'WhatsApp ਤੇ ਪੁੱਛੋ',
            'btn_call_us': 'ਕਾਲ ਕਰੋ',
            'contact_subtext_instant': 'ਤੁਰੰਤ ਸਹਾਇਤਾ! ਅਸੀਂ ਮਿੰਟਾਂ ਵਿੱਚ ਜਵਾਬ ਦਿੰਦੇ ਹਾਂ',
            'form_badge': 'ਤੁਰੰਤ ਰਜਿਸਟ੍ਰੇਸ਼ਨ',
            'form_title': 'ਪਾਰਟਨਰ ਜਾਂ ਡੀਲਰ ਬਣਨ ਲਈ ਅਪਲਾਈ ਕਰੋ',
            'form_subtitle': 'ਹੇਠਾਂ ਆਪਣੇ ਵੇਰਵੇ ਭਰੋ ਅਤੇ ਸਾਡੀ ਟੀਮ 2 ਘੰਟਿਆਂ ਵਿੱਚ ਸੰਪਰਕ ਕਰੇਗੀ।',
            'label_name': 'ਪੂਰਾ ਨਾਮ *',
            'label_phone': 'ਫੋਨ / ਮੋਬਾਈਲ ਨੰਬਰ *',
            'label_city': 'ਸ਼ਹਿਰ / ਜ਼ਿਲ੍ਹਾ *',
            'label_role': 'ਤਰਜੀਹੀ ਭੂਮਿਕਾ ਚੁਣੋ *',
            'label_message': 'ਵਾਧੂ ਸੁਨੇਹਾ (ਵਿਕਲਪਿਕ)',
            'btn_submit_application': 'ਅਰਜ਼ੀ ਜਮ੍ਹਾਂ ਕਰੋ',
            'placeholder_name': 'ਆਪਣਾ ਪੂਰਾ ਨਾਮ ਦਰਜ ਕਰੋ',
            'placeholder_phone': '10-ਅੰਕਾਂ ਦਾ ਮੋਬਾਈਲ ਨੰਬਰ',
            'placeholder_city': 'ਆਪਣਾ ਸ਼ਹਿਰ / ਜ਼ਿਲ੍ਹਾ ਦਰਜ ਕਰੋ',
            'placeholder_message': 'ਆਪਣੇ ਤਜ਼ਰਬੇ ਜਾਂ ਆਪਣੇ ਖੇਤਰ ਵਿੱਚ ਡੇਅਰੀਆਂ ਦੀ ਗਿਣਤੀ ਬਾਰੇ ਦੱਸੋ...',
            'option_role_1': '1. ਸੇਲਜ਼ ਪਾਰਟਨਰ / ਰੈਫਰਲ ਏਜੰਟ (10% ਕਮਿਸ਼ਨ)',
            'option_role_2': '2. ਡਾਟਾ ਐਂਟਰੀ ਓਪਰੇਟਰ (ਪ੍ਰਤੀ ਡੇਅਰੀ ਤੈਅ ਭੁਗਤਾਨ)',
            'option_role_3': '3. ਫ੍ਰੈਂਚਾਈਜ਼ ਡੀਲਰ (ਸੰਪੂਰਨ ਸੌਫਟਵੇਅਰ ਨੈੱਟਵਰਕ)',
            'option_role_4': '4. ਸਾਰੀਆਂ 3 ਭੂਮਿਕਾਵਾਂ ਇਕੱਠੀਆਂ / ਆਲ-ਇਨ-ਵਨ ਮਲਟੀ-ਰੋਲ ਪਾਰਟਨਰ (ਵੱਧ ਤੋਂ ਵੱਧ ਆਮਦਨ)',
            'contact_section_badge': 'ਤੁਰੰਤ ਸਹਾਇਤਾ',
            'contact_section_title': 'ਕੋਈ ਸਵਾਲ ਹੈ ਜਾਂ ਮਦਦ ਚਾਹੀਦੀ ਹੈ? ਤੁਰੰਤ ਸਾਡੇ ਨਾਲ ਗੱਲ ਕਰੋ',
            'contact_section_subtitle': 'ਸਾਡੇ ਪਾਰਟਨਰ ਮਾਹਰ ਤੁਹਾਨੂੰ ਭੂਮਿਕਾਵਾਂ, ਕਮਾਈ ਅਤੇ ਆਨਬੋਰਡਿੰਗ ਬਾਰੇ ਜਾਣਕਾਰੀ ਦੇਣ ਲਈ ਉਪਲਬਧ ਹਨ।',
            'contact_card_wa_title': 'WhatsApp \'ਤੇ ਗੱਲਬਾਤ ਕਰੋ',
            'contact_card_wa_desc': 'ਸਾਡੀ ਸਹਾਇਤਾ ਟੀਮ ਤੋਂ ਆਪਣੇ ਸਾਰੇ ਸਵਾਲਾਂ ਦੇ ਤੁਰੰਤ ਜਵਾਬ ਪ੍ਰਾਪਤ ਕਰੋ।',
            'contact_card_call_title': 'ਸਾਡੇ ਪਾਰਟਨਰ ਮੈਨੇਜਰ ਨੂੰ ਕਾਲ ਕਰੋ',
            'contact_card_call_desc': 'ਸਵੇਰੇ 9:00 ਵਜੇ ਤੋਂ ਰਾਤ 8:00 ਵਜੇ ਤੱਕ ਸਿੱਧੀ ਫੋਨ ਸਹਾਇਤਾ।',
            'dealer_sub_badge': 'ਡੇਅਰੀ ਸੰਗ੍ਰਹਿ ਕੇਂਦਰਾਂ ਅਤੇ ਡੀਲਰਾਂ ਲਈ ਸੌਫਟਵੇਅਰ ਪਲਾਨ',
            'dealer_sub_title': 'ਦੁਧੀਆ ਸੌਫਟਵੇਅਰ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਪਲਾਨ ਚੁਣੋ',
            'dealer_sub_subtitle': 'ਦੁਧੀਆ ਡੇਅਰੀ ਸੰਗ੍ਰਹਿ ਸੌਫਟਵੇਅਰ ਵਰਤਣ ਵਾਲੀਆਂ ਡੇਅਰੀਆਂ ਲਈ ਕਿਫਾਇਤੀ ਪਲਾਨ।',
            'dealer_plan_freetrial_title': 'ਮੁਫ਼ਤ ਟ੍ਰਾਇਲ',
            'dealer_plan_freetrial_price': 'FREE',
            'dealer_plan_freetrial_dur': '1 ਮਹੀਨੇ ਲਈ',
            'dealer_plan_monthly_title': 'ਮਾਸਿਕ ਪਲਾਨ',
            'dealer_plan_monthly_price': '₹899',
            'dealer_plan_monthly_orig': '₹999',
            'dealer_plan_monthly_unit': 'ਪ੍ਰਤੀ ਡੇਅਰੀ/ਸੰਗ੍ਰਹਿ ਕੇਂਦਰ',
            'dealer_plan_yearly_title': 'ਸਾਲਾਨਾ ਪਲਾਨ',
            'dealer_plan_yearly_price': '₹9,999',
            'dealer_plan_yearly_orig': '₹10,999',
            'dealer_plan_yearly_unit': 'ਅਸੀਮਿਤ ਡੇਅਰੀ/ਸੰਗ੍ਰਹਿ ਕੇਂਦਰ',
            'feat_1_center': '1 ਡੇਅਰੀ/ਸੰਗ੍ਰਹਿ ਕੇਂਦਰ',
            'feat_basic_analytics': 'ਬੁਨਿਆਦੀ ਰਿਪੋਰਟਿੰਗ ਅਤੇ ਐਨਾਲਿਟਿਕਸ',
            'feat_std_support': 'ਸਟੈਂਡਰਡ ਗਾਹਕ ਸਹਾਇਤਾ',
            'feat_basic_training': 'ਬੁਨਿਆਦੀ ਸਿਖਲਾਈ ਸਮੱਗਰੀ',
            'feat_flex_center': 'ਲਚਕਦਾਰ ਕੇਂਦਰ ਵਿਕਲਪ',
            'feat_center_mgmt': 'ਸੰਗ੍ਰਹਿ ਕੇਂਦਰ ਪ੍ਰਬੰਧਨ',
            'feat_adv_analytics': 'ਐਡਵਾਂਸਡ ਰਿਪੋਰਟਿੰਗ ਅਤੇ ਐਨਾਲਿਟਿਕਸ',
            'feat_prio_support': 'ਪਹਿਲ ਗਾਹਕ ਸਹਾਇਤਾ',
            'feat_training_onboard': 'ਸਿਖਲਾਈ ਅਤੇ ਆਨਬੋਰਡਿੰਗ ਸ਼ਾਮਲ',
            'feat_mktg_materials': 'ਮਾਰਕੀਟਿੰਗ ਸਮੱਗਰੀ ਪ੍ਰਦਾਨ ਕੀਤੀ ਜਾਵੇਗੀ',
            'btn_get_started': 'ਇਸ ਪਲਾਨ ਨਾਲ ਸ਼ੁਰੂ ਕਰੋ',
            'dealer_plan_contact_title': 'ਸਬਸਕ੍ਰਿਪਸ਼ਨ ਲੈਣ ਲਈ ਸੰਪਰਕ ਕਰੋ',
            'dealer_plan_contact_sub': 'ਆਪਣੀ ਸਬਸਕ੍ਰਿਪਸ਼ਨ ਤੁਰੰਤ ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਸਾਡੀ ਟੀਮ ਨੂੰ ਕਾਲ ਜਾਂ WhatsApp ਕਰੋ।'
        },
        'kn': {
            'nav_home': 'ಮುಖಪುಟ',
            'nav_features': 'ವೈಶಿಷ್ಟ್ಯಗಳು',
            'nav_benefits': 'ಪ್ರಯೋಜನಗಳು',
            'nav_download': 'ಡೌನ್‌ಲೋಡ್',
            'nav_about': 'ನಮ್ಮ ಬಗ್ಗಯಲು',
            'nav_partner': 'ಪಾಟ್ನರ್/ಡೀಲರ್',
            'nav_pricing': 'ಬೆಲೆಪಟ್ಟಿ',
            'nav_contact': 'ಸಂಪರ್ಕ',
            'nav_login': 'ಲಾಗಿನ್',
            'nav_dashboard': 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
            'select_language': 'ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ',
            'hero_badge': 'ಮೊದಲ ತಿಂಗಳು FREE • ₹500 ಬೋನಸ್',
            'hero_title': 'ಹಾಲು ಸಂಗ್ರಹಣೆ ಕೇಂದ್ರಗಳಿಗಾಗಿ ಭಾರತದ #1 ಅಪ್ಲಿಕೇಶನ್',
            'hero_title_part1': 'ಭಾರತದ ',
            'hero_title_part2': '#1 ಅಪ್ಲಿಕೇಶನ್',
            'hero_title_part3': ' ಹಾಲು ಸಂಗ್ರಹಣೆ ಕೇಂದ್ರಗಳಿಗಾಗಿ',
            'hero_subtitle': 'ಕಾಗದದ ರಜಿಸ್ಟರ್‌ಗಳು ಮತ್ತು ಕ್ಯಾಲ್ಕುಲೇಟರ್‌ಗಳನ್ನು ಬದಲಾಯಿಸಿ. ರೈತರ ಹಾಲು ಸರಬರಾಜುವನ್ನು ರೆಕಾರ್ಡ್ ಮಾಡಿ, FAT/SNF ಪಾವತಿಗಳನ್ನು ಆಟೋ-ಲೆಕ್ಕಹಾಕಿ, ಮತ್ತು ವರದಿಗಳನ್ನು ರಚಿಸಿ — ಎಲ್ಲವೂ ನಿಮ್ಮ ಫೋನ್‌ನಿಂದ. 10,000+ ಡೇರಿ ಕೇಂದ್ರಗಳಿಂದ ಬಳಸಲಾಗುತ್ತಿದೆ.',
            'btn_download': 'ಮೊಬೈಲ್ ಅಪ್ಲಿಕೇಶನ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',
            'btn_explore': 'ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ಅನ್ವೇಷಿಸಿ',
            'workflow_buyer_label': 'ಖರೀದಿದಾರರಿಗಾಗಿ (ಸಂಗ್ರಹಣೆ ಕೇಂದ್ರಗಳು)',
            'workflow_buyer_step1_title': 'ಸರಬರಾಜುದಾರರನ್ನು ಸೇರಿಸಿ',
            'workflow_buyer_step1_desc': 'ಡೇರಿ ರೈತರನ್ನು ಸಂಪರ್ಕಿಸಿ',
            'workflow_buyer_step2_title': 'ಸಂಗ್ರಹಣೆ ಮಾಡಿ',
            'workflow_buyer_step2_desc': 'ಪ್ರೋ ರಾಟಾ ಮತ್ತು ಪ್ರಮಾಣಿತ',
            'workflow_buyer_step3_title': 'ವರದಿಗಳನ್ನು ರಚಿಸಿ',
            'workflow_buyer_step3_desc': 'ಸರಬರಾಜುದಾರ ಅಥವಾ ಎಲ್ಲರಿಗೂ',
            'workflow_supplier_label': 'ಸರಬರಾಜುದಾರರಿಗಾಗಿ (ರೈತರು)',
            'workflow_supplier_step1_title': 'ಸಂಪರ್ಕಿತ ಡೇರಿಗಳನ್ನು ನೋಡಿ',
            'workflow_supplier_step1_desc': 'ಎಲ್ಲಾ ಖರೀದಿದಾರರನ್ನು ನೋಡಿ',
            'workflow_supplier_step2_title': 'ಸಂಗ್ರಹಣೆಗಳನ್ನು ನೋಡಿ',
            'workflow_supplier_step2_desc': 'ನಿರ್ದಿಷ್ಟ ಖರೀದಿದಾರರಿಂದ',
            'workflow_supplier_step3_title': 'ವರದಿಗಳನ್ನು ರಚಿಸಿ',
            'workflow_supplier_step3_desc': 'ಡೌನ್‌ಲೋಡ್ ಮತ್ತು ಹಂಚಿಕೊಳ್ಳಿ',
            'workflow_buyer_title': 'ಸರಳ 3-ಹಂತದ ವರ್ಕ್‌ಫ್ಲೋ',
            'workflow_buyer_subtitle': 'ನಮ್ಮ ಸ್ಟ್ರೀಮ್‌ಲೈನ್ಡ್ ಪ್ರಕ್ರಿಯೆಯೊಂದಿಗೆ ನಿಮ್ಮ ಸಂಗ್ರಹಣೆ ಕೇಂದ್ರವನ್ನು ಪರಿಣಾಮಕಾರಿಯಾಗಿ ನಿರ್ವಹಿಸಿ',
            'workflow_buyer_step1_title_full': 'ಸರಬರಾಜುದಾರರನ್ನು ಸೇರಿಸಿ',
            'workflow_buyer_step1_desc_full': 'ವಿವರವಾದ ಪ್ರೊಫೈಲ್‌ಗಳೊಂದಿಗೆ ಡೇರಿ ರೈತರನ್ನು ನಿಮ್ಮ ಸಂಗ್ರಹಣೆ ಕೇಂದ್ರಕ್ಕೆ ಸಂಪರ್ಕಿಸಿ',
            'workflow_buyer_step2_title_full': 'ಸಂಗ್ರಹಣೆ ಮಾಡಿ',
            'workflow_buyer_step2_desc_full': 'ಆಟೋ-ಲೆಕ್ಕಹಾಕಿದ FAT, SNF ಮತ್ತು ದರಗಳೊಂದಿಗೆ ಹಾಲು ವಿತರಣೆಯನ್ನು ರೆಕಾರ್ಡ್ ಮಾಡಿ',
            'workflow_buyer_step3_title_full': 'ವರದಿಗಳನ್ನು ರಚಿಸಿ',
            'workflow_buyer_step3_desc_full': 'ಯಾವುದೇ ದಿನಾಂಕ ವ್ಯಾಪ್ತಿ, ಸರಬರಾಜುದಾರ ಅಥವಾ ಶಿಫ್ಟ್‌ಗಾಗಿ PDF/Excel ವರದಿಗಳನ್ನು ರಚಿಸಿ',
            'workflow_supplier_title': 'ಸರಳ 3-ಹಂತದ ವರ್ಕ್‌ಫ್ಲೋ',
            'workflow_supplier_subtitle': 'ನಮ್ಮ ರೈತ-ಸ್ನೇಹಿ ವ್ಯವಸ್ಥೆಯೊಂದಿಗೆ ನಿಮ್ಮ ಹಾಲು ವಿತರಣೆ ಮತ್ತು ಸಂಪಾದನೆಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
            'workflow_supplier_step1_title_full': 'ಸಂಪರ್ಕಿತ ಡೇರಿಗಳನ್ನು ನೋಡಿ',
            'workflow_supplier_step1_desc_full': 'ನೀವು ಸಂಪರ್ಕಿಸಿರುವ ಎಲ್ಲಾ ಸಂಗ್ರಹಣೆ ಕೇಂದ್ರಗಳನ್ನು ನೋಡಿ',
            'workflow_supplier_step2_title_full': 'ಸಂಗ್ರಹಣೆಗಳನ್ನು ನೋಡಿ',
            'workflow_supplier_step2_desc_full': 'ನಿರ್ದಿಷ್ಟ ಖರೀದಿದಾರರಿಂದ ನಿಮ್ಮ ಹಾಲು ವಿತರಣೆಯನ್ನು ಪರಿಶೀಲಿಸಿ',
            'workflow_supplier_step3_title_full': 'ವರದಿಗಳು ಮತ್ತು ಸಂಪಾದನೆಯನ್ನು ನೋಡಿ',
            'workflow_supplier_step3_desc_full': 'ಖರೀದಿದಾರರಿಂದ ಹಂಚಿಕೊಳ್ಳಲಾದ ವರದಿಗಳನ್ನು ನೋಡಿ ಮತ್ತು ನಿಮ್ಮ ಸಂಪಾದನೆಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
            'farmer_details': 'ರೈತರ ವಿವರಗಳು',
            'contact_info': 'ಸಂಪರ್ಕ ಮಾಹಿತಿ',
            'pro_rata': 'ಪ್ರೋ ರಾಟಾ',
            'standard': 'ಪ್ರಮಾಣಿತ',
            'pdf_bills': 'PDF ಬಿಲ್ಲುಗಳು',
            'excel_export': 'ಎಕ್ಸೆಲ್ ಎಕ್ಸ್‌ಪೋರ್ಟ್',
            'all_buyers': 'ಎಲ್ಲಾ ಖರೀದಿದಾರರು',
            'status': 'ಸ್ಥಿತಿ',
            'daily_logs': 'ದೈನಂದಿನ ಲಾಗ್‌ಗಳು',
            'rates': 'ದರಗಳು',
            'view_reports': 'ವರದಿಗಳನ್ನು ನೋಡಿ',
            'track_earnings': 'ಸಂಪಾದನೆಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
            'learn_more': 'ಇನ್ನಷ್ಟು ತಿಳಿಯಿರಿ',
            'free_for_first_month': 'ಮೊದಲ ತಿಂಗಳಿಗಾಗಿ ಸಂಪೂರ್ಣವಾಗಿ ಉಚಿತ',
            'free_for_lifetime': 'ಜೀವಿತವಾಗಿ ಉಚಿತ!',
            'learn_more_btn': 'ಇನ್ನಷ್ಟು ತಿಳಿಯಿರಿ',
            'use_web_app': 'ವೆಬ್ ಅಪ್ಲಿಕೇಶನ್ ಬಳಸಿ',
            'first_month_free': 'ಮೊದಲ ತಿಂಗಳು FREE',
            'no_credit_card': 'ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ ಅಗತ್ಯವಿಲ್ಲ',
            'support_24_7': '24/7 ಬೆಂಬಲ',
            'about_title': 'ದುಧಿಯಾ ಬಗ್ಗೆ',
            'about_subtitle': 'ಒಂದೇ ಶಕ್ತಿಶಾಲಿ ಅಪ್ಲಿಕೇಶನ್‌ನಲ್ಲಿ ನಿಮ್ಮ ಸಂಪೂರ್ಣ ಡೇರಿ ನಿರ್ವಹಣಾ ಪರಿಹಾರ',
            'about_card_what_title': 'ಏನು',
            'about_card_what_desc': 'ಅತ್ಯಾಧುನಿಕ ತಂತ್ರಜ್ಞಾನದೊಂದಿಗೆ ಹಾಲು ಸಂಗ್ರಹಣೆ ನಿರ್ವಹಣೆಗಾಗಿ ಸ್ಮಾರ್ಟ್ ಅಪ್ಲಿಕೇಶನ್',
            'about_card_who_title': 'ಯಾರಿಗೆ',
            'about_card_who_desc': 'ಸಂಗ್ರಹಣೆ ಕೇಂದ್ರಗಳು ಮತ್ತು ಡೇರಿ ರೈತರು ಒಟ್ಟಿಗೆ ಕೆಲಸ ಮಾಡುತ್ತಾರೆ',
            'about_card_how_title': 'ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ',
            'about_card_how_desc': 'ಪ್ರತಿದಿನ ಗಂಟೆಗಳನ್ನು ಉಳಿಸುವ ಸರಳ 3-ಹಂತದ ಡಿಜಿಟಲ್ ವರ್ಕ್‌ಫ್ಲೋ',
            'about_card_why_title': 'ಏಕೆ ಆರಿಸಬೇಕು',
            'about_card_why_desc': 'ಸಮಯ ಉಳಿಸಿ, ದೋಷಗಳನ್ನು ಕಡಿಮೆ ಮಾಡಿ, ವ್ಯಾಪಾರವನ್ನು ತ್ವರಿತವಾಗಿ ಬೆಳೆಸಿ',
            'watch_demo': 'ಡೆಮೋ ನೋಡಿ ಮತ್ತು ಇನ್ನಷ್ಟು ತಿಳಿಯಿರಿ',
            'demo_duration': '2-ನಿಮಿಷದ ಡೆಮೋ ವೀಡಿಯೊ',
            'whatis_title': 'ದುಧಿಯಾ ಎಂದರೆ ಏನು?',
            'whatis_subtitle': 'ಕಾಗದದ ರಜಿಸ್ಟರ್‌ಗಳು ಮತ್ತು ಹಸ್ತಚಾಲಿತ ಲೆಕ್ಕಾಚಾರಗಳನ್ನು ಬದಲಾಯಿಸುವ ಸ್ಮಾರ್ಟ್ ಅಪ್ಲಿಕೇಶನ್.',
            'whatis_without_title': 'ದುಧಿಯಾ ಇಲ್ಲದೆ',
            'whatis_without_point1': 'ಹಸ್ತಚಾಲಿತ ರಜಿಸ್ಟರ್‌ಗಳು ಕಳೆದುಹೋಗುತ್ತವೆ ಅಥವಾ ಹಾನಿಗೊಳಗಾಗುತ್ತವೆ',
            'whatis_without_point2': 'FAT/SNF ಲೆಕ್ಕಾಚಾರಗಳಲ್ಲಿ ಕ್ಯಾಲ್ಕುಲೇಟರ್ ದೋಷಗಳು',
            'whatis_without_point3': 'ರೈತರೊಂದಿಗೆ ಪಾವತಿ ವಿವಾದಗಳು',
            'whatis_without_point4': 'ಹಸ್ತಚಾಲಿತ ವರದಿಗಳಲ್ಲಿ ಗಂಟೆಗಳ ಕಾಲ ಕಳೆದುಕೊಳ್ಳುವುದು',
            'whatis_with_title': 'ದುಧಿಯಾ ಜೊತೆಗೆ',
            'whatis_with_point1': 'ಕ್ಲೌಡ್ ಬ್ಯಾಕಪ್‌ನೊಂದಿಗೆ ಡಿಜಿಟಲ್ ದಾಖಲೆಗಳು',
            'whatis_with_point2': 'ಸ್ವಯಂಚಾಲಿತ FAT/SNF ಲೆಕ್ಕಾಚಾರಗಳು',
            'whatis_with_point3': 'ಪ್ರತಿ ರೈತರಿಗೂ ಪಾರದರ್ಶಕ ವ್ಯಾಲೆಟ್',
            'whatis_with_point4': 'ಒಂದೇ-ಕ್ಲಿಕ್ PDF/Excel ವರದಿಗಳು',
            'features_title': 'ನಿಮ್ಮ ಡೇರಿ ನಡೆಸಲು ಬೇಕಾದ ಎಲ್ಲವೂ',
            'feature1_title': 'ಹಾಲು ಕ್ಯಾಲ್ಕುಲೇಟರ್',
            'feature1_desc': 'FAT, SNF ಮತ್ತು ಪರಿಮಾಣದ ಆಧಾರದ ಮೇಲೆ ಹಾಲಿನ ಮೌಲ್ಯವನ್ನು ತಕ್ಷಣ ಲೆಕ್ಕಹಾಕಿ.',
            'feature2_title': 'ರೈತ ನಿರ್ವಹಣೆ',
            'feature2_desc': 'ವಿವರವಾದ ಪ್ರೊಫೈಲ್‌ಗಳು ಮತ್ತು ಇತಿಹಾಸದೊಂದಿಗೆ ಎಲ್ಲಾ ರೈತರನ್ನು ಸೇರಿಸಿ, ಸಂಪಾದಿಸಿ ಮತ್ತು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.',
            'feature3_title': 'ಸಂಗ್ರಹಣೆ ಎಂಟ್ರಿ',
            'feature3_desc': 'ಪ್ರಮಾಣ, FAT, SNF ಮತ್ತು ದರದೊಂದಿಗೆ ಹಾಲು ವಿತರಣೆಯನ್ನು ರೆಕಾರ್ಡ್ ಮಾಡಿ.',
            'feature4_title': 'ವಾಲೆಟ್ ಮತ್ತು ಚಂದಾದಾರಿಕೆ',
            'feature4_desc': 'ವಾಲೆಟ್ ರೀಚಾರ್ಜ್ ಅಥವಾ ಚಂದಾದಾರಿಕೆ ಯೋಜನೆಗಳೊಂದಿಗೆ ಆಪ್ ಬಳಕೆಯನ್ನು ಮುಂದುವರಿಸಿ.',
            'feature5_title': 'ಶಿಫ್ಟ್ ನಿರ್ವಹಣೆ',
            'feature5_desc': 'ಬೆಳಗ್ಗೆ ಮತ್ತು ಸಂಜೆ ಶಿಫ್ಟ್‌ಗಳನ್ನು ಸುಲಭವಾಗಿ ಪ್ರತ್ಯೇಕವಾಗಿ ನಿರ್ವಹಿಸಿ.',
            'feature6_title': 'ವರದಿಗಳು ಮತ್ತು ಬಿಲ್ಲುಗಳು',
            'feature6_desc': 'ಎಲ್ಲಾ ದಿನಾಂಕ ವ್ಯಾಪ್ತಿ, ರೈತ ಅಥವಾ ಶಿಫ್ಟ್‌ಗಾಗಿ ಸಮಗ್ರ PDF/Excel ವರದಿಗಳು ಮತ್ತು ಬಿಲ್ಲುಗಳನ್ನು ರಚಿಸಿ.',
            'feature7_title': 'ಬಹುಭಾಷಾ ಬೆಂಬಲ',
            'feature7_desc': 'ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯಲ್ಲಿ ಐಪ್ ಬಳಸಿ. ಇಂಗ್ಲೀಷ್, ಹಿಂದಿ, ಪಂಜಾಬಿ ಮತ್ತು ಕನ್ನಡ ಬೆಂಬಲ.',
            'feature8_title': 'ಡೇಟಾ ಬ್ಯಾಕಪ್ ಮತ್ತು ಸುರಕ್ಷತೆ',
            'feature8_desc': 'ಸ್ವಯಂಚಾಲಿತ ಬ್ಯಾಕಪ್ ಮತ್ತು ಪುನರ್ಪ್ರಾಪ್ತಿ ಆಯ್ಕೆಗಳೊಂದಿಗೆ ಎಲ್ಲಾ ಡೇಟಾ ಸುರಕ್ಷಿತವಾಗಿ ಕ್ಲೌಡ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ.',
            'plans_badge': 'ಯೋಜನೆಗಳು ಮತ್ತು ಚಂದಾದಾರಿಕೆ',
            'plans_title': 'ನಿಮ್ಮ <span class="text-primary" style="color: #00288e;">ಡೈರಿಗಾಗಿ</span> ಸುಲಭ ಯೋಜನೆಗಳು',
            'plans_subtitle': 'ಉಚಿತವಾಗಿ ಪ್ರಾರಂಭಿಸಿ ಮತ್ತು ನಿಮ್ಮ ವ್ಯವಹಾರ ಬೆಳೆದಂತೆ ಮುಂದುವರಿಯಿರಿ',
            'plan_free_title': 'ಮೊದಲ ತಿಂಗಳು FREE',
            'plan_free_duration': '/ಮೊದಲ ತಿಂಗಳು',
            'plan_feature_all': 'ಎಲ್ಲಾ ಪ್ರೀಮಿಯಂ ಫೀಚರ್‌ಗಳು ಸೇರಿವೆ',
            'plan_feature_suppliers_unlimited': 'ಸಪ್ಲೈಯರ್‌ಗಳ ಮಿತಿ ಇಲ್ಲ',
            'plan_feature_support': '24/7 ಬೆಂಬಲ',
            'btn_start_free': 'ಉಚಿತವಾಗಿ ಪ್ರಾರಂಭಿಸಿ',
            'plan_monthly_title': 'ಮಾಸಿಕ ಯೋಜನೆ',
            'plan_monthly_duration': '/ತಿಂಗಳು',
            'plan_monthly_desc': 'ಬೆಳೆಯುತ್ತಿರುವ ಸಂಗ್ರಹ ಕೇಂದ್ರಗಳಿಗೆ ಸೂಕ್ತವಾಗಿದೆ',
            'plan_feature_suppliers_limit': 'ಸಪ್ಲೈಯರ್‌ಗಳ ಮಿತಿ ಇಲ್ಲ',
            'plan_feature_wallet_recharge': 'ವಾಲೆಟ್ ರೀಚಾರ್ಜ್ ಸೌಲಭ್ಯ',
            'plan_feature_wallet_recharge_desc': 'ನಿಮ್ಮ ಮಾಸಿಕ ಪ್ಲಾನ್ ಮುಕ್ತಾಯಗೊಂಡರೆ, ಕೆಲಸವನ್ನು ಮುಂದುವರಿಸಲು ಕನಿಷ್ಠ ₹10 ರಿಂದ ವ್ಯಾಲೆಟ್ ರೀಚಾರ್ಜ್ ಮಾಡಿ.',
            'plan_feature_reports': 'PDF ವರದಿಗಳು',
            'btn_choose_plan': 'ಈ ಯೋಜನೆಯೊಂದಿಗೆ ಪ್ರಾರಂಭಿಸಿ',
            'plan_yearly_title': 'ವಾರ್ಷಿಕ ಯೋಜನೆ',
            'plan_yearly_subtitle': 'ಅತ್ಯುತ್ತಮ ಮೌಲ್ಯ',
            'plan_yearly_price': '₹3999',
            'plan_yearly_duration': '/ವರ್ಷ',
            'plan_yearly_desc': 'ಗರಿಷ್ಠ ಉಳಿತಾಯದೊಂದಿಗೆ ಪೂರ್ಣ ವರ್ಷದ ಡೈರಿ ನಿರ್ವಹಣೆ.',
            'plan_feature_save': 'ವರ್ಷಕ್ಕೆ ₹589 ಉಳಿಸಿ',
            'plan_feature_priority_support': 'ಆದ್ಯತೆಯ 24/7 ಬೆಂಬಲ',
            'btn_get_yearly': 'ಈ ಯೋಜನೆಯೊಂದಿಗೆ ಪ್ರಾರಂಭಿಸಿ',
            'plan_wallet_title': 'ವಾಲೆಟ್ ರೀಚಾರ್ಜ್',
            'plan_wallet_min_recharge': 'ಕನಿಷ್ಠ ರೀಚಾರ್ಜ್',
            'plan_wallet_rate_desc': '₹0.0125 / ಕೆಜಿ ಸಂಗ್ರಹಣಾ ಶುಲ್ಕ',
            'plan_wallet_feature1': 'ಸಪ್ಲೈಯರ್‌ಗಳ ಮಿತಿ ಇಲ್ಲ',
            'plan_wallet_feature2': 'ಬಳಕೆಗೆ ತಕ್ಕಂತೆ ಪಾವತಿ (ಯಾವುದೇ ಸ್ಥಿರ ಮಾಸಿಕ ಶುಲ್ಕವಿಲ್ಲ)',
            'plan_wallet_feature3': '100 ಕೆಜಿ ಹಾಲಿಗೆ ಕೇವಲ ₹1.25 ಶುಲ್ಕ',
            'plan_wallet_feature4': 'ವಾಲೆಟ್ ಬ್ಯಾಲೆನ್ಸ್ ಎಂದಿಗೂ ಮುಕ್ತಾಯವಾಗುವುದಿಲ್ಲ',
            'btn_start_wallet': 'ವಾಲೆಟ್‌ನೊಂದಿಗೆ ಪ್ರಾರಂಭಿಸಿ',
            'pricing_page_title': 'Dudhiya - ಯೋಜನೆಗಳು ಮತ್ತು ಬೆಲೆ ಹೋಲಿಕೆ',
            'pricing_hero_badge': '100% ಪಾರದರ್ಶಕ ಬಿಲ್ಲಿಂಗ್',
            'pricing_hero_title': 'ನಿಮ್ಮ ಡೈರಿಗೆ ಸೂಕ್ತವಾದ ಯೋಜನೆಯನ್ನು ಆರಿಸಿ',
            'pricing_hero_subtitle': 'ನೀವು ಮಾಸಿಕ ಚಂದಾದಾರಿಕೆಯನ್ನು ಬಯಸಲಿ ಅಥವಾ ಬಳಸಿದಂತೆ ಪಾವತಿಸುವ ವಾಲೆಟ್ ರೀಚಾರ್ಜ್ ಬಯಸಲಿ, ನಮ್ಮರಲ್ಲಿ ಎರಡೂ ಆಯ್ಕೆಗಳಿವೆ.',
            'pricing_free_desc': 'ಎಲ್ಲಾ ಪ್ರೀಮಿಯಂ ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ಒಂದು ತಿಂಗಳ ಕಾಲ ಸಂಪೂರ್ಣವಾಗಿ ಉಚಿತವಾಗಿ ಟ್ರೈ ಮಾಡಿ.',
            'pricing_badge_popular': 'ಜನಪ್ರಿಯ',
            'pricing_badge_value': 'ಅತ್ಯುತ್ತಮ ಮೌಲ್ಯ',
            'pricing_badge_flexible': 'ಲಚಕದಾರ್ (ಹೊಂದಿಕೊಳ್ಳುವ)',
            'pricing_wallet_desc_short': 'ಸಂಗ್ರಹಿಸಿದ ಪ್ರತಿ ಕೆಜಿ ಹಾಲಿಗೆ ಪಾವತಿಸಿ. ನಿಮಗೆ ಅಗತ್ಯವಿದ್ದಾಗ ಮಾತ್ರ ರೀಚಾರ್ಜ್ ಮಾಡಿ.',
            'pricing_compare_title': 'ವೈಶಿಷ್ಟ್ಯಗಳ ವಿವರವಾದ ಹೋಲಿಕೆ',
            'pricing_compare_subtitle': 'ನಿಮ್ಮ ಡೈರಿ ವ್ಯವಹಾರಕ್ಕೆ ಸರಿಯಾದ ಯೋಜನೆಯನ್ನು ಕಂಡುಹಿಡಿಯಲು ಎಲ್ಲಾ ಯೋಜನೆಗಳನ್ನು ಹೋಲಿಕೆ ಮಾಡಿ.',
            'pricing_table_header_features': 'ವೈಶಿಷ್ಟ್ಯಗಳು',
            'pricing_row_cost': 'ಚಂದಾದಾರಿಕೆ ವೆಚ್ಚ',
            'pricing_row_min_deposit': 'ಕನಿಷ್ಠ ಠೇವಣಿ/ಸೆಟಪ್',
            'pricing_row_pay_as_you_go': 'ಬಳಸಿದಂತೆ ಪಾವತಿ (ಪ್ರತಿ ಕೆಜಿಗೆ)',
            'pricing_row_reports': 'ವಿವರವಾದ PDF ಮತ್ತು Excel ವರದಿಗಳು',
            'pricing_row_backup': 'ಸ್ವಯಂಚಾಲಿತ ಕ್ಲೌಡ್ ಬ್ಯಾಕಪ್‌ಗಳು',
            'pricing_row_shift': 'ಶಿಫ್ಟ್ ನಿರ್ವಹಣೆ (ಬೆಳಗ್ಗೆ/ಸಂಜೆ)',
            'pricing_row_support': 'ಗ್ರಾಹಕ ಬೆಂಬಲ',
            'pricing_info_title': 'ಪದೇ ಪದೇ ಕೇಳಲಾಗುವ ಪ್ರಶ್ನೆಗಳು',
            'pricing_q1': 'ನಾನು ಯಾವಾಗ ಬೇಕಾದರೂ ಯೋಜನೆಗಳನ್ನು ಬದಲಾಯಿಸಬಹುದೇ?',
            'pricing_a1': 'ಹೌದು! ನಿಮ್ಮ ಡ್ಯಶ್‌ಬೋರ್ಡ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳ ಮೂಲಕ ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ಉಚಿತ ಪ್ರಯೋಗದಿಂದ ಮಾಸಿಕ, ವಾರ್ಷಿಕ ಅಥವಾ ವಾಲೆಟ್ ರೀಚಾರ್ಜ್‌ಗೆ ಅಪ್‌ಗ್ರೇಡ್ ಮಾಡಬಹುದು.',
            'pricing_q2': 'ವಾಲೆಟ್ ರೀಚಾರ್ಜ್ ಯೋಜನೆ ನನಗೆ ಹೇಗೆ ಶುಲ್ಕ ವಿಧಿಸುತ್ತದೆ?',
            'pricing_a2': 'ವಾಲೆಟ್ ಯೋಜನೆಯಲ್ಲಿ, ಯಾವುದೇ ಸ್ಥಿರ ಮಾಸಿಕ ವೆಚ್ಚಗಳಿಲ್ಲ. ಸಂಗ್ರಹಿಸಿದ ಹಾಲಿಗೆ ಕೇವಲ ₹0.0125 ಪ್ರತಿ ಕೆಜಿಗೆ ಪಾವತಿಸುತ್ತೀರಿ. ಉದಾಹರಣೆಗೆ, ನೀವು 100 ಕೆಜಿ ಹಾಲು ಸಂಗ್ರಹಿಸಿದರೆ, ನಿಮ್ಮ ವಾಲೆಟ್ ಬ್ಯಾಲೆನ್ಸ್‌ನಿಂದ ಕೇವಲ ₹1.25 ಕಡಿತಗೊಳಿಸಲಾಗುತ್ತದೆ. ನೀವು ಕನಿಷ್ಠ ₹10 ರಿಂದ ರೀಚಾರ್ಜ್ ಮಾಡಿಕೊಂಡು ಸೇವೆಗಳನ್ನು ಬಳಸಬಹುದು.',
            'pricing_q3': 'ನನ್ನ ವಾಲೆಟ್ ಬ್ಯಾಲೆನ್ಸ್ ಅವಧಿ ಮುಗಿಯುತ್ತದೆಯೇ?',
            'pricing_a3': 'ಇಲ್ಲ! ನಿಮ್ಮ ವಾಲೆಟ್ ಬ್ಯಾಲೆನ್ಸ್ ಜೀವಿತಾವಧಿಯ ಸಿಂಧುತ್ವವನ್ನು ಹೊಂದಿದ್ದು ಎಂದಿಗೂ ಮುಕ್ತಾಯವಾಗುವುದಿಲ್ಲ, ನಿಮ್ಮ ಸಂಗ್ರಹಣಾ ಕೇಂದ್ರವು ಮುಚ್ಚಿದ್ದರೂ ಸಹ.',
            'btn_pricing_know_more': 'ಯೋಜನೆಗಳು ಮತ್ತು ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ಹೋಲಿಕೆ ಮಾಡಿ',
            'calc_title': 'ಯೋಜನೆ ಶಿಫಾರಸು ಕ್ಯಾಲ್ಕುಲೇಟರ್',
            'calc_subtitle': 'ನಿಮ್ಮ ಮಾಸಿಕ ಹಾಲಿನ ಪ್ರಮಾಣವನ್ನು ನಮೂದಿಸಿ ಮತ್ತು ಸ್ಥಿರ ಮಾಸಿಕ ಚಂದಾದಾರಿಕೆ ಅಥವಾ ವಾಲೆಟ್ ರೀಚಾರ್ಜ್ ಯೋಜನೆಯಲ್ಲಿ ಯಾವುದು ಅಗ್ಗವಾಗಿದೆ ಎಂದು ತಿಳಿಯಿರಿ.',
            'calc_label_milk': 'ಅಂದಾಜು ಮಾಸಿಕ ಹಾಲಿನ ಪ್ರಮಾಣ (ಕಿಲೋಗ್ರಾಂಗಳಲ್ಲಿ)',
            'calc_sub_flat_cost': 'ಸ್ಥಿರ ಚಂದಾದಾರಿಕೆ ಶುಲ್ಕ',
            'calc_sub_usage_cost': '₹0.0125 / ಕೆಜಿಗೆ ವಿಧಿಸಲಾಗುತ್ತದೆ',
            'btn_call_us': 'ಈಗ ನಮ್ಮನ್ನು ಕರೆಯಿರಿ',
            'btn_use_web_app': 'ವೆಬ್ ಆಪ್ ಬಳಸಿ',
            'btn_contact_us': 'ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ',
            // Modal feature data
            'modal_milk_calculator_title': 'ಹಾಲು ಕ್ಯಾಲ್ಕುಲೇಟರ್',
            'modal_milk_calculator_desc': 'FAT, SNF ಮತ್ತು ಪರಿಮಾಣದ ಆಧಾರದ ಮೇಲೆ ಹಾಲಿನ ಮೌಲ್ಯವನ್ನು ತಕ್ಷಣ ಲೆಕ್ಕಹಾಕಿ.',
            'modal_milk_calculator_feature1': 'ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ: ತೂಕ, FAT ಪ್ರತಿಶತ, SNF ಪ್ರತಿಶತ',
            'modal_milk_calculator_feature2': 'ಈಗ ಕಳೆದುಹೋಗುವ ಕಾಗದದ ರಜಿಸ್ಟರ್‌ಗಳಿಲ್ಲ',
            'modal_milk_calculator_feature3': 'ಸ್ವಯಂಚಾಲಿತ ಬ್ಯಾಕಪ್‌ನೊಂದಿಗೆ ಡಿಜಿಟಲ್ ರೆಕಾರ್ಡ್‌ಗಳು',
            'modal_milk_calculator_feature4': 'ಸ್ಮಾರ್ಟ್ ಸಲಹೆಗಳೊಂದಿಗೆ ಸುಲಭ ಡೇಟಾ ಎಂಟ್ರಿ',
            'modal_milk_calculator_feature5': 'ರಿಯಲ್-ಟೈಮ್ ಪರಿಶೀಲನೆ ಮತ್ತು ದೋಷ ತಡೆಗಟ್ಟುವಿಕೆ',
            'modal_farmer_management_title': 'ರೈತ (ಪೂರೈಕೆದಾರ) ನಿರ್ವಹಣೆ',
            'modal_farmer_management_desc': 'ವಿವರವಾದ ಪ್ರೊಫೈಲ್‌ಗಳು ಮತ್ತು ಇತಿಹಾಸದೊಂದಿಗೆ ಎಲ್ಲಾ ರೈತರನ್ನು ಸೇರಿಸಿ, ಸಂಪಾದಿಸಿ ಮತ್ತು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.',
            'modal_farmer_management_feature1': 'ರೈತರ ವಿವರಗಳನ್ನು ಉಳಿಸಿ: ಹೆಸರು, ಫೋನ್ ಸಂಖ್ಯೆ, ಗ್ರಾಮ',
            'modal_farmer_management_feature2': 'ಹೆಸರು ಅಥವಾ ID ಸಂಖ್ಯೆಯಿಂದ ರೈತರನ್ನು ತ್ವರಿತವಾಗಿ ಹುಡುಕಿ',
            'modal_farmer_management_feature3': 'ಪ್ರತಿಯೊಬ್ಬ ರೈತರ ಡಿಲಿವರಿಯ ಸಂಪೂರ್ಣ ಇತಿಹಾಸವನ್ನು ನೋಡಿ',
            'modal_farmer_management_feature4': 'ಹಲವು ರೈತರನ್ನು ದಕ್ಷತೆಯಿಂದ ನಿರ್ವಹಿಸಿ',
            'modal_farmer_management_feature5': 'ರೈತರ ಪ್ರದರ್ಶನ ಮತ್ತು ಗುಣಮಟ್ಟದ ಪ್ರವೃತ್ತಿಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
            'modal_collection_entry_title': 'ಸಂಗ್ರಹಣೆ ಎಂಟ್ರಿ',
            'modal_collection_entry_desc': 'ಪ್ರಮಾಣ, FAT, SNF ಮತ್ತು ದರದೊಂದಿಗೆ ಹಾಲು ವಿತರಣೆಯನ್ನು ರೆಕಾರ್ಡ್ ಮಾಡಿ.',
            'modal_collection_entry_feature1': 'ನಿಮ್ಮ ಫೋನ್‌ನಲ್ಲಿ ರೈತರಿಂದ ಹಾಲಿನ ಡಿಲಿವರಿಯನ್ನು ರೆಕಾರ್ಡ್ ಮಾಡಿ',
            'modal_collection_entry_feature2': 'ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ: ತೂಕ, FAT ಪ್ರತಿಶತ, SNF ಪ್ರತಿಶತ',
            'modal_collection_entry_feature3': 'ಕಾರ್ಯನಿರತ ಸಂಗ್ರಹಣೆ ಗಂಟೆಗಳಲ್ಲಿ ತ್ವರಿತ ಎಂಟ್ರಿ',
            'modal_collection_entry_feature4': 'ರಿಯಲ್-ಟೈಮ್ ಡೇಟಾ ಪರಿಶೀಲನೆ',
            'modal_collection_entry_feature5': 'ಸ್ವಯಂಚಾಲಿತ ಗುಣಮಟ್ಟದ ಲೆಕ್ಕಾಚಾರಗಳು',
            'modal_wallet_payments_title': 'ವ್ಯಾಲೆಟ್ ಮತ್ತು ಪಾವತಿಗಳು',
            'modal_wallet_payments_desc': 'ವಾಲೆಟ್ ರೀಚಾರ್ಜ್ ಅಥವಾ ಚಂದಾದಾರಿಕೆ ಯೋಜನೆಗಳೊಂದಿಗೆ ಆಪ್ ಬಳಕೆಯನ್ನು ಮುಂದುವರಿಸಿ.',
            // 'modal_wallet_payments_feature1': 'ರೈತರಿಗೆ ಪಾವತಿಸಬೇಕಾದ ಹಣವನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ಡಿಜಿಟಲ್ ವ್ಯಾಲೆಟ್',
            'modal_wallet_payments_feature2': 'ಆನ್‌ಲೈನ್ ಪಾವತಿ (UPI/ಕಾರ್ಡ್) ಬಳಸಿ ನಿಮ್ಮ ವ್ಯಾಲೆಟ್‌ಗೆ ಹಣವನ್ನು ಸೇರಿಸಿ',
            'modal_wallet_payments_feature3': 'ರಿಚಾರ್ಜ್ ಮಾಡಿದಾಗ ಬೋನಸ್ ಹಣ ಪಡೆಯಿರಿ (10% ಹೆಚ್ಚುವರಿ ಆಫರ್‌ಗಳು)',
            'modal_wallet_payments_feature4': 'ರೈತರು ತಮ್ಮ ಶೇಷ ಮತ್ತು ಪಾವತಿ ಇತಿಹಾಸವನ್ನು ನೋಡಬಹುದು',
            'modal_wallet_payments_feature5': 'ತಕ್ಷಣ ಪಾವತಿ ಸಂಸ್ಕರಣೆ ಮತ್ತು ಅಧಿಸೂಚನೆಗಳು',
            'modal_shift_management_title': 'ಶಿಫ್ಟ್ ನಿರ್ವಹಣೆ',
            'modal_shift_management_desc': 'ಬೆಳಗ್ಗೆ ಮತ್ತು ಸಂಜೆ ಶಿಫ್ಟ್‌ಗಳನ್ನು ಸುಲಭವಾಗಿ ಪ್ರತ್ಯೇಕವಾಗಿ ನಿರ್ವಹಿಸಿ.',
            'modal_shift_management_feature1': 'ಬೆಳಗ್ಗೆ ಮತ್ತು ಸಂಜೆ ಹಾಲು ಸಂಗ್ರಹಣೆಗಾಗಿ ಪ್ರತ್ಯೇಕ ಎಂಟ್ರಿಗಳು',
            'modal_shift_management_feature2': 'ಹಾಲು ಯಾವ ಶಿಫ್ಟ್‌ನಲ್ಲಿ ಡಿಲಿವರಿ ಮಾಡಲಾಯಿತು ಎಂದು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
            'modal_shift_management_feature3': 'ಶಿಫ್ಟ್-ವಾರ್ ವರದಿ ಮತ್ತು ವಿಶ್ಲೇಷಣೆ',
            'modal_shift_management_feature4': 'ವಿವಿಧ ಶಿಫ್ಟ್‌ಗಳಿಗೆ ವಿವಿಧ ಬೆಲೆ ನಿರ್ಧಾರಣೆಯನ್ನು ನಿರ್ವಹಿಸಿ',
            'modal_shift_management_feature5': 'ಸುಲಭ ಶಿಫ್ಟ್ ಸ್ವಿಚಿಂಗ್ ಮತ್ತು ಟ್ರ್ಯಾಕಿಂಗ್',
            'modal_reports_bills_title': 'ವರದಿಗಳು ಮತ್ತು ಬಿಲ್ಲುಗಳು',
            'modal_reports_bills_desc': 'ಯಾವುದೇ ದಿನಾಂಕ ವ್ಯಾಪ್ತಿ, ರೈತ ಅಥವಾ ಶಿಫ್ಟ್‌ಗಾಗಿ ಸಮಗ್ರ PDF/Excel ವರದಿಗಳು ಮತ್ತು ಬಿಲ್ಲುಗಳನ್ನು ರಚಿಸಿ.',
            'modal_reports_bills_feature1': 'ರೈತರಿಗಾಗಿ PDF ಬಿಲ್‌ಗಳನ್ನು ರಚಿಸಿ',
            'modal_reports_bills_feature2': 'ಯಾವುದೇ ದಿನಾಂಕ ವ್ಯಾಪ್ತಿಗಾಗಿ ವರದಿಗಳನ್ನು ರಚಿಸಿ (ದೈನಂದಿನ, ವಾರಕ್ಕೆ, ಮಾಸಿಕ)',
            'modal_reports_bills_feature3': 'WhatsApp ಮೂಲಕ ವರದಿಗಳನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ ಮತ್ತು ಹಂಚಿಕೊಳ್ಳಿ',
            'modal_reports_bills_feature4': 'ಒಟ್ಟು ಸಂಗ್ರಹಿಸಿದ ಹಾಲು, ಪಾವತಿಸಬೇಕಾದ ಒಟ್ಟು ಹಣ ನೋಡಿ',
            'modal_reports_bills_feature5': 'ಅನುಕೂಲನೀಯ ವರದಿ ಟೆಂಪ್ಲೇಟ್‌ಗಳು ಮತ್ತು ಫಾರ್ಮ್ಯಾಟ್‌ಗಳು',
            'modal_multi_language_title': 'ಬಹುಭಾಷಾ ಬೆಂಬಲ',
            'modal_multi_language_desc': 'ಹಲವು ಪ್ರಾದೇಶಿಕ ಭಾಷೆಗಳ ಬೆಂಬಲದೊಂದಿಗೆ ನಿಮ್ಮ ಆದ್ಯತೆಯ ಭಾಷೆಯಲ್ಲಿ ಅಪ್ಲಿಕೇಶನ್ ಬಳಸಿ.',
            'modal_multi_language_feature1': 'ಇಂಗ್ಲೀಷ್',
            'modal_multi_language_feature2': 'ಹಿಂದಿ (हिन्दी)',
            'modal_multi_language_feature3': 'ಪಂಜಾಬಿ (ਪੰਜਾਬੀ)',
            'modal_multi_language_feature4': 'ಕನ್ನಡ (ಕನ್ನಡ)',
            'modal_multi_language_feature5': 'ಅಪ್ಲಿಕೇಶನ್‌ನೊಳಗೆ ಸುಲಭ ಭಾಷಾ ಬದಲಾವಣೆ',
            'modal_data_backup_title': 'ಡೇಟಾ ಬ್ಯಾಕಪ್ ಮತ್ತು ಸುರಕ್ಷತೆ',
            'modal_data_backup_desc': 'ಸ್ವಯಂಚಾಲಿತ ಬ್ಯಾಕಪ್ ಮತ್ತು ಪುನರ್ಪ್ರಾಪ್ತಿ ಆಯ್ಕೆಗಳೊಂದಿಗೆ ಎಲ್ಲಾ ಡೇಟಾ ಸುರಕ್ಷಿತವಾಗಿ ಕ್ಲೌಡ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ.',
            'modal_data_backup_feature1': 'ಎಲ್ಲಾ ಡೇಟಾ ಸುರಕ್ಷಿತವಾಗಿ ಕ್ಲೌಡ್‌ನಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ',
            'modal_data_backup_feature2': 'ಯಾವುದೇ ಸಾಧನದಿಂದ ನಿಮ್ಮ ಡೇಟಾವನ್ನು ಪ್ರವೇಶಿಸಿ',
            'modal_data_backup_feature3': 'ನೀವು ಫೋನ್ ಬದಲಾದರೆ, ನಿಮ್ಮ ಡೇಟಾ ಇನ್ನೂ ಅಲ್ಲೇ ಇದೆ',
            'modal_data_backup_feature4': 'ಕಾಗದದ ರೆಕಾರ್ಡ್‌ಗಳು ಕಳೆದುಹೋಗುವ ಭಯವಿಲ್ಲ',
            'modal_data_backup_feature5': 'ಸ್ವಯಂಚಾಲಿತ ಬ್ಯಾಕಪ್ ಮತ್ತು ಪುನರ್ಪ್ರಾಪ್ತಿ ಆಯ್ಕೆಗಳು',
            'benefits_ready_text': 'ಈ ಪ್ರಯೋಜನೆಗಳನ್ನು ಅನುಭವಿಸಲು ಸಿದ್ಧರಾಗಿದ್ದೀರಾ?',
            'whois_badge': 'ಡೇರಿಯಲ್ಲಿ ಎಲ್ಲರಿಗೂ',
            'whois_title': 'ದುಧಿಯಾ ಯಾರಿಗೆ?',
            'whois_subtitle': 'ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ದುಧಿಯಾ ನಿಮ್ಮ ಡೇರಿ ನಿರ್ವಹಣೆಯನ್ನು ಹೇಗೆ ಸರಳಗೊಳಿಸುತ್ತದೆ ಎಂದು ಕಂಡುಹಿಡಿಯಿರಿ',
            'whois_card1_role': 'ನಿರ್ವಾಹಕ ಪಾತ್ರ',
            'whois_card1_title': 'ಸಂಗ್ರಹಣೆ ಕೇಂದ್ರಗಳು',
            'whois_card1_desc': 'ನೀವು ಹಾಲು ಸಂಗ್ರಹಣೆ ಕೇಂದ್ರವನ್ನು ನಡೆಸುವ ಖರೀದಿದಾರರೇ? ನಮ್ಮ ಶಕ್ತಿಶಾಲಿ Android ಅಪ್ಲಿಕೇಶನ್ ಅಥವಾ ವೆಬ್ ಅಪ್ಲಿಕೇಶನ್‌ನೊಂದಿಗೆ 10 ರಿಂದ 1000+ ರೈತರನ್ನು ನಿರ್ವಹಿಸಿ. ಸಂಗ್ರಹಣೆಗಳನ್ನು ರೆಕಾರ್ಡ್ ಮಾಡಿ, ದರಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಲೆಕ್ಕಹಾಕಿ, ಮತ್ತು ತಕ್ಷಣ ವರದಿಗಳನ್ನು ರಚಿಸಿ.',
            'whois_card1_feature1_title': 'ಸರಬರಾಜುದಾರರನ್ನು ಸೇರಿಸಿ ಮತ್ತು ನಿರ್ವಹಿಸಿ',
            'whois_card1_feature1_desc': 'ಅಪ್ಲಿಕೇಶನ್‌ನಲ್ಲಿ ರೈತರ ಪ್ರೊಫೈಲ್‌ಗಳನ್ನು ರಚಿಸಿ',
            'whois_card1_feature2_title': 'ಸಂಗ್ರಹಣೆಗಳನ್ನು ರೆಕಾರ್ಡ್ ಮಾಡಿ',
            'whois_card1_feature2_desc': 'ಸ್ವಯಂಚಾಲಿತ FAT/SNF ಲೆಕ್ಕಾಚಿಯೊಂದಿಗೆ ಹಾಲು ಡೇಟಾ ನಮೂದಿಸಿ',
            'whois_card1_feature3_title': 'ವರದಿಗಳನ್ನು ರಚಿಸಿ ಮತ್ತು ಹಂಚಿಕೊಳ್ಳಿ',
            'whois_card1_feature3_desc': 'WhatsApp ಮೂಲಕ PDF/Excel ಬಿಲ್‌ಗಳು',
            'whois_card1_desc_short': 'ಸಂಗ್ರಹಣೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ, ದರಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತಗೊಳಿಸಿ ಮತ್ತು ರಿಪೋರ್ಟ್ ತಯಾರಿಸಿ.',
            'whois_card1_feat_short1': 'ಸರಬರಾಜುದಾರರನ್ನು ಸೇರಿಸಿ',
            'whois_card1_feat_short2': 'ರಿಪೋರ್ಟ್ಗಳನ್ನು ರಚಿಸಿ',
            'whois_card2_role': 'ವೀಕ್ಷಕ ಪಾತ್ರ',
            'whois_card2_title': 'ಡೇರಿ ರೈತರು',
            'whois_card2_desc': 'ನೀವು ಹಾಲನ್ನು ಪೂರೈಸುವ ಸರಬರಾಜುದಾರರೇ? ನಿಮ್ಮ ದೈನಂದಿನ ವಿತರಣೆಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು, ನಿಮ್ಮ ಸಂಪಾದನೆಯನ್ನು ವೀಕ್ಷಿಸಲು, ಮತ್ತು ನಿಮ್ಮ ಸಂಗ್ರಹಣೆ ಕೇಂದ್ರದಿಂದ ಹಂಚಿಕೊಳ್ಳಲಾದ ವರದಿಗಳಿಗೆ ಪ್ರವೇಶಿಸಲು ನಮ್ಮ ಮೊಬೈಲ್ ಅಪ್ಲಿಕೇಶನ್ ಅನ್ನು ಬಳಸಿ - ಎಲ್ಲವೂ ಒಂದೇ ಸ್ಥಳದಲ್ಲಿ.',
            'whois_card2_feature1_title': 'ಸಂಪರ್ಕಿತ ಡೇರಿಗಳನ್ನು ನೋಡಿ',
            'whois_card2_feature1_desc': 'ಅಪ್ಲಿಕೇಶನ್‌ನಲ್ಲಿ ಎಲ್ಲಾ ಸಂಗ್ರಹಣೆ ಕೇಂದ್ರಗಳನ್ನು ನೋಡಿ',
            'whois_card2_feature2_title': 'ನಿಮ್ಮ ಸಂಗ್ರಹಣೆಗಳನ್ನು ನೋಡಿ',
            'whois_card2_feature2_desc': 'ದೈನಂದಿನ ಲಾಗ್‌ಗಳು ಮತ್ತು ಹಾಲು ದರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ',
            'whois_card2_feature3_title': 'ನಿಮ್ಮ ಸಂಪಾದನೆಯನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
            'whois_card2_feature3_desc': 'ವಾಲೆಟ್ ಮತ್ತು ವರದಿಗಳನ್ನು ನೈಜ-ಸಮಯದಲ್ಲಿ ವೀಕ್ಷಿಸಿ',
            'whois_card2_desc_short': 'ಡಿಲಿವರಿಗಳನ್ನು ಮತ್ತು ವಾಲೆಟ್ ಬ್ಯಾಲೆನ್ಸನ್ನು ಒಂದೇ ಜಾಗದಲ್ಲಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.',
            'whois_card2_feat_short1': 'ಸಂಗ್ರಹಣೆಗಳನ್ನು ನೋಡಿ',
            'whois_card2_feat_short2': 'ಆದಾಯವನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
            'whois_card3_role': 'ಉದ್ಯಮ ಪಾತ್ರ',
            'whois_card3_title': 'ಸಹಕಾರ ಸಂಘಗಳು ಮತ್ತು ಸಮಾಜಗಳು',
            'whois_card3_desc': 'ಹಲವು ಸಂಗ್ರಹಣೆ ಕೇಂದ್ರಗಳನ್ನು ನಿರ್ವಹಿಸುತ್ತಿದ್ದೀರಾ? ನಮ್ಮ ವೆಬ್ ಅಪ್ಲಿಕೇಶನ್ ನಿಮಗೆ ಎಲ್ಲಾ ಸ್ಥಳಗಳನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಲು, ಸಂಯೋಜಿತ ವಿಶ್ಲೇಷಣಗಳನ್ನು ವೀಕ್ಷಿಸಲು, ಮತ್ತು ಪ್ರವೇಶವನ್ನು ನಿರ್ವಹಿಸಲು ಕೇಂದ್ರೀಕೃತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಅನ್ನು ನೀಡುತ್ತದೆ.',
            'whois_card3_feature1_title': 'ಬಹು-ಕೇಂದ್ರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
            'whois_card3_feature1_desc': 'ವೆಬ್ ಅಪ್ಲಿಕೇಶನ್ ಮೂಲಕ ಎಲ್ಲಾ ಕೇಂದ್ರಗಳನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ',
            'whois_card3_feature2_title': 'ಸಂಯೋಜಿತ ವರದಿಗಳು',
            'whois_card3_feature2_desc': 'ಎಲ್ಲಾ ಕೇಂದ್ರಗಳಾದ್ಯಂತ ಸಂಯೋಜಿತ ವಿಶ್ಲೇಷಣ',
            'whois_card3_feature3_title': 'ಪಾತ್ರ-ಆಧಾರಿತ ಪ್ರವೇಶ',
            'whois_card3_feature3_desc': 'ಪ್ರತಿ ಕೇಂದ್ರಕ್ಕೆ ನಿರ್ವಾಹಕರನ್ನು ನಿಯೋಜಿಸಿ',
            'whois_card3_desc_short': 'ಬಹು-ಕೇಂದ್ರಗಳನ್ನು ಕೇಂದ್ರೀಕೃತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಿಂದ ಗಮನಿಸಿ ಮತ್ತು ಸಂಯೋಜಿತ ವಿಶ್ಲೇಷಣೆಯನ್ನು ಪಡೆಯಿರಿ.',
            'whois_card3_feat_short1': 'ಸಂಯೋಜಿತ ವರದಿಗಳು',
            'whois_card3_feat_short2': 'ಪಾತ್ರ ಪ್ರವೇಶ',
            'whois_buyer_note': 'ಖರೀದಿದಾರರು ಅಪ್ಲಿಕೇಶನ್/ವೆಬ್ ಮೂಲಕ ನಿರ್ವಹಿಸುತ್ತಾರೆ',
            'whois_supplier_note': 'ಸರಬರಾಜುದಾರರು ಮೊಬೈಲ್ ಅಪ್ಲಿಕೇಶನ್ ಮೂಲಕ ವೀಕ್ಷಿಸುತ್ತಾರೆ',
            'whois_cta_title': 'ಪ್ರಾರಂಭಿಸಲು ಸಿದ್ಧರಾ?',
            'whois_cta_desc': 'ಚಲಿಸುವ ಬಳಕೆಗಾಗಿ ದುಧಿಯಾ Android ಅಪ್ಲಿಕೇಶನ್ ಅನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ ಅಥವಾ ದೊಡ್ಡ ಸ್ಕ್ರೀನ್ ಇರುವ ಯಾವುದೇ ಸಾಧನದಿಂದ ವೆಬ್ ಅಪ್ಲಿಕೇಶನ್ ಅನ್ನು ಬಳಸಿ.',
            'faq_title': 'ಆಗಾಗ್ಗೆ ಕೇಳಲಾಗುವ ಪ್ರಶ್ನೆಗಳು',
            'faq_a1_p1': 'ಸರಬರಾಜುದಾರರಿಗೆ (ರೈತರಿಗೆ): ಸಂಪೂರ್ಣವಾಗಿ ಉಚಿತ. ಸರಬರಾಜುದಾರರು ಯಾವುದೇ ವೆಚ್ಚವಿಲ್ಲದೆ ತಮ್ಮ ಹಾಲು ಸರಬರಾಜುವನ್ನು, ಗಳಿಸುವ ಆದಾಯವನ್ನು ನೋಡಬಹುದು ಮತ್ತು ತಮ್ಮ ಪ್ರೊಫೈಲ್ ಅನ್ನು ನಿರ್ವಹಿಸಬಹುದು.',
            'faq_a1_p2': 'ಖರೀದಿದಾರರಿಗೆ (ಸಂಗ್ರಹಣೆ ಕೇಂದ್ರಗಳಿಗೆ): ಮೊದಲ ತಿಂಗಳು ಉಚಿತ. ಪ್ರಯೋಗದ ನಂತರ, ನಿಮ್ಮ ಸಂಗ್ರಹಣೆ ಪರಿಮಾಣ ಮತ್ತು ವಾಲೆಟ್ ವೈಶಿಷ್ಟ್ಯಗಳ ಆಧಾರದ ಮೇಲೆ ಚಂದಾಯಿತ ಯೋಜನೆಗಳು ಲಭ್ಯವಿವೆ.',
            'faq_a2': 'ಹೌದು, ನಿಮ್ಮ ಡೇಟಾ ಸ್ವಯಂಚಾಲಿತ ಬ್ಯಾಕಪ್‌ನೊಂದಿಗೆ ಕ್ಲೌಡ್‌ನಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿ ಸಂಗ್ರಹಿಸಲಾಗಿದೆ. ನೀವು ನಿಮ್ಮ ಫೋನ್ ಕಳೆದುಮಾಡಿದರೆ ಅಥವಾ ಸಾಧನಗಳನ್ನು ಬದಲಾದರೆ, ನಿಮ್ಮ ಡೇಟಾ ಸುರಕ್ಷಿತವಾಗಿರುತ್ತದೆ ಮತ್ತು ನೀವು ಲಾಗಿನ್ ಆದಾಗ ತಕ್ಷಣ ಪ್ರವೇಶಿಸಬಹುದು.',
            'faq_a4': 'ನೀವು ಸುಲಭವಾಗಿ ಅಪ್ಲಿಕೇಶನ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳಿಂದ ಪಾತ್ರಗಳನ್ನು ಬದಲಾಯಿಸಬಹುದು. ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಮೇಲೆ ಟ್ಯಾಪ್ ಮಾಡಿ, "ಪಾತ್ರ ಬದಲಾಯಿಸಿ" ಆಯ್ಕೆಮಾಡಿ, ಮತ್ತು ಖರೀದಿದಾರ (ಸಂಗ್ರಹಣೆ ಕೇಂದ್ರ) ಅಥವಾ ಸರಬರಾಜುದಾರ (ರೈತ) ಮೋಡ್ ನಡುವೆ ಆಯ್ಕೆಮಾಡಿ. ಪ್ರತಿಯೊಂದು ಪಾತ್ರಕ್ಕೆ ಅದರದೇ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮತ್ತು ವೈಶಿಷ್ಟ್ಯಗಳಿವೆ.',
            'faq_a5': 'ದುಧಿಯಾ ನಿಮಗೆ ಸಮಗ್ರ ವರದಿಗಳನ್ನು ರಚಿಸಲು ಅನುಮತಿಸುತ್ತದೆ: ಸಂಗ್ರಹಣೆ ವರದಿಗಳು (ದೈನಂದಿನ, ವಾರದ, ಮಾಸಿಕ), ರೈತ ವಾಲೆಟ್ ಹೇಳಿಕೆಗಳು, ಪಾವತಿ ಸಾರಾಂಶಗಳು, ಮತ್ತು ಶಿಫ್ಟ್-ವಾರ ವರದಿಗಳು. ಎಲ್ಲಾ ವರದಿಗಳನ್ನು PDF ಅಥವಾ Excel ಆಗಿ ಎಕ್ಸ್‌ಪೋರ್ಟ್ ಮಾಡಬಹುದು ಮತ್ತು WhatsApp ಮೂಲಕ ತಕ್ಷಣವಾಗಿ ಹಂಚಿಕೊಳ್ಳಬಹುದು.',
            'free_trial_text': 'ಅಪ್ಲಿಕೇಶನ್ ಅನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ ಮತ್ತು ಇಂದು ನಿಮ್ಮ ಉಚಿತ ಪ್ರಯೋಗವನ್ನು ಪ್ರಾರಂಭಿಸಿ — ಯಾವುದೇ ಕ್ರೆಡಿಟ್ ಕಾರ್ಡ್ ಅಗತ್ಯವಿಲ್ಲ!',
            'android_version': 'Android 5.0+',
            'modal_close': 'ಮುಚ್ಚಿಸಿ',
            'modal_key_features': 'ಪ್ರಮುಖ ವೈಶಿಷ್ಟ್ಯಗಳು',
            'modal_try_feature': 'ಈ ವೈಶಿಷ್ಟ್ಯವನ್ನು ಪ್ರಯತ್ನಿಸಿ',
            'benefits_rating': '4.9/5 ರೇಟಿಂಗ್',
            'benefits_subtitle': 'ದುಧಿಯಾವನ್ನು ಏಕೆ ಆರಿಸಬೇಕು?',
            'benefits_title': 'ದಕ್ಷತೆ ಪೂರಕ ಸುಧಾರಿತ ರೈತಗಾರಿಕೆ',
            'benefit1_title': 'ಪ್ರತಿದಿನ ಗಂಟೆಗಳನ್ನು ಉಳಿಸಿ',
            'benefit1_desc': 'ಸ್ವಯಂಚಾಲಿತ ಲೆಕ್ಕಾಚಾರಗಳು ಹಸ್ತಚಾಲಿತ ಕೆಲಸವನ್ನು ತೆಗೆದುಹಾಕುತ್ತವೆ ಮತ್ತು 99% ದೋಷಗಳನ್ನು ಕಡಿಮೆ ಮಾಡುತ್ತವೆ.',
            'benefit2_title': 'ವಿಶ್ವಾಸ ನಿರ್ಮಿಸಿ',
            'benefit2_desc': 'ಪಾರದರ್ಶಕ ಡಿಜಿಟಲ್ ದಾಖಲೆಗಳು ನಿಮ್ಮ ರೈತರೊಂದಿಗೆ ವಿಶ್ವಾಸವನ್ನು ಸೃಷ್ಟಿಸುತ್ತವೆ.',
            'benefit3_title': 'ನಿಮ್ಮ ವ್ಯವಹಾರವನ್ನು ಬೆಳೆಸಿ',
            'benefit3_desc': 'ಅದೇ ತಂಡದ ಗಾತ್ರದೊಂದಿಗೆ 10x ಹೆಚ್ಚು ರೈತರನ್ನು ನಿರ್ವಹಿಸಿ.',
            'download_badge': 'ಈಗ v2.0 ಲೈವ್ ಆಗಿದೆ',
            'download_title': 'ನಿಮ್ಮ ಡೇರಿ ಕಾರ್ಯಾಚರಣೆಗಳಲ್ಲಿ ಕ್ರಾಂತಿ ತBringರಿ',
            'download_subtitle': 'ದುಧಿಯಾದೊಂದಿಗೆ ತಮ್ಮ ವ್ಯವಹಾರವನ್ನು ಪರಿವರ್ತಿಸುತ್ತಿರುವ 10,000+ ಡೇರಿ ಪೇಷೆವಾರರೊಂದಿಗೆ ಸೇರಿ',
            'scan_to_download': 'ಡೌನ್‌ಲೋಡ್ ಮಾಡಲು ಸ್ಕ್ಯಾನ್ ಮಾಡಿ',
            'download_for': 'ಇದಕ್ಕಾಗಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',
            'download_android': 'ಆಂಡ್ರಾಯ್ಡ್',
            'version_info': 'ಆಂಡ್ರಾಯ್ಡ್ 5.0 ಮತ್ತು ಹೆಚ್ಚಿನ ಆವೃತ್ತಿಗಳೊಂದಿಗೆ ಹೊಂದಿಕೊಳ್ಳುತ್ತದೆ',
            'version_number': 'ಆವೃತ್ತಿ: 1.0.0',
            'version_size': 'ಗಾತ್ರ: 75MB',
            'testimonials_title': 'ಡೇರಿ ಸಮುದಾಯಗಳಿಂದ ವಿಶ್ವಾಸಾರ್ಹ',
            'testimonials_subtitle': 'ದುಧಿಯಾ ಸಂಗ್ರಹಣೆ ಕೇಂದ್ರದ ಮಾಲಿಕರು ಮತ್ತು ರೈತರ ಜೀವನದಲ್ಲಿ ನಿಜವಾದ ಬದಲಾವಣೆಯನ್ನು ತರಲು ಹೇಗೆ ಎಂಬುದನ್ನು ನೋಡಿ.',
            'testimonial1_text': 'ಬಹುಭಾಷಾ ಬೆಂಬಲವು ಜೀವರಕ್ಷಕ. ನಮ್ಮ ರೈತರು ತಮ್ಮ ಸ್ವಂತ ಭಾಷೆಯಲ್ಲಿ ತಮ್ಮ ಡೇಟಾವನ್ನು ನೋಡುವುದರಿಂದ ಹೆಚ್ಚಿನ ಆತ್ಮವಿಶ್ವಾಸ ಅನುಭವಿಸುತ್ತಾರೆ.',
            'testimonial1_name': 'ಆನಂದ್ ದೇಶ್mukh',
            'testimonial1_title': 'ಪ್ರಾದೇಶಿಕ ಸಂಗ್ರಹಣೆ ಮುಖ್ಯಸ್ಥ',
            'testimonial2_text': '500+ ಗ್ರಾಹಕರನ್ನು ನಿರ್ವಹಿಸುವುದು ದುಧಿಯಾಕ್ಕಿಂತ ಮೊದಲು ದುಃಸ್ವಪ್ನವಾಗಿತ್ತು. ಈಗ ಎಲ್ಲವೂ ಸ್ವಯಂಚಾಲಿತ ಮತ್ತು ಪಾರದರ್ಶಕವಾಗಿದೆ.',
            'testimonial2_name': 'ಮೀರಾ ಪಟೇಲ್',
            'testimonial2_title': 'ಡೇರಿ ಉದ್ಯಮಿ',
            'testimonial3_text': 'ವ್ಯಾಲೆಟ್ ವ್ಯವಸ್ಥೆ ಅದ್ಭುತವಾಗಿದೆ. ರೈತರು ತಮ್ಮ ಸಂಪಾದನೆಯನ್ನು ಲೈವ್‌ನಲ್ಲಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಬಹುದು, ಇದು ನಮ್ಮ ಕೇಂದ್ರದಲ್ಲಿ ಬಹಳಷ್ಟು ವಿಶ್ವಾಸವನ್ನು ನಿರ್ಮಿಸಿದೆ.',
            'testimonial3_name': 'ಸುರೇಶ್ ಜಿ.',
            'testimonial3_title': 'ರೈತ ಒಕ್ಕೂಟ ಪ್ರತಿನಿಧಿ',
            'testimonial3_org': 'ಶ್ರೀ ಕೃಷ್ಣಾ ಡೇರಿ • ಮಧ್ಯ ಪ್ರದೆಶ್',
            'testimonial4_text': 'ನಾನು ಪಾವತಿಗಳನ್ನು ಲೆಕ್ಕಹಾಕಲು ಗಂಟೆಗಳನ್ನು ಕಳೆಯುತ್ತಿದ್ದೆ. ಈಗ ದುಧಿಯಾ ಇದು ಸಂಪೂರ್ಣ ಶುದ್ಧತೆಯೊಂದಿಗೆ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಮಾಡುತ್ತದೆ.',
            'testimonial4_name': 'ರಾಜೇಶ್ ಶರ್ಮಾ',
            'testimonial4_title': 'ಸಂಗ್ರಹಣೆ ಕೇಂದ್ರ ಮಾಲೀಕ',
            'testimonial4_org': 'ಬಾಲಾಜಿ ಡೇರಿ • ರಾಜಸ್ಥಾನ್',
            'testimonial5_text': 'ದುಧಿಯಾದ ಸಹಕಾರ ವೈಶಿಷ್ಟ್ಯಗಳು ನಮ್ಮ ಹಲವಾರು ಕೇಂದ್ರಗಳ ಕಾರ್ಯಾಚರಣೆಯನ್ನು ಸುಗಮಗೊಳಿಸಿವೆ. ಹಂಚಿಕೆಯಾಗುವ ಡೇಟಾ ಗೇಮ್-ಚೇಂಜರ್ ಆಗಿದೆ.',
            'testimonial5_name': 'ಪ್ರಿಯಾ',
            'testimonial5_title': 'ಸಹಕಾರ ವ್ಯವಸ್ಥಾಪಕ',
            'testimonial5_org': 'ಕರ್ನಾಟಕ ಡೇರಿ ಸಹಕಾರ • ಕರ್ನಾಟಕ',
            'testimonial6_text': 'ವಿಶ್ಲೇಷಣೆಗಳು ನನ್ನ ದೈನಂದಿನ ಸಂಗ್ರಹವನ್ನು 40% ವೃದ್ಧಿಸಲು ಸಹಾಯ ಮಾಡಿದವು. ನಮ್ಮ ಸಂಪೂರ್ಣ ತಂಡಕ್ಕೆ ಬಳಸಲು ಸುಲಭವಾಗಿದೆ.',
            'testimonial6_name': 'ವಿಕ್ರಮ್ ಸಿಂಗ್',
            'testimonial6_title': 'ಡೆಯರಿ ವ್ಯವಹಾರ ಮಾಲೀಕ',
            'testimonial6_org': 'ಪಂಜಾಬ್ ಮಿಲ್ಕ್ ಯೂನಿಯನ್ • ಪಂಜಾಬ್',
            'contact_title': 'ಸಂಪರ್ಕಿಸಿ',
            'contact_subtitle': 'ದುಧಿಯಾದೊಂದಿಗೆ ನಿಮ್ಮ ಡೇರಿಯನ್ನು ಸ್ಥಾಪಿಸುವ ಬಗ್ಗೆ ಪ್ರಶ್ನೆಗಳಿವೆಯೇ? ಪರಿವರ್ತನೆಯ ಪ್ರತಿ ಹಂತದಲ್ಲೂ ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ನಮ್ಮ ನಿಪುಣರ ತಂಡ ಸಿದ್ಧವಾಗಿದೆ.',
            'contact_phone_label': 'ನಮಗೆ ಕರೆ ಮಾಡಿ',
            'contact_email_label': 'ಇಮೇಲ್ ಬೆಂಬಲ',
            'contact_address_label': 'ಕಚೇರಿಗೆ ಭೇಟಿ ನೀಡಿ',
            'contact_form_name_label': 'ನಿಮ್ಮ ಹೆಸರು',
            'contact_form_name_placeholder': 'ರಾಜೇಶ್ ಕುಮಾರ್',
            'contact_form_email_label': 'ಇಮೇಲ್ ವಿಳಾಸ',
            'contact_form_email_placeholder': 'rajesh@example.com',
            'contact_form_dairy_label': 'ಡೇರಿ ಹೆಸರು',
            'contact_form_dairy_placeholder': 'ಸೂರ್ಯೋದಯ ಡೇರಿ',
            'contact_form_message_label': 'ಸಂದೇಶ',
            'contact_form_message_placeholder': 'ನಾವು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
            'contact_form_submit': 'ಸಂದೇಶ ಕಳುಹಿಸಿ',
            'footer_description': 'ಮುಂದಿನ ಪೀಳಿಗೆಯ ಡೇರಿ ರೈತರಿಗಾಗಿ ನಿರ್ಮಿಸಲಾದ ವಿಶ್ವದ ಅತ್ಯಾಧುನಿಕ ಸ್ಮಾರ್ಟ್ ಡೇರಿ ನಿರ್ವಹಣಾ ಪರಿಸರ ವ್ಯವಸ್ಥೆ.',
            'footer_quicklinks_title': 'ತ್ವರಿತ ಲಿಂಕ್‌ಗಳು',
            'footer_link_features': 'ವೈಶಿಷ್ಟ್ಯಗಳು',
            'footer_link_benefits': 'ಪ್ರಯೋಜನಗಳು',
            'footer_link_download': 'ಡೌನ್‌ಲೋಡ್',
            'footer_link_contact': 'ಸಂಪರ್ಕ',
            'footer_link_pricing': 'ಬೆಲೆ',
            'footer_link_supplier': 'ಪೂರೈಕೆದಾರ',
            'footer_link_buyer': 'ಖರೀದಿದಾರ',
            'footer_explore_title': 'ಕಾರ್ಯಪ್ರವಾಹಗಳು',
            'footer_company_title': 'ಕಂಪನಿ',
            'footer_link_about': 'ನಮ್ಮ ಬಗ್ಗೆ',
            'footer_link_faq': 'ಸಾಮಾನ್ಯ ಪ್ರಶ್ನೆಗಳು',
            'footer_link_terms': 'ಸೇವಾ ನಿಯಮಗಳು',
            'footer_link_privacy': 'ಗೌಪ್ಯತಾ ನೀತಿ',
            'footer_newsletter_title': 'ನ್ಯೂಸ್‌ಲೆಟರ್',
            'footer_newsletter_desc': 'ಇತ್ತೀಚಿನ ಡೇರಿ ಉದ್ಯೋಗ ಅಪ್‌ಡೇಟ್‌ಗಳನ್ನು ನಿಮ್ಮ ಇನ್‌ಬಾಕ್ಸ್‌ಗೆ ಪಡೆಯಿರಿ.',
            'footer_newsletter_placeholder': 'ಇಮೇಲ್',
            'footer_powered': 'ಇವರಿಂದ ಚಾಲಿತ',
            'footer_copyright': '© 2026 ದುಧಿಯಾ (Milk Collection Management System). ಎಲ್ಲ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.',
            'footer_bottom_terms': 'ನಿಯಮಗಳು',
            'footer_bottom_refund': 'ಮರುಪಾವತಿ',
            'footer_bottom_terms_of_use': 'ಬಳಕೆಯ ನಿಯಮಗಳು',
            'footer_bottom_privacy': 'ಗೌಪ್ಯತೆ',
            'whois_title': 'ದುಧಿಯಾ ಯಾರಿಗೆ?',
            'whois_subtitle': 'ವಿಶೇಷವಾಗಿ ಭಾರತೀಯ ಡೇರಿ ಪರಿಸರ ವ್ಯವಸ್ಥೆಗಾಗಿ ನಿರ್ಮಿಸಲಾಗಿದೆ',
            'whois_card1_title': 'ಸಂಗ್ರಹಣೆ ಕೇಂದ್ರಗಳು',
            'whois_card1_desc': 'ಪ್ರತಿದಿನ ಬೆಳಿಗ್ಗೆ ಮತ್ತು ಸಂಜೆ ಶಿಫ್ಟ್‌ಗಳೊಂದಿಗೆ 10 ರಿಂದ 1000+ ರೈತರನ್ನು ನಿರ್ವಹಿಸುವ ಹಾಲು ಸಂಗ್ರಹಣೆ ಕೇಂದ್ರಗಳಿಗೆ ಪರಿಪೂರ್ಣ.',
            'whois_card1_point1': 'ದೈನಂದಿನ ಸಂಗ್ರಹಣೆ ಎಂಟ್ರಿ',
            'whois_card1_point2': 'ಸ್ವಯಂಚಾಲಿತ ದರ ಲೆಕ್ಕಾಚಾರ',
            'whois_card1_point3': 'ರೈತ-ವಾರು ವರದಿಗಳು',
            'whois_card2_title': 'ಡೇರಿ ರೈತರು',
            'whois_card2_desc': 'ಸಂಗ್ರಹಣೆ ಕೇಂದ್ರಗಳಿಗೆ ಹಾಲು ಪೂರೈಸುವ ಪ್ರತ್ಯೇಕ ರೈತರು ಮತ್ತು ಸಹಕಾರಿ ಸಂಘಗಳಿಗೆ ಆದರ್ಶ.',
            'whois_card2_point1': 'ನಿಮ್ಮ ಎಲ್ಲಾ ಸಂಗ್ರಹಣೆಗಳನ್ನು ನೋಡಿ',
            'whois_card2_point2': 'ವ್ಯಾಲೆಟ್ ಶೇಷವನ್ನು ಲೈವ್‌ನಲ್ಲಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
            'whois_card2_point3': 'ಪಾವತಿ ಇತಿಹಾಸವನ್ನು ಪ್ರವೇಶಿಸಿ',
            'whois_card3_title': 'ಡೇರಿ ಸಹಕಾರಿ ಸಂಘಗಳು',
            'whois_card3_desc': 'ಬಹು ಕೇಂದ್ರಗಳನ್ನು ನಿರ್ವಹಿಸುವ ದೊಡ್ಡ ಪ್ರಮಾಣದ ಡೇರಿ ಒಕ್ಕೂಟಗಳು ಮತ್ತು ಸಹಕಾರಿ ಸಂಘಗಳಿಗಾಗಿ ವಿನ್ಯಾಸಗೊಳಿಸಲಾಗಿದೆ.',
            'whois_card3_point1': 'ಬಹು-ಕೇಂದ್ರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
            'whois_card3_point2': 'ಒಗ್ಗೂಡಿದ ವಿಶ್ಲೇಷಣೆ',
            'whois_card3_point3': 'ಪಾತ್ರ-ಆಧಾರಿತ ಪ್ರವೇಶ',
            'faq_title': 'ಅಕ್ಷರಶಃ ಕೇಳಲಾಗುವ ಪ್ರಶ್ನೆಗಳು',
            'faq_subtitle': 'ದುಧಿಯಾ ಬಗ್ಗೆ ನಿಮಗೆ ತಿಳಿದಿರಬೇಕಾದ ಎಲ್ಲವೂ',
            'faq_q1': 'ದುಧಿಯಾ ಬೆಲೆ ಎಷ್ಟು?',
            'faq_q2': 'ನನ್ನ ಡೇಟಾ ಸುರಕ್ಷಿತವಾಗಿದ್ದು ಬ್ಯಾಕಪ್ ಆಗಿದೆಯೇ?',
            'faq_q4': 'ನಾನು ಖರೀದಿದಾರ ಮತ್ತು ಸರಬರಾಜುದಾರ ಪಾತ್ರಗಳ ನಡುವೆ ಹೇಗೆ ಬದಲಾಯಿಸಬಹುದು?',
            'faq_q5': 'ನಾನು ಯಾವ ರೀತಿಯ ವರದಿಗಳನ್ನು ರಚಿಸಬಹುದು?',
            'section_features': 'ಪ್ರಮುಖ ವೈಶಿಷ್ಟ್ಯಗಳು',
            'section_benefits': 'ದುಧಿಯಾವನ್ನು ಏಕೆ ಆರಿಸಬೇಕು?',
            'section_download': 'ಅಪ್ಲಿಕೇಶನ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',
            'section_testimonials': 'ನಮ್ಮ ಬಳಕೆದಾರರು ಏನು ಹೇಳುತ್ತಾರೆ',
            'section_contact': 'ಸಂಪರ್ಕಿಸಿ',
            'footer_tagline': 'ಸ್ಮಾರ್ಟ್ ಡೇರಿ ನಿರ್ವಹಣಾ ಪರಿಹಾರ',
            'footer_quicklinks': 'ತ್ವರಿತ ಲಿಂಕ್‌ಗಳು',
            'footer_connect': 'ನಮ್ಮೊಂದಿಗೆ ಸಂಪರ್ಕ ಸಾಧಿಸಿ',
            'still_have_questions': 'ಇನ್ನೂ ಪ್ರಶ್ನೆಗಳಿವೆಯೇ?',
            'ask_anything_text': 'ಉತ್ತರ ಸಿಗುತ್ತಿಲ್ಲವೇ? ನಮ್ಮ ತಂಡ ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ಸಿದ್ಧವಾಗಿದೆ!',
            'ask_on_whatsapp': 'WhatsApp ನಲ್ಲಿ ಕೇಳಿ',
            'call_us': 'ನಮ್ಮನ್ನು ಕರೆಯಿರಿ',
            'quick_response_text': 'ತಕ್ಷಣ ಸಹಾಯ! ನಾವು ಗಂಟೆಗಳಲ್ಲಿ ಪ್ರತಿಕ್ರಿಯಿಸುತ್ತೇವೆ, ನಿಮಿಷಗಳಲ್ಲಿ ಅಲ್ಲ',
            'hire_personnel_tag': 'ವೃತ್ತಿಪರ ಸೇವೆ',
            'hire_personnel_title': 'ನೀವು ಸಂಗ್ರಹಣೆಯನ್ನು ಸ್ವಯಂ ಮಾಡಲು ಬಯಸುವುದಿಲ್ಲವೇ?',
            'hire_personnel_subtitle': 'ನಿಮ್ಮ ಹಾಲು ಸಂಗ್ರಹಣೆಯನ್ನು ಪರಿಣಾಮಕಾರಿಯಾಗಿ ನಿರ್ವಹಿಸಲು ತರಬೇತಿ ಪಡೆದ ಆಪರೇಟರ್ ಅಥವಾ ವ್ಯಕ್ತಿಯನ್ನು ಬಾಡಿಗೆಗೆ ಪಡೆಯಿರಿ',
            'hire_personnel_card1_title': 'ಸಂಗ್ರಹಣೆಗಾಗಿ ವ್ಯಕ್ತಿಯನ್ನು ಬಾಡಿಗೆಗೆ ಪಡೆಯಿರಿ',
            'hire_personnel_card1_desc': 'ದುಧಿಯಾ ಅಪ್ಲಿಕೇಶನ್ ಬಳಸಲು ತರಬೇತಿ ಪಡೆದ ಮತ್ತು ನಿಮ್ಮ ದೈನಂದಿನ ಹಾಲು ಸಂಗ್ರಹಣೆಯನ್ನು ಪರಿಣಾಮಕಾರಿಯಾಗಿ ನಿರ್ವಹಿಸುವ ವಿಶ್ವಾಸಾರ್ಹ ಸಂಗ್ರಹಣೆ ಸಿಬ್ಬಂಧಿಗಳನ್ನು ಪಡೆಯಿರಿ.',
            'hire_personnel_card2_title': 'ವೆಚ್ಚ ಅಂದಾಜು',
            'hire_personnel_card2_desc': 'ಬೆಲೆಯು ಸಾಮಾನ್ಯವಾಗಿ ದೈನಂದಿನ ಸರಾಸರಿ ಸಂಗ್ರಹಣೆಗಳ ಸಂಖ್ಯೆ ಮತ್ತು ಅಗತ್ಯ ಕೆಲಸದ ಪ್ರಮಾಣದ ಆಧಾರದ ಮೇಲೆ ₹500 ರಿಂದ ₹3,000-₹4,000 ಪ್ರತಿ ತಿಂಗಳಿಗೆ ಇರುತ್ತದೆ.',
            'hire_personnel_card3_title': 'ದುಧಿಯಾ ಸಹಾಯವನ್ನು ಸಂಪರ್ಕಿಸಿ',
            'hire_personnel_card3_desc': 'ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ವಿಶ್ವಾಸಾರ್ಹ ಸಂಗ್ರಹಣೆ ಸಿಬ್ಬಂಧಿಗಳೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಲು ಮತ್ತು ಕಸ್ಟಮೈಸ್ಡ್ ಕೋಟ್ ಪಡೆಯಲು ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ.',
            'hire_personnel_call': 'ಕಾಲ್',
            'hire_personnel_whatsapp': 'ವಾಟ್ಸ್ಆಪ್ ನೆಟ್ಪೈ',
            'hire_personnel_cta_title': 'ಸರಿಯಾದ ವ್ಯಕ್ತಿಯನ್ನು ಹುಡುಕಲು ನಾವು ನಿಮಗೆ ಸಹಾಯ ಮಾಡುತ್ತೇವೆ',
            'hire_personnel_cta_desc': 'ನಾವು ನಿಮ್ಮನ್ನು ನಿಮ್ಮ ಸ್ಥಳೀಯ ಪ್ರದೇಶದಲ್ಲಿ ತರಬೇತಿ ಪಡೆದ, ವಿಶ್ವಾಸಾರ್ಹ ಸಂಗ್ರಹಣೆ ಸಿಬ್ಬಂಧಿಗಳೊಂದಿಗೆ ಸಂಪರ್ಕಿಸುತ್ತೇವೆ, ಅವರು ಈಗಾಗಲೇ ದುಧಿಯಾ ಅಪ್ಲಿಕೇಶನ್‌ಗೆ ಪರಿಚಿತರಾಗಿದ್ದಾರೆ.',
            'hire_personnel_cta_button': 'ಈಗಲೇ ಪ್ರಾರಂಭಿಸಿ',
            'plan_sub_card_title': 'ಚಂದಾದಾರಿಕೆ ಪ್ಲಾನ್',
            'plan_sub_card_subtitle': 'ನಿಮ್ಮ ಡೈರಿಗೆ ಮಾಸಿಕ ಮತ್ತು ವಾರ್ಷਿਕ ಚಂದಾದಾರಿಕೆ ಆಯ್ಕೆಗಳು',
            'plan_sub_feat1': 'ಮಾಸਿਕ ಮತ್ತು ವಾರ್ಷਿਕ ಫ್ಲಾਟ ದರಗಳು',
            'plan_sub_feat2': 'ಅನಿಯಮಿತ ಕಲೆಕ್ಷನ್ ಮತ್ತು ಸರಬರಾಜುದಾರರು',
            'plan_sub_feat3': 'ಡೆಡಿಕೇಟೆਡ ಬೆಂಬಲ ಮತ್ತು PDF ವರದಿಗಳು',
            'btn_know_more': 'ಮತ್ತಷ್ಟು ತಿಳಿಯಿರಿ',
            'modal_sub_heading': 'ಚಂದಾದಾರಿಕೆ ಪ್ಲಾನ್‌ಗಳು',
            'modal_sub_subheading': 'ನಿಮ್ಮ ಡೈರಿ ಸಂಗ್ರಹಣಾ ಕೇಂದ್ರಕ್ಕೆ ಸೂಕ್ತವಾದ ಚಂದಾದಾರಿಕೆ ಪ್ಲಾನ್ ಆಯ್ಕೆಮಾಡಿ.',
            'modal_contact_title': 'ಚಂದಾದಾರಿಕೆ ಪಡೆಯಲು ಸಂಪರ್ಕಿಸಿ',
            'modal_contact_desc': 'ನಿಮ್ಮ ಚಂದಾದಾರಿಕೆ ಪ್ಲಾನ್ ಸಕ್ರಿಯಗೊಳಿಸಲು ನಮ್ಮ ತಂಡಕ್ಕೆ ಕರೆ ಮಾಡಿ ಅಥವಾ ವಾಟ್ಸಾಪ್ ಮಾಡಿ.',
            'modal_btn_call': 'ಕರೆ ಮಾಡಿ',
            'modal_btn_whatsapp': 'WhatsApp ಮಾಡಿ',
            'badge_free': 'ಉಚಿತ',
            'badge_flexible': 'ಫ್ಲೆಕ್ಸಿಬಲ್',
            'badge_popular': 'ಜನಪ್ರಿಯ',
            'badge_best_value': 'ಉತ್ತಮ ಮೌಲ್ಯ',
            'page_title': 'ಪಾಲುದಾರ ಅಥವಾ ಡೀಲರ್ ಆಗಿ | ದುಧಿಯಾ ಸ್ಮಾರ್ಟ್ ಡೇರಿ ಟೆಕ್',
            'meta_description': 'ಸೇಲ್ಸ್ ಪಾರ್ಟನರ್, ಡೇಟಾ ಎಂಟ್ರಿ ಆಪರೇಟರ್, ಅಥವಾ ಫ್ರಾಂಚೈಸ್ ಡೀಲರ್ ಆಗಿ ದುಧಿಯಾಗೆ ಸೇರಿ. ಸ್ಥಳೀಯ ಡೇರಿ ಸಂಗ್ರಹಣಾ ಕೇಂದ್ರಗಳನ್ನು ಸಬಲೀಕರಿಸುವ ಮೂಲಕ ಹೆಚ್ಚಿನ ಮಾಸಿಕ ಆದಾಯ ಗಳಿಸಿ.',
            'hero_badge_tag': '3 ನಮ್ಯ ಪಾಲುದಾರಿಕೆ ಪಾತ್ರಗಳು ಲಭ್ಯವಿವೆ',
            'hero_main_title': 'ದುಧಿಯಾ ಜೊತೆ ಪಾಲುದಾರರಾಗಿ — ನಿಮ್ಮ ವ್ಯವಹಾರ ಬೆಳೆಸಿ',
            'hero_main_subtitle': 'ವೇಗವಾಗಿ ಬೆಳೆಯುತ್ತಿರುವ ಡೇರಿ ತಂತ್ರಜ್ಞಾನ ಕ್ಷೇತ್ರದಲ್ಲಿ ಸ್ಥಿರ ಆದಾಯ ಗಳಿಸಿ. 3 ಲಾಭದಾಯಕ ಮಾರ್ಗಗಳಿಂದ ಆಯ್ಕೆಮಾಡಿ: ಸೇಲ್ಸ್ ಪಾರ್ಟನರ್, ಡೇಟಾ ಎಂಟ್ರಿ ಆಪರೇಟರ್, ಅಥವಾ ಸ್ವತಂತ್ರ ಡೀಲರ್.',
            'btn_explore_roles': '3 ಪಾತ್ರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ',
            'btn_whatsapp_inquiry': 'WhatsApp ನಲ್ಲಿ ಸಂಪರ್ಕಿಸಿ',
            'pill_high_payout': 'ಹೆಚ್ಚಿನ ಮಾಸಿಕ ಕಮಿಷನ್',
            'pill_zero_risk': 'ಶೂನ್ಯ ಅಪಾಯ ಮತ್ತು ಹೂಡಿಕೆ ಆಯ್ಕೆಗಳು',
            'pill_full_training': 'ಸಂಪೂರ್ಣ ತರಬೇತಿ ಮತ್ತು ಮಾರ್ಕೆಟಿಂಗ್ ಬೆಂಬಲ',
            'card_opportunity_header': 'ತಿಂಗಳಿಗೆ ₹50,000+ ವರೆಗೆ ಗಳಿಸಿ',
            'card_opportunity_title': 'ನಿಮ್ಮ ಪಾಲುದಾರಿಕೆ ಗುರಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
            'mini_role1_title': '1. ಸೇಲ್ಸ್ ಪಾರ್ಟನರ್',
            'mini_role1_desc': 'ಡೇರಿಗಳನ್ನು ಶಿಫಾರಸು ಮಾಡಿ ಮತ್ತು 10% ಕಮಿಷನ್ ಗಳಿಸಿ',
            'mini_role2_title': '2. ಡೇಟಾ ಎಂಟ್ರಿ ಆಪರೇಟರ್',
            'mini_role2_desc': 'ನಿಯೋಜಿತ ಡೇರಿಗಳನ್ನು ನಿರ್ವಹಿಸಿ ಮತ್ತು ಪ್ರತಿಯೊಂದು ಡೇರಿಗೆ ಹಣ ಪಡೆಯಿರಿ',
            'mini_role3_title': '3. ಫ್ರಾಂಚೈಸ್ ಡೀಲರ್',
            'mini_role3_desc': 'ಸಂಪೂರ್ಣ ಪ್ರಾದೇಶಿಕ ನೆಟ್‌ವರ್ಕ್ ಮತ್ತು 50%+ ಲಾಭಾಂಶ',
            'roles_section_badge': 'ಕೆಲಸ ಮಾಡಲು ಮತ್ತು ಗಳಿಸಲು 3 ಮಾರ್ಗಗಳು',
            'roles_section_title': 'ನಿಮ್ಮ ಪಾಲುದಾರಿಕೆ ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
            'roles_section_subtitle': 'ನೀವು ಸ್ಥಳೀಯ ಸಂಗ್ರಹಣಾ ಕೇಂದ್ರಗಳನ್ನು ಉಲ್ಲೇಖಿಸಲು ಬಯಸಲಿ, ಡೇರಿ ಮಾಲೀಕರಿಗೆ ದೈನಂದಿನ ಡೇಟಾ ಎಂಟ್ರಿ ಮಾಡಲು ಬಯಸಲಿ, ಅಥವಾ ಸಂಪೂರ್ಣ ಡೀಲರ್‌ಶಿಪ್ ನಿರ್ವಹಿಸಲು ಬಯಸಲಿ — ನಮ್ಮಲ್ಲಿ ನಿಮಗಾಗಿ ಅತ್ಯುತ್ತਮ ಅವಕಾಶವಿದೆ.',
            'role1_badge': '10% ಕಮಿಷਨ + ಬೋನಸ್',
            'role1_title': '1. ಸೇಲ್ಸ್ ಪಾರ್ಟನರ್',
            'role1_subtitle': 'ಸೇಲ್ಸ್ ವ್ಯಕ್ತಿ / ಸಲಹೆಗಾರರಾಗಿ',
            'role1_desc': 'ಸ್ಥಳೀಯ ಹಾಲು ಸಂಗ್ರಹಣಾ ಕೇಂದ್ರಗಳಿಗೆ ದುಧಿಯಾ ಆ್ಯಪ್ ಮತ್ತು ವೆಬ್ ಪੋਰಟಲ್ ಪರಿಚಯಿಸಿ. ಡೇರಿ ಮಾಲೀಕರಿಗೆ ಡಿಜಿಟಲ್ ಮಾಡಲು ಸಹಾಯ ಮಾಡಿ ಮತ್ತು ಉತ್ತಮ ಆದಾಯ ಗಳಿಸಿ.',
            'role1_earning_label': 'ಸಂಭಾವ್ಯ ಆದಾಯ:',
            'role1_earning_val': '10% ಲೈಫ್‌ಟೈಮ್ ಕಮಿಷನ್ + ₹500 ಬೋನಸ್ / ಡೇರಿ',
            'role1_feat1': 'ಪ್ರತಿ ಡೇರಿ ಚಂದಾದಾರಿಕೆಗೆ 10% ತಕ್ಷಣದ ರಿಯಾಯಿತಿ / ಕಮಿಷನ್',
            'role1_feat2': 'ಪ್ರತಿ ತಿಂಗಳು ಡೇರಿ ರೀಚಾರ್ಜ್ ಮಾಡಿದಾಗ ನಿರಂತರ ಕಮಿಷನ್',
            'role1_feat3': 'ಸಂಪೂರ್ಣ ಆ್ಯಪ್ ಡೆಮೊ ಮತ್ತು ಮಾರ್ಕೆಟಿಂಗ್ ಸಾಮಗ್ರಿಗಳು ಲಭ್ಯ',
            'role1_btn': 'ಸೇಲ್ಸ್ ಪಾರ್ಟನರ್ ಆಗಿ',
            'role2_badge': 'ಪ್ರತಿ ಡೇರಿಗೆ ಖಾತರಿ ಪಾವತಿ',
            'role2_title': '2. ಡೇಟಾ ಎಂಟ್ರಿ ಆಪರೇಟರ್',
            'role2_subtitle': 'ಡೇರಿಗಳಿಗಾಗಿ ಹಾಲು ಸಂಗ್ರಹಣೆ ನಿರ್ವಹಿಸಿ',
            'role2_desc': 'ದುಧಿಯಾ ಅಥವಾ ಡೇರಿ ಮಾಲೀಕರಿಂದ 2, 5 ಅಥವಾ ಹೆಚ್ಚಿನ ಸ್ಥಳೀಯ ಡೇರಿಗಳನ್ನು ಪಡೆಯಿರಿ. ದೈನಂದಿನ ಬೆಳಿಗ್ಗೆ ಮತ್ತು ಸಂಜೆಯ ಹಾಲು ಸಂಗ್ರಹಣಾ ನಮೂದುಗಳನ್ನು ನಮೂದಿಸಿ ಮತ್ತು PDF ಬಿಲ್‌ಗಳನ್ನು ರಚಿಸಿ.',
            'role2_earning_label': 'ಸಂಭಾವ್ಯ ಆದಾಯ:',
            'role2_earning_val': 'ಪ್ರತಿ ಡೇರಿಗೆ ತಿಂಗಳಿಗೆ ₹1,500 – ₹3,000 ಗಳಿಸಿ',
            'role2_feat1': 'ಸ್ಥಳೀಯವಾಗಿ ಅಥವಾ ದೂರದಿಂದಲೇ ಡೇರಿಗಳಲ್ಲಿ ಕೆಲಸ ಮಾಡಿ',
            'role2_feat2': 'ನಿರ್ವಹಿಸಿದ ಪ್ರತಿ ಡೇರಿಗೆ ಮಾಸಿಕ ಖಾತರಿ ಪಾವತಿ',
            'role2_feat3': 'ಶೂನ್ಯ ಸಾಫ್ಟ್‌ವೇರ್ ಹೂಡಿಕೆ ಅಗತ್ಯವಿದೆ',
            'role2_btn': 'ಆಪರೇಟರ್ ಆಗಿ',
            'role3_badge': '⭐ ಗರಿಷ್ಠ ಗಳಿಕೆ ಮತ್ತು ನಿಯಂತ್ರಣ',
            'role3_title': '3. ಫ್ರಾಂಚೈಸ್ ಡೀಲರ್',
            'role3_subtitle': 'ನಿಮ್ಮ ಸ್ಥಳೀಯ ಸಾಫ್ಟ್‌ವೇರ್ ಪ್ರದೇಶದ ಮಾಲೀಕರಾಗಿ',
            'role3_desc': 'ನಿಮ್ಮ ತಾಲೂಕು ಅಥವಾ ಜಿಲ್ಲೆಯಲ್ಲಿ ಸಂಪೂರ್ಣ ದುಧಿಯಾ ಸಾಫ್ಟ್‌ವೇರ್ ಫ್ರಾಂಚೈಸ್ ನಡೆಸಿ. ಡೇರಿಗಳನ್ನು ಸೇರಿಸಿ, ಡೇರಿ ಮಾಲೀಕರಿಂದ ನೇರವಾಗಿ ಪಾವತಿ ಸಂಗ್ರಹಿಸಿ, ಮತ್ತು ಸಗಟು ದರಗಳಲ್ಲಿ ದುಧಿಯಾಗೆ ಪಾವತಿಸಿ.',
            'role3_earning_label': 'ಸಂಭಾವ್ಯ ಆದಾಯ:',
            'role3_earning_val': '50%+ ಲಾಭಾಂಶವನ್ನು ಇರಿಸಿಕೊಳ್ಳಿ (ತಿಂಗಳಿಗೆ ₹50,000+ ಗಳಿಸಿ)',
            'role3_feat1': 'ಸಂಪೂರ್ಣ ಪ್ರಾದೇಶಿಕ ಮಾಲೀಕತ್ವ ಮತ್ತು ಗ್ರಾಹಕ ನಿಯಂತ್ರಣ',
            'role3_feat2': 'ಡೇರಿ ಮಾಲೀಕರಿಂದ ನೇರ ಪಾವತಿ ಸಂಗ್ರಹಣೆ',
            'role3_feat3': 'ಅಂಕಿತ 24/7 ತಾಂತ್ರಿಕ ಬೆಂಬಲ ಮತ್ತು ಬ್ರ್ಯಾಂಡಿಂಗ್ ಕಿಟ್',
            'role3_btn': 'ಡೀಲರ್ ಆಗಿ',
            'multirole_badge': 'ಆಲ್-ಇನ್-ಒನ್ ಮಲ್ಟಿ-ರೋಲ್ ಅನುಕೂಲ',
            'multirole_title': 'ನಾನು ಒಂದೇ ಸಮಯದಲ್ಲಿ ಎಲ್ಲಾ 3 ಪಾತ್ರಗಳಲ್ಲಿ ಕೆಲಸ ಮಾಡಬಹುದೇ? <span class="text-orange-600">ಹೌದು!</span>',
            'multirole_desc': 'ನೀವು ಕೇವಲ ಒಂದು ಪಾತ್ರಕ್ಕೆ ಸೀಮಿತವಾಗಿಲ್ಲ! ನಿಮ್ಮ ಆದಾಯವನ್ನು ಹೆಚ್ಚಿಸಲು ಸೇಲ್ಸ್ ಪಾರ್ಟನರ್‌ಶಿಪ್, ಡೇಟಾ ಎಂಟ್ರಿ ಆಪರೇಷನ್‌ಗಳು, ಮತ್ತು ಡೀಲರ್‌ಶಿಪ್ ಅನ್ನು ಸಂಯೋಜಿಸಿ.',
            'multirole_point1': 'ಹಲವಾರು ಆದಾಯ ಮೂಲಗಳು',
            'multirole_point2': 'ಗರಿಷ್ಠ ಮಾಸಿಕ ಲಾಭಗಳು',
            'multirole_point3': 'ಒಂದೇ ಏಕೀಕೃತ ಖಾತೆ',
            'multirole_btn': 'ಮಲ್ಟಿ-ರೋಲ್ ಪಾರ್ಟನರ್‌ಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ',
            'matrix_title': 'ಪಾತ್ರ ಹೋಲಿಕೆ ಮತ್ತು ಗಳಿಕೆಯ ವಿವರ',
            'matrix_subtitle': 'ಪ್ರಮುಖ ವೈಶಿಷ್ಟ್ಯಗಳು, ಅಗತ್ಯವಿರುವ ಶ್ರಮ, ಮತ್ತು ಪಾವತಿ ರಚನೆಗಳನ್ನು ಹೋಲಿಕೆ ಮಾಡಿ',
            'th_feature': 'ವೈಶಿಷ್ಟ್ಯ / ನಿಯತಾಂಕ',
            'th_role1': 'ಸೇಲ್ಸ್ ಪಾರ್ಟನರ್',
            'th_role2': 'ಆಪರೇಟರ್',
            'th_role3': 'ಫ್ರಾಂಚೈಸ್ ಡೀಲರ್',
            'tr1_label': 'ಮುಖ್ಯ ಉದ್ದೇಶ',
            'tr1_role1': 'ಡೇರಿಗಳನ್ನು ಸೇರಿಸಿ',
            'tr1_role2': 'ದೈನಂದಿನ ಸಂಗ್ರಹಣೆ ನಮೂದಿಸಿ',
            'tr1_role3': 'ಪ್ರಾದೇಶಿಕ ನೆಟ್‌ವರ್ಕ್ ನಡೆಸಿ',
            'tr2_label': 'ಹೂಡಿಕೆ ಅಗತ್ಯವಿದೆ',
            'tr2_role1': '₹0 (ಶೂನ್ಯ)',
            'tr2_role2': '₹0 (ಶೂನ್ಯ)',
            'tr2_role3': 'ಕಡಿಮೆ ಸಗಟು ದರ',
            'tr3_label': 'ಮಾಸಿಕ ಗಳಿಕೆ',
            'tr3_role1': '₹5,000 – ₹20,000',
            'tr3_role2': '₹10,000 – ₹25,000',
            'tr3_role3': '₹50,000 – ₹1,50,000+',
            'tr4_label': 'ಸಮಯದ ಬದ್ಧತೆ',
            'tr4_role1': 'ನಮ್ಯತೆ / ಪಾರ್ಟ್-ಟೈಮ್',
            'tr4_role2': 'ದೈನಂದಿನ 1-2 ಗಂಟೆಗಳ ಶಿಫ್ಟ್',
            'tr4_role3': 'ಸಂಪೂರ್ಣ ವ್ಯವಹಾರ',
            'tr5_label': 'ಬೆಂಬಲ ಮತ್ತು ತರಬೇತಿ',
            'tr5_role1': 'ಆ್ಯಪ್ ಡೆಮೊ ಮತ್ತು ಮಾರ್ಕೆಟಿಂಗ್ ಕಿಟ್',
            'tr5_role2': 'ಸಂಪೂರ್ಣ ಆಪರೇಟರ್ ತರಬೇತಿ',
            'tr5_role3': 'ಆದ್ಯತೆಯ 24/7 ಮ್ಯಾನೇಜರ್',
            'training_badge_tag': 'ಉಚಿತ 1-ಆನ್-1 ಮತ್ತು ಗ್ರೂಪ್ ಮಾಸ್ಟರ್‌ಕ್ಲಾಸ್',
            'training_title': 'ಸಂಪೂರ್ಣ ದುಧಿಯಾ ಸಾಫ್ಟ್‌ವೇರ್ ತರಬೇತಿ',
            'training_desc': 'ನಿಮ್ಮ ಗ್ರಾಹಕರಿಗೆ ಪರಿಣಾಮಕಾರಿಯಾಗಿ ಬೆಂಬಲಿಸಲು ದುಧಿಯಾ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ನಲ್ಲಿ ಪ್ರವೀಣರಾಗಿ. ನಮ್ಮ ತಜ್ಞರು ಹಾಲು ಸಂಗ್ರਹಣಾ ಕೇಂದ್ರ ಸ್ಥಾಪಿಸುವುದು, ರೈತರ ಡೇಟಾಬೇಸ್ ನಿರ್ವಹಿಸುವುದು, FAT/SNF ಲೆಕ್ಕಾಚಾರ ಮತ್ತು PDF ವರದಿಗಳನ್ನು ರಚಿಸುವುದನ್ನು ಕಲಿಸುತ್ತಾರೆ.',
            'train_topic1_title': 'ಡೇರಿ ಕೇಂದ್ರ ಸ್ಥಾಪನೆ',
            'train_topic1_desc': 'ಸಂಪೂರ್ಣ ಸಾಫ್ಟ್‌ವೇರ್ ಮತ್ತು ದರ ಚಾರ್ಟ್ ಕಾನ್ಫಿಗರೇಶನ್',
            'train_topic2_title': 'ರೈತರ ಡೇಟಾಬೇಸ್ ನಿರ್ವಹಣೆ',
            'train_topic2_desc': 'ರೈತರು, ಪಾಸ್‌ಬುಕ್‌ಗಳು ಮತ್ತು ಮುಂಗಡಗಳನ್ನು ನಿರ್ವಹಿಸಿ',
            'train_topic3_title': 'FAT/SNF ಸ್ವಯಂಚಾಲಿತ ಲೆಕ್ಕಾಚಾರ',
            'train_topic3_desc': 'ಆಟೋ ಹಾಲು ಪರೀಕ್ಷೆ ಮತ್ತು ಬೆಲೆ ಲೆಕ್ಕಾಚಾರ',
            'train_topic4_title': '1-ಕ್ಲಿಕ್ PDF ವರದಿಗಳು',
            'train_topic4_desc': 'ತಕ್ಷಣದ ಬಿಲ್ಲಿಂಗ್, ಶಿಫ್ಟ್ ಸಾರಾಂಶ ಮತ್ತು ವರದಿಗಳು',
            'badge_cert': '100% ಉಚಿತ ಪಾರ್ಟನರ್ ಸರ್ಟಿಫಿಕೇಶನ್',
            'btn_call_training': 'ತರಬೇತಿಗಾಗಿ ಕರೆ ಮಾಡಿ',
            'training_badge_support': 'ತಜ್ಞರ ಬೆಂಬಲ',
            'training_badge_sub': '24/7 ಲಭ್ಯವಿದೆ',
            'how_title': '4 ಸುಲಭ ಹಂತಗಳಲ್ಲಿ ಪ್ರಾರಂಭಿಸಿ',
            'how_subtitle': '24 ಗಂಟೆಗಳಿಗಿಂತ ಕಡಿಮೆ ಅವಧಿಯಲ್ಲಿ ದುಧಿಯಾದೊಂದಿಗೆ ಗಳಿಸಲು ಪ್ರಾರಂಭಿಸಿ',
            'step1_title': 'ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
            'step1_desc': 'ಸೇಲ್ಸ್ ಪಾರ್ಟನರ್, ಆಪರೇಟರ್, ಅಥವಾ ಡೀಲರ್ ಆಗಬೇಕೆ ಎಂದು ಆಯ್ಕೆಮಾಡಿ.',
            'step2_title': 'ನಮ್ಮ ತಂಡವನ್ನು ಸಂಪರ್ਕಿಸಿ',
            'step2_desc': 'WhatsApp ಅಥವಾ ನೇರ ಕರೆ ಮೂಲಕ ನಮ್ಮ ತಂಡವನ್ನು ಸಂಪರ್ਕಿಸಿ.',
            'step3_title': 'ಉಚಿತ ತರಬೇತಿ ಪಡೆಯಿರಿ',
            'step3_desc': 'ಸಂಪೂರ್ಣ ಸಾಫ್ಟ್‌ವೇರ್ ಡೆಮೊ, ತರಬೇತಿ ಮತ್ತು ಮಾರ್ಕೆಟಿಂಗ್ ಮಾರ್ಗದರ್ಶನ ಪಡೆಯಿರಿ.',
            'step4_title': 'ಗಳಿಸಲು ಪ್ರಾರಂಭಿಸಿ',
            'step4_desc': 'ಡೇರಿಗಳನ್ನು ಸೇರಿಸಿ ಅಥವಾ ಡೇಟಾ ಎಂಟ್ರಿ ಮಾಡಿ ಮತ್ತು ಮಾಸಿಕ ಪಾವತಿಗಳನ್ನು ಪಡೆಯಿರಿ.',
            'btn_whatsapp_ask': 'WhatsApp ನಲ್ಲಿ ಕೇಳಿ',
            'btn_call_us': 'ನಮ್ಮನ್ನು ಕರೆಯಿರಿ',
            'contact_subtext_instant': 'ತಕ್ಷಣ ಸಹಾಯ! ನಾವು ನಿಮಿಷಗಳಲ್ಲಿ ಪ್ರತಿಕ್ರಿಯಿಸುತ್ತೇವೆ',
            'form_badge': 'ತ್ವರಿತ ನೋಂದಣಿ',
            'form_title': 'ಪಾಲುದಾರ ಅಥವಾ ಡೀಲರ್ ಆಗಲು ಅರ್ಜಿ ಸಲ್ಲಿಸಿ',
            'form_subtitle': 'ಕೆಳಗೆ ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ ಮತ್ತು ನಮ್ಮ ತಂಡವು 2 ಗಂಟೆಗಳಲ್ಲಿ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸುತ್ತದೆ.',
            'label_name': 'ಪೂರ್ಣ ಹೆಸರು *',
            'label_phone': 'ಫೋನ್ / ಮೊಬೈಲ್ ಸಂಖ್ಯೆ *',
            'label_city': 'ನಗರ / ಜಿಲ್ಲೆ *',
            'label_role': 'ಆದ್ಯತೆಯ ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ *',
            'label_message': 'ಹೆಚ್ಚುವರಿ ಸಂದೇಶ (ಐಚ್ಛಿಕ)',
            'btn_submit_application': 'ಅರ್ಜಿ ಸಲ್ಲಿಸಿ',
            'placeholder_name': 'ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ',
            'placeholder_phone': '10-ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
            'placeholder_city': 'ನಿಮ್ಮ ನಗರ / ಜಿಲ್ಲೆಯನ್ನು ನಮೂದಿಸಿ',
            'placeholder_message': 'ನಿಮ್ಮ ಅನುಭವ ಅಥವಾ ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿನ ಡೇರಿಗಳ ಸಂಖ್ಯೆಯ ಬಗ್ಗೆ ತಿಳಿಸಿ...',
            'option_role_1': '1. ಸೇಲ್ಸ್ ಪಾರ್ಟನರ್ / ರೆಫರಲ್ ಏಜೆಂಟ್ (10% ಕಮಿಷನ್)',
            'option_role_2': '2. ಡೇಟಾ ಎಂಟ್ರಿ ಆಪರೇಟರ್ (ಪ್ರತಿ ಡೇರಿಗೆ ಖಾತರಿ ಪಾವತಿ)',
            'option_role_3': '3. ಫ್ರಾಂಚೈಸ್ ಡೀಲರ್ (ಸಂಪೂರ್ಣ ಸಾಫ್ಟ್‌ವೇರ್ ನೆಟ್‌ವರ್ಕ್)',
            'option_role_4': '4. ಎಲ್ಲಾ 3 ಪಾತ್ರಗಳು ಒಟ್ಟಿಗೆ / ಆಲ್-ಇನ್-ಒನ್ ಮਲಟಿ-ರೋಲ್ ಪಾರ್ಟನರ್ (ಗರಿಷ್ಠ ಆದಾಯ)',
            'contact_section_badge': 'ತಕ್ಷಣದ ನೆರವು',
            'contact_section_title': 'ಸಹಾಯ ಬೇಕೇ ಅಥವಾ ಪ್ರಶ್ನೆಗಳಿವೆಯೇ? ತಕ್ಷಣ ನಮ್ಮೊಂದಿಗೆ ಮಾತನಾಡಿ',
            'contact_section_subtitle': 'ನಮ್ಮ ಪಾಲುದಾರಿಕೆ ತಜ್ಞರು ನಿಮಗೆ ಪಾತ್ರಗಳು, ಗಳಿಕೆಗಳು ಮತ್ತು ಆನ್‌ಬೋರ್ಡಿಂಗ್ ಕುರಿತು ಮಾರ್ಗದರ್ಶನ ನೀಡಲು ಲಭ್ಯವಿದ್ದಾರೆ.',
            'contact_card_wa_title': 'WhatsApp ನಲ್ಲಿ ಚಾಟ್ ಮಾಡಿ',
            'contact_card_wa_desc': 'ನಮ್ಮ ಬೆಂಬಲ ತಂಡದಿಂದ ನಿಮ್ಮ ಎಲ್ಲಾ ಪ್ರಶ್ನೆಗಳಿಗೆ ತಕ್ಷಣದ ಉತ್ತರಗಳನ್ನು ಪಡೆಯಿರಿ.',
            'contact_card_call_title': 'ನಮ್ಮ ಪಾಲುದಾರಿಕೆ ಮ್ಯಾನೇಜರ್‌ಗೆ ಕರೆ ಮಾಡಿ',
            'contact_card_call_desc': 'ಬೆಳಿಗ್ಗೆ 9:00 ರಿಂದ ರಾತ್ರಿ 8:00 ರವರೆಗೆ ನೇਰ 1-ਆਨ-1 ਫੋਨ ਨਮੂਨਾ.',
            'dealer_sub_badge': 'ಡೇರಿ ಸಂಗ್ರಹ ಕೇಂದ್ರಗಳು ಮತ್ತು ಡೀಲರ್‌ಗಳಿಗಾಗಿ ಸಾಫ್ಟ್‌ವೇರ್ ಯೋಜನೆಗಳು',
            'dealer_sub_title': 'ದುಧಿಯಾ ಸಾಫ್ಟ್‌ವೇರ್‌ಗಾಗಿ ಅತ್ಯುತ್ತಮ ಯೋಜನೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
            'dealer_sub_subtitle': 'ದುಧಿಯಾ ಡೇರಿ ಸಂಗ್ರಹ ಸಾಫ್ಟ್‌ವೇರ್ ಬಳಸುವ ಡೇರಿಗಳಿಗಾಗಿ ಕೈಗೆಟುಕುವ ಯೋಜನೆಗಳು.',
            'dealer_plan_freetrial_title': 'ಉಚಿತ ಟ್ರಯಲ್',
            'dealer_plan_freetrial_price': 'FREE',
            'dealer_plan_freetrial_dur': '1 ತಿಂಗಳ ಕಾಲ',
            'dealer_plan_monthly_title': 'ಮಾಸಿಕ ಯೋಜನೆ',
            'dealer_plan_monthly_price': '₹899',
            'dealer_plan_monthly_orig': '₹999',
            'dealer_plan_monthly_unit': 'ಪ್ರತಿ ಡೇರಿ/ಸಂಗ್ರಹ ಕೇಂದ್ರ',
            'dealer_plan_yearly_title': 'ವಾರ್ಷਿਕ ಯೋಜನೆ',
            'dealer_plan_yearly_price': '₹9,999',
            'dealer_plan_yearly_orig': '₹10,999',
            'dealer_plan_yearly_unit': 'ಅನಿಯಮಿತ ಡೇರಿ/ಸಂಗ್ರಹ ಕೇಂದ್ರಗಳು',
            'feat_1_center': '1 ಡೇರಿ/ಸಂಗ್ರಹ ಕೇಂದ್ರ',
            'feat_basic_analytics': 'ಮೂಲಭೂತ ವರದಿ ಮತ್ತು ವಿಶ್ಲೇಷಣೆ',
            'feat_std_support': 'ಸ್ಟ್ಯಾಂಡರ್ಡ್ ಗ್ರಾಹಕ ಬೆಂಬಲ',
            'feat_basic_training': 'ಮೂಲಭೂತ ತರಬೇತಿ ಸಾಮಗ್ರಿಗಳು',
            'feat_flex_center': 'ಹೊಂದಿಕೊಳ್ಳುವ ಕೇಂದ್ರದ ಆಯ್ಕೆಗಳು',
            'feat_center_mgmt': 'ಸಂಗ್ರಹ ಕೇಂದ್ರಗಳ ನಿರ್ವಹಣೆ',
            'feat_adv_analytics': 'ಸುಧಾರಿತ ವರದಿ ಮತ್ತು ವಿಶ್ಲೇಷಣೆ',
            'feat_prio_support': 'ಆದ್ಯತೆಯ ಗ್ರಾਹಕ ಬೆಂಬಲ',
            'feat_training_onboard': 'ತರಬೇತಿ ಮತ್ತು ಆನ್‌ಬೋರ್ಡಿಂಗ್ ಸೇರಿಸಲಾಗಿದೆ',
            'feat_mktg_materials': 'ಮಾರ್ಕೆಟಿಂಗ್ ಸಾಮಗ್ರಿಗಳನ್ನು ನೀಡಲಾಗುತ್ತದೆ',
            'btn_get_started': 'ಈ ಯೋಜನೆಯೊಂದಿಗೆ ಪ್ರಾರಂಭಿಸಿ',
            'dealer_plan_contact_title': 'ಸಬ್‌ಸ್ಕ್ರಿಪ್ಷನ್ ಸಕ್ರಿಯಗೊಳಿಸಲು ಸಂಪರ್ಕಿಸಿ',
            'dealer_plan_contact_sub': 'ನಿಮ್ಮ ಯೋಜನೆಯನ್ನು ತಕ್ಷಣವೇ ಸಕ್ರಿಯಗೊಳಿಸಲು ನಮ್ಮ ತಂಡಕ್ಕೆ ಕರೆ ಮಾಡಿ ಅಥವಾ WhatsApp ಮಾಡಿ.'
        }
    };

    // Function to update language display across all navbar displays & dropdown items
    function updateLanguageDisplay(lang) {
        const langText = {
            'en': 'English',
            'hi': 'हिन्दी',
            'pa': 'ਪੰਜਾਬੀ',
            'kn': 'ಕನ್ನಡ'
        };

        const currentLangDisplay = document.getElementById('currentLang');
        const currentLangDisplayDesktop = document.getElementById('currentLangDesktop');

        if (currentLangDisplay && langText[lang]) {
            currentLangDisplay.textContent = langText[lang];
        }
        if (currentLangDisplayDesktop && langText[lang]) {
            currentLangDisplayDesktop.textContent = langText[lang];
        }

        // Update active class for all language option elements
        document.querySelectorAll('[data-lang]').forEach(opt => {
            if (opt.getAttribute('data-lang') === lang) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });
    }

    // Expose updateLanguageDisplay globally
    window.updateLanguageDisplay = updateLanguageDisplay;

    // Global Event Delegation for Language Dropdown Toggle & Options Click
    document.addEventListener('click', function (e) {
        const desktopToggle = e.target.closest('#langToggleDesktop');
        const mobileToggle = e.target.closest('#langToggle');
        const langItem = e.target.closest('[data-lang]');

        const langDropdownDesktop = document.getElementById('langDropdownDesktop');
        const langDropdown = document.getElementById('langDropdown');

        // 1. Desktop Toggle Click
        if (desktopToggle) {
            e.stopPropagation();
            if (langDropdownDesktop) {
                langDropdownDesktop.classList.toggle('show');
            }
            return;
        }

        // 2. Mobile Toggle Click
        if (mobileToggle) {
            e.stopPropagation();
            if (langDropdown) {
                langDropdown.classList.toggle('show');
            }
            return;
        }

        // 3. Language Option Click
        if (langItem) {
            e.preventDefault();
            const lang = langItem.getAttribute('data-lang');
            if (lang && translations[lang]) {
                updateLanguageDisplay(lang);
                if (langDropdownDesktop) langDropdownDesktop.classList.remove('show');
                if (langDropdown) langDropdown.classList.remove('show');

                updateLanguage(lang);
                localStorage.setItem('preferredLanguage', lang);

                // Dispatch global event for any listening page modules
                window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
            }
            return;
        }

        // 4. Close dropdowns when clicking outside
        if (langDropdownDesktop && !e.target.closest('.desktop-language-selector')) {
            langDropdownDesktop.classList.remove('show');
        }
        if (langDropdown && !e.target.closest('.language-selector') && !e.target.closest('.mobile-language-item')) {
            langDropdown.classList.remove('show');
        }
    });

    // Function to update the content based on selected language
    function updateLanguage(lang) {
        const elements = document.querySelectorAll('[data-i18n], [data-i18n-partner]');

        elements.forEach(element => {
            const key = element.getAttribute('data-i18n') || element.getAttribute('data-i18n-partner');

            if (translations[lang] && translations[lang][key]) {
                // Handle special cases
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = translations[lang][key];
                } else if (element.tagName === 'OPTION') {
                    element.textContent = translations[lang][key];
                } else {
                    element.innerHTML = translations[lang][key];
                }
            }
        });
    }

    // Expose updateLanguage globally for navbar translation after dynamic loading
    window.updateLanguage = updateLanguage;

    // Add data-i18n attributes to translatable elements
    function setupTranslationAttributes() {
        // Only set attributes for elements that don't already have them
        // This prevents conflicts with existing HTML data-i18n attributes

        // Navigation (only if not already set)
        const navLinks = document.querySelectorAll('nav ul li a:not([data-i18n])');
        const navKeys = ['nav_features', 'nav_benefits', 'nav_download', 'nav_contact'];

        navLinks.forEach((link, index) => {
            if (index < navKeys.length) {
                link.setAttribute('data-i18n', navKeys[index]);
            }
        });
    }

    // Initialize translations
    function initTranslations() {
        setupTranslationAttributes();

        // Check for saved language preference - default to Hindi
        const savedLang = localStorage.getItem('preferredLanguage') || 'hi';

        // Update active language in dropdown
        langOptions.forEach(option => {
            if (option.getAttribute('data-lang') === savedLang) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });

        // Update display text for both mobile and desktop
        updateLanguageDisplay(savedLang);

        // Apply saved language
        updateLanguage(savedLang);
    }

    // Listen for language change events from landing pages
    window.addEventListener('languageChanged', function (e) {
        const lang = e.detail.language;
        updateLanguageDisplay(lang);
        updateLanguage(lang);
    });

    // Run initialization
    initTranslations();




});

function initActiveLinkHighlighting() {
    // Use a small timeout to ensure DOM is fully ready after component injection
    setTimeout(() => {
        const navLinks = document.querySelectorAll('.nav-link');

        function updateActiveState() {
            const currentPath = window.location.pathname.split('/').pop() || 'index.html';
            const currentHash = window.location.hash || '';
            const scrollPosition = window.scrollY + 100; // Offset for navbar

            let activeFound = false;

            // 1. Scroll-Spy logic for index.html sections
            if (currentPath === 'index.html' || currentPath === 'index' || currentPath === '') {
                const sections = ['features', 'benefits', 'download', 'contact'];
                let currentSection = '';

                for (const id of sections) {
                    const el = document.getElementById(id);
                    if (el && scrollPosition >= el.offsetTop && scrollPosition < (el.offsetTop + el.offsetHeight)) {
                        currentSection = id;
                        break;
                    }
                }

                if (currentSection) {
                    navLinks.forEach(link => {
                        const href = link.getAttribute('href') || '';
                        if (href.includes('#' + currentSection)) {
                            link.classList.add('nav-link-active');
                            activeFound = true;
                        } else {
                            link.classList.remove('nav-link-active');
                        }
                    });
                    if (activeFound) return;
                }
            }

            // 2. Exact Path and Hash Matching
            navLinks.forEach(link => {
                const href = link.getAttribute('href') || '';
                link.classList.remove('nav-link-active');

                if (activeFound) return;

                // Match based on endsWith to handle potential relative path differences
                const cleanHref = href.split('#')[0];
                const hrefHash = href.includes('#') ? '#' + href.split('#')[1] : '';

                const isPageMatch = cleanHref === currentPath ||
                    (currentPath === 'index.html' && cleanHref === '') ||
                    (cleanHref === 'index.html' && currentPath === '');

                if (currentHash && isPageMatch && hrefHash === currentHash) {
                    link.classList.add('nav-link-active');
                    activeFound = true;
                } else if (!currentHash && isPageMatch && !hrefHash) {
                    link.classList.add('nav-link-active');
                    activeFound = true;
                }
            });
        }

        window.addEventListener('scroll', updateActiveState);
        window.addEventListener('hashchange', updateActiveState);
        updateActiveState();
    }, 150);
}

// Load footer component automatically if container exists
document.addEventListener('DOMContentLoaded', () => {
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        loadFooter(footerContainer);
    }
});

async function loadFooter(container) {
    try {
        const response = await fetch('components/footer.html');
        const footerHTML = await response.text();
        container.innerHTML = footerHTML;

        // Re-apply language translations if updateLanguage is available
        const savedLang = localStorage.getItem('preferredLanguage') || 'hi';
        if (typeof updateLanguage === 'function') {
            updateLanguage(savedLang);
        }
        if (typeof updateAboutDudhiyaLanguage === 'function') {
            updateAboutDudhiyaLanguage(savedLang);
        }
        if (typeof updateBuyerWorkflowLanguage === 'function') {
            updateBuyerWorkflowLanguage(savedLang);
        }
        if (typeof updateSupplierWorkflowLanguage === 'function') {
            updateSupplierWorkflowLanguage(savedLang);
        }
        if (typeof updatePartnerDealerLanguage === 'function') {
            updatePartnerDealerLanguage(savedLang);
        }

        // Setup newsletter form submit handler if on page
        initNewsletterSubmit();

        // Setup contact speed dial handler
        initContactSpeedDial();
    } catch (error) {
        console.error('Error loading footer:', error);
    }
}

function initNewsletterSubmit() {
    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterSubmit = document.getElementById('newsletterSubmit');

    if (newsletterForm && newsletterSubmit) {
        newsletterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('newsletterEmail').value;

            newsletterSubmit.disabled = true;
            const originalBtnContent = newsletterSubmit.innerHTML;
            newsletterSubmit.innerHTML = `
                <svg class="animate-spin h-4 w-4 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            `;

            try {
                const _cfg = window.LANDING_CONFIG || {};
                const _nocoBase = (_cfg.NOCODB_BASE_URL || '').replace(/\/$/, '');
                const _nocoTable = _cfg.NOCODB_TABLE_ID || '';
                const _nocoToken = _cfg.NOCODB_TOKEN || '';
                const _newsletterUrl = `${_nocoBase}/api/v2/tables/${_nocoTable}/records`;

                const response = await fetch(_newsletterUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'xc-token': _nocoToken
                    },
                    body: JSON.stringify({
                        "Email": email,
                        "Message": "Newsletter Subscription Signup"
                    })
                });

                if (response.ok) {
                    showGlobalNotification("Success! You're now on our list for the latest updates.", 'success');
                    newsletterForm.reset();
                } else {
                    const result = await response.json();
                    throw new Error(result.message || 'Subscription failed.');
                }
            } catch (error) {
                console.error('Newsletter Error:', error);
                showGlobalNotification('Error: ' + error.message, 'error');
            } finally {
                newsletterSubmit.disabled = false;
                newsletterSubmit.innerHTML = originalBtnContent;
            }
        });
    }
}

function showGlobalNotification(message, type = 'success') {
    const container = document.createElement('div');
    container.className = `fixed top-24 inset-x-0 flex justify-center z-[100] pointer-events-none`;

    const toast = document.createElement('div');
    toast.className = `flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl transition-all duration-500 transform -translate-y-10 opacity-0 pointer-events-auto ${
        type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
    }`;

    toast.innerHTML = `
        <span class="material-symbols-outlined">${type === 'success' ? 'check_circle' : 'error'}</span>
        <p class="font-bold">${message}</p>
    `;

    container.appendChild(toast);
    document.body.appendChild(container);

    setTimeout(() => {
        toast.classList.remove('-translate-y-10', 'opacity-0');
    }, 100);

    setTimeout(() => {
        toast.classList.add('-translate-y-10', 'opacity-0');
        setTimeout(() => container.remove(), 500);
    }, 4000);
}

function initContactSpeedDial() {
    const toggleBtn = document.getElementById('contact-toggle-btn');
    const optionsContainer = document.getElementById('contact-options');
    const toggleIcon = document.getElementById('contact-toggle-icon');

    if (toggleBtn && optionsContainer && toggleIcon) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = optionsContainer.classList.contains('pointer-events-none');
            
            if (isHidden) {
                optionsContainer.classList.remove('pointer-events-none', 'opacity-0', 'translate-y-4');
                optionsContainer.classList.add('opacity-100', 'translate-y-0');
                toggleIcon.textContent = 'close';
                toggleIcon.style.transform = 'rotate(90deg)';
            } else {
                optionsContainer.classList.add('pointer-events-none', 'opacity-0', 'translate-y-4');
                optionsContainer.classList.remove('opacity-100', 'translate-y-0');
                toggleIcon.textContent = 'call';
                toggleIcon.style.transform = 'rotate(0deg)';
            }
        });

        document.addEventListener('click', () => {
            if (!optionsContainer.classList.contains('pointer-events-none')) {
                optionsContainer.classList.add('pointer-events-none', 'opacity-0', 'translate-y-4');
                optionsContainer.classList.remove('opacity-100', 'translate-y-0');
                toggleIcon.textContent = 'call';
                toggleIcon.style.transform = 'rotate(0deg)';
            }
        });
    }
}

