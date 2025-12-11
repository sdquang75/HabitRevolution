import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { HabitBoard } from '@/components/templates/HabitBoard';

export default async function DashboardPage() {
  const session = await auth();
  const t = await getTranslations('Common');

  // Lấy dữ liệu
  const habits = await db.habit.findMany({
    where: { userId: session?.user?.id },
    include: { logs: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <DashboardLayout>
        {/* Truyền trực tiếp vào Layout, không bọc thêm div thừa gây scroll */}
        <HabitBoard habits={habits} />
    </DashboardLayout>
  );
}