'use client';

import { useState, useMemo } from 'react';
import { HabitRow } from '@/components/molecules/HabitRow';
import { HabitGrid } from '@/components/organisms/HabitGrid';
import { HabitDetailDrawer } from '@/components/organisms/HabitDetailDrawer';
import { AddHabitButton } from '@/components/molecules/AddHabitButton';
import { useRouter } from 'next/navigation';
import { Segmented, DatePicker, Button, Collapse, Typography, Divider, Empty } from 'antd';
import { UnorderedListOutlined, AppstoreOutlined, LeftOutlined, RightOutlined, CheckCircleOutlined, CaretRightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useHabitNotification } from '@/hooks/useHabitNotification';
const { Panel } = Collapse;
const { Text } = Typography;

export const HabitBoard = ({ habits }: { habits: any[] }) => {
  useHabitNotification(habits);
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'List' | 'Grid'>('List');
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const handleRefresh = () => router.refresh();

  // --- LOGIC PHÂN LOẠI THÓI QUEN ---
  const { todoList, doneList } = useMemo(() => {
    const todo: any[] = [];
    const done: any[] = [];

    habits.forEach(habit => {
      // Tìm log của ngày đang chọn
      const log = habit.logs.find((l: any) => dayjs(l.completedAt).isSame(selectedDate, 'day'));

      // Điều kiện đã xong: Status là DONE, FAILED hoặc SKIPPED (và phải hoàn thành mục tiêu nếu là DONE)
      // Hoặc logic đơn giản: Cứ có status khác IN_PROGRESS là coi như xong phiên đó
      const isFinished = log && ['DONE', 'FAILED', 'SKIPPED'].includes(log.status);

      if (isFinished) {
        done.push(habit);
      } else {
        todo.push(habit);
      }
    });

    return { todoList: todo, doneList: done };
  }, [habits, selectedDate]);

  return (
    <>

      {/* HEADER CONTROLS (Giữ nguyên) */}
      <div className="relative min-h-[calc(100vh-80px)] overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 sticky top-2 z-10 backdrop-blur-md bg-white/90">
          <Segmented
            options={[
              { label: 'Danh sách', value: 'List', icon: <UnorderedListOutlined /> },
              { label: 'Lưới', value: 'Grid', icon: <AppstoreOutlined /> },
            ]}
            value={viewMode}
            onChange={(val: any) => setViewMode(val)}
          />

          <div className="flex items-center gap-2">
            <Button icon={<LeftOutlined />} onClick={() => setSelectedDate(d => d.subtract(1, 'day'))} />
            <DatePicker
              value={selectedDate}
              onChange={(date) => setSelectedDate(date || dayjs())}
              format="DD/MM/YYYY"
              allowClear={false}
              className="font-bold w-36 text-center border-none bg-gray-50"
              suffixIcon={false}
            />
            <Button
              icon={<RightOutlined />}
              onClick={() => setSelectedDate(d => d.add(1, 'day'))}
              disabled={selectedDate.isSame(dayjs(), 'day')}
            />
          </div>
        </div>

        {viewMode === 'List' ? (
          <div className="flex flex-col gap-4 max-w-4xl mx-auto pb-20">

            {/* 1. SECTION: TODO (VIỆC CẦN LÀM) */}
            <div className="space-y-3">
              {todoList.length > 0 ? (
                todoList.map((habit) => (
                  <HabitRow
                    key={habit.id}
                    habit={habit}
                    onRefresh={handleRefresh}
                    selectedDate={selectedDate.toDate()}
                  />
                ))
              ) : (
                // Nếu làm hết rồi -> Hiện màn hình chúc mừng (Dopamine)
                doneList.length > 0 && (
                  <div className="text-center py-10 bg-emerald-50 rounded-3xl border border-emerald-100">
                    <CheckCircleOutlined className="text-6xl text-emerald-500 mb-4 animate-bounce" />
                    <h3 className="text-xl font-bold text-emerald-700">Tuyệt vời! Bạn đã "dọn sạch" ngày hôm nay.</h3>
                    <p className="text-emerald-600">Hãy nghỉ ngơi hoặc học thêm kỹ năng mới.</p>
                  </div>
                )
              )}

              {/* Nút thêm mới luôn nằm dưới cùng của list TODO */}
              {todoList.length > 0 && (
                <div className="text-center pt-2">
                  {/* <AddHabitButton /> */}
                </div>
              )}
            </div>

            {/* 2. SECTION: DONE (ĐÃ XONG - GOM GỌN) */}
            {doneList.length > 0 && (
              <div className="mt-8">
                <Divider orientation="left" className="!text-gray-400 !font-normal !text-xs uppercase tracking-widest">
                  Đã hoàn thành ({doneList.length})
                </Divider>

                <Collapse
                  ghost
                  bordered={false}
                  defaultActiveKey={['1']}
                  expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} className="text-gray-400" />}
                >
                  <Panel header={<span className="text-gray-500 font-medium">Xem lại các mục đã xong / thất bại</span>} key="1">
                    <div className="space-y-2 opacity-70 hover:opacity-100 transition-opacity duration-300">
                      {doneList.map((habit) => (
                        <HabitRow
                          key={habit.id}
                          habit={habit}
                          onRefresh={handleRefresh}
                          selectedDate={selectedDate.toDate()}
                        />
                      ))}
                    </div>
                  </Panel>
                </Collapse>
              </div>
            )}

            {/* Nếu chưa có gì cả */}
            {todoList.length === 0 && doneList.length === 0 && (
              <div className="text-center mt-10">
                <Empty description="Chưa có thói quen nào" />
                <div className="mt-4"><AddHabitButton /></div>
              </div>
            )}
          </div>
        ) : (
          // VIEW GRID GIỮ NGUYÊN
          <div className="pb-20">
            <HabitGrid habits={habits} startDate={selectedDate.toDate()} />
            {/* <div className="text-center mt-6"><AddHabitButton /></div> */}
          </div>
        )}

        <HabitDetailDrawer />
        </div>
      </>
      );
};