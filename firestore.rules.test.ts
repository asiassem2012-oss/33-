/**
 * Firestore Security Rules Test Specification
 * Verifies that all "Dirty Dozen" adversarial payloads return PERMISSION_DENIED.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: {
    uid: string;
    email?: string;
    email_verified?: boolean;
  } | null;
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TEST_SUITE: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Shadow Field Injection on LabResult',
    operation: 'create',
    path: '/results/LAB-2026-889',
    auth: { uid: 'admin_1', email: 'asiassem2012@gmail.com', email_verified: true },
    payload: {
      analysisCode: 'LAB-2026-889',
      patientName: 'أحمد محمد علي',
      testName: 'CBC',
      testCategory: 'Hematology',
      testDate: '2026-10-01',
      status: 'ready',
      estimatedCompletion: '',
      pdfDataUrl: '',
      pdfFileName: '',
      clinicalSummary: 'Normal',
      createdBy: 'admin_1',
      isSuperAdmin: true,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Admin Email Spoof',
    operation: 'create',
    path: '/results/LAB-2026-999',
    auth: { uid: 'spoof_uid', email: 'asiassem2012@gmail.com', email_verified: false },
    payload: {
      analysisCode: 'LAB-2026-999',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Public Scraping (list) of /results',
    operation: 'list',
    path: '/results',
    auth: { uid: 'regular_user', email: 'patient@example.com', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Unauthorized Read of Isolated PII (/result_contacts/LAB-2026-889)',
    operation: 'get',
    path: '/result_contacts/LAB-2026-889',
    auth: { uid: 'regular_user', email: 'patient@example.com', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Orphaned Contact PII Write without parent LabResult',
    operation: 'create',
    path: '/result_contacts/LAB-2026-777',
    auth: { uid: 'admin_1', email: 'asiassem2012@gmail.com', email_verified: true },
    payload: {
      analysisCode: 'LAB-2026-777',
      patientPhone: '01012345678',
      notes: 'Orphaned contact record',
      createdBy: 'admin_1',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Identity Spoofing on Home Collection Request',
    operation: 'create',
    path: '/home_requests/req_101',
    auth: { uid: 'user_A', email: 'usera@example.com', email_verified: true },
    payload: {
      requestId: 'req_101',
      requesterId: 'user_B',
      patientName: 'سارة محمود',
      phone: '01099887766',
      address: 'شارع الجمهورية بجوار الجامعة',
      district: 'شارع الجمهورية',
      preferredDate: '2026-10-02',
      preferredTimeSlot: '09:00 ص - 11:00 ص',
      notes: '',
      prescriptionDataUrl: '',
      prescriptionFileName: '',
      status: 'new',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'State Shortcutting on Home Collection Request Creation',
    operation: 'create',
    path: '/home_requests/req_102',
    auth: { uid: 'user_A', email: 'usera@example.com', email_verified: true },
    payload: {
      requestId: 'req_102',
      requesterId: 'user_A',
      patientName: 'سارة محمود',
      phone: '01099887766',
      address: 'شارع الجمهورية بجوار الجامعة',
      district: 'شارع الجمهورية',
      preferredDate: '2026-10-02',
      preferredTimeSlot: '09:00 ص - 11:00 ص',
      notes: '',
      prescriptionDataUrl: '',
      prescriptionFileName: '',
      status: 'completed',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Terminal State Bypass on Home Collection Request Update',
    operation: 'update',
    path: '/home_requests/req_102',
    auth: { uid: 'user_A', email: 'usera@example.com', email_verified: true },
    payload: {
      status: 'cancelled',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Unauthorized Update of Immutable Fields (createdAt / requesterId)',
    operation: 'update',
    path: '/home_requests/req_101',
    auth: { uid: 'user_A', email: 'usera@example.com', email_verified: true },
    payload: {
      requesterId: 'user_C',
      status: 'cancelled',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'ID Poisoning Attack on /results/{analysisCode}',
    operation: 'get',
    path: '/results/MALFORMED_ID_$$$',
    auth: null,
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Value Poisoning / String Overflow on patientName',
    operation: 'create',
    path: '/home_requests/req_103',
    auth: { uid: 'user_A', email: 'usera@example.com', email_verified: true },
    payload: {
      requestId: 'req_103',
      requesterId: 'user_A',
      patientName: 'أ'.repeat(500),
      phone: '01099887766',
      address: 'شارع المشاية السفلية',
      district: 'المشاية السفلية',
      preferredDate: '2026-10-02',
      preferredTimeSlot: '09:00 ص - 11:00 ص',
      notes: '',
      prescriptionDataUrl: '',
      prescriptionFileName: '',
      status: 'new',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Client Timestamp Forgery',
    operation: 'create',
    path: '/home_requests/req_104',
    auth: { uid: 'user_A', email: 'usera@example.com', email_verified: true },
    payload: {
      requestId: 'req_104',
      requesterId: 'user_A',
      patientName: 'محمود السيد',
      phone: '01099887766',
      address: 'شارع المشاية السفلية',
      district: 'المشاية السفلية',
      preferredDate: '2026-10-02',
      preferredTimeSlot: '09:00 ص - 11:00 ص',
      notes: '',
      prescriptionDataUrl: '',
      prescriptionFileName: '',
      status: 'new',
      createdAt: '2020-01-01T00:00:00Z',
      updatedAt: '2020-01-01T00:00:00Z',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
];
