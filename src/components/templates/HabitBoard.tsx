'use client';

import { HabitRow } from '@/components/molecules/HabitRow';
import { HabitDetailDrawer } from '@/components/organisms/HabitDetailDrawer';
import { AddHabitButton } from '@/components/molecules/AddHabitButton';
import { useRouter } from 'next/navigation';

export const HabitBoard = ({ habits }: { habits: any[] }) => {
  const router = useRouter();

  return (
    <>
      {/* 1. Danh sách thói quen */}
      <div className="flex flex-col gap-2 max-w-4xl mx-auto">
        {habits.map((habit) => (
          <HabitRow 
            key={habit.id} 
            habit={habit} 
            onRefresh={() => router.refresh()} // Truyền hàm refresh xuống
          />
        ))}
        
        <div className="text-center mt-6">
          <AddHabitButton />
        </div>
      </div>

      {/* 2. Cái Drawer tàng hình (Chờ sự kiện double-click để hiện) */}
      <HabitDetailDrawer />
    </>
  );
};