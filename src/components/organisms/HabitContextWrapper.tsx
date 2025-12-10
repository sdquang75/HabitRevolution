'use client';

import { useState } from 'react';
import { Dropdown, MenuProps, Modal, Input, InputNumber, Button, App, message } from 'antd';
import { 
  CheckCircleOutlined, CloseCircleOutlined, StopOutlined, 
  EditOutlined, DeleteOutlined, FieldTimeOutlined, 
  FileTextOutlined, UndoOutlined, PlayCircleOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

interface HabitContextWrapperProps {
  children: React.ReactNode;
  habit: any;
  date: Date;
  onOptimisticUpdate?: (val: number, status: string) => void;
}

export const HabitContextWrapper = ({ children, habit, date, onOptimisticUpdate }: HabitContextWrapperProps) => {
  const router = useRouter();
  const { message: msg } = App.useApp();
  
  // State cho Modal Ghi chú
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');

  // State cho Modal Hẹn giờ (Timer)
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(habit.goalUnit === 'phút' ? habit.goalCount * 60 : 120); // Mặc định 2 phút hoặc theo goal
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const isBeast = habit.mode === 'BEAST';
  const formattedDate = dayjs(date).format('YYYY-MM-DD');

  // --- API CALLS ---
  const submitLog = async (val: number, status: string, note?: string) => {
    if (onOptimisticUpdate) {
        onOptimisticUpdate(val, status);
    }
    try {
      await fetch(`/api/habits/${habit.id}/log`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            progress: val, 
            status: status, 
            date: date,
            note: note // Gửi thêm ghi chú
        }),
      });
      router.refresh();
      if (status === 'DONE') msg.success('Hoàn thành!');
    } catch (e) { msg.error('Lỗi'); }
  };

  const handleReset = async () => {
    if (onOptimisticUpdate) onOptimisticUpdate(0, 'IN_PROGRESS');
    try {
      await fetch(`/api/habits/${habit.id}/log?date=${formattedDate}`, {
        method: 'DELETE',
      });
      router.refresh();
      msg.info('Đã xóa lần nhập');
    } catch (e) { msg.error('Lỗi'); }
  };

  // --- TIMER LOGIC (Đơn giản) ---
  const startTimer = () => {
    setIsTimerRunning(true);
    // Logic đếm ngược đơn giản (Trong thực tế nên dùng Web Worker)
    const interval = setInterval(() => {
        setTimeLeft((prev) => {
            if (prev <= 1) {
                clearInterval(interval);
                setIsTimerRunning(false);
                // Tự động Done khi hết giờ
                submitLog(habit.goalCount, 'DONE', 'Hoàn thành bằng Hẹn giờ'); 
                return 0;
            }
            return prev - 1;
        });
    }, 1000);
  };

  // --- MENU ITEMS ---
  const menuItems: MenuProps['items'] = [
    {
      key: 'done',
      label: 'Xong',
      icon: <CheckCircleOutlined className="text-emerald-500" />,
      extra: 'Alt+D', // Gợi ý phím tắt
      onClick: () => submitLog(habit.goalCount, 'DONE'),
    },
    {
      key: 'skip',
      label: 'Đánh dấu là bỏ qua',
      icon: <StopOutlined />,
      extra: 'Alt+S',
      disabled: isBeast, // Beast Mode không được skip
      onClick: () => submitLog(0, 'SKIPPED'),
    },
    {
      key: 'fail',
      label: 'Đánh dấu là thất bại',
      icon: <CloseCircleOutlined className="text-red-500" />,
      extra: 'Alt+F',
      danger: true,
      onClick: () => submitLog(0, 'FAILED'),
    },
    {
      key: 'reset',
      label: 'Xóa các lần nhập',
      icon: <UndoOutlined />,
      onClick: handleReset,
    },
    { type: 'divider' },
    {
      key: 'input',
      label: 'Nhập tiến độ',
      icon: <EditOutlined />,
      children: [{
        key: 'input_box',
        label: (
            <div onClick={e => e.stopPropagation()} className="p-1">
                <InputNumber 
                    min={0} defaultValue={0} 
                    onChange={(v) => submitLog(v || 0, (v || 0) >= habit.goalCount ? 'DONE' : 'IN_PROGRESS')}
                    addonAfter={`/${habit.goalCount} ${habit.goalUnit}`}
                />
            </div>
        )
      }]
    },
    {
      key: 'timer',
      label: 'Bắt đầu hẹn giờ',
      icon: <FieldTimeOutlined />,
      onClick: () => setIsTimerOpen(true),
    },
    {
      key: 'note',
      label: 'Thêm/Xem ghi chú',
      icon: <FileTextOutlined />,
      onClick: () => setIsNoteOpen(true),
    },
    { type: 'divider' },
    {
      key: 'edit',
      label: 'Chỉnh sửa thói quen',
      icon: <EditOutlined />,
      onClick: () => router.push(`/habits/${habit.id}/edit`), // Tính năng sau này
    }
  ];

  return (
    <>
      <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
        {children}
      </Dropdown>

      {/* MODAL GHI CHÚ */}
      <Modal 
        title="Ghi chú cho ngày này" 
        open={isNoteOpen} 
        onOk={() => {
            submitLog(0, 'IN_PROGRESS', noteContent); // Chỉ lưu note, giữ nguyên trạng thái
            setIsNoteOpen(false);
        }}
        onCancel={() => setIsNoteOpen(false)}
      >
        <Input.TextArea 
            rows={4} 
            placeholder="Tại sao bạn thất bại? Hoặc bạn cảm thấy thế nào?" 
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
        />
      </Modal>

      {/* MODAL HẸN GIỜ (TIMER) */}
      <Modal
        title="Hẹn giờ tập trung (Deep Work)"
        open={isTimerOpen}
        footer={null}
        onCancel={() => setIsTimerOpen(false)}
        centered
      >
        <div className="flex flex-col items-center justify-center py-6">
            <div className={`text-6xl font-mono font-bold mb-6 ${isBeast ? 'text-force-main' : 'text-atomic-main'}`}>
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </div>
            {!isTimerRunning ? (
                <Button 
                    type="primary" shape="round" size="large" icon={<PlayCircleOutlined />} 
                    onClick={startTimer}
                    className={isBeast ? 'bg-force-main' : 'bg-atomic-main'}
                >
                    Bắt đầu ngay
                </Button>
            ) : (
                <div className="text-gray-500 animate-pulse">Đừng bỏ cuộc...</div>
            )}
        </div>
      </Modal>
    </>
  );
};