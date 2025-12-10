import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Button, Empty } from 'antd'; // <--- Bỏ 'Typography' ra khỏi import
import { PlusOutlined } from '@ant-design/icons';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/auth';
import { AddHabitButton } from '@/components/molecules/AddHabitButton';
import { HabitCard } from '@/components/molecules/HabitCard';
import { db } from '@/lib/db';
import { HabitBoard } from '@/components/templates/HabitBoard';
import { HabitRow } from '@/components/molecules/HabitRow';
export default async function DashboardPage() {
  const t = await getTranslations('Common');
  const session = await auth();
const habits = await db.habit.findMany({
    where: { userId: session?.user?.id },
    include: { logs: true },
    orderBy: { createdAt: 'desc' },
  });
  
  return (
    <DashboardLayout>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          {/* Thay Typography.Title bằng h3 + Tailwind */}
          <h3 className="text-2xl font-bold text-gray-900 mb-0">
            Tổng quan
          </h3>
          
          {/* Thay Typography.Text bằng p + Tailwind */}
          <p className="text-gray-500 mt-1">
            Chào mừng trở lại, {session?.user?.name}!
          </p>
        </div>
        
        <AddHabitButton />
      </div>

    <HabitBoard habits={habits} />
    </DashboardLayout>
  );
}