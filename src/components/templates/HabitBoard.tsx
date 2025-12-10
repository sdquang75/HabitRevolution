'use client';

import { useState } from 'react';
import { HabitRow } from '@/components/molecules/HabitRow';
import { HabitGrid } from '@/components/organisms/HabitGrid';
import { HabitDetailDrawer } from '@/components/organisms/HabitDetailDrawer';
import { AddHabitButton } from '@/components/molecules/AddHabitButton';
import { useRouter } from 'next/navigation';
import { Segmented, DatePicker, Button } from 'antd';
import { UnorderedListOutlined, AppstoreOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

export const HabitBoard = ({ habits }: { habits: any[] }) => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'List' | 'Grid'>('List'); // State chuyển view
  const [selectedDate, setSelectedDate] = useState(dayjs()); // State chọn ngày

  const handleRefresh = () => router.refresh();

  return (
    <>
      {/* --- HEADER CONTROLS --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-3 rounded-xl shadow-sm border">
         
         {/* 1. Switch View (List / Grid) */}
         <Segmented
            options={[
              { label: 'Danh sách', value: 'List', icon: <UnorderedListOutlined /> },
              { label: 'Lưới', value: 'Grid', icon: <AppstoreOutlined /> },
            ]}
            value={viewMode}
            onChange={(val: any) => setViewMode(val)}
         />

         {/* 2. Date Navigator (Chọn ngày) */}
         <div className="flex items-center gap-2">
            <Button icon={<LeftOutlined />} onClick={() => setSelectedDate(d => d.subtract(1, 'day'))} />
            
            <DatePicker 
                value={selectedDate} 
                onChange={(date) => setSelectedDate(date || dayjs())} 
                format="DD/MM/YYYY"
                allowClear={false}
                className="font-bold w-40 text-center"
            />
            
            <Button 
                icon={<RightOutlined />} 
                onClick={() => setSelectedDate(d => d.add(1, 'day'))} 
                disabled={selectedDate.isSame(dayjs(), 'day')} // Không cho chọn tương lai
            />
         </div>
      </div>

      {/* --- BODY --- */}
      {viewMode === 'List' ? (
        // VIEW DANH SÁCH (Cũ nhưng nâng cấp)
        <div className="flex flex-col gap-2 max-w-4xl mx-auto pb-20">
            {/* Label nhỏ hiển thị ngày đang chọn */}
            {/* <div className="text-center text-xs text-gray-500 mb-2 uppercase font-semibold tracking-wider">
                Đang sửa dữ liệu ngày: {selectedDate.format('DD/MM/YYYY')}
            </div> */}

            {habits.map((habit) => (
            <HabitRow 
                key={habit.id} 
                habit={habit} 
                onRefresh={handleRefresh}
                selectedDate={selectedDate.toDate()} // Truyền ngày vào
            />
            ))}
            <div className="text-center mt-6">
                 <AddHabitButton />
            </div>
        </div>
      ) : (
        // VIEW LƯỚI (Mới)
        <div className="pb-20">
            <HabitGrid habits={habits} startDate={selectedDate.toDate()} />
            <div className="text-center mt-6">
                 <AddHabitButton />
            </div>
        </div>
      )}

      <HabitDetailDrawer />
    </>
  );
};