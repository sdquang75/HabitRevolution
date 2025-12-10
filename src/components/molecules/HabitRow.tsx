'use client';
import { HabitContextWrapper } from '../organisms/HabitContextWrapper';
import { useState, useEffect } from 'react';
import { Dropdown, MenuProps, Progress, Button, InputNumber, App, Tag } from 'antd';
import {
  CheckCircleFilled, CloseCircleFilled, StepForwardFilled,
  EditOutlined, DeleteOutlined, MoreOutlined,
  PlusOutlined, MinusOutlined,
  ThunderboltFilled, SmileFilled
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

interface HabitRowProps {
  habit: any;
  onRefresh: () => void;
  selectedDate: Date; // <--- Biến selectedDate được khai báo ở đây
}

export const HabitRow = ({ habit, onRefresh, selectedDate }: HabitRowProps) => {
  // 1. Tìm log của ngày được chọn (Không phải lúc nào cũng là hôm nay)
  const getLogForDate = () => {
    return habit.logs.find((l: any) => 
      dayjs(l.completedAt).isSame(dayjs(selectedDate), 'day')
    );
  };

  const initialLog = getLogForDate();

  // 2. Khai báo State (Đây là chỗ cậu bị lỗi thiếu setCurrentVal)
  const [currentVal, setCurrentVal] = useState(initialLog?.currentValue || 0);
  const [status, setStatus] = useState(initialLog?.status || 'IN_PROGRESS'); 
  const [loading, setLoading] = useState(false);
  
  const { message, modal } = App.useApp();
  const router = useRouter();

  const goal = habit.goalCount || 1;
  const isBeast = habit.mode === 'BEAST';
  const unit = habit.goalUnit || 'lần';
const handleOptimisticUpdate = (val: number, newStatus: string) => {
      setCurrentVal(val);
      setStatus(newStatus);
  };
  // 3. EFFECT: Khi người dùng đổi ngày (selectedDate thay đổi) -> Reset lại UI theo ngày đó
  useEffect(() => {
    const log = getLogForDate();
    setCurrentVal(log?.currentValue || 0);
    setStatus(log?.status || 'IN_PROGRESS');
  }, [selectedDate, habit]);

  // --- CORE FUNCTION: GỌI API ---
  const submitLog = async (val: number, newStatus: string) => {
    if (loading) return;
    const oldVal = currentVal;
    const oldStatus = status;

    // Optimistic Update
    setCurrentVal(val);
    setStatus(newStatus);
    setLoading(true);

    try {
      const res = await fetch(`/api/habits/${habit.id}/log`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            progress: val, 
            status: newStatus,
            date: selectedDate // Gửi ngày đang chọn lên Server
        }),
      });

      if (!res.ok) throw new Error();
      
      onRefresh(); 
      if (newStatus === 'DONE' && oldStatus !== 'DONE') message.success('Đã cập nhật!');

    } catch (error) {
      setCurrentVal(oldVal);
      setStatus(oldStatus);
      message.error('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---
  const handleIncrement = (delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newVal = Math.min(Math.max(0, currentVal + delta), goal);
    const newStatus = newVal >= goal ? 'DONE' : 'IN_PROGRESS';
    submitLog(newVal, newStatus);
  };

  const handleQuickAction = (action: 'DONE' | 'SKIP' | 'FAIL') => {
    if (action === 'DONE') submitLog(goal, 'DONE');
    if (action === 'SKIP') submitLog(currentVal, 'SKIPPED');
    if (action === 'FAIL') submitLog(currentVal, 'FAILED');
  };

  const handleDelete = () => {
    modal.confirm({
        title: 'Xóa thói quen này?',
        content: 'Dữ liệu lịch sử cũng sẽ bị xóa.',
        okType: 'danger',
        onOk: async () => {
             try {
                 await fetch(`/api/habits/${habit.id}`, { method: 'DELETE' });
                 message.success('Đã xóa');
                 onRefresh();
             } catch (e) {
                 message.error('Lỗi khi xóa');
             }
        }
    });
  };

  // --- MENU ITEMS ---
  const menuItems: MenuProps['items'] = [
    {
      key: 'done',
      label: 'Hoàn thành ngay',
      icon: <CheckCircleFilled className="text-emerald-500" />,
      onClick: () => handleQuickAction('DONE'),
    },
    {
      key: 'input',
      label: 'Nhập số tay...',
      icon: <EditOutlined />,
      children: [{
          key: 'input_num',
          label: (
            <div onClick={e => e.stopPropagation()} className="p-1">
                 <InputNumber 
                    min={0} max={goal} value={currentVal} 
                    onChange={(v) => submitLog(v || 0, (v || 0) >= goal ? 'DONE' : 'IN_PROGRESS')}
                 />
            </div>
          )
      }]
    },
    { type: 'divider' },
    {
      key: 'skip',
      label: 'Bỏ qua ngày này',
      icon: <StepForwardFilled />,
      disabled: isBeast, 
      onClick: () => handleQuickAction('SKIP'),
    },
    {
      key: 'fail',
      label: 'Đánh dấu Thất bại',
      icon: <CloseCircleFilled className="text-red-500" />,
      danger: true,
      onClick: () => handleQuickAction('FAIL'),
    },
    { type: 'divider' },
    {
      key: 'delete',
      label: 'Xóa',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleDelete
    }
  ];

  // --- RENDER ---
  const isDone = status === 'DONE' || currentVal >= goal;
  const isSkipped = status === 'SKIPPED';
  const isFailed = status === 'FAILED';

  let rowBg = 'bg-white';
  if (isDone) rowBg = 'bg-emerald-50';
  if (isSkipped) rowBg = 'bg-gray-100 opacity-60';
  if (isFailed) rowBg = 'bg-red-50';

  return (
    <HabitContextWrapper habit={habit} date={selectedDate} onOptimisticUpdate={handleOptimisticUpdate}>
      <div 
        onDoubleClick={() => window.dispatchEvent(new CustomEvent('openHabitDetail', { detail: habit }))}
        className={`
            group relative flex items-center justify-between p-3 sm:p-4 mb-3 rounded-xl border border-gray-100 shadow-sm 
            transition-all duration-200 select-none cursor-default
            ${rowBg}
            ${isBeast ? 'border-l-4 border-l-force-main' : 'border-l-4 border-l-atomic-main'}
            hover:shadow-md
        `}
      >
        <div className="flex items-center gap-3 sm:gap-4 flex-1 overflow-hidden">
             <div className={`
                flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors
                ${isDone ? 'bg-green-500 text-white' : (isBeast ? 'bg-red-100 text-force-main' : 'bg-emerald-100 text-atomic-main')}
             `}>
                {isDone ? <CheckCircleFilled /> : (isBeast ? <ThunderboltFilled /> : <SmileFilled />)}
             </div>

             <div className="min-w-0">
                <h4 className={`font-bold m-0 text-sm sm:text-base truncate ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {habit.title}
                </h4>
                <div className="flex items-center gap-2 text-xs mt-1">
                    <Tag className="m-0 text-[10px] sm:text-xs border-0 bg-gray-200/50">
                        {currentVal}/{goal} {unit}
                    </Tag>
                    {isBeast && !isDone && <span className="text-force-main font-bold text-[10px] sm:text-xs">-{habit.stakeAmount}đ</span>}
                </div>
             </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity duration-200 items-center gap-2 bg-white/80 backdrop-blur rounded-lg px-2 py-1 shadow-sm absolute right-16">
                 <Button 
                    type="text" shape="circle" size="small" icon={<MinusOutlined />} 
                    onClick={(e) => handleIncrement(-1, e)}
                    disabled={isDone || currentVal <= 0}
                 />
                 <span className="font-bold w-6 text-center">{currentVal}</span>
                 <Button 
                    type="primary" shape="circle" size="small" icon={<PlusOutlined />} 
                    onClick={(e) => handleIncrement(1, e)}
                    disabled={isDone}
                    className={isBeast ? 'bg-force-main' : 'bg-atomic-main'}
                 />
            </div>

            <div className="md:hidden flex items-center gap-1">
                 {!isDone && (
                    <Button 
                        size="small" shape="circle" icon={<PlusOutlined />} 
                        type="primary" ghost
                        onClick={(e) => handleIncrement(1, e)}
                    />
                 )}
                 <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                    <Button type="text" size="small" icon={<MoreOutlined />} onClick={e => e.stopPropagation()} />
                 </Dropdown>
            </div>

            <div className="relative">
                <Progress 
                    type="circle" 
                    percent={Math.round((currentVal / goal) * 100)} 
                    width={36} 
                    strokeColor={isBeast ? '#ef4444' : '#10b981'}
                    showInfo={false}
                    className="opacity-80"
                />
            </div>
        </div>
      </div>
    </HabitContextWrapper>
  );
};