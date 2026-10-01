import React, { useState } from 'react';
import {
  PlusCircle,
  Upload,
  FileDown,
  Send,
  RefreshCw,
  CheckCircle2,
  Clock,
  ShieldAlert,
  LogIn,
  LogOut,
  Eye,
  Database,
} from 'lucide-react';
import {
  type LabResultRecord,
  type HomeCollectionRecord,
  LAB_DIRECTORY_ITEMS,
} from '../data/labData';
import { downloadLabResultPdf } from '../lib/pdfGenerator';
import { type User } from '../lib/firebase';

interface AdminPanelSectionProps {
  currentUser: User | null;
  isAuthorizedAdmin: boolean;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  resultsList: LabResultRecord[];
  homeRequestsList: HomeCollectionRecord[];
  onCreateOrUpdateResult: (record: LabResultRecord) => Promise<void>;
  onToggleResultStatus: (
    analysisCode: string,
    nextStatus: 'ready' | 'pending'
  ) => Promise<void>;
  onUpdateHomeRequestStatus: (
    requestId: string,
    nextStatus: 'new' | 'confirmed' | 'completed' | 'cancelled'
  ) => Promise<void>;
  onSeedInitialData: () => Promise<void>;
}

function generateRandomAnalysisCode(): string {
  const randomNum = Math.floor(100 + Math.random() * 899);
  return `LAB-2026-${randomNum}`;
}

export const AdminPanelSection: React.FC<AdminPanelSectionProps> = ({
  currentUser,
  isAuthorizedAdmin,
  onSignIn,
  onSignOut,
  resultsList,
  homeRequestsList,
  onCreateOrUpdateResult,
  onToggleResultStatus,
  onUpdateHomeRequestStatus,
  onSeedInitialData,
}) => {
  const todayIso = new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState<'results' | 'home-visits'>('results');
  const [analysisCode, setAnalysisCode] = useState(generateRandomAnalysisCode());
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [testName, setTestName] = useState(
    `${LAB_DIRECTORY_ITEMS[0].nameAr} (${LAB_DIRECTORY_ITEMS[0].nameEn})`
  );
  const [testCategory, setTestCategory] = useState(LAB_DIRECTORY_ITEMS[0].category);
  const [testDate, setTestDate] = useState(todayIso);
  const [status, setStatus] = useState<'ready' | 'pending'>('ready');
  const [estimatedCompletion, setEstimatedCompletion] = useState(
    'اليوم الساعة 08:00 مساءً'
  );
  const [clinicalSummary, setClinicalSummary] = useState('');
  const [pdfDataUrl, setPdfDataUrl] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [previewPrescription, setPreviewPrescription] = useState<{
    patientName: string;
    dataUrl: string;
  } | null>(null);

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setFeedbackMsg({
        type: 'error',
        text: 'يرجى اختيار ملف بصيغة PDF فقط لنتيجة التحليل.',
      });
      return;
    }

    if (file.size > 700 * 1024) {
      setFeedbackMsg({
        type: 'error',
        text: 'حجم ملف PDF يتجاوز الحد المسموح للتخزين المباشر (700 كيلوبايت). يرجى ضغط الملف أو الاكتفاء بملخص التقرير ليقوم النظام بتوليد ملف PDF رسمي تلقائياً.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPdfDataUrl(String(ev.target?.result || ''));
      setPdfFileName(file.name.slice(0, 100));
      setFeedbackMsg({
        type: 'success',
        text: `تم إرفاق ملف النتيجة (${file.name}) بنجاح وربطه بالكود ${analysisCode}.`,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    const normalizedCode = analysisCode.trim().toUpperCase();
    if (!/^LAB-[0-9]{4}-[0-9]{3,6}$/.test(normalizedCode)) {
      setFeedbackMsg({
        type: 'error',
        text: 'صيغة رقم التحليل يجب أن تكون مثل LAB-2026-889.',
      });
      return;
    }
    if (patientName.trim().length < 2) {
      setFeedbackMsg({
        type: 'error',
        text: 'يرجى إدخال اسم المريض.',
      });
      return;
    }

    setIsSaving(true);
    try {
      await onCreateOrUpdateResult({
        analysisCode: normalizedCode,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim() || '01000000000',
        testName: testName.trim(),
        testCategory: testCategory.trim(),
        testDate,
        status,
        estimatedCompletion:
          status === 'ready'
            ? 'مكتمل وجاهز للتحميل'
            : estimatedCompletion.trim(),
        pdfDataUrl,
        pdfFileName:
          pdfFileName || `LifeLabs_${normalizedCode}_Report.pdf`,
        clinicalSummary:
          clinicalSummary.trim() ||
          'جميع المؤشرات الإكلينيكية ضمن المعدلات المرجعية المعتمدة.',
        createdBy: currentUser?.uid || 'staff_preview',
        notes: 'مسجل عبر لوحة إدارة المعمل',
      });

      setFeedbackMsg({
        type: 'success',
        text: `تم حفظ وتسجيل التحليل رقم (${normalizedCode}) باسم (${patientName.trim()}) بنجاح. يمكنك الآن تجربته في بوابة الاستعلام أو إرساله عبر الواتساب.`,
      });

      // Prepare next code
      setAnalysisCode(generateRandomAnalysisCode());
      setPatientName('');
      setPatientPhone('');
      setClinicalSummary('');
      setPdfDataUrl('');
      setPdfFileName('');
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text:
          err instanceof Error
            ? `تعذر حفظ السجل: ${err.message}`
            : 'حدث خطأ أثناء حفظ سجل التحليل.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const buildWhatsAppResultUrl = (record: LabResultRecord): string => {
    const rawPhone = (record.patientPhone || '').replace(/[^0-9]/g, '');
    const formattedPhone = rawPhone.startsWith('0')
      ? `2${rawPhone}`
      : rawPhone.startsWith('20')
      ? rawPhone
      : rawPhone
      ? `20${rawPhone}`
      : '';

    const portalUrl = `${window.location.origin}${window.location.pathname}?code=${encodeURIComponent(
      record.analysisCode
    )}`;

    const message =
      record.status === 'ready'
        ? `مرحباً أ/ ${record.patientName}،\nيسعدنا في *معامل الحياة للتحاليل الطبية بالمنصورة* إبلاغكم بجهوزية نتيجة تحليل (${record.testName}).\n\n*رقم التحليل (Analysis Code):* ${record.analysisCode}\n*رابط الاستعلام وتحميل النتيجة PDF:*\n${portalUrl}\n\nنتمنى لكم دوام الصحة والعافية.`
        : `مرحباً أ/ ${record.patientName}،\nتم تسجيل عينتكم في *معامل الحياة للتحاليل الطبية بالمنصورة* لتحليل (${record.testName}).\n\n*رقم التحليل للمتابعة:* ${record.analysisCode}\n*الموعد المتوقع للنتيجة:* ${record.estimatedCompletion}\n*رابط المتابعة المباشر:*\n${portalUrl}`;

    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <section
      id="admin-panel"
      className="py-16 lg:py-20 bg-white border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Bar of Admin Panel */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="text-xs font-semibold text-teal-700">
              بوابة طاقم المعمل والإدارة الطبية · معامل الحياة المنصورة
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              لوحة تحكم المعمل وإدارة النتائج والزيارات المنزلية
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              تسجيل تحاليل المرضى، توليد أكواد الاستعلام الفريدة، رفع تقارير PDF، وإرسال النتائج عبر الواتساب بضغطة واحدة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg">
                <div className="text-xs">
                  <p className="font-bold text-slate-900">
                    {currentUser.displayName || currentUser.email}
                  </p>
                  <p className="text-slate-500">
                    {isAuthorizedAdmin
                      ? 'صلاحية مدير المعمل (متصل بـ Firestore)'
                      : 'حساب زائر (معاينة محلية)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>خروج</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <LogIn className="w-4 h-4" />
                <span>تسجيل دخول الإدارة بحساب Google</span>
              </button>
            )}

            {isAuthorizedAdmin && (
              <button
                type="button"
                disabled={isSeeding}
                onClick={async () => {
                  setIsSeeding(true);
                  try {
                    await onSeedInitialData();
                    setFeedbackMsg({
                      type: 'success',
                      text: 'تمت مزامنة السجلات النموذجية مع قاعدة بيانات Firestore بنجاح.',
                    });
                  } finally {
                    setIsSeeding(false);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 border border-teal-700 text-teal-800 hover:bg-teal-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <Database className="w-4 h-4" />
                <span>
                  {isSeeding
                    ? 'جاري المزامنة...'
                    : 'مزامنة البيانات النموذجية في Firestore'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Auth Status Notice */}
        {!isAuthorizedAdmin && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-teal-700 shrink-0" />
              <span>
                أنت تتصفح لوحة الإدارة في <strong>وضع المعاينة التفاعلية</strong>. يمكنك تجربة إضافة تحليل جديد ورفع ملف PDF وإرسال رسالة الواتساب فوراً، أو تسجيل الدخول بحساب مدير المعمل للحفظ الدائم في قاعدة بيانات Firestore.
              </span>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'results'
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            إدارة نتائج التحاليل وأكواد المرضى ({resultsList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('home-visits')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'home-visits'
                ? 'bg-teal-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            طلبات سحب العينات المنزلي ({homeRequestsList.length})
          </button>
        </div>

        {feedbackMsg && (
          <div
            className={`p-4 rounded-lg border text-xs sm:text-sm flex items-center justify-between gap-3 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button
              type="button"
              onClick={() => setFeedbackMsg(null)}
              className="text-xs underline cursor-pointer shrink-0"
            >
              إغلاق
            </button>
          </div>
        )}

        {activeTab === 'results' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form to Register New Analysis */}
            <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900">
                  تسجيل تحليل مريض جديد وتوليد الكود
                </h3>
                <PlusCircle className="w-5 h-5 text-teal-700" />
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="admin-analysis-code"
                    className="block text-xs font-semibold text-slate-800 mb-1"
                  >
                    رقم التحليل الفريد (Analysis Code) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="admin-analysis-code"
                      type="text"
                      dir="ltr"
                      required
                      value={analysisCode}
                      onChange={(e) =>
                        setAnalysisCode(e.target.value.toUpperCase())
                      }
                      className="flex-1 px-3 py-2 text-sm font-mono-code font-bold bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setAnalysisCode(generateRandomAnalysisCode())
                      }
                      className="inline-flex items-center gap-1 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                      title="توليد كود جديد"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>توليد كود</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="admin-patient-name"
                      className="block text-xs font-semibold text-slate-800 mb-1"
                    >
                      اسم المريض *
                    </label>
                    <input
                      id="admin-patient-name"
                      type="text"
                      required
                      maxLength={120}
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="مثال: محمد السيد علي"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="admin-patient-phone"
                      className="block text-xs font-semibold text-slate-800 mb-1"
                    >
                      هاتف المريض (للواتساب) *
                    </label>
                    <input
                      id="admin-patient-phone"
                      type="tel"
                      dir="ltr"
                      required
                      maxLength={25}
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="01012345678"
                      className="w-full px-3 py-2 text-sm font-mono-code bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="admin-test-select"
                    className="block text-xs font-semibold text-slate-800 mb-1"
                  >
                    اسم التحليل الطبي *
                  </label>
                  <select
                    id="admin-test-select"
                    value={testName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTestName(val);
                      const found = LAB_DIRECTORY_ITEMS.find(
                        (i) => `${i.nameAr} (${i.nameEn})` === val
                      );
                      if (found) {
                        setTestCategory(found.category);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                  >
                    {LAB_DIRECTORY_ITEMS.map((item) => {
                      const label = `${item.nameAr} (${item.nameEn})`;
                      return (
                        <option key={item.id} value={label}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="admin-test-date"
                      className="block text-xs font-semibold text-slate-800 mb-1"
                    >
                      تاريخ العينة *
                    </label>
                    <input
                      id="admin-test-date"
                      type="date"
                      required
                      value={testDate}
                      onChange={(e) => setTestDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono-code bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="admin-test-status"
                      className="block text-xs font-semibold text-slate-800 mb-1"
                    >
                      حالة النتيجة *
                    </label>
                    <select
                      id="admin-test-status"
                      value={status}
                      onChange={(e) =>
                        setStatus(e.target.value as 'ready' | 'pending')
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                    >
                      <option value="ready">جاهز (Ready)</option>
                      <option value="pending">قيد التحضير (Pending)</option>
                    </select>
                  </div>
                </div>

                {status === 'pending' && (
                  <div>
                    <label
                      htmlFor="admin-est-completion"
                      className="block text-xs font-semibold text-slate-800 mb-1"
                    >
                      الموعد المتوقع لجهوزية النتيجة
                    </label>
                    <input
                      id="admin-est-completion"
                      type="text"
                      maxLength={120}
                      value={estimatedCompletion}
                      onChange={(e) => setEstimatedCompletion(e.target.value)}
                      placeholder="مثال: اليوم الساعة 08:00 مساءً"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="admin-clinical-summary"
                    className="block text-xs font-semibold text-slate-800 mb-1"
                  >
                    ملخص القيم الإكلينيكية (يظهر في التقرير وملف PDF)
                  </label>
                  <textarea
                    id="admin-clinical-summary"
                    rows={2}
                    maxLength={600}
                    dir="ltr"
                    value={clinicalSummary}
                    onChange={(e) => setClinicalSummary(e.target.value)}
                    placeholder="e.g. Hemoglobin: 14.2 g/dL | WBCs: 7.1 x10^3/uL | Platelets: 290 x10^3/uL"
                    className="w-full px-3 py-2 text-xs font-mono-code bg-white border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                {/* PDF Result File Upload */}
                <div>
                  <span className="block text-xs font-semibold text-slate-800 mb-1">
                    رفع ملف النتيجة الرسمي (PDF) - أو التوليد الآلي
                  </span>
                  <label
                    htmlFor="admin-pdf-upload"
                    className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-white border border-dashed border-slate-300 hover:border-teal-600 rounded-lg cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2 text-slate-600 truncate">
                      <Upload className="w-4 h-4 text-teal-700 shrink-0" />
                      <span className="truncate">
                        {pdfFileName
                          ? `تم إرفاق: ${pdfFileName}`
                          : 'اختر ملف PDF لربطه برقم التحليل'}
                      </span>
                    </div>
                    <span className="font-semibold text-teal-700 shrink-0">
                      رفع PDF
                    </span>
                    <input
                      id="admin-pdf-upload"
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3 px-4 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-400 text-white font-bold text-xs sm:text-sm rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  {isSaving
                    ? 'جاري تسجيل وحفظ التحليل...'
                    : 'حفظ التحليل وتفعيل الكود في البوابة'}
                </button>
              </form>
            </div>

            {/* Table of Registered Results */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">
                  سجل التحاليل المسجلة وإرسال النتائج عبر الواتساب
                </h3>
                <span className="text-xs text-slate-500 font-mono-code tabular-nums">
                  إجمالي السجلات: {resultsList.length}
                </span>
              </div>

              <div className="divide-y divide-slate-200">
                {resultsList.map((rec) => (
                  <div
                    key={rec.analysisCode}
                    className="p-5 hover:bg-slate-50/80 transition-colors space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="font-mono-code font-bold text-sm text-teal-800"
                            dir="ltr"
                          >
                            {rec.analysisCode}
                          </span>
                          <span aria-hidden="true" className="text-slate-300">
                            ·
                          </span>
                          <span className="font-bold text-sm text-slate-900">
                            {rec.patientName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {rec.testName}
                        </p>
                      </div>

                      {/* Status Toggle Button */}
                      <button
                        type="button"
                        onClick={() =>
                          onToggleResultStatus(
                            rec.analysisCode,
                            rec.status === 'ready' ? 'pending' : 'ready'
                          )
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                          rec.status === 'ready'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                            : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                        }`}
                        title="اضغط لتغيير حالة النتيجة بين جاهز وقيد التحضير"
                      >
                        {rec.status === 'ready' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>جاهز (اضغط للتحويل لقيد التحضير)</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            <span>قيد التحضير (اضغط لاعتماد النتيجة)</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <span>تاريخ العينة:</span>
                        <span className="font-mono-code tabular-nums text-slate-700">
                          {rec.testDate}
                        </span>
                        {rec.patientPhone && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>الهاتف:</span>
                            <span
                              className="font-mono-code tabular-nums text-slate-700"
                              dir="ltr"
                            >
                              {rec.patientPhone}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => downloadLabResultPdf(rec)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <FileDown className="w-3.5 h-3.5 text-teal-700" />
                          <span>معاينة / تحميل PDF</span>
                        </button>

                        <a
                          href={buildWhatsAppResultUrl(rec)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال النتيجة عبر الواتساب</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Home Sample Collection Requests Tab */
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                طلبات سحب العينات المنزلية الواردة بالمنصورة
              </h3>
              <span className="text-xs text-slate-500 font-mono-code tabular-nums">
                إجمالي الطلبات: {homeRequestsList.length}
              </span>
            </div>

            {homeRequestsList.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                لا توجد طلبات سحب منزلي مسجلة حالياً. يمكنك تجربة إضافة طلب جديد من قسم "خدمة سحب العينات المنزلي" أعلاه.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {homeRequestsList.map((req) => (
                  <div
                    key={req.requestId}
                    className="p-5 hover:bg-slate-50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span
                          className="font-mono-code font-bold text-teal-800"
                          dir="ltr"
                        >
                          {req.requestId}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>الموعد المطلوب:</span>
                        <strong className="text-slate-800">
                          {req.preferredDate} ({req.preferredTimeSlot})
                        </strong>
                      </div>

                      <div className="text-base font-bold text-slate-900">
                        {req.patientName}{' '}
                        <span
                          className="text-xs font-mono-code font-normal text-slate-600"
                          dir="ltr"
                        >
                          ({req.phone})
                        </span>
                      </div>

                      <p className="text-xs text-slate-700">
                        <strong>العنوان بالمنصورة:</strong> {req.district} —{' '}
                        {req.address}
                      </p>

                      {req.notes && (
                        <p className="text-xs text-slate-600">
                          <strong>المطلوب / ملاحظات:</strong> {req.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {req.prescriptionDataUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewPrescription({
                              patientName: req.patientName,
                              dataUrl: req.prescriptionDataUrl,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold rounded-lg hover:bg-teal-100 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>عرض صورة الروشتة</span>
                        </button>
                      )}

                      <select
                        value={req.status}
                        onChange={(e) =>
                          onUpdateHomeRequestStatus(
                            req.requestId,
                            e.target.value as
                              | 'new'
                              | 'confirmed'
                              | 'completed'
                              | 'cancelled'
                          )
                        }
                        className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg text-slate-800"
                      >
                        <option value="new">حالة الطلب: جديد</option>
                        <option value="confirmed">حالة الطلب: مؤكد</option>
                        <option value="completed">
                          حالة الطلب: تم سحب العينة
                        </option>
                        <option value="cancelled">حالة الطلب: ملغي</option>
                      </select>

                      <a
                        href={`https://wa.me/2${req.phone.replace(
                          /[^0-9]/g,
                          ''
                        )}?text=${encodeURIComponent(
                          `مرحباً أ/ ${req.patientName}، نتواصل معكم من معامل الحياة للتحاليل الطبية بالمنصورة لتأكيد موعد زيارة سحب العينة المنزلية يوم ${req.preferredDate} (${req.preferredTimeSlot}) في عنوانكم: ${req.district} - ${req.address}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>تأكيد عبر واتساب</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Prescription Preview Modal */}
        {previewPrescription && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-5 space-y-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h4 className="text-sm font-bold text-slate-900">
                  الروشتة الطبية المرفقة — {previewPrescription.patientName}
                </h4>
                <button
                  type="button"
                  onClick={() => setPreviewPrescription(null)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
              <div className="max-h-96 overflow-auto rounded-lg border border-slate-200 bg-slate-100 p-2">
                <img
                  src={previewPrescription.dataUrl}
                  alt={`روشتة المريض ${previewPrescription.patientName}`}
                  className="w-full h-auto object-contain rounded"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
