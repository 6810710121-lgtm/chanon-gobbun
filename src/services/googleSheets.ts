import { Activity, Registration, CancellationRecord } from '../types';

const SHEETS_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_BASE_URL = 'https://www.googleapis.com/drive/v3/files';

export const SHEET_NAME_ACTIVITIES = 'กิจกรรมทั้งหมด';
export const SHEET_NAME_REGISTRATIONS = 'รายชื่อผู้ลงทะเบียน';
export const SHEET_NAME_CANCELLATIONS = 'ประวัติการถอนกิจกรรม';
export const SHEET_NAME_ANTI_PROXY = 'ประวัติตรวจสอบการจองแทน';

export interface SpreadsheetInfo {
  id: string;
  url: string;
  name: string;
}

/**
 * Find existing activity spreadsheet on Google Drive, or create a new one.
 */
export async function findOrCreateSpreadsheet(
  token: string,
  spreadsheetTitle = 'ระบบจองกิจกรรมพัฒนานิสิต - TSU Activities'
): Promise<SpreadsheetInfo> {
  // 1. Search existing files in Drive
  const query = encodeURIComponent(
    `name = '${spreadsheetTitle}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`
  );
  const searchUrl = `${DRIVE_BASE_URL}?q=${query}&fields=files(id,name,webViewLink)`;

  const searchRes = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const existing = searchData.files[0];
      return {
        id: existing.id,
        url: existing.webViewLink || `https://docs.google.com/spreadsheets/d/${existing.id}/edit`,
        name: existing.name,
      };
    }
  }

  // 2. Not found, create new spreadsheet
  const createPayload = {
    properties: {
      title: spreadsheetTitle,
    },
    sheets: [
      { properties: { title: SHEET_NAME_ACTIVITIES } },
      { properties: { title: SHEET_NAME_REGISTRATIONS } },
      { properties: { title: SHEET_NAME_CANCELLATIONS } },
      { properties: { title: SHEET_NAME_ANTI_PROXY } },
    ],
  };

  const createRes = await fetch(SHEETS_BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`ไม่สามารถสร้าง Google Sheets ได้: ${errText}`);
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const webUrl = createdData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 3. Initialize headers
  await initializeHeaders(token, spreadsheetId);

  return {
    id: spreadsheetId,
    url: webUrl,
    name: spreadsheetTitle,
  };
}

/**
 * Initializes header columns for all 4 worksheets
 */
async function initializeHeaders(token: string, spreadsheetId: string) {
  const headersData = [
    {
      range: `'${SHEET_NAME_ACTIVITIES}'!A1:L1`,
      values: [
        [
          'รหัสกิจกรรม',
          'ชื่อกิจกรรม',
          'หมวดหมู่',
          'วันที่จัด',
          'เวลาเริ่มต้น',
          'เวลาสิ้นสุด',
          'สถานที่',
          'วิทยากร',
          'ที่นั่งทั้งหมด',
          'ลงทะเบียนแล้ว',
          'ที่นั่งคงเหลือ',
          'ชั่วโมงกิจกรรม (ชม.)',
        ],
      ],
    },
    {
      range: `'${SHEET_NAME_REGISTRATIONS}'!A1:N1`,
      values: [
        [
          'รหัสการจอง',
          'รหัสกิจกรรม',
          'ชื่อกิจกรรม',
          'รหัสนิสิต',
          'ชื่อ-นามสกุล',
          'คณะ',
          'สาขาวิชา',
          'ชั้นปี',
          'เบอร์โทรศัพท์',
          'อีเมล Google ที่ใช้จอง',
          'วันเวลาที่ลงทะเบียน',
          'สถานะ',
          'ระดับความเสี่ยงจองแทน',
          'ผลการตรวจสอบตัวตน (Anti-Proxy Audit)',
        ],
      ],
    },
    {
      range: `'${SHEET_NAME_CANCELLATIONS}'!A1:I1`,
      values: [
        [
          'รหัสรายการถอน',
          'รหัสการจองเดิม',
          'รหัสกิจกรรม',
          'ชื่อกิจกรรม',
          'รหัสนิสิต',
          'ชื่อ-นามสกุล',
          'เบอร์โทรศัพท์',
          'วันเวลาที่ถอนกิจกรรม',
          'เหตุผลที่ขอถอน',
        ],
      ],
    },
    {
      range: `'${SHEET_NAME_ANTI_PROXY}'!A1:H1`,
      values: [
        [
          'วันเวลาที่บันทึก',
          'รหัสนิสิตที่ระบุ',
          'อีเมล Google ผู้ทำรายการ',
          'รหัสนิสิตที่ดึงจากอีเมล',
          'ผลการเทียบรหัส',
          'คะแนนความเสี่ยง (0-100)',
          'วิธีการตรวจสอบ',
          'บันทึกการตรวจสอบความปลอดภัย',
        ],
      ],
    },
  ];

  await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: headersData,
    }),
  });
}

/**
 * Synchronize full state to Google Sheets
 */
export async function syncFullStateToSheet(
  token: string,
  spreadsheetId: string,
  activities: Activity[],
  registrations: Registration[],
  cancellations: CancellationRecord[]
): Promise<void> {
  const activitiesRows = activities.map((a) => [
    a.id,
    a.title,
    a.categoryLabel,
    a.startDate,
    a.startTime,
    a.endTime,
    a.location,
    a.speaker,
    a.maxSeats,
    a.enrolledCount,
    Math.max(0, a.maxSeats - a.enrolledCount),
    a.activityHours,
  ]);

  const registrationsRows = registrations.map((r) => [
    r.id,
    r.activityId,
    r.activityTitle,
    r.studentId,
    r.fullName,
    r.faculty,
    r.major,
    r.year,
    r.phone,
    r.userEmail,
    r.registeredAt,
    r.status === 'confirmed' ? 'ยืนยันแล้ว' : r.status === 'attended' ? 'เข้าร่วมแล้ว' : 'ยกเลิก',
    r.antiProxy?.riskScore === 0 ? 'ปลอดภัย (0%)' : `${r.antiProxy?.riskScore || 0}%`,
    r.antiProxy?.auditNotes || 'ตรวจสอบสำเร็จ',
  ]);

  const cancellationsRows = cancellations.map((c) => [
    c.id,
    c.registrationId,
    c.activityId,
    c.activityTitle,
    c.studentId,
    c.fullName,
    c.phone,
    c.cancelledAt,
    c.reason,
  ]);

  const antiProxyRows = registrations.map((r) => [
    r.antiProxy?.verifiedAt || r.registeredAt,
    r.studentId,
    r.userEmail,
    r.antiProxy?.studentIdExtractedFromEmail || '-',
    r.antiProxy?.matchedStudentId ? 'ตรงกัน (ผ่าน)' : 'ต้องตรวจสอบเพิ่มเติม',
    r.antiProxy?.riskScore || 0,
    r.antiProxy?.method || 'oauth_match',
    r.antiProxy?.auditNotes || '-',
  ]);

  const data = [
    // Clear and overwrite activities
    {
      range: `'${SHEET_NAME_ACTIVITIES}'!A2:L${Math.max(2, activitiesRows.length + 1)}`,
      values: activitiesRows.length > 0 ? activitiesRows : [['-']],
    },
    {
      range: `'${SHEET_NAME_REGISTRATIONS}'!A2:N${Math.max(2, registrationsRows.length + 1)}`,
      values: registrationsRows.length > 0 ? registrationsRows : [['-']],
    },
    {
      range: `'${SHEET_NAME_CANCELLATIONS}'!A2:I${Math.max(2, cancellationsRows.length + 1)}`,
      values: cancellationsRows.length > 0 ? cancellationsRows : [['-']],
    },
    {
      range: `'${SHEET_NAME_ANTI_PROXY}'!A2:H${Math.max(2, antiProxyRows.length + 1)}`,
      values: antiProxyRows.length > 0 ? antiProxyRows : [['-']],
    },
  ];

  const updateRes = await fetch(
    `${SHEETS_BASE_URL}/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data,
      }),
    }
  );

  if (!updateRes.ok) {
    const errorText = await updateRes.text();
    throw new Error(`การซิงค์ข้อมูลกับ Google Sheets ล้มเหลว: ${errorText}`);
  }
}
