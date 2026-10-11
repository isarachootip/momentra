export interface PlatformUser {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: 'sysadmin' | 'owner' | 'admin' | 'contributor' | 'viewer';
  pageSlug: string;
  pageName: string;
  status: 'active' | 'suspended';
  joinedAt: string;
}

export const INITIAL_PLATFORM_USERS: PlatformUser[] = [
  {
    id: 'sysadmin-1',
    fullName: 'สำราญ ศักดี',
    email: 'samran@momentra.app',
    username: 'samran',
    role: 'sysadmin',
    pageSlug: 'samran',
    pageName: 'คลังประวัติศาสตร์และจดหมายเหตุ คุณสำราญ',
    status: 'active',
    joinedAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'user-drmum',
    fullName: 'ดร. มานพ พิทักษ์ธรรม (Dr. Mum)',
    email: 'drmum@momentra.app',
    username: 'drmum',
    role: 'owner',
    pageSlug: 'drmum',
    pageName: 'สถาบันวิจัยการแพทย์ประวัติศาสตร์ (Dr. Mum)',
    status: 'active',
    joinedAt: '2026-02-01T09:00:00Z',
  },
  {
    id: 'user-wanida',
    fullName: 'วนิดา ธนสารสิทธิ์',
    email: 'wanida@momentra.app',
    username: 'wanida',
    role: 'admin',
    pageSlug: 'drmum',
    pageName: 'สถาบันวิจัยการแพทย์ประวัติศาสตร์ (Dr. Mum)',
    status: 'active',
    joinedAt: '2026-02-15T10:30:00Z',
  },
  {
    id: 'user-pranote',
    fullName: 'ปราโมทย์ รัตนชัย',
    email: 'pranote@momentra.app',
    username: 'pranote',
    role: 'contributor',
    pageSlug: 'drmum',
    pageName: 'สถาบันวิจัยการแพทย์ประวัติศาสตร์ (Dr. Mum)',
    status: 'active',
    joinedAt: '2026-03-01T14:00:00Z',
  },
  {
    id: 'user-kanthida',
    fullName: 'กานต์ธิดา อัมพวา',
    email: 'archivist.intern@momentra.app',
    username: 'archivist',
    role: 'viewer',
    pageSlug: 'drmum',
    pageName: 'สถาบันวิจัยการแพทย์ประวัติศาสตร์ (Dr. Mum)',
    status: 'active',
    joinedAt: '2026-04-05T11:00:00Z',
  },
];
