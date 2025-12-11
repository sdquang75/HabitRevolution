'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button, App, Tooltip, Dropdown, MenuProps, Tag } from 'antd'; // Thêm các import thiếu nếu cần
import {
  CheckCircleFilled, CloseCircleFilled,
  PlusOutlined, MinusOutlined, MoreOutlined,
  ThunderboltFilled, SmileFilled, FireFilled
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { HabitContextWrapper } from '../organisms/HabitContextWrapper';
import { calculateStreak, getLast7DaysStatus, isHabitActive } from '@/lib/habit-utils';

interface HabitRowProps {
  habit: any;
  onRefresh: () => void;
  selectedDate: Date;
}

export const HabitRow = ({ habit, onRefresh, selectedDate }: HabitRowProps) => {
  // 1. Kiểm tra trạng thái hiệu lực
  const { active, reason } = isHabitActive(habit, selectedDate);

  const getLogForDate = () => habit.logs.find((l: any) => dayjs(l.completedAt).isSame(dayjs(selectedDate), 'day'));
  const initialLog = getLogForDate();

  const [currentVal, setCurrentVal] = useState(initialLog?.currentValue || 0);
  const [status, setStatus] = useState(initialLog?.status || 'IN_PROGRESS'); 
  const [loading, setLoading] = useState(false);
  
  const streak = useMemo(() => calculateStreak(habit.logs), [habit.logs]);
  const last7Days = useMemo(() => getLast7DaysStatus(habit.logs), [habit.logs]);

  const goal = habit.goalCount || 1;
  const isBeast = habit.mode === 'BEAST';
  const unit = habit.goalUnit || 'lần';

  useEffect(() => {
    const log = getLogForDate();
    setCurrentVal(log?.currentValue || 0);
    setStatus(log?.status || 'IN_PROGRESS');
  }, [selectedDate, habit]);

  const handleOptimisticUpdate = (val: number, newStatus: string) => {
      setCurrentVal(val);
      setStatus(newStatus);
  };

  // Hàm gọi API
  const submitLog = async (val: number, newStatus: string) => {
    if (loading) return;
    const oldVal = currentVal;
    const oldStatus = status;

    handleOptimisticUpdate(val, newStatus);
    setLoading(true);

    try {
      const res = await fetch(`/api/habits/${habit.id}/log`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            progress: val, 
            status: newStatus, 
            date: selectedDate 
        }),
      });
      if (!res.ok) throw new Error();
      onRefresh(); 
    } catch (error) {
      handleOptimisticUpdate(oldVal, oldStatus); // Revert nếu lỗi
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý tăng giảm
  const handleIncrement = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Chặn click thường
    const newVal = Math.min(Math.max(0, currentVal + delta), goal);
    const newStatus = newVal >= goal ? 'DONE' : 'IN_PROGRESS';
    submitLog(newVal, newStatus);
  };

  // --- RENDER VISUALS ---
  const isDone = status === 'DONE' || currentVal >= goal;
  const isFailed = status === 'FAILED';
  const isSkipped = status === 'SKIPPED';
  
  let cardClass = "bg-white border-gray-100";
  let iconColor = isBeast ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500";
  
  if (isDone) {
      cardClass = "bg-emerald-50/40 border-emerald-100 opacity-90";
      iconColor = "bg-emerald-500 text-white";
  } else if (isFailed) {
      cardClass = "bg-red-50/40 border-red-100 opacity-90";
      iconColor = "bg-red-500 text-white";
  } else if (isSkipped) {
      cardClass = "bg-gray-50 border-gray-200 opacity-60 grayscale";
      iconColor = "bg-gray-300 text-white";
  }

  const percent = Math.min(100, Math.round((currentVal / goal) * 100));

  // Render trạng thái khóa (Không active)
  if (!active) {
      // ... (Giữ nguyên code render trạng thái khóa như bài trước)
      return <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed mb-3">...</div>;
  }

  return (
    <HabitContextWrapper 
        habit={habit} 
        date={selectedDate} 
        onOptimisticUpdate={handleOptimisticUpdate}
    >
      <div 
        onDoubleClick={() => window.dispatchEvent(new CustomEvent('openHabitDetail', { detail: habit }))}
        className={`
            group relative p-4 rounded-2xl border shadow-[0_2px_8px_rgba(0,0,0,0.04)]
            transition-all duration-300 select-none cursor-default
            ${cardClass}
            hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:-translate-y-[1px]
        `}
      >
        <div className="grid grid-cols-12 gap-4 items-center">
            
            {/* CỘT 1-5: INFO */}
            <div className="col-span-12 md:col-span-5 flex items-center gap-3 overflow-hidden">
                <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-colors ${iconColor}`}>
                    {isDone ? <CheckCircleFilled /> : (isFailed ? <CloseCircleFilled /> : (isBeast ? <ThunderboltFilled /> : <SmileFilled />))}
                </div>
                <div className="min-w-0 flex-1">
                    <h4 className={`font-bold m-0 text-base truncate ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>{habit.title}</h4>
                    {isBeast && !isDone && (
                        <div className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-0.5"><FireFilled /> Phạt: {habit.stakeAmount?.toLocaleString()}đ</div>
                    )}
                </div>
            </div>

            {/* CỘT 6-8: CONTROL & PROGRESS */}
            <div className="col-span-6 md:col-span-3 flex items-center justify-start md:justify-center gap-2">
                 {!isDone && !isFailed && !isSkipped ? (
                    // --- KHU VỰC NÚT BẤM ---
                    <div 
                        className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100 group-hover:bg-white group-hover:shadow-sm transition-all"
                        // QUAN TRỌNG: Chặn Double Click tại đây để không mở Drawer
                        onDoubleClick={(e) => e.stopPropagation()} 
                    >
                        <Button 
                            type="text" size="small" icon={<MinusOutlined />} 
                            // GỌI HÀM THẬT
                            onClick={(e) => handleIncrement(-1, e)} 
                            disabled={currentVal <= 0}
                            className="text-gray-400 hover:text-gray-700"
                        />
                        <div className="px-2 text-center min-w-[60px]">
                            <span className="font-bold text-gray-700">{currentVal}</span>
                            <span className="text-xs text-gray-400">/{goal}</span>
                        </div>
                        <Button 
                            type="text" size="small" icon={<PlusOutlined />} 
                            // GỌI HÀM THẬT
                            onClick={(e) => handleIncrement(1, e)}
                            className={isBeast ? "text-red-500" : "text-emerald-500"}
                        />
                    </div>
                 ) : (
                    // Nếu xong rồi thì hiện text đơn giản
                    <div className="text-sm font-bold text-emerald-600">Đã xong</div>
                 )}
            </div>

            {/* CỘT 9-10: STREAK (Desktop Only) */}
            <div className="col-span-3 hidden md:flex items-center justify-center gap-1">
                 {/* ... code streak cũ ... */}
                 {streak > 0 && <Tag color="orange" icon={<FireFilled />}>{streak} ngày</Tag>}
            </div>

            {/* CỘT 11-12: MINI HISTORY (Desktop Only) */}
            <div className="col-span-2 hidden md:flex items-center justify-end gap-1">
                 {last7Days.map((day, i) => (
                    <Tooltip key={i} title={day.date.format('DD/MM')}>
                        <div className={`w-1.5 h-1.5 rounded-full ${day.status === 'DONE' ? (isBeast ? 'bg-red-400' : 'bg-emerald-400') : 'bg-gray-200'}`} />
                    </Tooltip>
                 ))}
            </div>

            {/* Nút 3 chấm Mobile */}
            <div className="col-span-6 md:hidden flex justify-end">
                <Button type="text" icon={<MoreOutlined />} />
            </div>

        </div>
        
        {/* Progress Bar chạy dưới đáy Card */}
        <div className="absolute bottom-0 left-0 h-1 bg-gray-100 w-full rounded-b-2xl overflow-hidden">
             <div className={`h-full transition-all duration-500 ${isBeast ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }} />
        </div>
      </div>
    </HabitContextWrapper>
  );
};