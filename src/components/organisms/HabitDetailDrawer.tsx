'use client';

import { Drawer, Card, Statistic, Tag, Spin, Button, Input, Tabs, List, Avatar, Tooltip, Empty } from 'antd';
import { useEffect, useState, useMemo } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { 
  FireFilled, CheckCircleFilled, CloseCircleFilled, 
  ThunderboltFilled, SmileFilled, LeftOutlined, RightOutlined,
  EditOutlined, CalendarOutlined, HistoryOutlined, FileTextOutlined,
  StopOutlined
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { HabitFormModal } from './HabitFormModal';

dayjs.locale('vi');

export const HabitDetailDrawer = () => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // State quản lý UI
  const [viewDate, setViewDate] = useState(dayjs()); // Tháng đang xem trên lịch
  const [selectedLogDate, setSelectedLogDate] = useState<string>(dayjs().format('YYYY-MM-DD')); // Ngày đang chọn để xem note
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

  // --- LOGIC DỮ LIỆU ---
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
    const logs = data.logs;
    const done = logs.filter((l: any) => l.status === 'DONE').length;
    const fail = logs.filter((l: any) => l.status === 'FAILED').length;
    const skip = logs.filter((l: any) => l.status === 'SKIPPED').length;
    const money = fail * (data.stakeAmount || 0);
    return { done, fail, skip, money };
  }, [data]);

  // Dữ liệu cho biểu đồ cột (30 ngày gần nhất)
  const chartData = useMemo(() => {
    const arr = [];
    for (let i = 14; i >= 0; i--) { // 15 ngày gần nhất cho gọn
        const d = dayjs().subtract(i, 'day');
        const key = d.format('YYYY-MM-DD');
        const log = logMap[key];
        arr.push({
            name: d.format('DD/MM'),
            value: log?.currentValue || 0,
            status: log?.status || 'NONE',
        });
    }
    return arr;
  }, [logMap]);

  // --- RENDER CALENDAR (CUSTOM GRID) ---
  const renderCalendar = () => {
    const startOfMonth = viewDate.startOf('month');
    const endOfMonth = viewDate.endOf('month');
    const startDay = startOfMonth.day() === 0 ? 6 : startOfMonth.day() - 1; // T2 là 0
    const totalDays = endOfMonth.date();

    // Tạo mảng trống để đẩy ngày mùng 1 vào đúng thứ
    const blanks = Array.from({ length: startDay });
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);

    return (
        <div className="select-none">
            {/* Header Thứ */}
            <div className="grid grid-cols-7 mb-2">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                    <div key={d} className="text-center text-xs text-gray-400 font-bold">{d}</div>
                ))}
            </div>
            {/* Grid Ngày */}
            <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                {blanks.map((_, i) => <div key={`blank-${i}`} />)}
                
                {days.map(day => {
                    const dateStr = viewDate.date(day).format('YYYY-MM-DD');
                    const log = logMap[dateStr];
                    const isSelected = dateStr === selectedLogDate;
                    const isToday = dateStr === dayjs().format('YYYY-MM-DD');

                    let content = <span className="text-sm text-gray-600">{day}</span>;
                    let wrapperClass = `h-10 w-10 flex items-center justify-center rounded-full cursor-pointer transition-all border-2 
                        ${isSelected ? 'border-blue-500' : 'border-transparent'} 
                        ${isToday && !isSelected ? 'border-blue-200' : ''}
                        hover:bg-gray-50`;

                    if (log) {
                        if (log.status === 'DONE') {
                            wrapperClass += isBeast ? " bg-red-600 text-white" : " bg-purple-600 text-white";
                            // content = <span className="font-bold">{day}</span>; // Hoặc icon check
                            content = <span className="font-bold text-lg">{log.currentValue >= 1 ? log.currentValue : '✔'}</span>
                        } else if (log.status === 'FAILED') {
                            wrapperClass += " bg-transparent";
                            content = <CloseCircleFilled className="text-xl text-red-500" />;
                        } else if (log.status === 'SKIPPED') {
                            wrapperClass += " bg-gray-100";
                            content = <StopOutlined className="text-lg text-gray-400" />;
                        }
                    }

                    return (
                        <div key={day} className="flex justify-center" onClick={() => setSelectedLogDate(dateStr)}>
                            <div className={wrapperClass}>
                                {content}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };

  if (!open) return null;
  const isBeast = data?.mode === 'BEAST';
  const themeColor = isBeast ? '#ef4444' : '#9333ea'; // Đỏ hoặc Tím
  const currentLog = logMap[selectedLogDate];

  return (
    <Drawer
      title={null}
      placement="right"
      width="100%"
      height="100%"
      onClose={() => setOpen(false)}
      open={open}
      closable={false}
      getContainer={false} // Render local
      style={{ position: 'absolute' }}
      styles={{ body: { padding: 0 } }}
    >
      {loading || !data ? (
        <div className="flex h-full items-center justify-center"><Spin size="large" /></div>
      ) : (
        <div className="flex flex-col h-full bg-gray-50">
            
            {/* 1. HEADER */}
            <div className="bg-white px-6 py-3 flex justify-between items-center shadow-sm border-b sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <Button type="text" icon={<LeftOutlined />} onClick={() => setOpen(false)} />
                    <div>
                        <h1 className="text-xl font-bold m-0 flex items-center gap-2">
                            {data.title}
                            {isBeast && <Tag color="red" className="m-0 border-0">BEAST MODE</Tag>}
                        </h1>
                    </div>
                </div>
                <Button icon={<EditOutlined />} onClick={() => setIsEditOpen(true)}>Sửa</Button>
            </div>

            {/* 2. BODY CONTENT (3 CỘT) */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 h-full">
                    
                    {/* --- CỘT TRÁI: STREAK (3/12) --- */}
                    <div className="col-span-12 lg:col-span-3 space-y-4">
                        <Card bordered={false} className="shadow-sm text-center h-full flex flex-col justify-center">
                            <div className="relative inline-block mx-auto mb-4">
                                <FireFilled className={`text-9xl opacity-20 ${isBeast ? 'text-red-500' : 'text-purple-500'}`} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-6xl font-bold ${isBeast ? 'text-red-600' : 'text-purple-600'}`}>
                                        {data.streak}
                                    </span>
                                    <span className="text-gray-500 font-medium uppercase tracking-wider text-xs mt-2">Chuỗi ngày</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-8 px-4">
                                <Statistic 
                                    title="Đã xong" value={stats.done} 
                                    valueStyle={{color: '#10b981', fontSize: 18, fontWeight: 'bold'}} 
                                />
                                <Statistic 
                                    title={isBeast ? "TIỀN PHẠT" : "Thất bại"} 
                                    value={isBeast ? stats.money : stats.fail} 
                                    prefix={isBeast ? '₫' : ''}
                                    valueStyle={{color: '#ef4444', fontSize: 18, fontWeight: 'bold'}} 
                                />
                            </div>
                        </Card>
                    </div>

                    {/* --- CỘT GIỮA: CALENDAR & CHART (6/12) --- */}
                    <div className="col-span-12 lg:col-span-6 space-y-4">
                        {/* CALENDAR BLOCK */}
                        <Card bordered={false} className="shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <Button type="text" icon={<LeftOutlined />} onClick={() => setViewDate(d => d.subtract(1, 'month'))} />
                                <span className="font-bold text-lg capitalize">{viewDate.format('MMMM YYYY')}</span>
                                <Button type="text" icon={<RightOutlined />} onClick={() => setViewDate(d => d.add(1, 'month'))} />
                            </div>
                            {renderCalendar()}
                            
                            {/* Chú thích */}
                            <div className="flex justify-center gap-4 mt-6 text-xs text-gray-400">
                                <div className="flex items-center gap-1"><div className={`w-2 h-2 rounded-full ${isBeast ? 'bg-red-600' : 'bg-purple-600'}`}></div> Xong</div>
                                <div className="flex items-center gap-1"><CloseCircleFilled className="text-red-500"/> Thất bại</div>
                                <div className="flex items-center gap-1"><StopOutlined className="text-gray-400"/> Bỏ qua</div>
                            </div>
                        </Card>

                        {/* CHART BLOCK */}
                        <Card bordered={false} className="shadow-sm" bodyStyle={{padding: '12px 24px'}}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-gray-400 uppercase">Hiệu suất 15 ngày qua</span>
                                <span className="text-xs text-gray-500">TB: {Math.round(chartData.reduce((a,b)=>a+b.value,0)/15)} / ngày</span>
                            </div>
                            <div className="h-32">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <XAxis dataKey="name" tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                        <RechartsTooltip contentStyle={{fontSize: 12}} />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {chartData.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.status === 'DONE' ? themeColor : '#e5e7eb'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    {/* --- CỘT PHẢI: SIDEBAR CHI TIẾT (3/12) --- */}
                    <div className="col-span-12 lg:col-span-3">
                        <Card bordered={false} className="shadow-sm h-full flex flex-col" bodyStyle={{padding: 0, height: '100%', display: 'flex', flexDirection: 'column'}}>
                            <div className="p-4 border-b bg-gray-50/50">
                                <div className="text-xs text-gray-400 font-bold uppercase mb-1">Đang xem ngày</div>
                                <div className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <CalendarOutlined /> {dayjs(selectedLogDate).format('DD/MM/YYYY')}
                                </div>
                                {currentLog ? (
                                    <Tag className="mt-2 border-0" color={currentLog.status === 'DONE' ? 'green' : (currentLog.status === 'FAILED' ? 'red' : 'default')}>
                                        {currentLog.status} ({currentLog.currentValue} {data.goalUnit})
                                    </Tag>
                                ) : (
                                    <Tag className="mt-2 border-0">Chưa có dữ liệu</Tag>
                                )}
                            </div>

                            <Tabs 
                                defaultActiveKey="1" 
                                className="flex-1"
                                tabBarStyle={{padding: '0 16px', marginBottom: 0}}
                                items={[
                                    {
                                        key: '1', 
                                        label: <span><FileTextOutlined/> Ghi chú</span>,
                                        children: (
                                            <div className="p-4 h-full">
                                                <Input.TextArea 
                                                    placeholder={currentLog ? "Viết ghi chú cho ngày này..." : "Hãy check-in để viết ghi chú"}
                                                    disabled={!currentLog}
                                                    defaultValue={currentLog?.note || ''}
                                                    key={selectedLogDate} // Force re-render khi đổi ngày
                                                    autoSize={{ minRows: 4, maxRows: 10 }}
                                                    className="bg-gray-50 border-0 focus:bg-white transition-colors"
                                                    onBlur={(e) => {
                                                        // Logic save note ở đây (đã có ở bài trước)
                                                    }}
                                                />
                                            </div>
                                        )
                                    },
                                    {
                                        key: '2',
                                        label: <span><HistoryOutlined/> Lịch sử</span>,
                                        children: (
                                            <div className="p-4">
                                                {/* List lịch sử logs gần đây */}
                                                <List
                                                    dataSource={data.logs.slice(0, 5)}
                                                    renderItem={(item: any) => (
                                                        <List.Item className="text-xs">
                                                            <div className="flex justify-between w-full">
                                                                <span className="text-gray-500">{dayjs(item.completedAt).format('DD/MM HH:mm')}</span>
                                                                <span className={item.status === 'DONE' ? 'text-green-600' : 'text-red-500'}>{item.status}</span>
                                                            </div>
                                                        </List.Item>
                                                    )}
                                                />
                                            </div>
                                        )
                                    }
                                ]}
                            />
                        </Card>
                    </div>

                </div>
            </div>
        </div>
      )}

      {/* Modal Edit tái sử dụng */}
      {isEditOpen && data && (
          <HabitFormModal 
            open={isEditOpen} onClose={() => { setIsEditOpen(false); fetchDetail(data.id); }} 
            initialData={data} 
          />
      )}
    </Drawer>
  );
};