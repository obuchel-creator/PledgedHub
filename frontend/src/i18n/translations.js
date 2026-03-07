/**
 * Translations for PledgedHub Application
 * Supported Languages: English (en), Luganda (lg), Swahili (sw)
 */

export const translations = {
  en: {
    // Navigation
    nav: {
      home: 'Home',
      campaigns: 'Campaigns',
      myPledges: 'My Pledges',
      analytics: 'Analytics',
      settings: 'Settings',
      help: 'Help',
      logout: 'Logout',
      login: 'Login',
      register: 'Register'
    },
    
    // Common
    common: {
      welcome: 'Welcome',
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      submit: 'Submit',
      close: 'Close',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      download: 'Download',
      upload: 'Upload',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information'
    },
    
    // Auth
    auth: {
      loginTitle: 'Login to Your Account',
      registerTitle: 'Create New Account',
      email: 'Email Address',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot Password?',
      rememberMe: 'Remember Me',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      signUp: 'Sign Up',
      signIn: 'Sign In',
      username: 'Username',
      phoneNumber: 'Phone Number'
    },
    
    // Dashboard/Home
    home: {
      title: 'Welcome to PledgedHub',
      subtitle: 'Make a difference with your commitment',
      activeCampaigns: 'Active Campaigns',
      totalPledges: 'Total Pledges',
      amountRaised: 'Amount Raised',
      viewAll: 'View All',
      makePledge: 'Make a Pledge',
      noCampaigns: 'No active campaigns at the moment',
      recentActivity: 'Recent Activity'
    },
    
    // Pledges
    pledges: {
      myPledges: 'My Pledges',
      pledgeAmount: 'Pledge Amount',
      pledgeDate: 'Pledge Date',
      status: 'Status',
      active: 'Active',
      pending: 'Pending',
      completed: 'Completed',
      cancelled: 'Cancelled',
      paid: 'Paid',
      overdue: 'Overdue',
      makePayment: 'Make Payment',
      viewDetails: 'View Details',
      amountPaid: 'Amount Paid',
      balanceRemaining: 'Balance Remaining',
      lastPayment: 'Last Payment',
      paymentHistory: 'Payment History',
      noPledges: 'You have no pledges yet'
    },
    
    // Campaigns
    campaigns: {
      allCampaigns: 'All Campaigns',
      campaignDetails: 'Campaign Details',
      goal: 'Goal',
      raised: 'Raised',
      donors: 'Donors',
      daysLeft: 'Days Left',
      donate: 'Donate Now',
      pledgeNow: 'Pledge Now',
      description: 'Description',
      updates: 'Updates',
      supporters: 'Supporters'
    },
    
    // Settings
    settings: {
      title: 'Settings',
      profile: 'Profile Settings',
      notifications: 'Notifications',
      appearance: 'Appearance',
      language: 'Language & Region',
      privacy: 'Privacy & Security',
      account: 'Account',
      changePassword: 'Change Password',
      twoFactor: 'Two-Factor Authentication',
      downloadData: 'Download My Data',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      enabled: 'ENABLED',
      disabled: 'DISABLED',
      saveChanges: 'Save Changes',
      emailNotifications: 'Email Notifications',
      emailNotificationsDesc: 'Receive updates and alerts via email',
      smsNotifications: 'SMS Notifications',
      smsNotificationsDesc: 'Get important alerts via text message',
      pushNotifications: 'Push Notifications',
      pledgeReminders: 'Pledge Reminders',
      pledgeRemindersDesc: 'Reminders about your upcoming pledges',
      campaignUpdates: 'Campaign Updates',
      campaignUpdatesDesc: 'Get notified about campaign milestones',
      weeklyReports: 'Weekly Reports',
      weeklyReportsDesc: 'Receive weekly summary of your pledges',
      paymentConfirmations: 'Payment Confirmations',
      balanceReminders: 'Balance Reminders',
      selectLanguage: 'Select Language',
      theme: 'Theme',
      themeLight: 'Light',
      themeDark: 'Dark',
      themeAuto: 'Auto',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode'
    },
    
    // Analytics
    analytics: {
      title: 'Analytics Dashboard',
      overview: 'Overview',
      pledgesTrend: 'Pledges Trend',
      topCampaigns: 'Top Campaigns',
      recentDonors: 'Recent Donors',
      totalRevenue: 'Total Revenue',
      avgPledge: 'Average Pledge',
      conversionRate: 'Conversion Rate',
      monthlyGrowth: 'Monthly Growth',
      // Dashboard elements
      loading: 'Loading analytics...',
      error: 'Error',
      backToDashboard: 'Back to Dashboard',
      startDate: 'Start',
      endDate: 'End',
      darkModeOn: 'Dark Mode On',
      lightModeOn: 'Light Mode On',
      // Stat Cards
      totalPledges: 'Total Pledges',
      totalAmount: 'Total Amount',
      paid: 'Paid',
      pending: 'Pending',
      overdue: 'Overdue',
      collectionRate: 'Collection Rate',
      // AI Insights
      aiInsights: 'AI Insights',
      loadingInsights: 'Loading insights...',
      noInsights: 'No insights available.',
      summary: 'Summary',
      trends: 'Trends',
      anomalies: 'Anomalies',
      recommendations: 'Recommendations',
      // Charts
      pledgeTrendsMonthly: 'Pledge Trends (Monthly)',
      pledgesLabel: 'Pledges',
      amountLabel: 'Amount (UGX)',
      // Top Donors
      topDonors: 'Top Donors',
      exportCSV: 'Export CSV',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      pledges: 'Pledges',
      totalPledged: 'Total Pledged',
      totalPaid: 'Total Paid',
      fulfillmentRate: 'Fulfillment Rate',
      // Purpose Breakdown
      pledgesByPurpose: 'Pledges by Purpose',
      // At-Risk Pledges
      atRiskOverdue: 'At-Risk & Overdue Pledges',
      donor: 'Donor',
      amount: 'Amount',
      purpose: 'Purpose',
      collectionDate: 'Collection Date',
      status: 'Status',
      daysOverdue: 'Days Overdue',
      riskLevel: 'Risk Level',
      // Campaign Breakdown
      campaignBreakdown: 'Campaign Breakdown',
      campaign: 'Campaign',
      // Export/Print Actions
      printDashboard: 'Print Dashboard',
      exportAllCSV: 'Export All CSV',
      exportAllExcel: 'Export All Excel',
      exportAllPDF: 'Export All PDF'
    },
    
    // Help
    help: {
      title: 'Help & Support',
      faq: 'Frequently Asked Questions',
      contact: 'Contact Us',
      documentation: 'Documentation',
      tutorials: 'Tutorials',
      searchHelp: 'Search help articles...',
      stillNeedHelp: 'Still need help?',
      contactSupport: 'Contact Support'
    },
    
    // Messages
    messages: {
      pledgeSuccess: 'Pledge created successfully!',
      paymentSuccess: 'Payment processed successfully!',
      updateSuccess: 'Updated successfully!',
      deleteSuccess: 'Deleted successfully!',
      errorOccurred: 'An error occurred. Please try again.',
      confirmDelete: 'Are you sure you want to delete this?',
      unsavedChanges: 'You have unsaved changes. Do you want to leave?',
      exportSuccess: 'Data exported successfully!',
      exportError: 'Failed to export data',
      passwordChanged: 'Password changed successfully!',
      twoFactorEnabled: 'Two-factor authentication enabled!',
      twoFactorDisabled: 'Two-factor authentication disabled!'
    },
    
    // Payment
    payment: {
      makePayment: 'Make Payment',
      paymentMethod: 'Payment Method',
      cash: 'Cash',
      mobileMoney: 'Mobile Money',
      bankTransfer: 'Bank Transfer',
      card: 'Card',
      amount: 'Amount',
      reference: 'Reference Number',
      processPayment: 'Process Payment',
      paymentDetails: 'Payment Details',
      partialPayment: 'Partial Payment',
      fullPayment: 'Full Payment'
    }
  },
  
  lg: {
    // Navigation - Luganda
    nav: {
      home: 'Awaka',
      campaigns: 'Emirimu',
      myPledges: 'Obweyamo Bwange',
      analytics: 'Okwekenenya',
      settings: 'Enteekateeka',
      help: 'Obuyambi',
      logout: 'Fuluma',
      login: 'Yingira',
      register: 'Wandiisa'
    },
    
    // Common - Luganda
    common: {
      welcome: 'Tukwaniriza',
      loading: 'Kigenda...',
      save: 'Tereka',
      cancel: 'Sazaamu',
      delete: 'Gyawo',
      edit: 'Kyusa',
      submit: 'Waayo',
      close: 'Ggalawo',
      confirm: 'Kakasa',
      back: 'Komawo',
      next: 'Ddako',
      search: 'Noonya',
      filter: 'Sengejja',
      export: 'Fulumya',
      import: 'Leeta',
      download: 'Wanula',
      upload: 'Teeka',
      success: 'Kiwedde',
      error: 'Kiremye',
      warning: 'Okulabula',
      info: 'Amakulu'
    },
    
    // Auth - Luganda
    auth: {
      loginTitle: 'Yingira mu Akawunti Yo',
      registerTitle: 'Tondawo Akawunti Empya',
      email: 'Endagamuntu (Email)',
      password: 'Ekigambo Eky\'ekyama',
      confirmPassword: 'Ddamu Ekigambo Eky\'ekyama',
      forgotPassword: 'Weerabidde Ekigambo Eky\'ekyama?',
      rememberMe: 'Nzijukira',
      noAccount: 'Tolina kawunti?',
      hasAccount: 'Olina dda akawunti?',
      signUp: 'Wandiisa',
      signIn: 'Yingira',
      username: 'Erinnya',
      phoneNumber: 'Namba ya Simu'
    },
    
    // Dashboard/Home - Luganda
    home: {
      title: 'Tukwaniriza ku PledgedHub',
      subtitle: 'Kola enkyukakyuka n\'obweyamo bwo',
      activeCampaigns: 'Emirimu Egikola',
      totalPledges: 'Obweyamo Bwonna',
      amountRaised: 'Ssente Ezikungaanyiziddwa',
      viewAll: 'Laba Byonna',
      makePledge: 'Kola Obweyamo',
      noCampaigns: 'Tewali mirimu gikola kati',
      recentActivity: 'Ebyo Ebikolebwa Kaakano'
    },
    
    // Pledges - Luganda
    pledges: {
      myPledges: 'Obweyamo Bwange',
      pledgeAmount: 'Omuwendo gw\'Obweyamo',
      pledgeDate: 'Olunaku lw\'Obweyamo',
      status: 'Embeera',
      active: 'Kikola',
      pending: 'Kirindiridde',
      completed: 'Kimaze',
      cancelled: 'Kisaziddwamu',
      paid: 'Kisasuliddwa',
      overdue: 'Kiwedde',
      makePayment: 'Sasula',
      viewDetails: 'Laba Ebikwata ku Kino',
      amountPaid: 'Omuwendo Ogusasuliddwa',
      balanceRemaining: 'Omuwendo Ogusigadde',
      lastPayment: 'Okusasula kw\'Enkomerero',
      paymentHistory: 'Ebyafaayo by\'Okusasula',
      noPledges: 'Tolinaako bweyamo kati'
    },
    
    // Campaigns - Luganda
    campaigns: {
      allCampaigns: 'Emirimu Gyonna',
      campaignDetails: 'Ebikwata ku Mulimu',
      goal: 'Ekigendererwa',
      raised: 'Ezikungaanyiziddwa',
      donors: 'Abeewaayo',
      daysLeft: 'Ennaku Ezisigadde',
      donate: 'Waayo Kati',
      pledgeNow: 'Eeyama Kati',
      description: 'Okunnyonnyola',
      updates: 'Amakulu Amapya',
      supporters: 'Abawagizi'
    },
    
    // Settings - Luganda
    settings: {
      title: 'Enteekateeka',
      profile: 'Ebikwata ku Wawe',
      notifications: 'Obubaka',
      appearance: 'Endabika',
      language: 'Olulimi n\'Ekitundu',
      privacy: 'Ebyama n\'Obukuumi',
      account: 'Akawunti',
      changePassword: 'Kyusa Ekigambo Eky\'ekyama',
      twoFactor: 'Okukakasa Emirundi Ebiri',
      downloadData: 'Wanula Ebikwata ku We',
      currentPassword: 'Ekigambo Eky\'ekyama Ekiriwo',
      newPassword: 'Ekigambo Eky\'ekyama Ekipya',
      enabled: 'KIKOZESEBWA',
      disabled: 'TEKIKOZESEBWA',
      saveChanges: 'Tereka Enkyukakyuka',
      emailNotifications: 'Obubaka bwa Email',
      emailNotificationsDesc: 'Funa amakulu n\'obubaka mu email',
      smsNotifications: 'Obubaka bwa SMS',
      smsNotificationsDesc: 'Funa obubaka obukulu mu SMS',
      pushNotifications: 'Obubaka obusunsulwa',
      pledgeReminders: 'Okujjukiza Obweyamo',
      pledgeRemindersDesc: 'Okujjukiza ku bweyamo bwo obujja',
      campaignUpdates: 'Amakulu g\'Emirimu',
      campaignUpdatesDesc: 'Manyisibwa ebituufu by\'emirimu',
      weeklyReports: 'Alipooti za Buli Wiiki',
      weeklyReportsDesc: 'Funa okuggyamu kw\'obweyamo bwo buli wiiki',
      paymentConfirmations: 'Okukakasa Okusasula',
      balanceReminders: 'Okujjukiza Ebisigadde',
      selectLanguage: 'Londa Olulimi',
      theme: 'Endabika',
      themeLight: 'Ekitangaala',
      themeDark: 'Ekizikiza',
      themeAuto: 'Okwekola',
      darkMode: 'Ekizikiza',
      lightMode: 'Ekitangaala'
    },
    
    // Analytics - Luganda
    analytics: {
      title: 'Okwekenenya Amakulu',
      overview: 'Okutunuulira Okumu',
      pledgesTrend: 'Enkola y\'Obweyamo',
      topCampaigns: 'Emirimu Egisinga',
      recentDonors: 'Abeewaayo Abaakakanu',
      totalRevenue: 'Ensimbi Zonna',
      avgPledge: 'Omuwendo gw\'Obweyamo Ogwa Bulijjo',
      conversionRate: 'Omuwendo gw\'Enkyukakyuka',
      monthlyGrowth: 'Okukula kwa Buli Mwezi',
      // Dashboard elements
      loading: 'Tukuteekateeka ebintu...',
      error: 'Kiremya',
      backToDashboard: 'Ddayo ku Dashibodi',
      startDate: 'Tandika',
      endDate: 'Komekkereza',
      darkModeOn: 'Ekizikiza Kikolebwa',
      lightModeOn: 'Ekitangaala Kikolebwa',
      // Stat Cards
      totalPledges: 'Obweyamo Bwonna',
      totalAmount: 'Omuwendo Gwonna',
      paid: 'Obusaasulidde',
      pending: 'Obulindiridde',
      overdue: 'Obw\'olubeerawo',
      collectionRate: 'Omuwendo gw\'Okukung\'aanya',
      // AI Insights
      aiInsights: 'Ebiteekateeko by\'AI',
      loadingInsights: 'Tukuteekateeka ebiteekateeko...',
      noInsights: 'Tewali biteekateeko',
      summary: 'Okuggyamu',
      trends: 'Enkyukakyuka',
      anomalies: 'Ebitaliimu',
      recommendations: 'Ebirowoozo',
      // Charts  
      pledgeTrendsMonthly: 'Enkyukakyuka y\'Obweyamo (Buli Mwezi)',
      pledgesLabel: 'Obweyamo',
      amountLabel: 'Omuwendo (UGX)',
      // Top Donors
      topDonors: 'Abawaayo Abakulu',
      exportCSV: 'Teeka CSV',
      name: 'Erinnya',
      email: 'Emeeri',
      phone: 'Essimu',
      pledges: 'Obweyamo',
      totalPledged: 'Obweyamo Bwonna',
      totalPaid: 'Obusaasulidde Bwonna',
      fulfillmentRate: 'Omuwendo gw\'Okutuukiriza',
      // Purpose Breakdown
      pledgesByPurpose: 'Obweyamo ng\'Ekigendererwa',
      // At-Risk Pledges
      atRiskOverdue: 'Obweyamo Obulimu Akabi & Obw\'olubeerawo',
      donor: 'Omuwaayo',
      amount: 'Omuwendo',
      purpose: 'Ekigendererwa',
      collectionDate: 'Olunaku lw\'Okukung\'aanya',
      status: 'Embeera',
      daysOverdue: 'Ennaku ez\'olubeerawo',
      riskLevel: 'Omutindo gw\'Akabi',
      // Campaign Breakdown
      campaignBreakdown: 'Kampeyini ng\'Okwawulamu',
      campaign: 'Kampeyini',
      // Export/Print Actions
      printDashboard: 'Fulumya Dashibodi',
      exportAllCSV: 'Teeka Byonna CSV',
      exportAllExcel: 'Teeka Byonna Excel',
      exportAllPDF: 'Teeka Byonna PDF'
    },
    
    // Help - Luganda
    help: {
      title: 'Obuyambi n\'Okuwagira',
      faq: 'Ebibuuzo Ebya Bulijjo',
      contact: 'Tusisinkane',
      documentation: 'Ebiwandiiko',
      tutorials: 'Okusomesa',
      searchHelp: 'Noonya ebiwandiiko by\'obuyambi...',
      stillNeedHelp: 'Okyetaaga obuyambi?',
      contactSupport: 'Sisinkana n\'Abawagizi'
    },
    
    // Messages - Luganda
    messages: {
      pledgeSuccess: 'Obweyamo butondeddwa obulungi!',
      paymentSuccess: 'Okusasula kuwedde obulungi!',
      updateSuccess: 'Kyuuse obulungi!',
      deleteSuccess: 'Kigiddwaawo obulungi!',
      errorOccurred: 'Wabaddewo kiremye. Ddamu okugezaako.',
      confirmDelete: 'Ddala oyagala okuggyawo kino?',
      unsavedChanges: 'Olina enkyukakyuka ezitaterekeddwa. Oyagala okufuluma?',
      exportSuccess: 'Ebikwata ku we bifulumiziddwa obulungi!',
      exportError: 'Kiremye okufulumya ebikwata ku we',
      passwordChanged: 'Ekigambo eky\'ekyama kikyusiddwa obulungi!',
      twoFactorEnabled: 'Okukakasa emirundi ebiri kutandikiddwa!',
      twoFactorDisabled: 'Okukakasa emirundi ebiri kukomeddwa!'
    },
    
    // Payment - Luganda
    payment: {
      makePayment: 'Sasula',
      paymentMethod: 'Engeri y\'Okusasula',
      cash: 'Ssente',
      mobileMoney: 'Ssente za Simu',
      bankTransfer: 'Okutambuza Ssente za Bbanka',
      card: 'Kaadi',
      amount: 'Omuwendo',
      reference: 'Namba y\'Okwogerako',
      processPayment: 'Sasula',
      paymentDetails: 'Ebikwata ku Kusasula',
      partialPayment: 'Okusasula Kitundu',
      fullPayment: 'Okusasula Byonna'
    }
  },
  
  sw: {
    // Navigation - Swahili
    nav: {
      home: 'Nyumbani',
      campaigns: 'Kampeni',
      myPledges: 'Ahadi Zangu',
      analytics: 'Takwimu',
      settings: 'Mipangilio',
      help: 'Msaada',
      logout: 'Ondoka',
      login: 'Ingia',
      register: 'Jisajili'
    },
    
    // Common - Swahili
    common: {
      welcome: 'Karibu',
      loading: 'Inapakia...',
      save: 'Hifadhi',
      cancel: 'Ghairi',
      delete: 'Futa',
      edit: 'Hariri',
      submit: 'Wasilisha',
      close: 'Funga',
      confirm: 'Thibitisha',
      back: 'Rudi',
      next: 'Ifuatayo',
      search: 'Tafuta',
      filter: 'Chuja',
      export: 'Hamisha',
      import: 'Leta',
      download: 'Pakua',
      upload: 'Pakia',
      success: 'Imefanikiwa',
      error: 'Hitilafu',
      warning: 'Onyo',
      info: 'Taarifa'
    },
    
    // Auth - Swahili
    auth: {
      loginTitle: 'Ingia kwenye Akaunti Yako',
      registerTitle: 'Fungua Akaunti Mpya',
      email: 'Barua Pepe',
      password: 'Nywila',
      confirmPassword: 'Thibitisha Nywila',
      forgotPassword: 'Umesahau Nywila?',
      rememberMe: 'Nikumbuke',
      noAccount: 'Hauna akaunti?',
      hasAccount: 'Tayari una akaunti?',
      signUp: 'Jisajili',
      signIn: 'Ingia',
      username: 'Jina la Mtumiaji',
      phoneNumber: 'Nambari ya Simu'
    },
    
    // Dashboard/Home - Swahili
    home: {
      title: 'Karibu kwenye PledgedHub',
      subtitle: 'Fanya mabadiliko kwa ahadi yako',
      activeCampaigns: 'Kampeni Zinazoendelea',
      totalPledges: 'Jumla ya Ahadi',
      amountRaised: 'Kiasi Kilichokusanywa',
      viewAll: 'Tazama Zote',
      makePledge: 'Fanya Ahadi',
      noCampaigns: 'Hakuna kampeni zinazoendelea kwa sasa',
      recentActivity: 'Shughuli za Hivi Karibuni'
    },
    
    // Pledges - Swahili
    pledges: {
      myPledges: 'Ahadi Zangu',
      pledgeAmount: 'Kiasi cha Ahadi',
      pledgeDate: 'Tarehe ya Ahadi',
      status: 'Hali',
      active: 'Inaendelea',
      pending: 'Inasubiri',
      completed: 'Imekamilika',
      cancelled: 'Imeghairiwa',
      paid: 'Imelipwa',
      overdue: 'Imechelewa',
      makePayment: 'Lipa',
      viewDetails: 'Tazama Maelezo',
      amountPaid: 'Kiasi Kilicholipwa',
      balanceRemaining: 'Kiasi Kilichobaki',
      lastPayment: 'Malipo ya Mwisho',
      paymentHistory: 'Historia ya Malipo',
      noPledges: 'Huna ahadi kwa sasa'
    },
    
    // Campaigns - Swahili
    campaigns: {
      allCampaigns: 'Kampeni Zote',
      campaignDetails: 'Maelezo ya Kampeni',
      goal: 'Lengo',
      raised: 'Iliyokusanywa',
      donors: 'Wafadhili',
      daysLeft: 'Siku Zilizobaki',
      donate: 'Changia Sasa',
      pledgeNow: 'Ahidi Sasa',
      description: 'Maelezo',
      updates: 'Habari',
      supporters: 'Waunga Mkono'
    },
    
    // Settings - Swahili
    settings: {
      title: 'Mipangilio',
      profile: 'Wasifu',
      notifications: 'Arifa',
      appearance: 'Muonekano',
      language: 'Lugha na Eneo',
      privacy: 'Faragha na Usalama',
      account: 'Akaunti',
      changePassword: 'Badilisha Nywila',
      twoFactor: 'Uthibitishaji wa Hatua Mbili',
      downloadData: 'Pakua Data Yangu',
      currentPassword: 'Nywila ya Sasa',
      newPassword: 'Nywila Mpya',
      enabled: 'IMEWASHWA',
      disabled: 'IMEZIMWA',
      saveChanges: 'Hifadhi Mabadiliko',
      emailNotifications: 'Arifa za Barua Pepe',
      emailNotificationsDesc: 'Pokea habari na arifa kupitia barua pepe',
      smsNotifications: 'Arifa za SMS',
      smsNotificationsDesc: 'Pokea arifa muhimu kupitia ujumbe mfupi',
      pushNotifications: 'Arifa za Kusukuma',
      pledgeReminders: 'Vikumbusho vya Ahadi',
      pledgeRemindersDesc: 'Vikumbusho kuhusu ahadi zako zinazokuja',
      campaignUpdates: 'Habari za Kampeni',
      campaignUpdatesDesc: 'Pata taarifa kuhusu mafanikio ya kampeni',
      weeklyReports: 'Ripoti za Kila Wiki',
      weeklyReportsDesc: 'Pokea muhtasari wa ahadi zako kila wiki',
      paymentConfirmations: 'Uthibitisho wa Malipo',
      balanceReminders: 'Vikumbusho vya Salio',
      selectLanguage: 'Chagua Lugha',
      theme: 'Mandhari',
      themeLight: 'Mwanga',
      themeDark: 'Giza',
      themeAuto: 'Kiotomatiki',
      darkMode: 'Hali ya Giza',
      lightMode: 'Hali ya Mwanga'
    },
    
    // Analytics - Swahili
    analytics: {
      title: 'Dashibodi ya Takwimu',
      overview: 'Muhtasari',
      pledgesTrend: 'Mwenendo wa Ahadi',
      topCampaigns: 'Kampeni Bora',
      recentDonors: 'Wafadhili wa Hivi Karibuni',
      totalRevenue: 'Mapato Jumla',
      avgPledge: 'Wastani wa Ahadi',
      conversionRate: 'Kiwango cha Ubadilishaji',
      monthlyGrowth: 'Ukuaji wa Kila Mwezi',
      // Dashboard elements
      loading: 'Inapakia takwimu...',
      error: 'Hitilafu',
      backToDashboard: 'Rudi kwenye Dashibodi',
      startDate: 'Anza',
      endDate: 'Mwisho',
      darkModeOn: 'Hali ya Giza Imewashwa',
      lightModeOn: 'Hali ya Mwanga Imewashwa',
      // Stat Cards
      totalPledges: 'Jumla ya Ahadi',
      totalAmount: 'Jumla ya Kiasi',
      paid: 'Imelipwa',
      pending: 'Inasubiri',
      overdue: 'Imechelewa',
      collectionRate: 'Kiwango cha Ukusanyaji',
      // AI Insights
      aiInsights: 'Ufahamu wa AI',
      loadingInsights: 'Inapakia ufahamu...',
      noInsights: 'Hakuna ufahamu unapatikana.',
      summary: 'Muhtasari',
      trends: 'Mienendo',
      anomalies: 'Makosa',
      recommendations: 'Mapendekezo',
      // Charts  
      pledgeTrendsMonthly: 'Mwenendo wa Ahadi (Kila Mwezi)',
      pledgesLabel: 'Ahadi',
      amountLabel: 'Kiasi (UGX)',
      // Top Donors
      topDonors: 'Wafadhili Wakuu',
      exportCSV: 'Hamisha CSV',
      name: 'Jina',
      email: 'Barua Pepe',
      phone: 'Simu',
      pledges: 'Ahadi',
      totalPledged: 'Jumla ya Kuahidiwa',
      totalPaid: 'Jumla ya Kulipwa',
      fulfillmentRate: 'Kiwango cha Utimizaji',
      // Purpose Breakdown
      pledgesByPurpose: 'Ahadi kwa Madhumuni',
      // At-Risk Pledges
      atRiskOverdue: 'Ahadi Zenye Hatari & Zilizochelewa',
      donor: 'Mfadhili',
      amount: 'Kiasi',
      purpose: 'Madhumuni',
      collectionDate: 'Tarehe ya Ukusanyaji',
      status: 'Hali',
      daysOverdue: 'Siku Zilizochelewa',
      riskLevel: 'Kiwango cha Hatari',
      // Campaign Breakdown
      campaignBreakdown: 'Mgawanyiko wa Kampeni',
      campaign: 'Kampeni',
      // Export/Print Actions
      printDashboard: 'Chapisha Dashibodi',
      exportAllCSV: 'Hamisha Yote CSV',
      exportAllExcel: 'Hamisha Yote Excel',
      exportAllPDF: 'Hamisha Yote PDF'
    },
    
    // Help - Swahili
    help: {
      title: 'Msaada na Usaidizi',
      faq: 'Maswali Yanayoulizwa Mara kwa Mara',
      contact: 'Wasiliana Nasi',
      documentation: 'Nyaraka',
      tutorials: 'Mafunzo',
      searchHelp: 'Tafuta makala za msaada...',
      stillNeedHelp: 'Bado unahitaji msaada?',
      contactSupport: 'Wasiliana na Usaidizi'
    },
    
    // Messages - Swahili
    messages: {
      pledgeSuccess: 'Ahadi imeundwa kwa mafanikio!',
      paymentSuccess: 'Malipo yamechakatwa kwa mafanikio!',
      updateSuccess: 'Imesasishwa kwa mafanikio!',
      deleteSuccess: 'Imefutwa kwa mafanikio!',
      errorOccurred: 'Hitilafu imetokea. Tafadhali jaribu tena.',
      confirmDelete: 'Una uhakika unataka kufuta hii?',
      unsavedChanges: 'Una mabadiliko ambayo hayajahifadhiwa. Unataka kuondoka?',
      exportSuccess: 'Data imehamishwa kwa mafanikio!',
      exportError: 'Imeshindwa kuhamisha data',
      passwordChanged: 'Nywila imebadilishwa kwa mafanikio!',
      twoFactorEnabled: 'Uthibitishaji wa hatua mbili umewashwa!',
      twoFactorDisabled: 'Uthibitishaji wa hatua mbili umezimwa!'
    },
    
    // Payment - Swahili
    payment: {
      makePayment: 'Fanya Malipo',
      paymentMethod: 'Njia ya Malipo',
      cash: 'Pesa Taslimu',
      mobileMoney: 'Pesa za Simu',
      bankTransfer: 'Uhamishaji wa Benki',
      card: 'Kadi',
      amount: 'Kiasi',
      reference: 'Nambari ya Kumbukumbu',
      processPayment: 'Chakata Malipo',
      paymentDetails: 'Maelezo ya Malipo',
      partialPayment: 'Malipo ya Sehemu',
      fullPayment: 'Malipo Kamili'
    }
  },
  rny: {
    nav: {
      home: 'Ahansi',
      campaigns: 'Omurimo',
      myPledges: 'Ebirayiro Byange',
      analytics: 'Obubalo',
      settings: 'Enkora',
      help: 'Obuyambi',
      logout: 'Genda',
      login: 'Injira',
      register: 'Iyandikishe'
    },
    common: {
      welcome: 'Tukushemererwe',
      loading: 'Kutekateka...',
      save: 'Tereka',
      cancel: 'Saza',
      delete: 'Sangura',
      edit: 'Hindura',
      submit: 'Tuma',
      close: 'Gara',
      confirm: 'Kakasa',
      back: 'Garuka',
      next: 'Komeza',
      search: 'Shakisha',
      filter: 'Sengeja',
      export: 'Fulumya',
      import: 'Leeta',
      download: 'Wanura',
      upload: 'Teeka',
      success: 'Kyakora',
      error: 'Kireme',
      warning: 'Okurabura',
      info: 'Amakuru'
    },
    // ...add more keys as needed
  },
  ateso: {
    nav: {
      home: 'Ekai',
      campaigns: 'Emikoro',
      myPledges: 'Ebirayiro Ikai',
      analytics: 'Obubalo',
      settings: 'Ekikaro',
      help: 'Obuyambi',
      logout: 'Genda',
      login: 'Ingo',
      register: 'Ikwang'
    },
    common: {
      welcome: 'Ejai',
      loading: 'Ekitere...',
      save: 'Tereka',
      cancel: 'Saza',
      delete: 'Sangura',
      edit: 'Hindura',
      submit: 'Tuma',
      close: 'Gara',
      confirm: 'Kakasa',
      back: 'Garuka',
      next: 'Komeza',
      search: 'Shakisha',
      filter: 'Sengeja',
      export: 'Fulumya',
      import: 'Leeta',
      download: 'Wanura',
      upload: 'Teeka',
      success: 'Kyakora',
      error: 'Kireme',
      warning: 'Okurabura',
      info: 'Amakuru'
    },
    // ...add more keys as needed
  },
  fr: {
    nav: {
      home: 'Accueil',
      campaigns: 'Campagnes',
      myPledges: 'Mes Engagements',
      analytics: 'Analytique',
      settings: 'Paramètres',
      help: 'Aide',
      logout: 'Déconnexion',
      login: 'Connexion',
      register: 'Inscription'
    },
    common: {
      welcome: 'Bienvenue',
      loading: 'Chargement...',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      submit: 'Soumettre',
      close: 'Fermer',
      confirm: 'Confirmer',
      back: 'Retour',
      next: 'Suivant',
      search: 'Rechercher',
      filter: 'Filtrer',
      export: 'Exporter',
      import: 'Importer',
      download: 'Télécharger',
      upload: 'Téléverser',
      success: 'Succès',
      error: 'Erreur',
      warning: 'Avertissement',
      info: 'Information'
    },
    // ...add more keys as needed
  },
};

// Helper function to get translation
export const t = (key, language = 'en') => {
  const keys = key.split('.');
  let value = translations[language];
  
  for (const k of keys) {
    if (value && value[k]) {
      value = value[k];
    } else {
      // Fallback to English
      value = translations['en'];
      for (const k of keys) {
        if (value && value[k]) {
          value = value[k];
        } else {
          return key; // Return key if not found
        }
      }
      break;
    }
  }
  
  return value;
};

export default translations;
