import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar,
  Upload,
  CheckCircle2,
  AlertCircle,
  Trash2,
  PhoneCall,
} from 'lucide-react';
import {
  MANSOURA_DISTRICTS,
  LIFE_LABS_INFO,
  type HomeCollectionRecord,
} from '../data/labData';
import homeVisitImage from '../assets/images/home_visit_phlebotomy_1790883015192.jpg';

interface HomeCollectionSectionProps {
  preselectedTestName: string;
  onSubmitBooking: (
    booking: Omit<HomeCollectionRecord, 'requestId' | 'requesterId' | 'status'>
  ) => Promise<{ requestId: string; savedToCloud: boolean }>;
  isUserSignedIn: boolean;
  onPromptSignIn: () => Promise<void>;
}

/**
 * Compresses an uploaded prescription image on the client side using an HTML5 Canvas
 * so it remains well below Firestore's 1MB document limit.
 */
async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 900;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(e.target?.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.68);
        resolve(compressedDataUrl);
      };
      img.onerror = () => reject(new Error('تعذر قراءة ملف الصورة'));
      img.src = String(e.target?.result || '');
    };
    reader.onerror = () => reject(new Error('تعذر تحميل الملف'));
    reader.readAsDataURL(file);
  });
}

export const HomeCollectionSection: React.FC<HomeCollectionSectionProps> = ({
  preselectedTestName,
  onSubmitBooking,
  isUserSignedIn,
  onPromptSignIn,
}) => {
  const todayIso = new Date().toISOString().split('T')[0];

  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState(MANSOURA_DISTRICTS[0]);
  const [address, setAddress] = useState('');
  const [preferredDate, setPreferredDate] = useState(todayIso);
  const [preferredTimeSlot, setPreferredTimeSlot] = useState(
    'الفترة الصباحية (08:00 ص - 12:00 ظ)'
  );
  const [notes, setNotes] = useState('');
  const [prescriptionDataUrl, setPrescriptionDataUrl] = useState('');
  const [prescriptionFileName, setPrescriptionFileName] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedConfirmation, setSubmittedConfirmation] = useState<{
    requestId: string;
    patientName: string;
    phone: string;
    district: string;
    address: string;
    preferredDate: string;
    preferredTimeSlot: string;
    notes: string;
    savedToCloud: boolean;
  } | null>(null);
  const [visitImgError, setVisitImgError] = useState(false);

  useEffect(() => {
    if (preselectedTestName) {
      setNotes((prev) =>
        prev.includes(preselectedTestName)
          ? prev
          : prev
          ? `${prev} + ${preselectedTestName}`
          : `التحليل المطلوب: ${preselectedTestName}`
      );
    }
  }, [preselectedTestName]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('يرجى اختيار ملف صورة صالح للروشتة الطبية (JPG أو PNG).');
      return;
    }

    setFormError(null);
    setIsCompressing(true);
    try {
      const compressed = await compressImageFile(file);
      if (compressed.length > 800000) {
        setFormError(
          'حجم الصورة كبير جداً حتى بعد الضغط. يرجى اختيار صورة أصغر حجماً.'
        );
        return;
      }
      setPrescriptionDataUrl(compressed);
      setPrescriptionFileName(file.name.slice(0, 100));
    } catch {
      setFormError('حدث خطأ أثناء معالجة صورة الروشتة.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = patientName.trim();
    const cleanPhone = phone.trim();
    const cleanAddress = address.trim();

    if (cleanName.length < 3) {
      setFormError('يرجى إدخال اسم المريض بالكامل (3 أحرف على الأقل).');
      return;
    }
    if (!/^[0-9+\-\s]{8,20}$/.test(cleanPhone)) {
      setFormError('يرجى إدخال رقم هاتف محمول صحيح للتواصل وتأكيد الموعد.');
      return;
    }
    if (cleanAddress.length < 5) {
      setFormError(
        'يرجى كتابة العنوان التفصيلي في المنصورة (اسم الشارع، رقم العقار أو علامة مميزة).'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmitBooking({
        patientName: cleanName,
        phone: cleanPhone,
        district,
        address: cleanAddress,
        preferredDate,
        preferredTimeSlot,
        notes: notes.trim(),
        prescriptionDataUrl,
        prescriptionFileName,
      });

      setSubmittedConfirmation({
        requestId: result.requestId,
        patientName: cleanName,
        phone: cleanPhone,
        district,
        address: cleanAddress,
        preferredDate,
        preferredTimeSlot,
        notes: notes.trim(),
        savedToCloud: result.savedToCloud,
      });
    } catch {
      setFormError(
        'تعذر حفظ الطلب في الوقت الحالي. يرجى المحاولة مرة أخرى أو التواصل هاتفياً.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="home-collection"
      className="py-16 lg:py-20 bg-white border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Right Column: Service Explanation & Visual Showcase */}
          <div className="lg:col-span-5 space-y-6">
            <div className="text-xs font-semibold text-teal-700">
              خدمة الرعاية المنزلية بالمنصورة · تغطية شاملة
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug"
              style={{ textWrap: 'balance' }}
            >
              خدمة سحب العينات المنزلي بأعلى معايير مكافحة العدوى
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              نوفر فريقاً متخصصاً من أخصائيي سحب العينات (Phlebotomists) للوصول إلى منزلك أو مقر عملك في جميع أحياء المنصورة وطلخا، مع نقل العينات في حافظات حرارية معايرة لضمان ثبات العينة ودقة الفحص.
            </p>

            {/* Visual Showcase with Fallback */}
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-[4/3]">
              {!visitImgError ? (
                <img
                  src={homeVisitImage}
                  alt="حقيبة سحب العينات المنزلية المعقمة - معامل الحياة المنصورة"
                  referrerPolicy="no-referrer"
                  onError={() => setVisitImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-teal-900 to-slate-900 text-white text-center">
                  <MapPin className="w-10 h-10 text-teal-300 mb-2" />
                  <p className="font-bold text-base">
                    وحدة السحب المنزلي المتنقلة - المنصورة
                  </p>
                </div>
              )}
            </div>

            {/* Numbered Service Protocol List (Editorial Numbering per Frontend Design Guidelines) */}
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  01. تغطية فورية لكافة أحياء المنصورة
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  المشاية السفلية، الجمهورية، توريل، حي الجامعة، سامي الجمل، قناة السويس، الجلاء، وطلخا.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  02. إرفاق الروشتة الطبية ومراجعة شروط الصيام
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  يقوم طبيب المعمل بمراجعة صورة الروشتة المرفقة والتواصل معك لتأكيد شروط التحضير قبل الزيارة.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  03. استلام النتيجة إلكترونياً عبر الموقع أو الواتساب
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  تحصل على كود تحليل فريد فور سحب العينة لمتابعة وتحميل التقرير الرسمي PDF دون الحاجة للحضور.
                </p>
              </div>
            </div>
          </div>

          {/* Left Column: Interactive Booking Form */}
          <div className="lg:col-span-7">
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    نموذج حجز زيارة سحب عينة منزلي
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    أكمل بيانات العنوان والموعد المناسب وسيتواصل معك منسق الزيارات المنزلية خلال دقائق
                  </p>
                </div>
                {!isUserSignedIn && (
                  <button
                    type="button"
                    onClick={onPromptSignIn}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline underline-offset-4 cursor-pointer whitespace-nowrap"
                  >
                    تسجيل الدخول لحفظ الطلب سحابياً
                  </button>
                )}
              </div>

              {submittedConfirmation ? (
                <div className="bg-white border border-emerald-200 rounded-xl p-6 space-y-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">
                        تم تسجيل طلب الزيارة المنزلية بنجاح
                      </h4>
                      <p className="text-sm text-slate-600 mt-1">
                        رقم مرجع الحجز:{' '}
                        <span
                          className="font-mono-code font-bold text-teal-800"
                          dir="ltr"
                        >
                          {submittedConfirmation.requestId}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-slate-500">اسم المريض: </span>
                      <strong className="text-slate-900">
                        {submittedConfirmation.patientName}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">رقم الهاتف: </span>
                      <strong
                        className="text-slate-900 font-mono-code"
                        dir="ltr"
                      >
                        {submittedConfirmation.phone}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">المنطقة: </span>
                      <strong className="text-slate-900">
                        {submittedConfirmation.district}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">الموعد المفضل: </span>
                      <strong className="text-slate-900">
                        {submittedConfirmation.preferredDate} ·{' '}
                        {submittedConfirmation.preferredTimeSlot}
                      </strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500">العنوان التفصيلي: </span>
                      <strong className="text-slate-900">
                        {submittedConfirmation.address}
                      </strong>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                    <a
                      href={`https://wa.me/${
                        LIFE_LABS_INFO.whatsappNumber
                      }?text=${encodeURIComponent(
                        `مرحباً معامل الحياة بالمنصورة، أؤكد طلب سحب عينة منزلي رقم (${submittedConfirmation.requestId})\nالاسم: ${submittedConfirmation.patientName}\nالهاتف: ${submittedConfirmation.phone}\nالمنطقة: ${submittedConfirmation.district} - ${submittedConfirmation.address}\nالموعد: ${submittedConfirmation.preferredDate} (${submittedConfirmation.preferredTimeSlot})\nملاحظات: ${submittedConfirmation.notes || 'لا يوجد'}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>إرسال تفاصيل الحجز الفوري عبر واتساب المعمل</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setSubmittedConfirmation(null);
                        setPatientName('');
                        setPhone('');
                        setAddress('');
                        setNotes('');
                        setPrescriptionDataUrl('');
                        setPrescriptionFileName('');
                      }}
                      className="px-4 py-3 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      حجز زيارة أخرى
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-5">
                  {formError && (
                    <div
                      role="alert"
                      className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-900"
                    >
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="booking-patient-name"
                        className="block text-xs font-semibold text-slate-800 mb-1.5"
                      >
                        اسم المريض بالكامل *
                      </label>
                      <input
                        id="booking-patient-name"
                        type="text"
                        required
                        maxLength={120}
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="الاسم الثلاثي أو الرباعي"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="booking-phone"
                        className="block text-xs font-semibold text-slate-800 mb-1.5"
                      >
                        رقم الهاتف المحمول (يدعم واتساب) *
                      </label>
                      <input
                        id="booking-phone"
                        type="tel"
                        dir="ltr"
                        required
                        maxLength={25}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="01012345678"
                        className="w-full px-3.5 py-2.5 text-sm font-mono-code bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="booking-district"
                        className="block text-xs font-semibold text-slate-800 mb-1.5"
                      >
                        المنطقة / الحي في المنصورة *
                      </label>
                      <select
                        id="booking-district"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                      >
                        {MANSOURA_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="booking-address"
                        className="block text-xs font-semibold text-slate-800 mb-1.5"
                      >
                        العنوان التفصيلي بالمنصورة *
                      </label>
                      <input
                        id="booking-address"
                        type="text"
                        required
                        maxLength={300}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="اسم الشارع، رقم البرج/المنزل، الدور، علامة مميزة"
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="booking-date"
                        className="block text-xs font-semibold text-slate-800 mb-1.5"
                      >
                        التاريخ المفضل للزيارة *
                      </label>
                      <div className="relative">
                        <input
                          id="booking-date"
                          type="date"
                          required
                          min={todayIso}
                          value={preferredDate}
                          onChange={(e) => setPreferredDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm font-mono-code bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="booking-timeslot"
                        className="block text-xs font-semibold text-slate-800 mb-1.5"
                      >
                        الفترة الزمنية المناسبة *
                      </label>
                      <select
                        id="booking-timeslot"
                        value={preferredTimeSlot}
                        onChange={(e) => setPreferredTimeSlot(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                      >
                        <option value="الفترة الصباحية المبكرة (07:00 ص - 10:00 ص - لتحاليل الصيام)">
                          الفترة الصباحية المبكرة (07:00 ص - 10:00 ص - لتحاليل الصيام)
                        </option>
                        <option value="الفترة الصباحية (10:00 ص - 01:00 ظ)">
                          الفترة الصباحية (10:00 ص - 01:00 ظ)
                        </option>
                        <option value="فترة الظهيرة (01:00 ظ - 05:00 م)">
                          فترة الظهيرة (01:00 ظ - 05:00 م)
                        </option>
                        <option value="الفترة المسائية (05:00 م - 10:00 م)">
                          الفترة المسائية (05:00 م - 10:00 م)
                        </option>
                        <option value="زيارة طوارئ ليلية (خدمة 24 ساعة)">
                          زيارة طوارئ ليلية (خدمة 24 ساعة)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="booking-notes"
                      className="block text-xs font-semibold text-slate-800 mb-1.5"
                    >
                      التحاليل المطلوبة أو ملاحظات إضافية (اختياري)
                    </label>
                    <textarea
                      id="booking-notes"
                      rows={2}
                      maxLength={500}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="اكتب أسماء التحاليل المطلوبة أو أي تعليمات خاصة بكبار السن أو الأطفال..."
                      className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>

                  {/* Optional Prescription / Rosheta Image Upload */}
                  <div>
                    <span className="block text-xs font-semibold text-slate-800 mb-1.5">
                      إرفاق صورة الروشتة الطبية (Rosheta) - اختياري
                    </span>
                    {!prescriptionDataUrl ? (
                      <label
                        htmlFor="prescription-upload"
                        className="flex items-center justify-between gap-3 px-4 py-3 bg-white border border-dashed border-slate-300 hover:border-teal-600 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 text-xs text-slate-600">
                          <Upload className="w-4 h-4 text-teal-700 shrink-0" />
                          <span>
                            {isCompressing
                              ? 'جاري ضغط وتجهيز صورة الروشتة...'
                              : 'اضغط لرفع صورة الروشتة أو التحاليل المطلوبة من هاتفك أو جهازك'}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-teal-700 whitespace-nowrap">
                          اختيار صورة
                        </span>
                        <input
                          id="prescription-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="flex items-center justify-between gap-3 p-3 bg-white border border-teal-200 rounded-lg">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={prescriptionDataUrl}
                            alt="معاينة الروشتة المرفقة"
                            className="w-12 h-12 object-cover rounded border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {prescriptionFileName || 'صورة الروشتة المرفقة'}
                            </p>
                            <p className="text-xs text-emerald-700">
                              تم إرفاق الروشتة بنجاح
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPrescriptionDataUrl('');
                            setPrescriptionFileName('');
                          }}
                          className="p-1.5 text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                          title="إزالة الصورة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || isCompressing}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-400 text-white font-bold text-sm rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>
                        {isSubmitting
                          ? 'جاري تأكيد وحفظ طلب الزيارة...'
                          : 'تأكيد حجز سحب العينة المنزلي'}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
