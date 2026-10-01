import React, { useState, useEffect, useCallback } from 'react';
import {
  Phone,
  Globe,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  writeBatch,
  serverTimestamp,
  OperationType,
  handleFirestoreError,
  sanitizeString,
  isValidAnalysisCodeFormat,
  BOOTSTRAPPED_ADMIN_EMAIL,
  type User,
} from './lib/firebase';
import {
  INITIAL_DEMO_RESULTS,
  LIFE_LABS_INFO,
  type LabResultRecord,
  type HomeCollectionRecord,
} from './data/labData';
import { ResultLookupHero } from './components/ResultLookupHero';
import { HomeCollectionSection } from './components/HomeCollectionSection';
import { TestDirectorySection } from './components/TestDirectorySection';
import { AdminPanelSection } from './components/AdminPanelSection';
import analyzerImage from './assets/images/automated_analyzer_unit_1790883028222.jpg';

const INITIAL_DEMO_HOME_REQUESTS: HomeCollectionRecord[] = [
  {
    requestId: 'HOME-2026-301',
    requesterId: 'demo_patient_1',
    patientName: 'د. عبد الله السعيد منصور',
    phone: '01066778899',
    district: 'شارع المشاية السفلية',
    address: 'برج النيل الإداري، الدور الخامس، بجوار نادي جزيرة الورد',
    preferredDate: '2026-10-02',
    preferredTimeSlot: 'الفترة الصباحية المبكرة (07:00 ص - 10:00 ص - لتحاليل الصيام)',
    notes: 'صورة دم كاملة + ملف الدهون الكامل + سكر تراكمي',
    prescriptionDataUrl: '',
    prescriptionFileName: '',
    status: 'confirmed',
  },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState(false);
  const [resultsList, setResultsList] =
    useState<LabResultRecord[]>(INITIAL_DEMO_RESULTS);
  const [homeRequestsList, setHomeRequestsList] = useState<
    HomeCollectionRecord[]
  >(INITIAL_DEMO_HOME_REQUESTS);
  const [preselectedTestForVisit, setPreselectedTestForVisit] = useState('');
  const [analyzerImgError, setAnalyzerImgError] = useState(false);

  // Check URL query param for ?code=LAB-2026-XXX
  const initialQueryCode =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('code') || ''
      : '';

  // Monitor Auth State & check Admin status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && user.emailVerified) {
        if (user.email === BOOTSTRAPPED_ADMIN_EMAIL) {
          setIsAuthorizedAdmin(true);
          return;
        }
        try {
          const adminDoc = await getDoc(doc(db, 'admins', user.uid));
          setIsAuthorizedAdmin(adminDoc.exists());
        } catch {
          setIsAuthorizedAdmin(false);
        }
      } else {
        setIsAuthorizedAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load live data from Firestore when Admin is authenticated
  const fetchAdminDataFromFirestore = useCallback(async () => {
    if (!isAuthorizedAdmin) return;
    try {
      const resultsSnap = await getDocs(collection(db, 'results'));
      const contactsSnap = await getDocs(collection(db, 'result_contacts'));
      const contactsMap = new Map<
        string,
        { patientPhone: string; notes: string }
      >();
      contactsSnap.forEach((docSnap) => {
        const d = docSnap.data();
        contactsMap.set(docSnap.id, {
          patientPhone: String(d.patientPhone || ''),
          notes: String(d.notes || ''),
        });
      });

      if (!resultsSnap.empty) {
        const loadedResults: LabResultRecord[] = [];
        resultsSnap.forEach((docSnap) => {
          const d = docSnap.data();
          const contact = contactsMap.get(docSnap.id);
          loadedResults.push({
            analysisCode: String(d.analysisCode || docSnap.id),
            patientName: String(d.patientName || ''),
            testName: String(d.testName || ''),
            testCategory: String(d.testCategory || ''),
            testDate: String(d.testDate || ''),
            status: d.status === 'pending' ? 'pending' : 'ready',
            estimatedCompletion: String(d.estimatedCompletion || ''),
            pdfDataUrl: String(d.pdfDataUrl || ''),
            pdfFileName: String(d.pdfFileName || ''),
            clinicalSummary: String(d.clinicalSummary || ''),
            createdBy: String(d.createdBy || ''),
            patientPhone: contact?.patientPhone || '',
            notes: contact?.notes || '',
          });
        });
        setResultsList(loadedResults);
      }

      const homeSnap = await getDocs(collection(db, 'home_requests'));
      if (!homeSnap.empty) {
        const loadedRequests: HomeCollectionRecord[] = [];
        homeSnap.forEach((docSnap) => {
          const d = docSnap.data();
          loadedRequests.push({
            requestId: String(d.requestId || docSnap.id),
            requesterId: String(d.requesterId || ''),
            patientName: String(d.patientName || ''),
            phone: String(d.phone || ''),
            address: String(d.address || ''),
            district: String(d.district || ''),
            preferredDate: String(d.preferredDate || ''),
            preferredTimeSlot: String(d.preferredTimeSlot || ''),
            notes: String(d.notes || ''),
            prescriptionDataUrl: String(d.prescriptionDataUrl || ''),
            prescriptionFileName: String(d.prescriptionFileName || ''),
            status:
              d.status === 'confirmed' ||
              d.status === 'completed' ||
              d.status === 'cancelled'
                ? d.status
                : 'new',
          });
        });
        setHomeRequestsList(loadedRequests);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'results');
    }
  }, [isAuthorizedAdmin]);

  useEffect(() => {
    if (isAuthorizedAdmin) {
      fetchAdminDataFromFirestore();
    }
  }, [isAuthorizedAdmin, fetchAdminDataFromFirestore]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign-in error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  // Patient Result Lookup Handler (queries Firestore /results/{analysisCode} first, then local state)
  const handleLookupCode = async (
    rawCode: string
  ): Promise<LabResultRecord | null> => {
    const code = rawCode.trim().toUpperCase();

    if (isValidAnalysisCodeFormat(code)) {
      try {
        const docRef = doc(db, 'results', code);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const d = snap.data();
          return {
            analysisCode: String(d.analysisCode || code),
            patientName: String(d.patientName || ''),
            testName: String(d.testName || ''),
            testCategory: String(d.testCategory || ''),
            testDate: String(d.testDate || ''),
            status: d.status === 'pending' ? 'pending' : 'ready',
            estimatedCompletion: String(d.estimatedCompletion || ''),
            pdfDataUrl: String(d.pdfDataUrl || ''),
            pdfFileName: String(d.pdfFileName || ''),
            clinicalSummary: String(d.clinicalSummary || ''),
            createdBy: String(d.createdBy || ''),
          };
        }
      } catch (err) {
        // Only invoke handleFirestoreError if it's a permission error on a valid path
        if (
          err instanceof Error &&
          err.message.includes('Missing or insufficient permissions')
        ) {
          handleFirestoreError(err, OperationType.GET, `results/${code}`);
        }
      }
    }

    const localMatch = resultsList.find(
      (r) => r.analysisCode.toUpperCase() === code
    );
    return localMatch || null;
  };

  // Home Sample Collection Booking Handler
  const handleHomeBookingSubmit = async (
    booking: Omit<HomeCollectionRecord, 'requestId' | 'requesterId' | 'status'>
  ): Promise<{ requestId: string; savedToCloud: boolean }> => {
    const randomSuffix = Math.floor(1000 + Math.random() * 8999);
    const requestId = `HOME-2026-${randomSuffix}`;

    const sanitizedRecord: HomeCollectionRecord = {
      requestId,
      requesterId: currentUser?.uid || 'guest_session',
      patientName: sanitizeString(booking.patientName, 120),
      phone: sanitizeString(booking.phone, 25),
      address: sanitizeString(booking.address, 300),
      district: sanitizeString(booking.district, 80),
      preferredDate: sanitizeString(booking.preferredDate, 40),
      preferredTimeSlot: sanitizeString(booking.preferredTimeSlot, 60),
      notes: sanitizeString(booking.notes, 500),
      prescriptionDataUrl: sanitizeString(booking.prescriptionDataUrl, 850000),
      prescriptionFileName: sanitizeString(booking.prescriptionFileName, 120),
      status: 'new',
    };

    let savedToCloud = false;
    if (currentUser && currentUser.emailVerified) {
      try {
        const batch = writeBatch(db);
        const docRef = doc(db, 'home_requests', requestId);
        batch.set(docRef, {
          ...sanitizedRecord,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await batch.commit();
        savedToCloud = true;
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.CREATE,
          `home_requests/${requestId}`
        );
      }
    }

    setHomeRequestsList((prev) => [sanitizedRecord, ...prev]);
    return { requestId, savedToCloud };
  };

  // Admin: Create or Update Lab Result (uses atomic writeBatch for /results and /result_contacts)
  const handleCreateOrUpdateResult = async (record: LabResultRecord) => {
    const code = sanitizeString(record.analysisCode.toUpperCase(), 32);

    if (isAuthorizedAdmin && currentUser) {
      const path = `results/${code}`;
      try {
        const batch = writeBatch(db);
        const resultRef = doc(db, 'results', code);
        const contactRef = doc(db, 'result_contacts', code);

        batch.set(resultRef, {
          analysisCode: code,
          patientName: sanitizeString(record.patientName, 120),
          testName: sanitizeString(record.testName, 160),
          testCategory: sanitizeString(record.testCategory, 80),
          testDate: sanitizeString(record.testDate, 40),
          status: record.status,
          estimatedCompletion: sanitizeString(record.estimatedCompletion, 120),
          pdfDataUrl: sanitizeString(record.pdfDataUrl, 950000),
          pdfFileName: sanitizeString(record.pdfFileName, 120),
          clinicalSummary: sanitizeString(record.clinicalSummary, 600),
          createdBy: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        batch.set(contactRef, {
          analysisCode: code,
          patientPhone: sanitizeString(record.patientPhone || '01000000000', 25),
          notes: sanitizeString(record.notes || '', 300),
          createdBy: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    }

    setResultsList((prev) => {
      const filtered = prev.filter((r) => r.analysisCode !== code);
      return [{ ...record, analysisCode: code }, ...filtered];
    });
  };

  // Admin: Toggle Result Status
  const handleToggleResultStatus = async (
    analysisCode: string,
    nextStatus: 'ready' | 'pending'
  ) => {
    if (isAuthorizedAdmin && currentUser) {
      const path = `results/${analysisCode}`;
      try {
        const docRef = doc(db, 'results', analysisCode);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          await updateDoc(docRef, {
            status: nextStatus,
            estimatedCompletion:
              nextStatus === 'ready'
                ? 'مكتمل وجاهز للتحميل'
                : 'قيد المراجعة النهائية بالمعمل',
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }

    setResultsList((prev) =>
      prev.map((item) =>
        item.analysisCode === analysisCode
          ? {
              ...item,
              status: nextStatus,
              estimatedCompletion:
                nextStatus === 'ready'
                  ? 'مكتمل وجاهز للتحميل'
                  : 'قيد المراجعة النهائية بالمعمل',
            }
          : item
      )
    );
  };

  // Admin: Update Home Request Status
  const handleUpdateHomeRequestStatus = async (
    requestId: string,
    nextStatus: 'new' | 'confirmed' | 'completed' | 'cancelled'
  ) => {
    if (isAuthorizedAdmin && currentUser) {
      const path = `home_requests/${requestId}`;
      try {
        const docRef = doc(db, 'home_requests', requestId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          await updateDoc(docRef, {
            status: nextStatus,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    }

    setHomeRequestsList((prev) =>
      prev.map((req) =>
        req.requestId === requestId ? { ...req, status: nextStatus } : req
      )
    );
  };

  // Admin: Seed Initial Demo Data into Firestore
  const handleSeedInitialData = async () => {
    if (!isAuthorizedAdmin || !currentUser) return;
    try {
      const batch = writeBatch(db);
      for (const item of INITIAL_DEMO_RESULTS) {
        const resultRef = doc(db, 'results', item.analysisCode);
        const contactRef = doc(db, 'result_contacts', item.analysisCode);

        batch.set(resultRef, {
          analysisCode: item.analysisCode,
          patientName: sanitizeString(item.patientName, 120),
          testName: sanitizeString(item.testName, 160),
          testCategory: sanitizeString(item.testCategory, 80),
          testDate: sanitizeString(item.testDate, 40),
          status: item.status,
          estimatedCompletion: sanitizeString(item.estimatedCompletion, 120),
          pdfDataUrl: sanitizeString(item.pdfDataUrl, 950000),
          pdfFileName: sanitizeString(item.pdfFileName, 120),
          clinicalSummary: sanitizeString(item.clinicalSummary, 600),
          createdBy: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        batch.set(contactRef, {
          analysisCode: item.analysisCode,
          patientPhone: sanitizeString(item.patientPhone || '01012345678', 25),
          notes: sanitizeString(item.notes || '', 300),
          createdBy: currentUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
      await fetchAdminDataFromFirestore();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'results');
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* 3-Zone Top Bar Contract (Brand single element, 5 nav links, 2 actions) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Zone 1: Single text element Brand Wordmark */}
          <a
            href="#results-lookup"
            className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 hover:text-teal-800 transition-colors whitespace-nowrap"
          >
            معامل الحياة للتحاليل الطبية
          </a>

          {/* Zone 2: 5 Single-Line Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a
              href="#results-lookup"
              className="hover:text-teal-700 hover:underline underline-offset-8 transition-colors whitespace-nowrap"
            >
              الاستعلام عن النتائج
            </a>
            <a
              href="#home-collection"
              className="hover:text-teal-700 hover:underline underline-offset-8 transition-colors whitespace-nowrap"
            >
              سحب العينات المنزلي
            </a>
            <a
              href="#test-directory"
              className="hover:text-teal-700 hover:underline underline-offset-8 transition-colors whitespace-nowrap"
            >
              دليل التحاليل والأسعار
            </a>
            <a
              href="#lab-technology"
              className="hover:text-teal-700 hover:underline underline-offset-8 transition-colors whitespace-nowrap"
            >
              التجهيزات والجودة
            </a>
            <a
              href="#admin-panel"
              className="hover:text-teal-700 hover:underline underline-offset-8 transition-colors whitespace-nowrap"
            >
              إدارة المعمل
            </a>
          </nav>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => scrollToSection('home-collection')}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              حجز زيارة منزلية
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('admin-panel')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 hover:border-slate-400 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              بوابة الموظفين
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* 1. Patient Result Lookup Portal & Hero */}
        <ResultLookupHero
          onLookupCode={handleLookupCode}
          initialCode={initialQueryCode}
          onNavigateHomeVisit={() => scrollToSection('home-collection')}
        />

        {/* 2. Home Sample Collection Request */}
        <HomeCollectionSection
          preselectedTestName={preselectedTestForVisit}
          onSubmitBooking={handleHomeBookingSubmit}
          isUserSignedIn={Boolean(currentUser)}
          onPromptSignIn={handleSignIn}
        />

        {/* 3. Lab Test Directory & Instructions */}
        <TestDirectorySection
          onSelectTestForHomeVisit={(testLabel) => {
            setPreselectedTestForVisit(testLabel);
            scrollToSection('home-collection');
          }}
        />

        {/* 4. Diagnostic Technology & Clinical Proof Section */}
        <section
          id="lab-technology"
          className="py-16 lg:py-20 bg-slate-900 text-white border-b border-slate-800"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="text-xs font-semibold text-teal-400">
                  التكنولوجيا التشخيصية ومعايير الاعتماد · المنصورة
                </div>
                <h2
                  className="text-2xl sm:text-3xl font-bold text-white leading-snug"
                  style={{ textWrap: 'balance' }}
                >
                  أجهزة تحليل آلية مغلقة تضمن أعلى درجات الدقة وعدم التدخل البشري
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  تعتمد معامل الحياة للتحاليل الطبية بالمنصورة على منظومة باركود رقمية تربط أنبوبة العينة بجهاز الفحص الآلي فور سحبها وحتى إصدار التقرير النهائي، مما يمنع أي احتمال للخطأ البشري ويضمن سرعة ودقة النتائج في الحالات الحرجة والروتينية.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>وحدة أمراض الدم والسيولة الآلية</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      عد تفصيلي لخلايا الدم بخاصية التدفق الخلوي الليزري للكشف المبكر عن الأنيميا وأمراض الدم.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm font-bold text-white">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                      <span>وحدة الهرمونات والمناعة والـ PCR</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      قياس فائق الحساسية بتقنية الوميض الكيميائي (CLIA) للغدة الدرقية، دلالات الأورام، والفيتامينات.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-800 aspect-[4/3]">
                  {!analyzerImgError ? (
                    <img
                      src={analyzerImage}
                      alt="أجهزة التحليل الآلي الكامل بمعامل الحياة المنصورة"
                      referrerPolicy="no-referrer"
                      onError={() => setAnalyzerImgError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-800 text-center">
                      <ShieldCheck className="w-10 h-10 text-teal-400 mb-2" />
                      <p className="text-sm font-bold text-white">
                        أنظمة تحليل آلية معتمدة دولياً
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Admin & Lab Staff Panel */}
        <AdminPanelSection
          currentUser={currentUser}
          isAuthorizedAdmin={isAuthorizedAdmin}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          resultsList={resultsList}
          homeRequestsList={homeRequestsList}
          onCreateOrUpdateResult={handleCreateOrUpdateResult}
          onToggleResultStatus={handleToggleResultStatus}
          onUpdateHomeRequestStatus={handleUpdateHomeRequestStatus}
          onSeedInitialData={handleSeedInitialData}
        />
      </main>

      {/* 6. Branding & Footer Integration */}
      <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-10 border-b border-slate-800">
            {/* Brand & Operating Hours */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-xl font-bold text-white">
                {LIFE_LABS_INFO.nameAr} — {LIFE_LABS_INFO.cityAr}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md">
                الريادة في خدمات التشخيص المعملي والتحاليل الطبية الدقيقة بمدينة المنصورة والدقهلية. نتائج موثوقة، سحب منزلي مجاني، وخدمة طوارئ معملية متواصلة.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 pt-1">
                <Clock className="w-4 h-4 shrink-0" />
                <span>{LIFE_LABS_INFO.hoursAr}</span>
              </div>
            </div>

            {/* Mansoura Branches */}
            <div className="lg:col-span-4 space-y-3">
              <h4 className="text-sm font-bold text-white">
                عناوين الفروع بمدينة المنصورة
              </h4>
              <div className="space-y-2.5 text-xs text-slate-400">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>{LIFE_LABS_INFO.addressBranch1}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>{LIFE_LABS_INFO.addressBranch2}</span>
                </div>
              </div>
            </div>

            {/* Direct Contact & Official Links */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-sm font-bold text-white">
                التواصل والحجز المباشر
              </h4>
              <div className="space-y-2.5 text-xs">
                <a
                  href={`tel:${LIFE_LABS_INFO.phone}`}
                  className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                >
                  <Phone className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>الهاتف والواتساب:</span>
                  <span
                    className="font-mono-code font-bold text-white tabular-nums"
                    dir="ltr"
                  >
                    {LIFE_LABS_INFO.phone}
                  </span>
                </a>

                <a
                  href={`https://${LIFE_LABS_INFO.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                >
                  <Globe className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>الموقع الرسمي:</span>
                  <span className="font-mono-code text-teal-400" dir="ltr">
                    {LIFE_LABS_INFO.website}
                  </span>
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>
              © {new Date().getFullYear()} معامل الحياة للتحاليل الطبية بالمنصورة (Life Labs Mansoura). جميع الحقوق محفوظة.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#results-lookup"
                className="hover:text-slate-300 transition-colors"
              >
                بوابة النتائج
              </a>
              <span aria-hidden="true">·</span>
              <a
                href="#home-collection"
                className="hover:text-slate-300 transition-colors"
              >
                السحب المنزلي
              </a>
              <span aria-hidden="true">·</span>
              <a
                href="#test-directory"
                className="hover:text-slate-300 transition-colors"
              >
                دليل التحاليل
              </a>
              <span aria-hidden="true">·</span>
              <a
                href="#admin-panel"
                className="hover:text-slate-300 transition-colors"
              >
                إدارة المعمل
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
