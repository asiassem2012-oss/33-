import React, { useState } from 'react';
import {
  Search,
  FileDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { type LabResultRecord, LIFE_LABS_INFO } from '../data/labData';
import { downloadLabResultPdf } from '../lib/pdfGenerator';
import heroLabImage from '../assets/images/hero_clinical_laboratory_1790883001864.jpg';

interface ResultLookupHeroProps {
  onLookupCode: (code: string) => Promise<LabResultRecord | null>;
  initialCode?: string;
  onNavigateHomeVisit: () => void;
}

export const ResultLookupHero: React.FC<ResultLookupHeroProps> = ({
  onLookupCode,
  initialCode = '',
  onNavigateHomeVisit,
}) => {
  const [codeInput, setCodeInput] = useState(initialCode);
  const [isSearching, setIsSearching] = useState(false);
  const [searchedResult, setSearchedResult] = useState<LabResultRecord | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [heroImgError, setHeroImgError] = useState(false);

  const executeLookup = async (rawCode: string) => {
    const normalized = rawCode.trim().toUpperCase();
    setCodeInput(normalized);
    setErrorMsg(null);

    if (!normalized) {
      setErrorMsg('يرجى إدخال رقم التحليل المكون من الكود التعريفي (مثال: LAB-2026-889).');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      const record = await onLookupCode(normalized);
      setSearchedResult(record);
      if (!record) {
        setErrorMsg(
          `لم يتم العثور على نتيجة مسجلة برقم التحليل (${normalized}). يرجى التأكد من الرقم المدون في إيصال المعمل أو تجربة أحد الأكواد التوضيحية أدناه.`
        );
      }
    } catch {
      setErrorMsg('حدث خطأ أثناء الاتصال بقاعدة البيانات. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLookup(codeInput);
  };

  return (
    <section
      id="results-lookup"
      className="relative bg-slate-900 text-white border-b border-slate-800 overflow-hidden"
    >
      {/* Background visual layer with measured contrast scrim */}
      <div className="absolute inset-0 pointer-events-none">
        {!heroImgError ? (
          <img
            src={heroLabImage}
            alt="معامل الحياة للتحاليل الطبية بالمنصورة - تجهيزات المعمل الآلية"
            referrerPolicy="no-referrer"
            onError={() => setHeroImgError(true)}
            className="w-full h-full object-cover opacity-20"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 opacity-60" />
        )}
        <div className="absolute inset-0 bg-gradient-to-l from-slate-950/95 via-slate-900/90 to-slate-900/75" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Right Column (RTL Primary Proposition) */}
          <div className="lg:col-span-6 space-y-6 pt-2">
            <div className="flex items-center gap-2 text-xs text-teal-400 font-medium">
              <span>المنصورة · المشاية السفلية وشارع الجمهورية</span>
              <span aria-hidden="true">·</span>
              <span>خدمة طبية على مدار 24 ساعة</span>
            </div>

            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight"
              style={{ textWrap: 'balance' }}
            >
              دقة تشخيصية معتمدة ونتائج فورية لباب منزلك في المنصورة
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              تقدم معامل الحياة للتحاليل الطبية منظومة فحص إكلينيكي متكاملة بأحدث أجهزة التحليل الآلي في أمراض الدم، الكيمياء الحيوية، الهرمونات، والبيولوجيا الجزيئية مع إتاحة الاستعلام الإلكتروني وتحميل التقارير الرسمية بصيغة PDF فور اعتمادها.
            </p>

            {/* Quantified Clinical Proof Row (Unboxed typography per Zero-Pill Discipline) */}
            <div className="pt-4 border-t border-slate-800 grid grid-cols-3 gap-6">
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-white font-mono-code tabular-nums">
                  24/7
                </p>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  عمل متواصل طوال الأسبوع
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-teal-400 font-mono-code tabular-nums">
                  +450
                </p>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  فحص تخصصي ودوري معتمد
                </p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-white font-mono-code tabular-nums">
                  99.8%
                </p>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  دقة معايرة الجودة القياسية
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onNavigateHomeVisit}
                className="inline-flex items-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>طلب سحب عينة منزلي مجاناً بالمنصورة</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
              <a
                href={`tel:${LIFE_LABS_INFO.phone}`}
                className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-slate-200 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-colors whitespace-nowrap"
              >
                <span>الخط الساخن:</span>
                <span className="font-mono-code tabular-nums" dir="ltr">
                  {LIFE_LABS_INFO.phone}
                </span>
              </a>
            </div>
          </div>

          {/* Left Column: Prominent Patient Result Lookup Portal Card */}
          <div className="lg:col-span-6">
            <div className="bg-white text-slate-900 rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xl">
              <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    الاستعلام عن النتائج برقم التحليل
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    أدخل كود التحليل المدون في إيصال الاستلام لعرض حالة الفحص وتحميل التقرير الطبي بصيغة PDF
                  </p>
                </div>
                <ShieldCheck className="w-7 h-7 text-teal-700 shrink-0 mt-1" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="analysis-code-input"
                    className="block text-sm font-semibold text-slate-800 mb-2"
                  >
                    رقم التحليل الفريد (Unique Analysis Code)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <input
                        id="analysis-code-input"
                        type="text"
                        dir="ltr"
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                        placeholder="LAB-2026-889"
                        maxLength={32}
                        className="w-full px-4 py-3 text-base font-mono-code uppercase tracking-wider bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSearching}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-400 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Search className="w-4 h-4" />
                      <span>
                        {isSearching ? 'جاري البحث...' : 'استعلام عن النتيجة'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Quick Benchmark Codes for Instant Testing */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
                  <span>أكواد تجريبية للاستعلام الفوري:</span>
                  <button
                    type="button"
                    onClick={() => executeLookup('LAB-2026-889')}
                    className="font-mono-code text-teal-700 hover:text-teal-900 underline underline-offset-4 cursor-pointer whitespace-nowrap"
                  >
                    LAB-2026-889 (جاهز)
                  </button>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => executeLookup('LAB-2026-412')}
                    className="font-mono-code text-amber-700 hover:text-amber-900 underline underline-offset-4 cursor-pointer whitespace-nowrap"
                  >
                    LAB-2026-412 (قيد التحضير)
                  </button>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => executeLookup('LAB-2026-905')}
                    className="font-mono-code text-teal-700 hover:text-teal-900 underline underline-offset-4 cursor-pointer whitespace-nowrap"
                  >
                    LAB-2026-905 (جاهز)
                  </button>
                </div>
              </form>

              {/* Error / Not Found State */}
              {errorMsg && (
                <div
                  role="alert"
                  className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-900"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="text-sm leading-relaxed">{errorMsg}</div>
                </div>
              )}

              {/* Dynamic Result Display */}
              {hasSearched && !isSearching && searchedResult && (
                <div className="mt-6 pt-6 border-t border-slate-200 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>كود التحليل:</span>
                      <span
                        className="font-mono-code font-semibold text-slate-900"
                        dir="ltr"
                      >
                        {searchedResult.analysisCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>تاريخ العينة:</span>
                      <span
                        className="font-mono-code text-slate-800 tabular-nums"
                        dir="ltr"
                      >
                        {searchedResult.testDate}
                      </span>
                    </div>

                    {/* Semantic Status Indicator with Icon + Explicit Text */}
                    {searchedResult.status === 'ready' ? (
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>الحالة: جاهز للاستلام والتحميل</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-700">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span>الحالة: قيد التحضير بالمعمل</span>
                      </div>
                    )}
                  </div>

                  {/* Patient & Test Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">اسم المريض</p>
                      <p className="text-base font-bold text-slate-900">
                        {searchedResult.patientName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">
                        الفحص الطبي المطلوب
                      </p>
                      <p className="text-sm font-semibold text-teal-900">
                        {searchedResult.testName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {searchedResult.testCategory}
                      </p>
                    </div>
                  </div>

                  {/* Ready vs Pending Action Area */}
                  {searchedResult.status === 'ready' ? (
                    <div className="space-y-4">
                      {searchedResult.clinicalSummary && (
                        <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-lg">
                          <div className="flex items-center gap-2 text-xs font-semibold text-teal-900 mb-1">
                            <FileText className="w-4 h-4 text-teal-700" />
                            <span>ملخص المؤشرات المعتمدة بالتقرير:</span>
                          </div>
                          <p
                            className="text-xs text-slate-700 leading-relaxed font-mono-code"
                            dir="ltr"
                          >
                            {searchedResult.clinicalSummary}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <button
                          type="button"
                          onClick={() => downloadLabResultPdf(searchedResult)}
                          className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <FileDown className="w-5 h-5" />
                          <span>تحميل النتيجة PDF</span>
                        </button>

                        <a
                          href={`https://wa.me/${LIFE_LABS_INFO.whatsappNumber}?text=${encodeURIComponent(
                            `مرحباً معامل الحياة بالمنصورة، أرغب في الاستفسار عن نتيجة التحليل رقم ${searchedResult.analysisCode} باسم (${searchedResult.patientName}).`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-4 py-3.5 border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
                        >
                          <span>استشارة طبية عبر واتساب</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                      <p className="text-sm font-semibold text-amber-900">
                        عزيزنا المريض، عينة التحليل الخاصة بك قيد الفحص والمراجعة الطبية حالياً
                      </p>
                      <p className="text-xs text-amber-800 leading-relaxed">
                        نحرص في معامل الحياة على تطبيق أعلى معايير المعايرة والتدقيق المزدوج لضمان دقة النتائج.
                      </p>
                      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-amber-200/70 text-xs">
                        <span className="text-amber-900 font-medium">
                          الموعد المتوقع لجهوزية النتيجة:{' '}
                          <strong className="font-bold">
                            {searchedResult.estimatedCompletion ||
                              'خلال ساعتين إلى 3 ساعات'}
                          </strong>
                        </span>
                        <a
                          href={`https://wa.me/${LIFE_LABS_INFO.whatsappNumber}?text=${encodeURIComponent(
                            `مرحباً معامل الحياة، أتابع حالة التحليل رقم ${searchedResult.analysisCode} باسم (${searchedResult.patientName}).`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-800 hover:text-teal-950 font-semibold underline underline-offset-4 whitespace-nowrap"
                        >
                          طلب إشعار واتساب فور الانتهاء
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
