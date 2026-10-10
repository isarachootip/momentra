import type { WorkspaceMember, WorkspaceSummary } from '@/types';

export const INITIAL_WORKSPACES: WorkspaceSummary[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'หอจดหมายเหตุแห่งชาติ (National Archives)',
    slug: 'national-archives',
    type: 'organization',
    role: 'owner',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'คลังประวัติศาสตร์ส่วนตัว (Personal)',
    slug: 'personal-archive',
    type: 'personal',
    role: 'owner',
  },
];

export const INITIAL_MEMBERS: WorkspaceMember[] = [
  {
    user_id: 'a1111111-1111-1111-1111-111111111111',
    email: 'samran@momentra.app',
    full_name: 'สำราญ ศักดี',
    avatar_url: null,
    role: 'owner',
    joined_at: '2026-01-15T08:00:00Z',
  },
  {
    user_id: 'b2222222-2222-2222-2222-222222222222',
    email: 'wanida@momentra.app',
    full_name: 'วนิดา ธนสารสิทธิ์',
    avatar_url: null,
    role: 'admin',
    joined_at: '2026-02-01T09:30:00Z',
  },
  {
    user_id: 'c3333333-3333-3333-3333-333333333333',
    email: 'pranote@momentra.app',
    full_name: 'ปราโมทย์ รัตนชัย',
    avatar_url: null,
    role: 'contributor',
    joined_at: '2026-03-10T14:15:00Z',
  },
  {
    user_id: 'd4444444-4444-4444-4444-444444444444',
    email: 'archivist.intern@momentra.app',
    full_name: 'กานต์ธิดา อัมพวา',
    avatar_url: null,
    role: 'viewer',
    joined_at: '2026-04-05T11:00:00Z',
  },
];
