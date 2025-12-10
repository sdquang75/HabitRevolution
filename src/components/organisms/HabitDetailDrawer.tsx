'use client';

import { Drawer, Card, Statistic, Tag, Spin, Button, Input, Checkbox, Row, Col, Progress, Tooltip, Avatar, Divider, message } from 'antd';
import { useEffect, useState, useMemo } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { 
  FireFilled, CheckCircleFilled, CloseCircleFilled, 
  ThunderboltFilled, SmileFilled, ArrowLeftOutlined,
  CalendarOutlined, EditOutlined, ClockCircleOutlined,
  CheckCircleTwoTone, StopOutlined, UnorderedListOutlined
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { HabitFormModal } from './HabitFormModal'; // Reuse Modal chỉnh sửa

dayjs.locale('vi');

export const HabitDetailDrawer = () => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLogDate, setSelectedLogDate] = useState<string>(dayjs().format('YYYY-MM-DD')); // Ngày đang chọn để xem chi tiết
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Lắng nghe sự kiện mở
  useEffect(() => {
    const handleOpen = (e: any) => {
      setOpen(true);
      fetchDetail(e.detail.id);
    };
    window.addEventListener('openHabitDetail', handleOpen);
    return () => window.removeEventListener('openHabitDetail', handleOpen);
  }, []);

  const fetchDetail = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/habits/${id}`);
      if (res.ok) setData(await res.json());
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  // --- LOGIC TÍNH TOÁN ---
  const logMap = useMemo(() => {
    if (!data?.logs) return {};
    const map: Record<string, any> = {};
    data.logs.forEach((log: any) => {
      map[dayjs(log.completedAt).format('YYYY-MM-DD')] = log;
    });
    return map;
  }, [data]);

  const stats = useMemo(() => {
    if (!data?.logs) return { done: 0, fail: 0, skip: 0, money: 0 };
    const done = data.logs.filter((l: any) => l.status === 'DONE').length;
    const fail = data.logs.filter((l: any) => l.status === 'FAILED').length;
    const skip = data.logs.filter((l: any) => l.status === 'SKIPPED').length;
    const money = fail * (data.stakeAmount || 0);
    return { done, fail, skip, money };
  }, [data]);

  // Chart Data (30 ngày gần nhất)
  const chartData = useMemo(() => {
    const arr = [];
    for (let i = 29; i >= 0; i--) {
        const d = dayjs().subtract(i, 'day');
        const key = d.format('YYYY-MM-DD');
        const log = logMap[key];
        arr.push({
            name: d.format('DD/MM'),
            value: log?.currentValue || 0,
            status: log?.status || 'NONE',
            fullDate: key
        });
    }
    return arr;
  }, [logMap]);

  // --- ACTION HANDLERS ---
  const handleChecklistToggle = async (index: number) => {
    // 1. Chỉ cho phép sửa checklist của HÔM NAY (hoặc ngày đang chọn nếu muốn mở rộng logic)
    // Tạm thời logic: User đang xem ngày nào thì sửa ngày đó (nếu ngày đó đã có log)
    const targetLog = logMap[selectedLogDate];
    
    // Nếu chưa có log ngày này -> Tạo mới (Logic phức tạp hơn, tạm thời chỉ cho sửa nếu đã có log hoặc là hôm nay)
    // Để đơn giản hóa: Chỉ cho sửa Checklist của Hôm nay
    if (selectedLogDate !== dayjs().format('YYYY-MM-DD')) {
        message.warning("Chỉ có thể chỉnh sửa quy trình của ngày hôm nay!");
        return;
    }

    let currentChecked: number[] = targetLog?.checklistState ? JSON.parse(targetLog.checklistState) : [];
    if (currentChecked.includes(index)) {
        currentChecked = currentChecked.filter(i => i !== index);
    } else {
        currentChecked.push(index);
    }

    try {
        await fetch(`/api/habits/${data.id}/log`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                progress: targetLog?.currentValue || 0, 
                status: targetLog?.status || 'IN_PROGRESS',
                date: new Date(),
                checklistState: JSON.stringify(currentChecked) 
            }),
        });
        fetchDetail(data.id); // Refresh
    } catch (e) { message.error('Lỗi lưu checklist'); }
  };

  const handleUpdateNote = async (val: string) => {
      // Sửa note của ngày đang chọn
      const targetLog = logMap[selectedLogDate];
      if (!targetLog) return; // Chưa có log thì ko sửa note được (phải checkin trước)

      try {
        await fetch(`/api/habits/${data.id}/log`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                progress: targetLog.currentValue,
                status: targetLog.status,
                date: targetLog.completedAt,
                note: val
            }),
        });
        message.success("Đã lưu ghi chú");
      } catch(e) { message.error("Lỗi"); }
  };

  // --- RENDERERS ---
  const renderCalendar = () => {
    // Render 3 tháng gần nhất dạng Heatmap đơn giản
    const days = [];
    // Lấy 90 ngày
    for (let i = 89; i >= 0; i--) {
        days.push(dayjs().subtract(i, 'day'));
    }

    return (
        <div className="flex flex-wrap gap-1 justify-center">
            {days.map(day => {
                const key = day.format('YYYY-MM-DD');
                const log = logMap[key];
                const isSelected = key === selectedLogDate;
                
                let bg = "bg-gray-100";
                if (log?.status === 'DONE') bg = isBeast ? "bg-red-500" : "bg-emerald-500";
                if (log?.status === 'FAILED') bg = "bg-black"; // Fail màu đen cho ngầu
                if (log?.status === 'SKIPPED') bg = "bg-gray-300";
                
                // Hiệu ứng Active Day
                const border = isSelected ? "ring-2 ring-blue-500 ring-offset-1" : "";

                return (
                    <Tooltip key={key} title={`${day.format('DD/MM')}: ${log?.status || 'Chưa làm'}`}>
                        <div 
                            className={`w-4 h-4 rounded-sm cursor-pointer transition-all ${bg} ${border} hover:opacity-80`}
                            onClick={() => setSelectedLogDate(key)}
                        />
                    </Tooltip>
                );
            })}
        </div>
    );
  };

  if (!open) return null;
  const isBeast = data?.mode === 'BEAST';
  const themeColor = isBeast ? '#ef4444' : '#10b981';

  // Log của ngày đang chọn
  const currentLog = logMap[selectedLogDate];

  return (
    <Drawer
      title={null}
      placement="right" // Trượt từ dưới lên (hoặc right tùy sở thích)
      height="100%" // FULL MÀN HÌNH
      width="100%"
      onClose={() => setOpen(false)}
      open={open}
      closable={false}
      getContainer={false}
     style={{ position: 'absolute' }} // <--- Đè lên nội dung cũ
      className="habit-detail-drawer"
      // Xóa styles body padding 0 cũ nếu cần, hoặc giữ nguyên
      styles={{ body: { padding: 0 } }}
    >
      {loading || !data ? (
        <div className="flex h-full items-center justify-center"><Spin size="large" /></div>
      ) : (
        <div className="flex flex-col h-full bg-gray-50">
            
            {/* --- 1. HEADER BAR (Cố định) --- */}
            <div className="bg-white px-6 py-4 flex justify-between items-center shadow-sm border-b z-10 sticky top-0">
                <div className="flex items-center gap-4">
                    <Button type="text" icon={<ArrowLeftOutlined />} size="large" onClick={() => setOpen(false)} />
                    <div>
                        <h1 className="text-xl font-bold m-0 flex items-center gap-2">
                            {data.title}
                            {isBeast && <Tag color="red" className="m-0">BEAST</Tag>}
                        </h1>
                        <span className="text-xs text-gray-500">{data.frequency} • {data.goalCount} {data.goalUnit}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                     <Button icon={<EditOutlined />} onClick={() => setIsEditOpen(true)}>Chỉnh sửa</Button>
                </div>
            </div>

            {/* --- 2. MAIN CONTENT (Scrollable) --- */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* --- CỘT TRÁI: DASHBOARD & ANALYTICS (2/3 chiều rộng) --- */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* HERO STATS */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card bordered={false} className="shadow-sm">
                                <Statistic 
                                    title="Streak" value={data.streak} 
                                    prefix={<FireFilled className="text-orange-500" />} 
                                    valueStyle={{fontWeight: 'bold'}}
                                />
                            </Card>
                            <Card bordered={false} className="shadow-sm">
                                <Statistic 
                                    title="Tỷ lệ thành công" 
                                    value={stats.done + stats.fail > 0 ? Math.round((stats.done / (stats.done + stats.fail)) * 100) : 0} 
                                    suffix="%" 
                                    valueStyle={{color: '#10b981', fontWeight: 'bold'}}
                                />
                            </Card>
                            <Card bordered={false} className="shadow-sm">
                                <Statistic 
                                    title={isBeast ? "TIỀN MẤT" : "Bỏ qua"} 
                                    value={isBeast ? stats.money : stats.skip} 
                                    prefix={isBeast ? <ThunderboltFilled /> : null}
                                    valueStyle={{color: isBeast ? '#ef4444' : '#9ca3af', fontWeight: 'bold'}}
                                />
                            </Card>
                            <Card bordered={false} className="shadow-sm bg-gradient-to-r from-blue-500 to-blue-600">
                                <Statistic 
                                    title={<span className="text-white/80">Total Logs</span>} 
                                    value={data.logs.length} 
                                    valueStyle={{color: 'white', fontWeight: 'bold'}}
                                />
                            </Card>
                        </div>

                        {/* CHART 30 NGÀY */}
                        <Card title="Hiệu suất 30 ngày qua" bordered={false} className="shadow-sm">
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <XAxis dataKey="name" tick={{fontSize: 10}} interval={2} />
                                        <RechartsTooltip />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {chartData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.status === 'DONE' ? themeColor : (entry.status === 'FAILED' ? '#000' : '#e5e7eb')} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* HEATMAP CALENDAR */}
                        <Card title="Bản đồ kỷ luật (90 ngày)" bordered={false} className="shadow-sm">
                            <div className="flex flex-col items-center">
                                {renderCalendar()}
                                <div className="flex gap-4 mt-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-gray-100"></div> Trống</span>
                                    <span className="flex items-center gap-1"><div className={`w-3 h-3 rounded-sm ${isBeast ? 'bg-red-500' : 'bg-emerald-500'}`}></div> Xong</span>
                                    <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-black"></div> Thất bại</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* --- CỘT PHẢI: ACTION CENTER (1/3 chiều rộng) --- */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* NGÀY ĐANG CHỌN */}
                        <Card 
                            className={`shadow-sm border-t-4 ${currentLog?.status === 'DONE' ? 'border-t-green-500' : (currentLog?.status === 'FAILED' ? 'border-t-red-500' : 'border-t-gray-300')}`}
                            bordered={false}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold m-0 flex items-center gap-2">
                                    <CalendarOutlined /> {dayjs(selectedLogDate).format('DD/MM/YYYY')}
                                </h3>
                                {currentLog ? (
                                    <Tag color={currentLog.status === 'DONE' ? 'success' : (currentLog.status === 'FAILED' ? 'error' : 'default')}>
                                        {currentLog.status}
                                    </Tag>
                                ) : <Tag>Chưa nhập</Tag>}
                            </div>

                            {/* NOTE AREA */}
                            <div className="bg-gray-50 p-3 rounded-lg mb-4">
                                <span className="text-xs text-gray-400 font-bold uppercase mb-1 block">Ghi chú</span>
                                {currentLog ? (
                                    <Input.TextArea 
                                        defaultValue={currentLog.note || ''}
                                        placeholder="Viết cảm nghĩ..."
                                        autoSize={{ minRows: 2, maxRows: 5 }}
                                        className="bg-transparent border-none p-0 focus:shadow-none text-gray-700"
                                        onBlur={(e) => {
                                            if (e.target.value !== currentLog.note) handleUpdateNote(e.target.value);
                                        }}
                                    />
                                ) : (
                                    <div className="text-xs text-gray-400 italic">Hãy check-in để viết ghi chú</div>
                                )}
                            </div>

                            {/* CHECKLIST */}
                            <div>
                                <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                                    <UnorderedListOutlined /> Quy trình
                                </h4>
                                {data.checklist && data.checklist.length > 0 ? (
                                    <div className="space-y-2">
                                        {data.checklist.map((item: any, idx: number) => {
                                            const isChecked = currentLog?.checklistState 
                                                ? JSON.parse(currentLog.checklistState).includes(idx) 
                                                : false;
                                            
                                            // Disable nếu không phải hôm nay (để tránh sửa quá khứ làm sai lệch streak logic phức tạp)
                                            const isToday = selectedLogDate === dayjs().format('YYYY-MM-DD');

                                            return (
                                                <div 
                                                    key={idx}
                                                    onClick={() => isToday && handleChecklistToggle(idx)}
                                                    className={`
                                                        flex items-center gap-3 p-3 rounded-lg border transition-all
                                                        ${isChecked ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}
                                                        ${isToday ? 'cursor-pointer hover:border-blue-400' : 'opacity-60 cursor-not-allowed'}
                                                    `}
                                                >
                                                    <Checkbox checked={isChecked} disabled={!isToday} />
                                                    <span className={isChecked ? 'line-through text-gray-400' : 'text-gray-700'}>
                                                        {item.content}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-400 py-4 text-xs">Không có checklist</div>
                                )}
                            </div>
                        </Card>

                        {/* REMINDERS INFO */}
                        <Card title="Nhắc nhở & Mục tiêu" size="small" bordered={false} className="shadow-sm">
                             <div className="space-y-3">
                                 <div className="flex justify-between text-sm">
                                     <span className="text-gray-500">Giờ nhắc:</span>
                                     <div className="flex gap-1">
                                         {data.reminders && JSON.parse(data.reminders).map((t:string) => (
                                             <Tag key={t}>{t}</Tag>
                                         ))}
                                     </div>
                                 </div>
                                 <div className="flex justify-between text-sm">
                                     <span className="text-gray-500">Mục tiêu:</span>
                                     <span className="font-bold">{data.goalCount} {data.goalUnit}/ngày</span>
                                 </div>
                                 <div className="flex justify-between text-sm">
                                     <span className="text-gray-500">Bắt đầu:</span>
                                     <span>{dayjs(data.startDate).format('DD/MM/YYYY')}</span>
                                 </div>
                             </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Modal Edit */}
      {isEditOpen && data && (
          <HabitFormModal 
            open={isEditOpen} 
            onClose={() => { setIsEditOpen(false); fetchDetail(data.id); }} 
            initialData={data} 
          />
      )}
    </Drawer>
  );
};