import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);

  return {
    title: `${displayName} — Personal Hub & Digital Archive | Momentra`,
    description: `สำรวจพอร์ตโฟลิโอ ช่องทางโซเชียล และคลังความรู้ประวัติศาสตร์ของ @${username} บน Momentra HDAM`,
    openGraph: {
      title: `${displayName} — Personal Hub & Digital Archive | Momentra`,
      description: `สำรวจพอร์ตโฟลิโอ ช่องทางโซเชียล และคลังความรู้ประวัติศาสตร์ของ @${username}`,
      url: `https://momentra.online/${username}`,
      siteName: 'Momentra HDAM',
      locale: 'th_TH',
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} — Personal Hub | Momentra`,
      description: `สำรวจพอร์ตโฟลิโอและคลังความรู้ประวัติศาสตร์ของ @${username}`,
    },
  };
}

export default function HubUserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
