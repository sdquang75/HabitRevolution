'use client';
import { isHabitActive } from '@/lib/habit-utils'; // Import hàm check
import { useState, useEffect, useMemo } from 'react';
import { Dropdown, MenuProps, Button, App, Tooltip, Progress, Tag } from 'antd';
import {
  CheckCircleFilled, CloseCircleFilled, StepForwardFilled,
  EditOutlined, DeleteOutlined,
  PlusOutlined, MinusOutlined,
  ThunderboltFilled, SmileFilled, FireFilled,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { HabitContextWrapper } from '../organisms/HabitContextWrapper';
import { getLast7DaysStatus } from '@/lib/habit-utils';

interface HabitRowProps {
  habit: any;
  onRefresh: () => void;
  selectedDate: Date;
}

export const HabitRow = ({ habit, onRefresh, selectedDate }: HabitRowProps) => {
  const router = useRouter();
  const { message, modal } = App.useApp();
  const { active, reason } = isHabitActive(habit, selectedDate);
  const getLogForDate = () => habit.logs.find((l: any) => dayjs(l.completedAt).isSame(dayjs(selectedDate), 'day'));
  const initialLog = getLogForDate();

  const [currentVal, setCurrentVal] = useState(initialLog?.currentValue || 0);
  const [status, setStatus] = useState(initialLog?.status || 'IN_PROGRESS');
  const [loading, setLoading] = useState(false);


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

  const submitLog = async (val: number, newStatus: string) => { /* Logic cũ giữ nguyên, để trống cho gọn bài */ };

  // --- RENDER VISUALS ---
  const isDone = status === 'DONE' || currentVal >= goal;
  const isFailed = status === 'FAILED';
  const isSkipped = status === 'SKIPPED';

  // Màu sắc động
  let cardClass = "bg-white border-gray-100";
  let iconColor = isBeast ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500";

  if (isDone) {
    cardClass = "bg-emerald-50/40 border-emerald-100 opacity-90"; // Mờ đi chút
    iconColor = "bg-emerald-500 text-white";
  }
  if (isFailed) {
    cardClass = "bg-red-50/40 border-red-100 opacity-90";
    iconColor = "bg-red-500 text-white";
  }
  if (isSkipped) {
    cardClass = "bg-gray-50 border-gray-200 opacity-60 grayscale";
    iconColor = "bg-gray-300 text-white";
  }

  // Tính % tiến độ
  const percent = Math.min(100, Math.round((currentVal / goal) * 100));
if (!active) {
      return (
        <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed mb-3 select-none">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                        {reason === 'not_started' ? <ClockCircleOutlined /> : <CheckCircleFilled />}
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-500 m-0">{habit.title}</h4>
                        <span className="text-xs text-gray-400">
                            {reason === 'not_started' ? `Bắt đầu từ ${dayjs(habit.startDate).format('DD/MM/YYYY')}` : 'Đã kết thúc'}
                        </span>
                    </div>
                </div>
                <Tag color="default">{reason === 'not_started' ? 'CHƯA ĐẾN HẠN' : 'ĐÃ KẾT THÚC'}</Tag>
            </div>
        </div>
      );
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
        <div className="flex items-center gap-4">

          {/* 1. ICON & STREAK BADGE */}
          <div className="relative">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-colors ${iconColor}`}>
              {isDone ? <CheckCircleFilled /> : (isFailed ? <CloseCircleFilled /> : (isBeast ? <ThunderboltFilled /> : <SmileFilled />))}
            </div>
            {/* Badge Streak nằm đè lên góc */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${habit.streak > 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
              <FireFilled /> {habit.streak} ngày
            </div>
          </div>

          {/* 2. INFO & PROGRESS BAR */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <h4 className={`font-bold text-base truncate ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                {habit.title}
              </h4>
              {/* Mini History (Chỉ hiện trên Desktop) */}
              <div className="hidden md:flex gap-0.5">
                {last7Days.map((day, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${day.status === 'DONE' ? (isBeast ? 'bg-red-400' : 'bg-emerald-400') :
                    day.status === 'FAILED' ? 'bg-red-200' : 'bg-gray-200'
                    }`} />
                ))}
              </div>
            </div>

            {/* Thanh tiến độ + Controls */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${isBeast ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="text-xs font-bold text-gray-500 w-16 text-right">
                {currentVal}/{goal} {unit}
              </div>
            </div>
          </div>

          {/* 3. QUICK ACTIONS (Nút +/-) - Chỉ hiện khi chưa xong */}
          {!isDone && !isFailed && !isSkipped && (
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="text" size="small" icon={<MinusOutlined />}
                onClick={(e) => { e.stopPropagation(); /* gọi handleIncrement(-1) */ }}
                disabled={currentVal <= 0}
              />
              <div className="w-[1px] h-4 bg-gray-200 mx-1"></div>
              <Button
                type="text" size="small" icon={<PlusOutlined />}
                onClick={(e) => { e.stopPropagation(); /* gọi handleIncrement(1) */ }}
                className={isBeast ? "text-red-500" : "text-emerald-500"}
              />
            </div>
          )}
        </div>
      </div>
    </HabitContextWrapper>
  );
};