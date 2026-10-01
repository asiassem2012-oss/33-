import React, { useState, useMemo } from 'react';
import { Search, Clock, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { LAB_DIRECTORY_ITEMS, type LabDirectoryItem } from '../data/labData';

interface TestDirectorySectionProps {
  onSelectTestForHomeVisit: (testName: string) => void;
}

const CATEGORIES = [
  'الكل',
  'أمراض الدم',
  'السكري والدهون',
  'الهرمونات والغدد',
  'وظائف الأعضاء',
  'الفيتامينات والمناعة',
  'الفحوصات الشاملة',
];

export const TestDirectorySection: React.FC<TestDirectorySectionProps> = ({
  onSelectTestForHomeVisit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [onlyFasting, setOnlyFasting] = useState<'all' | 'fasting' | 'no-fasting'>(
    'all'
  );

  const filteredTests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return LAB_DIRECTORY_ITEMS.filter((item) => {
      const matchesCategory =
        selectedCategory === 'الكل' || item.category === selectedCategory;
      const matchesFasting =
        onlyFasting === 'all' ||
        (onlyFasting === 'fasting' && item.fastingRequired) ||
        (onlyFasting === 'no-fasting' && !item.fastingRequired);
      const matchesQuery =
        !q ||
        item.nameAr.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.clinicalPurposeAr.toLowerCase().includes(q);

      return matchesCategory && matchesFasting && matchesQuery;
    });
  }, [searchQuery, selectedCategory, onlyFasting]);

  return (
    <section
      id="test-directory"
      className="py-16 lg:py-20 bg-slate-50 border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-semibold text-teal-700">
              دليل الفحوصات والتجهيز المسبق · أسعار معلنة وواضحة
            </div>
            <h2
              className="text-2xl sm:text-3xl font-bold text-slate-900"
              style={{ textWrap: 'balance' }}
            >
              دليل التحاليل الطبية وشروط التحضير قبل الفحص
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              ابحث باسم التحليل بالعربية أو الإنجليزية (مثل: CBC، السكر التراكمي، الغدة الدرقية، فيتامين د) للاطلاع على شروط الصيام ومدة ظهور النتيجة والتكلفة المعتمدة.
            </p>
          </div>

          {/* Search Input */}
          <div className="w-full md:w-80">
            <label htmlFor="directory-search" className="sr-only">
              ابحث في دليل التحاليل
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="directory-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم التحليل (مثال: CBC, دهون, غدة)..."
                className="w-full pr-10 pl-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>
        </div>

        {/* Interactive Filter Controls (Functional Segmented Buttons) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedCategory === category
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start">
            <button
              type="button"
              onClick={() => setOnlyFasting('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                onlyFasting === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              جميع الشروط
            </button>
            <button
              type="button"
              onClick={() => setOnlyFasting('fasting')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                onlyFasting === 'fasting'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              يشترط الصيام
            </button>
            <button
              type="button"
              onClick={() => setOnlyFasting('no-fasting')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                onlyFasting === 'no-fasting'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              بدون صيام
            </button>
          </div>
        </div>

        {/* Directory Cards Grid (Single-Elevation Depth, Zero Static Pill Clutter) */}
        {filteredTests.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
            <p className="text-base font-bold text-slate-900">
              لا توجد تحاليل مطابقة لعبارة البحث الحالية
            </p>
            <p className="text-xs text-slate-500">
              جرب البحث بكلمات أخرى أو عرض جميع الأقسام الطبية
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('الكل');
                setOnlyFasting('all');
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTests.map((test: LabDirectoryItem) => (
              <div
                key={test.id}
                className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between hover:border-teal-600/60 transition-colors"
              >
                <div className="space-y-3">
                  {/* Quiet 1-line unboxed metadata kicker */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {test.category} · كود{' '}
                      <span className="font-mono-code text-slate-700">
                        {test.code}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-teal-700" />
                      <span>{test.turnaroundTime}</span>
                    </span>
                  </div>

                  {/* Primary Title */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {test.nameAr}
                    </h3>
                    <p
                      className="text-xs font-mono-code text-slate-500 mt-0.5"
                      dir="ltr"
                    >
                      {test.nameEn}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {test.clinicalPurposeAr}
                  </p>

                  {/* Preparation Rule Block */}
                  <div className="pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      {test.fastingRequired ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="text-amber-800">
                            شرط الفحص: يشترط الصيام
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-emerald-800">
                            شرط الفحص: لا يشترط الصيام
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {test.preparationAr}
                    </p>
                  </div>
                </div>

                {/* Price & Action Footer */}
                <div className="pt-4 mt-5 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs text-slate-500 block">
                      تكلفة التحليل
                    </span>
                    <span className="text-xl font-bold text-slate-900 font-mono-code tabular-nums">
                      {test.priceEgp}
                    </span>{' '}
                    <span className="text-xs font-semibold text-slate-600">
                      ج.م
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onSelectTestForHomeVisit(`${test.nameAr} (${test.nameEn})`)
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>حجز سحب منزلي</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
