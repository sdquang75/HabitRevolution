'use client';

import { useState, useMemo } from 'react';
import { HabitRow } from '@/components/molecules/HabitRow';
import { HabitGrid } from '@/components/organisms/HabitGrid';
import { HabitDetailDrawer } from '@/components/organisms/HabitDetailDrawer';
import { AddHabitButton } from '@/components/molecules/AddHabitButton';
import { useRouter } from 'next/navigation';
import { Segmented, DatePicker, Button, Collapse, Divider, Empty } from 'antd';
import { 
  UnorderedListOutlined, AppstoreOutlined, LeftOutlined, RightOutlined, 
  CheckCircleOutlined, CaretRightOutlined, CloseCircleOutlined, StopOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHabitNotification } from '@/hooks/useHabitNotification';

const { Panel } = Collapse;

export const HabitBoard = ({ habits }: { habits: any[] }) => {
  useHabitNotification(habits);
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'List' | 'Grid'>('List');
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const handleRefresh = () => router.refresh();

  // --- LOGIC PHÂN LOẠI MỚI (CHIA 4 NHÓM) ---
// --- LOGIC PHÂN LOẠI MỚI (CHIA 4 NHÓM) ---
  // THÊM ĐOẠN ĐỊNH NGHĨA KIỂU NÀY VÀO SAU useMemo:
  const { todoList, successList, skippedList, failedList } = useMemo<{ 
    todoList: any[]; 
    successList: any[]; 
    skippedList: any[]; 
    failedList: any[]; 
  }>(() => {
    const todo: any[] = [];
    const success: any[] = [];
    const skipped: any[] = [];
    const failed: any[] = [];

    habits.forEach((habit: any) => {
      const log = habit.logs.find((l: any) => dayjs(l.completedAt).isSame(selectedDate, 'day'));
      const status = log?.status || 'IN_PROGRESS';

      const isDone = status === 'DONE' || (log && log.currentValue >= habit.goalCount);

      if (isDone) {
        success.push(habit);
      } else if (status === 'FAILED') {
        failed.push(habit);
      } else if (status === 'SKIPPED') {
        skipped.push(habit);
      } else {
        todo.push(habit);
      }
    });

    // Trả về đúng tên key đã định nghĩa ở trên
    return { todoList: todo, successList: success, skippedList: skipped, failedList: failed };
  }, [habits, selectedDate]);

  // Helper render danh sách habit trong Collapse
  const renderHabitList = (list: any[]) => (
    <div className="space-y-2 opacity-80 hover:opacity-100 transition-opacity duration-300">
      {list.map((habit) => (
        <HabitRow
          key={habit.id}
          habit={habit}
          onRefresh={handleRefresh}
          selectedDate={selectedDate.toDate()}
        />
      ))}
    </div>
  );

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 sticky top-2 z-10 backdrop-blur-md bg-white/90 mx-4 mt-2">
        <Segmented
          options={[
            { label: 'Danh sách', value: 'List', icon: <UnorderedListOutlined /> },
            { label: 'Lưới', value: 'Grid', icon: <AppstoreOutlined /> },
          ]}
          value={viewMode}
          onChange={(val: any) => setViewMode(val)}
        />

        <div className="flex items-center gap-3">
           <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
              <Button type="text" size="small" icon={<LeftOutlined />} onClick={() => setSelectedDate(d => d.subtract(1, 'day'))} />
              <DatePicker
                value={selectedDate}
                onChange={(date) => setSelectedDate(date || dayjs())}
                format="DD/MM/YYYY"
                allowClear={false}
                className="font-bold w-32 text-center border-none bg-transparent shadow-none"
                suffixIcon={false}
              />
              <Button
                type="text"
                size="small"
                icon={<RightOutlined />}
                onClick={() => setSelectedDate(d => d.add(1, 'day'))}
                disabled={selectedDate.isSame(dayjs(), 'day')}
              />
           </div>
           <AddHabitButton />
        </div>
      </div>

      {/* BODY CONTENT */}
      {viewMode === 'List' ? (
        <div className="flex flex-col gap-4 max-w-4xl mx-auto pb-20 px-4">

          {/* 1. TODO SECTION (LUÔN MỞ) */}
          <div className="space-y-3">
            {todoList.length > 0 ? (
              todoList.map((habit: any) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  onRefresh={handleRefresh}
                  selectedDate={selectedDate.toDate()}
                />
              ))
            ) : (
              // All Clear Logic: Chỉ hiện khi KHÔNG còn việc phải làm VÀ đã có ít nhất 1 việc thành công
              successList.length > 0 && (
                <div className="text-center py-10 bg-emerald-50 rounded-3xl border border-emerald-100 mb-6">
                  <CheckCircleOutlined className="text-6xl text-emerald-500 mb-4 animate-bounce" />
                  <h3 className="text-xl font-bold text-emerald-700">All Clear!</h3>
                  <p className="text-emerald-600">Bạn đã hoàn thành xuất sắc mục tiêu hôm nay.</p>
                </div>
              )
            )}
          </div>

          {/* 2. COMPLETED SECTIONS (MẶC ĐỊNH ĐÓNG) */}
          {(successList.length > 0 || skippedList.length > 0 || failedList.length > 0) && (
            <div className="mt-4">
              <Divider orientation="left" className="!text-gray-400 !font-normal !text-xs uppercase tracking-widest !mb-2">
                Lịch sử hoạt động
              </Divider>

              <Collapse 
                ghost 
                bordered={false} 
                // defaultActiveKey={[]} // Mặc định rỗng -> Đóng tất cả
                expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} className="text-gray-400" />}
                className="site-collapse-custom-collapse"
              >
                {/* NHÓM THÀNH CÔNG */}
                {successList.length > 0 && (
                    <Panel 
                        header={
                            <div className="flex items-center gap-2 text-emerald-600 font-medium">
                                <CheckCircleOutlined /> Thành công ({successList.length})
                            </div>
                        } 
                        key="success"
                    >
                        {renderHabitList(successList)}
                    </Panel>
                )}

                {/* NHÓM BỎ QUA */}
                {skippedList.length > 0 && (
                    <Panel 
                        header={
                            <div className="flex items-center gap-2 text-gray-500 font-medium">
                                <StopOutlined /> Bỏ qua ({skippedList.length})
                            </div>
                        } 
                        key="skipped"
                    >
                        {renderHabitList(skippedList)}
                    </Panel>
                )}

                {/* NHÓM THẤT BẠI */}
                {failedList.length > 0 && (
                    <Panel 
                        header={
                            <div className="flex items-center gap-2 text-red-500 font-medium">
                                <CloseCircleOutlined /> Thất bại ({failedList.length})
                            </div>
                        } 
                        key="failed"
                    >
                        {renderHabitList(failedList)}
                    </Panel>
                )}
              </Collapse>
            </div>
          )}

          {/* Empty State */}
          {todoList.length === 0 && successList.length === 0 && skippedList.length === 0 && failedList.length === 0 && (
            <div className="text-center mt-20">
              <Empty description="Chưa có thói quen nào" />
              <div className="mt-4 text-gray-400 text-sm">Bấm nút ở góc trên để thêm mới</div>
            </div>
          )}
        </div>
      ) : (
        // VIEW GRID
        <div className="pb-20 px-4">
          <HabitGrid habits={habits} startDate={selectedDate.toDate()} />
        </div>
      )}

      <HabitDetailDrawer />
    </div>
  );
};