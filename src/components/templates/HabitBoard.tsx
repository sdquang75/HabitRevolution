'use client';

import { useState, useMemo } from 'react';
import { HabitRow } from '@/components/molecules/HabitRow';
import { HabitGrid } from '@/components/organisms/HabitGrid';
import { HabitDetailDrawer } from '@/components/organisms/HabitDetailDrawer';
import { AddHabitButton } from '@/components/molecules/AddHabitButton';
import { useRouter } from 'next/navigation';
import { Segmented, DatePicker, Button, Collapse, Divider, Empty } from 'antd';
import { UnorderedListOutlined, AppstoreOutlined, LeftOutlined, RightOutlined, CheckCircleOutlined, CaretRightOutlined, CloseCircleOutlined, StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHabitNotification } from '@/hooks/useHabitNotification';

const { Panel } = Collapse;

export const HabitBoard = ({ habits }: { habits: any[] }) => {
  useHabitNotification(habits);
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'List' | 'Grid'>('List');
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const handleRefresh = () => router.refresh();

  // --- LOGIC PHÂN LOẠI ---
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

  const renderHabitList = (list: any[]) => (
    <div className="space-y-2 opacity-80 hover:opacity-100 transition-opacity duration-300">
      {list.map((habit: any) => (
        <HabitRow key={habit.id} habit={habit} onRefresh={handleRefresh} selectedDate={selectedDate.toDate()} />
      ))}
    </div>
  );

  return (
    // 1. CONTAINER CHÍNH: CỐ ĐỊNH CHIỀU CAO (QUAN TRỌNG NHẤT)
    // h-[calc(100vh-64px)]: Chiều cao màn hình trừ đi Header chính của App (thường là 64px)
    // overflow-hidden: Cắt bỏ mọi thứ tràn ra ngoài -> Không bao giờ hiện thanh cuộn trình duyệt
    <div className="relative h-[calc(100vh-64px)] flex flex-col bg-gray-50/30 overflow-hidden">
      
      {/* 2. HEADER CONTROLS: CỐ ĐỊNH (flex-none) */}
      <div className="flex-none px-4 py-3 bg-white/80 backdrop-blur-md border-b border-gray-200 z-20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 max-w-4xl mx-auto w-full">
            <Segmented
                options={[
                { label: 'Danh sách', value: 'List', icon: <UnorderedListOutlined /> },
                { label: 'Lưới', value: 'Grid', icon: <AppstoreOutlined /> },
                ]}
                value={viewMode}
                onChange={(val: any) => setViewMode(val)}
            />

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                    <Button type="text" size="small" icon={<LeftOutlined />} onClick={() => setSelectedDate(d => d.subtract(1, 'day'))} />
                    <DatePicker
                        value={selectedDate}
                        onChange={(date) => setSelectedDate(date || dayjs())}
                        format="DD/MM/YYYY"
                        allowClear={false}
                        className="font-bold w-28 text-center border-none bg-transparent shadow-none"
                        suffixIcon={false}
                    />
                    <Button type="text" size="small" icon={<RightOutlined />} onClick={() => setSelectedDate(d => d.add(1, 'day'))} disabled={selectedDate.isSame(dayjs(), 'day')} />
                </div>
                <AddHabitButton />
            </div>
        </div>
      </div>

      {/* 3. SCROLLABLE AREA: TỰ CUỘN (flex-1) */}
      {/* flex-1: Chiếm toàn bộ không gian còn lại */}
      {/* overflow-y-auto: Nếu nội dung dài quá thì hiện thanh cuộn RIÊNG cho vùng này */}
      <div className="flex-1 overflow-y-auto scroll-smooth p-4 custom-scrollbar">
        <div className="max-w-4xl mx-auto pb-20"> {/* pb-20 để nội dung cuối không bị che */}
            
            {viewMode === 'List' ? (
                <div className="flex flex-col gap-4">
                    {/* TODO LIST */}
                    <div className="space-y-3">
                        {todoList.length > 0 ? (
                            todoList.map((habit: any) => (
                                <HabitRow key={habit.id} habit={habit} onRefresh={handleRefresh} selectedDate={selectedDate.toDate()} />
                            ))
                        ) : (
                            successList.length > 0 && (
                                <div className="text-center py-8 bg-emerald-50 rounded-2xl border border-emerald-100 mb-4">
                                    <CheckCircleOutlined className="text-5xl text-emerald-500 mb-2 animate-bounce" />
                                    <h3 className="text-lg font-bold text-emerald-700">All Clear!</h3>
                                    <p className="text-emerald-600 text-sm">Bạn đã hoàn thành xuất sắc mục tiêu hôm nay.</p>
                                </div>
                            )
                        )}
                    </div>

                    {/* DONE LISTS */}
                    {(successList.length > 0 || skippedList.length > 0 || failedList.length > 0) && (
                        <div className="mt-2">
                            <Divider orientation="left" className="!text-gray-400 !font-normal !text-xs uppercase tracking-widest !my-4">
                                Lịch sử hoạt động
                            </Divider>

                            <Collapse ghost bordered={false} expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} className="text-gray-400" />}>
                                {successList.length > 0 && (
                                    <Panel header={<div className="flex items-center gap-2 text-emerald-600 font-medium"><CheckCircleOutlined /> Thành công ({successList.length})</div>} key="success">
                                        {renderHabitList(successList)}
                                    </Panel>
                                )}
                                {skippedList.length > 0 && (
                                    <Panel header={<div className="flex items-center gap-2 text-gray-500 font-medium"><StopOutlined /> Bỏ qua ({skippedList.length})</div>} key="skipped">
                                        {renderHabitList(skippedList)}
                                    </Panel>
                                )}
                                {failedList.length > 0 && (
                                    <Panel header={<div className="flex items-center gap-2 text-red-500 font-medium"><CloseCircleOutlined /> Thất bại ({failedList.length})</div>} key="failed">
                                        {renderHabitList(failedList)}
                                    </Panel>
                                )}
                            </Collapse>
                        </div>
                    )}

                    {/* EMPTY STATE */}
                    {todoList.length === 0 && successList.length === 0 && skippedList.length === 0 && failedList.length === 0 && (
                        <div className="text-center mt-20">
                            <Empty description="Chưa có thói quen nào" />
                            <div className="mt-4 text-gray-400 text-sm">Bấm nút (+) ở góc trên để bắt đầu</div>
                        </div>
                    )}
                </div>
            ) : (
                // GRID VIEW
                <div className="overflow-x-auto pb-4"> {/* Grid cần scroll ngang nếu quá rộng */}
                    <HabitGrid habits={habits} startDate={selectedDate.toDate()} />
                </div>
            )}
        </div>
      </div>

      {/* 4. DRAWER (Vẫn nằm trong relative container để phủ đúng vùng) */}
      <HabitDetailDrawer />
    </div>
  );
};