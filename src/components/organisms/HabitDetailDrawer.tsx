'use client';

import { Drawer, Calendar, theme, Badge, Card, Statistic, Timeline, Tag, Avatar, Button, Input } from 'antd';
import { useEffect, useState } from 'react';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { 
  FireFilled, CheckCircleFilled, CloseCircleFilled, 
  ThunderboltFilled, SmileFilled, EditOutlined, SendOutlined 
} from '@ant-design/icons';

export const HabitDetailDrawer = () => {
  const [open, setOpen] = useState(false);
  const [habit, setHabit] = useState<any>(null);
  const { token } = theme.useToken();
  
  // Lắng nghe sự kiện double-click từ HabitRow
  useEffect(() => {
    const handleOpen = (e: any) => {
      setHabit(e.detail);
      setOpen(true);
    };
    window.addEventListener('openHabitDetail', handleOpen);
    return () => window.removeEventListener('openHabitDetail', handleOpen);
  }, []);

  if (!habit) return null;

  const isBeast = habit.mode === 'BEAST';
  const color = isBeast ? '#ef4444' : '#10b981';

  // --- COMPONENT CON: Lịch chấm công (Calendar Cell) ---
  const dateCellRender = (value: Dayjs) => {
    // Giả lập dữ liệu log (Thực tế phải lấy từ API habit.logs)
    // Logic: Nếu ngày đó có log -> hiển thị tick/cross
    const isToday = value.isSame(dayjs(), 'day');
    
    // Demo visual
    if (value.date() % 2 === 0) {
      return (
         <div className="flex justify-center items-center h-full">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${isBeast ? 'bg-red-500' : 'bg-emerald-500'}`}>
                ✔
            </div>
         </div>
      );
    }
    return null;
  };

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
            {isBeast ? <ThunderboltFilled style={{ color }} /> : <SmileFilled style={{ color }} />}
            <span className="text-lg font-bold">{habit.title}</span>
            <Tag color={isBeast ? 'red' : 'green'}>{habit.mode}</Tag>
        </div>
      }
      placement="right"
      width={900} // Rộng giống hình mẫu
      onClose={() => setOpen(false)}
      open={open}
      className={isBeast ? 'beast-drawer' : 'atomic-drawer'}
      headerStyle={{ borderBottom: `2px solid ${color}` }}
    >
      <div className="flex h-full gap-6">
        
        {/* --- CỘT TRÁI: THỐNG KÊ & LỊCH (Chiếm 70%) --- */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2">
            
            {/* 1. Top Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <Card size="small" className="bg-gray-50 text-center hover:shadow-md transition">
                    <Statistic 
                        title="Chuỗi hiện tại" 
                        value={habit.streak} 
                        prefix={<FireFilled style={{ color: '#f59e0b' }} />} 
                        suffix="ngày"
                        valueStyle={{ fontWeight: 'bold' }}
                    />
                </Card>
                <Card size="small" className="bg-gray-50 text-center hover:shadow-md transition">
                    <Statistic 
                        title="Hoàn thành" 
                        value={12} 
                        valueStyle={{ color: '#10b981', fontWeight: 'bold' }}
                    />
                </Card>
                <Card size="small" className="bg-gray-50 text-center hover:shadow-md transition">
                    <Statistic 
                        title={isBeast ? "Thất bại" : "Bỏ qua"} 
                        value={2} 
                        valueStyle={{ color: isBeast ? '#ef4444' : '#6b7280', fontWeight: 'bold' }}
                    />
                </Card>
                {/* [Phát triển thêm] Beast Mode hiện tiền phạt */}
                <Card size="small" className={`text-center hover:shadow-md transition ${isBeast ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
                    <Statistic 
                        title={isBeast ? "Tiền đã mất" : "Tổng cộng"} 
                        value={isBeast ? 100000 : 90} 
                        prefix={isBeast ? '-' : ''}
                        suffix={isBeast ? 'đ' : 'lần'}
                        valueStyle={{ color: isBeast ? '#ef4444' : '#374151', fontWeight: 'bold' }}
                    />
                </Card>
            </div>

            {/* 2. Calendar View (Phần to nhất trong hình) */}
            <div className="border rounded-xl p-4 shadow-sm bg-white">
                <div className="flex justify-between mb-4">
                    <h3 className="font-bold text-gray-700">Lịch sử hoạt động</h3>
                    <div className="flex gap-2 text-xs">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Xong</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300"></span> Nghỉ</span>
                    </div>
                </div>
                {/* Antd Calendar Full */}
                <Calendar 
                    fullscreen={false} 
                    dateCellRender={dateCellRender} 
                    className="custom-calendar"
                />
            </div>

            {/* 3. Biểu đồ tần suất (Mô phỏng cái biểu đồ cột bên dưới) */}
            <div className="border rounded-xl p-4 shadow-sm bg-white">
                 <h3 className="font-bold text-gray-700 mb-4">Tần suất trung bình</h3>
                 <div className="flex items-end gap-2 h-32 pl-4 border-l border-b border-gray-200">
                    {[3, 5, 2, 8, 6, 4, 7].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col justify-end group cursor-pointer">
                             <div 
                                style={{ height: `${h * 10}%`, backgroundColor: color }} 
                                className="w-full rounded-t-sm opacity-60 group-hover:opacity-100 transition-all"
                             ></div>
                             <span className="text-xs text-center mt-1 text-gray-500">{i + 1}</span>
                        </div>
                    ))}
                 </div>
            </div>
        </div>

        {/* --- CỘT PHẢI: SIDEBAR GHI CHÚ (Chiếm 30%) --- */}
        <div className="w-72 border-l pl-6 flex flex-col bg-gray-50 -my-6 py-6">
            <h3 className="font-bold text-gray-800 mb-4">Ghi chú & Nhật ký</h3>
            
            {/* Input thêm ghi chú */}
            <div className="mb-6 flex gap-2">
                <Input placeholder="Hôm nay thế nào?" className="bg-white" />
                <Button type="primary" icon={<SendOutlined />} style={{ backgroundColor: color }} />
            </div>

            {/* Timeline Lịch sử */}
            <Timeline
                items={[
                    {
                        color: 'green',
                        children: (
                            <div className="pb-2">
                                <div className="text-xs text-gray-400">Hôm nay, 09:00</div>
                                <div className="font-medium">Hoàn thành xuất sắc</div>
                                <div className="bg-white p-2 rounded text-gray-600 text-sm shadow-sm mt-1">
                                    "Cảm thấy rất khỏe sau khi chạy."
                                </div>
                            </div>
                        ),
                    },
                    {
                        color: 'red',
                        children: (
                            <div className="pb-2">
                                <div className="text-xs text-gray-400">Hôm qua</div>
                                <div className="font-medium">Thất bại</div>
                                <div className="bg-white p-2 rounded text-gray-600 text-sm shadow-sm mt-1 border-l-2 border-red-500">
                                    "Ngủ quên. Đã nộp phạt 50k."
                                </div>
                            </div>
                        ),
                    },
                     {
                        color: 'gray',
                        children: <p className="text-gray-400">Bắt đầu thói quen</p>,
                    },
                ]}
            />
        </div>

      </div>
    </Drawer>
  );
};