'use client';

import { useState } from 'react';
import { Dropdown, MenuProps, Progress, Button, InputNumber, Tag, App, Modal } from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined,
  StepForwardOutlined, EditOutlined,
  HistoryOutlined, DeleteOutlined,
  PlusOutlined, MinusOutlined,
  ThunderboltFilled, SmileFilled
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { message } from 'antd';


interface HabitRowProps {
  habit: any;
}

export const HabitRow = ({ habit, onRefresh }: { habit: any, onRefresh: () => void }) => {
  // State lưu giá trị tạm thời ở Client để UI phản hồi ngay lập tức (Optimistic UI)
  const [currentVal, setCurrentVal] = useState(habit.logs?.[0]?.currentValue || 0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { message, modal } = App.useApp();

  const goal = habit.goalCount || 1;
  const isBeast = habit.mode === 'BEAST';
  const unit = habit.goalUnit || 'lần';

  // --- LOGIC MENU CHUỘT PHẢI (CONTEXT MENU) ---
  const menuItems: MenuProps['items'] = [
    {
      key: 'done',
      label: 'Đánh dấu hoàn thành',
      icon: <CheckCircleOutlined className="text-emerald-500" />,
      onClick: () => handleQuickAction('DONE'),
    },
    {
      key: 'input',
      label: 'Nhập tiến độ cụ thể...',
      icon: <EditOutlined />,
      children: [
        {
          key: 'input_number',
          label: (
            <div className="p-2" onClick={(e) => e.stopPropagation()}>
              <InputNumber
                min={0} max={goal}
                defaultValue={currentVal}
                onChange={(val) => setCurrentVal(val || 0)}
              />
              <Button type="link" size="small">Lưu</Button>
            </div>
          )
        }
      ]
    },
    { type: 'divider' },
    {
      key: 'skip',
      label: 'Đánh dấu bỏ qua',
      icon: <StepForwardOutlined />,
      disabled: isBeast, // BEAST MODE KHÔNG ĐƯỢC BỎ QUA (Phát triển thêm)
      danger: false,
    },
    {
      key: 'fail',
      label: 'Đánh dấu thất bại',
      icon: <CloseCircleOutlined />,
      danger: true, // Màu đỏ
    },
    { type: 'divider' },
    {
      key: 'delete',
      label: 'Xóa thói quen',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDelete(),
    }
  ];

  const handleQuickAction = (type: string) => {
    if (type === 'DONE') updateProgress(goal);
    if (type === 'FAIL') { /* Logic đánh dấu thất bại */ }
  };

  const handleDelete = () => {
    modal.confirm({
      title: 'Bạn chắc chắn muốn xóa?',
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Xóa luôn',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        // Gọi API xóa ở đây
        message.success('Đã xóa!');
        router.refresh();
      }
    });
  }

  // --- LOGIC HOVER CONTROL ---
  const handleIncrement = (val: number) => {
    const newVal = Math.min(Math.max(0, currentVal + val), goal);
    setCurrentVal(newVal);
    // Debounce call API here
  };
  const updateProgress = async (newVal: number) => {
    // 1. Chặn nếu đang loading hoặc giá trị không đổi
    if (loading || newVal < 0) return;

    // 2. Cập nhật UI ngay lập tức (để user không thấy lag)
    const oldVal = currentVal;
    setCurrentVal(newVal);
    setLoading(true);
    try {
      // 3. Gọi API
      const res = await fetch(`/api/habits/${habit.id}/log`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: newVal }),
      });

      if (!res.ok) throw new Error();

      // 4. Nếu thành công -> Refresh lại dashboard để cập nhật Streak
      onRefresh();
      message.success('Đã cập nhật tiến độ!');

    } catch (error) {
      // 5. Nếu lỗi -> Hoàn tác lại giá trị cũ
      setCurrentVal(oldVal);
      message.error('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };
  return (<div
    onDoubleClick={() => window.dispatchEvent(new CustomEvent('openHabitDetail', { detail: habit }))}>
    <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
      <div
        className={`
            group flex items-center justify-between p-4 mb-3 bg-white rounded-xl border-l-4 shadow-sm 
            hover:shadow-md transition-all duration-200 cursor-default
            ${isBeast ? 'border-l-force-main' : 'border-l-atomic-main'}
        `}
      >
        {/* CỘT 1: ICON & INFO */}
        <div className="flex items-center gap-4 flex-1">
          {/* Icon tròn */}
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-lg
            ${isBeast ? 'bg-red-100 text-force-main' : 'bg-emerald-100 text-atomic-main'}
          `}>
            {isBeast ? <ThunderboltFilled /> : <SmileFilled />}
          </div>

          <div>
            <h4 className="font-bold text-gray-800 m-0 text-base">{habit.title}</h4>
            <div className="text-xs text-gray-500 flex gap-2 mt-1">
              {/* Chỉ hiện Tag khi không hover, hover vào sẽ hiện control khác nếu muốn */}
              <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                {habit.frequency === 'daily' ? 'Hàng ngày' : 'Hàng tuần'}
              </span>
              {isBeast && <span className="text-red-500 font-bold">Phạt: {habit.stakeAmount?.toLocaleString()}đ</span>}
            </div>
          </div>
        </div>

        {/* CỘT 2: PROGRESS & HOVER ACTION (PHÁT TRIỂN THÊM) */}
        <div className="flex items-center gap-4 w-48 justify-end relative">

          {/* TRẠNG THÁI BÌNH THƯỜNG (Hiện Text) */}
          <div className="group-hover:opacity-0 transition-opacity duration-200 absolute right-0 flex flex-col items-end">
            <span className={`font-bold text-lg ${currentVal >= goal ? 'text-green-600' : 'text-gray-700'}`}>
              {currentVal}/{goal}
            </span>
            <span className="text-xs text-gray-400">{unit}</span>
          </div>

          {/* TRẠNG THÁI HOVER (Hiện Nút bấm) */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2 bg-white pl-4">
            {/* Nếu đơn vị là phút/km -> Hiện Input, Nếu là lần -> Hiện +/- */}
            {['phút', 'km', 'trang'].includes(unit) ? (
              <div className="flex items-center gap-1">
                <InputNumber
                  size="small"
                  min={0} max={goal}
                  value={currentVal}
                  onChange={(v) => setCurrentVal(v || 0)}
                  style={{ width: 60 }}
                />
                <span className="text-xs text-gray-500">/{goal}</span>
              </div>
            ) : (
              <>
                <Button
                  shape="circle" size="small" icon={<MinusOutlined />}
                  onClick={() => handleIncrement(-1)}
                  disabled={currentVal <= 0}
                />
                <span className="font-bold w-8 text-center">{currentVal}</span>
                <Button
                  shape="circle" size="small" icon={<PlusOutlined />}
                  type="primary" ghost
                  onClick={() => handleIncrement(1)}
                  disabled={currentVal >= goal}
                />
              </>
            )}
          </div>
        </div>

        {/* CỘT 3: CIRCULAR PROGRESS (Nhỏ gọn bên phải cùng) */}
        <div className="ml-4">
          <Progress
            type="circle"
            percent={Math.round((currentVal / goal) * 100)}
            width={40}
            strokeColor={isBeast ? '#ef4444' : '#10b981'}
            format={() => null} // Ẩn số % đi cho gọn
          />
        </div>

      </div>
    </Dropdown></div>
  );

};