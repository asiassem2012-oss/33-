export interface LabResultRecord {
  analysisCode: string;
  patientName: string;
  testName: string;
  testCategory: string;
  testDate: string;
  status: 'ready' | 'pending';
  estimatedCompletion: string;
  pdfDataUrl: string;
  pdfFileName: string;
  clinicalSummary: string;
  createdBy: string;
  patientPhone?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HomeCollectionRecord {
  requestId: string;
  requesterId: string;
  patientName: string;
  phone: string;
  address: string;
  district: string;
  preferredDate: string;
  preferredTimeSlot: string;
  notes: string;
  prescriptionDataUrl: string;
  prescriptionFileName: string;
  status: 'new' | 'confirmed' | 'completed' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

export interface LabDirectoryItem {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  category: string;
  priceEgp: number;
  turnaroundTime: string;
  sampleType: string;
  fastingRequired: boolean;
  preparationAr: string;
  clinicalPurposeAr: string;
}

export const LIFE_LABS_INFO = {
  nameAr: 'معامل الحياة للتحاليل الطبية',
  nameEn: 'Life Labs Medical Diagnostics',
  cityAr: 'المنصورة',
  addressBranch1: 'فرع المشاية: شارع المشاية السفلية - أمام بوابة نادي جزيرة الورد - المنصورة',
  addressBranch2: 'فرع الجمهورية: شارع الجمهورية - أمام مستشفى الجامعة الرئيسي - المنصورة',
  phone: '01113350500',
  whatsappNumber: '201113350500',
  website: 'lifelabseg.com',
  hoursAr: 'نعمل على مدار 24 ساعة طوال أيام الأسبوع (24/7)',
};

export const MANSOURA_DISTRICTS = [
  'شارع المشاية السفلية',
  'شارع الجمهورية',
  'توريل الجديدة والقديمة',
  'حي الجامعة',
  'تقسيم سامي الجمل',
  'شارع قناة السويس',
  'شارع الجلاء',
  'شارع الترعة ومدينة مبارك',
  'المجزر الآلي',
  'جديلة وقولونجيل',
  'طلخا',
  'منطقة أخرى بالمنصورة',
];

export const INITIAL_DEMO_RESULTS: LabResultRecord[] = [
  {
    analysisCode: 'LAB-2026-889',
    patientName: 'أحمد محمد عبد الرحمن الشناوي',
    testName: 'صورة دم كاملة (Complete Blood Count - CBC)',
    testCategory: 'أمراض الدم (Hematology)',
    testDate: '2026-10-01',
    status: 'ready',
    estimatedCompletion: 'مكتمل وجاهز للتحميل',
    pdfDataUrl: '',
    pdfFileName: 'LifeLabs_LAB-2026-889_CBC_Report.pdf',
    clinicalSummary:
      'Hemoglobin: 14.6 g/dL (Normal: 13.5-17.5) | WBCs: 6.8 x10^3/uL (Normal: 4.5-11.0) | Platelets: 265 x10^3/uL (Normal: 150-450) | RBCs: 5.12 x10^6/uL. جميع المؤشرات الخلوية ضمن النطاق الفسيولوجي الطبيعي.',
    createdBy: 'system_seed',
    patientPhone: '01012345678',
    notes: 'تمت المراجعة والاعتماد من استشاري الباثولوجيا الإكلينيكية',
  },
  {
    analysisCode: 'LAB-2026-412',
    patientName: 'فاطمة الزهراء محمود السيد',
    testName: 'ملف الدهون الكامل والسكر التراكمي (Lipid Profile & HbA1c)',
    testCategory: 'الكيمياء الإكلينيكية والسكري',
    testDate: '2026-10-01',
    status: 'pending',
    estimatedCompletion: 'اليوم الساعة 07:30 مساءً (خلال ساعتين)',
    pdfDataUrl: '',
    pdfFileName: '',
    clinicalSummary:
      'العينة قيد الفحص حالياً داخل وحدة الكيمياء الحيوية الآلية (Cobas c311). سيتم إتاحة ملف النتيجة فور اعتماد الطبيب المراجع.',
    createdBy: 'system_seed',
    patientPhone: '01098765432',
    notes: 'صيام 12 ساعة مستوفى',
  },
  {
    analysisCode: 'LAB-2026-905',
    patientName: 'محمود إبراهيم الدسوقي خليل',
    testName: 'وظائف الغدة الدرقية الكاملة (TSH, Free T3, Free T4)',
    testCategory: 'الهرمونات والغدد الصماء',
    testDate: '2026-09-30',
    status: 'ready',
    estimatedCompletion: 'مكتمل وجاهز للتحميل',
    pdfDataUrl: '',
    pdfFileName: 'LifeLabs_LAB-2026-905_Thyroid_Panel.pdf',
    clinicalSummary:
      'TSH: 2.14 uIU/mL (Normal: 0.40-4.50) | Free T4: 1.28 ng/dL (Normal: 0.80-1.80) | Free T3: 3.10 pg/mL (Normal: 2.30-4.20). كفاءة الغدة الدرقية منتظمة.',
    createdBy: 'system_seed',
    patientPhone: '01223344556',
    notes: 'متابعة دورية',
  },
  {
    analysisCode: 'LAB-2026-731',
    patientName: 'سارة طارق عبد الفتاح الجندي',
    testName: 'فيتامين د الكلي ومخزون الحديد (25-OH Vitamin D & Serum Ferritin)',
    testCategory: 'الفيتامينات والمناعة',
    testDate: '2026-09-29',
    status: 'ready',
    estimatedCompletion: 'مكتمل وجاهز للتحميل',
    pdfDataUrl: '',
    pdfFileName: 'LifeLabs_LAB-2026-731_VitD_Ferritin.pdf',
    clinicalSummary:
      '25-OH Vitamin D: 38.5 ng/mL (Sufficient: 30-100) | Serum Ferritin: 64.0 ng/mL (Normal Female: 15-150). مستويات مثالية.',
    createdBy: 'system_seed',
    patientPhone: '01144556677',
    notes: 'تم إرسال إشعار واتساب للمريضة',
  },
];

export const LAB_DIRECTORY_ITEMS: LabDirectoryItem[] = [
  {
    id: 'test-cbc',
    code: 'HEM-01',
    nameAr: 'صورة دم كاملة',
    nameEn: 'Complete Blood Count (CBC)',
    category: 'أمراض الدم',
    priceEgp: 180,
    turnaroundTime: '3 ساعات',
    sampleType: 'دم وريدي (EDTA)',
    fastingRequired: false,
    preparationAr: 'لا يشترط الصيام؛ يمكن سحب العينة في أي وقت على مدار اليوم.',
    clinicalPurposeAr: 'تقييم نسبة الهيموجلوبين، كرات الدم الحمراء والبيضاء، والصفائح الدموية لتشخيص الأنيميا والعدوى.',
  },
  {
    id: 'test-lipid',
    code: 'BIO-02',
    nameAr: 'ملف الدهون الكامل بالدم',
    nameEn: 'Full Lipid Profile (Cholesterol, Triglycerides, HDL, LDL)',
    category: 'السكري والدهون',
    priceEgp: 360,
    turnaroundTime: '4 ساعات',
    sampleType: 'سيرم (Serum)',
    fastingRequired: true,
    preparationAr: 'يشترط صيام تام من 10 إلى 12 ساعة قبل سحب العينة، ويُسمح بشرب الماء الصافي فقط.',
    clinicalPurposeAr: 'قياس الكوليسترول الكلي والدهون الثلاثية والدهون النافعة والضارة لتقييم صحة القلب والشرايين.',
  },
  {
    id: 'test-fbs-ppbs',
    code: 'BIO-03',
    nameAr: 'سكر صائم وفاطر بالدم',
    nameEn: 'Fasting & 2-Hour Postprandial Blood Glucose',
    category: 'السكري والدهون',
    priceEgp: 140,
    turnaroundTime: 'ساعتان',
    sampleType: 'بلازما فلوريد',
    fastingRequired: true,
    preparationAr: 'صيام من 8 إلى 10 ساعات للعينة الأولى، ثم تناول وجبة متكاملة والانتظار ساعتين بالضبط للعينة الثانية.',
    clinicalPurposeAr: 'التشخيص الدقيق لمرض السكري ومتابعة استجابة الجسم للأنسولين بعد الوجبات.',
  },
  {
    id: 'test-hba1c',
    code: 'BIO-04',
    nameAr: 'تحليل السكر التراكمي',
    nameEn: 'Glycated Hemoglobin (HbA1c)',
    category: 'السكري والدهون',
    priceEgp: 250,
    turnaroundTime: '3 ساعات',
    sampleType: 'دم وريدي (EDTA)',
    fastingRequired: false,
    preparationAr: 'لا يشترط الصيام؛ يتأثر فقط بمتوسط مستوى السكر بالدم خلال آخر 8 إلى 12 أسبوعاً.',
    clinicalPurposeAr: 'قياس مدى انضباط مستوى السكر بالدم خلال الأشهر الثلاثة الماضية.',
  },
  {
    id: 'test-thyroid',
    code: 'HOR-01',
    nameAr: 'وظائف الغدة الدرقية الشاملة',
    nameEn: 'Thyroid Panel (TSH, Free T3, Free T4)',
    category: 'الهرمونات والغدد',
    priceEgp: 520,
    turnaroundTime: '5 ساعات',
    sampleType: 'سيرم (Serum)',
    fastingRequired: false,
    preparationAr: 'لا يشترط الصيام؛ يُفضل سحب العينة صباحاً قبل تناول جرعة دواء الغدة الدرقية اليومية إن وجدت.',
    clinicalPurposeAr: 'تشخيص خمول أو فرط نشاط الغدة الدرقية ومتابعة جرعات العلاج التعويضي.',
  },
  {
    id: 'test-liver',
    code: 'ORG-01',
    nameAr: 'وظائف الكبد الكاملة',
    nameEn: 'Comprehensive Liver Function Panel (ALT, AST, Albumin, Bilirubin, ALP)',
    category: 'وظائف الأعضاء',
    priceEgp: 380,
    turnaroundTime: '4 ساعات',
    sampleType: 'سيرم (Serum)',
    fastingRequired: false,
    preparationAr: 'لا يشترط الصيام، مع تفضيل الامتناع عن الوجبات الدسمة لمدة 4 ساعات قبل السحب.',
    clinicalPurposeAr: 'تقييم إنزيمات الكبد، البروتينات، والصفراء الكلية والمباشرة للاطمئنان على سلامة الأنسجة الكبدية.',
  },
  {
    id: 'test-kidney',
    code: 'ORG-02',
    nameAr: 'وظائف الكلى وأملاح النقرس',
    nameEn: 'Renal Function Panel (Creatinine, Urea, eGFR, Uric Acid)',
    category: 'وظائف الأعضاء',
    priceEgp: 260,
    turnaroundTime: '3 ساعات',
    sampleType: 'سيرم (Serum)',
    fastingRequired: false,
    preparationAr: 'لا يشترط الصيام؛ يُنصح بشرب كميات معتدلة من الماء وتجنب المجهود العضلي العنيف قبل الفحص.',
    clinicalPurposeAr: 'قياس معدل الترشيح الكبيبي وكفاءة الكلى ومستوى حمض اليوريك بالدم.',
  },
  {
    id: 'test-vitd',
    code: 'VIT-01',
    nameAr: 'تحليل فيتامين (د) الكلي',
    nameEn: '25-Hydroxy Vitamin D Total',
    category: 'الفيتامينات والمناعة',
    priceEgp: 480,
    turnaroundTime: '6 ساعات',
    sampleType: 'سيرم (Serum)',
    fastingRequired: false,
    preparationAr: 'لا يشترط الصيام؛ يمكن إجراء التحليل في أي وقت.',
    clinicalPurposeAr: 'تشخيص نقص فيتامين (د) المرتبط بآلام العظام والعضلات والإرهاق المزمن وضعف المناعة.',
  },
  {
    id: 'test-ferritin',
    code: 'VIT-02',
    nameAr: 'مخزون الحديد بالدم والحديد الكلي',
    nameEn: 'Serum Ferritin & Total Iron Profile',
    category: 'الفيتامينات والمناعة',
    priceEgp: 390,
    turnaroundTime: '5 ساعات',
    sampleType: 'سيرم (Serum)',
    fastingRequired: true,
    preparationAr: 'يُفضل الصيام لمدة 8 ساعات وسحب العينة صباحاً، مع التوقف عن مكملات الحديد لمدة 48 ساعة قبل الفحص.',
    clinicalPurposeAr: 'تحديد مخزون الحديد الفعلي بالجسم وتشخيص أسباب الأنيميا وتساقط الشعر.',
  },
  {
    id: 'test-coag',
    code: 'HEM-02',
    nameAr: 'سرعة وسيولة الدم قبل العمليات',
    nameEn: 'Coagulation Profile (PT, INR, PTT)',
    category: 'أمراض الدم',
    priceEgp: 240,
    turnaroundTime: 'ساعتان',
    sampleType: 'بلازما سترات الصوديوم',
    fastingRequired: false,
    preparationAr: 'لا يشترط الصيام؛ يجب إبلاغ أخصائي المعمل في حال تناول أدوية السيولة (مثل الماريفان أو الأسبرين).',
    clinicalPurposeAr: 'تقييم كفاءة عوامل التجلط قبل الإجراءات الجراحية ومتابعة جرعات أدوية السيولة.',
  },
  {
    id: 'test-crp-esr',
    code: 'VIT-03',
    nameAr: 'معاملات الالتهاب وسرعة الترسيب',
    nameEn: 'Quantitative CRP & ESR Inflammation Panel',
    category: 'الفيتامينات والمناعة',
    priceEgp: 220,
    turnaroundTime: '3 ساعات',
    sampleType: 'سيرم + دم وريدي',
    fastingRequired: false,
    preparationAr: 'لا يشترط الصيام.',
    clinicalPurposeAr: 'الكشف عن الالتهابات البكتيرية أو المناعية النشطة ومتابعة الاستجابة للعلاج.',
  },
  {
    id: 'test-checkup-gold',
    code: 'PKG-01',
    nameAr: 'باقة الفحص الطبي الشامل (الحياة بلس)',
    nameEn: 'Life Labs Comprehensive Executive Checkup (14 Tests)',
    category: 'الفحوصات الشاملة',
    priceEgp: 1150,
    turnaroundTime: '6 ساعات',
    sampleType: 'دم وريدي + سيرم + بول',
    fastingRequired: true,
    preparationAr: 'يشترط صيام من 10 إلى 12 ساعة (يسمح بالماء فقط) وإحضار أول عينة بول صباحية.',
    clinicalPurposeAr: 'تشمل صورة دم كاملة، سكر صائم وتراكمي، دهون كاملة، وظائف كبد وكلى، غدة درقية TSH، فيتامين د، وتحليل بول كامل.',
  },
];
