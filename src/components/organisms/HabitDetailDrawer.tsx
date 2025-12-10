'use client';

import { Drawer, theme, Card, Statistic, Tag, Spin, Empty, Button, Avatar, Tooltip, Segmented } from 'antd';
import { useEffect, useState, useMemo } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { 
  FireFilled, CheckCircleFilled, CloseCircleFilled, 
  ThunderboltFilled, SmileFilled, BarChartOutlined,
  LeftOutlined, RightOutlined, CalendarOutlined, EditOutlined
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

dayjs.locale('vi');

export const HabitDetailDrawer = () => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(dayjs()); // Để navigate lịch tháng
  const { token } = theme.useToken();

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

  // --- LOGIC TÍNH TOÁN DỮ LIỆU ---
  const stats = useMemo(() => {
    if (!data || !data.logs) return { done: 0, fail: 0, skip: 0, currentStreak: 0, totalMoney: 0 };
    
    const logs = data.logs;
    const done = logs.filter((l: any) => l.status === 'DONE').length;
    const fail = logs.filter((l: any) => l.status === 'FAILED').length;
    const skip = logs.filter((l: any) => l.status === 'SKIPPED').length;
    
    // Tính tiền phạt (Beast Mode)
    const totalMoney = fail * (data.stakeAmount || 0);

    // Tính Streak hiện tại (Logic đơn giản: đếm ngược từ hôm nay)
    let currentStreak = 0;
    // ... (Có thể thêm logic tính streak phức tạp hơn ở đây)
    // Tạm lấy từ DB nếu có, hoặc giả lập
    currentStreak = data.streak || 0; 

    return { done, fail, skip, currentStreak, totalMoney };
  }, [data]);

  // Tạo Map Log để tra cứu O(1)
  const logMap = useMemo(() => {
    if (!data?.logs) return {};
    const map: Record<string, any> = {};
    data.logs.forEach((log: any) => {
      map[dayjs(log.completedAt).format('YYYY-MM-DD')] = log;
    });
    return map;
  }, [data]);

  // Dữ liệu cho biểu đồ (7 ngày gần nhất)
  const chartData = useMemo(() => {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
        const d = dayjs().subtract(i, 'day');
        const key = d.format('YYYY-MM-DD');
        const log = logMap[key];
        arr.push({
            name: d.format('DD/MM'),
            value: log?.currentValue || 0,
            status: log?.status || 'NONE'
        });
    }
    return arr;
  }, [logMap]);

  // --- CUSTOM CALENDAR RENDERER ---
  const renderCalendar = () => {
    const startOfMonth = currentDate.startOf('month');
    const endOfMonth = currentDate.endOf('month');
    const daysInMonth = endOfMonth.date();
    const startDayOfWeek = startOfMonth.day(); // 0 (CN) -> 6 (T7)
    
    // Tạo mảng các ô trống trước ngày mùng 1
    const blanks = Array.from({ length: startDayOfWeek === 0 ? 6 : startDayOfWeek - 1 }); 
    // Tạo mảng các ngày trong tháng
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
        <div className="grid grid-cols-7 gap-2 mb-4">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                <div key={d} className="text-center text-xs text-gray-400 font-bold mb-2">{d}</div>
            ))}
            
            {blanks.map((_, i) => <div key={`blank-${i}`} />)}

            {days.map(day => {
                const dateStr = currentDate.date(day).format('YYYY-MM-DD');
                const log = logMap[dateStr];
                const isToday = dateStr === dayjs().format('YYYY-MM-DD');
                
                let content = <span className={`text-sm ${isToday ? 'font-bold text-blue-600' : 'text-gray-600'}`}>{day}</span>;
                let cellClass = "h-10 w-10 flex items-center justify-center rounded-full border border-transparent transition-all";

                if (log) {
                    if (log.status === 'DONE') {
                        cellClass = "h-10 w-10 flex items-center justify-center rounded-full bg-purple-600 text-white shadow-sm ring-2 ring-purple-100";
                        // Custom content kiểu hình mẫu: Vòng tròn tím
                        content = <span className="font-bold">{day}</span>; 
                    } else if (log.status === 'FAILED') {
                        cellClass = "h-10 w-10 flex items-center justify-center rounded-lg bg-red-50 text-red-500";
                        content = <CloseCircleFilled />;
                    } else if (log.status === 'SKIPPED') {
                        cellClass = "h-10 w-10 flex items-center justify-center rounded-lg bg-gray-100 text-gray-400";
                        content = <span className="text-xs">Skip</span>;
                    }
                }

                return (
                    <div key={day} className="flex justify-center">
                        <Tooltip title={log ? `${log.status}: ${log.currentValue}` : 'Chưa nhập'}>
                            <div className={cellClass}>
                                {content}
                            </div>
                        </Tooltip>
                    </div>
                );
            })}
        </div>
    );
  };

  if (!open) return null;
  const isBeast = data?.mode === 'BEAST';
  const themeColor = isBeast ? '#ef4444' : '#7e22ce'; // Đỏ hoặc Tím (giống hình mẫu)

  return (
    <Drawer
      title={null} // Tắt title mặc định để custom header xịn hơn
      placement="right"
      width={900}
      onClose={() => setOpen(false)}
      open={open}
      className="habit-detail-drawer"
      styles={{ body: { padding: 0 } }} // Full width
    >
      {loading || !data ? (
        <div className="flex h-full items-center justify-center"><Spin size="large" /></div>
      ) : (
        <div className="flex h-full bg-gray-50">
            
            {/* --- LEFT PANEL (MAIN CONTENT) --- */}
            <div className="flex-1 p-6 overflow-y-auto">
                
                {/* HEADER */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm ${isBeast ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'}`}>
                             {isBeast ? <ThunderboltFilled /> : <FireFilled />}
                         </div>
                         <div>
                             <h2 className="text-2xl font-bold m-0 text-gray-800">{data.title}</h2>
                             <div className="flex gap-2 mt-1">
                                 <Tag color={isBeast ? "red" : "purple"}>{isBeast ? 'BEAST MODE' : 'ATOMIC'}</Tag>
                                 <Tag>{data.frequency === 'daily' ? 'Hàng ngày' : 'Hàng tuần'}</Tag>
                             </div>
                         </div>
                    </div>
                    <Button icon={<EditOutlined />}>Chỉnh sửa</Button>
                </div>

                {/* STATS CARDS */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <Card size="small" className="shadow-sm border-none">
                        <Statistic 
                            title="Hoàn thành" value={stats.done} 
                            valueStyle={{ color: '#10b981', fontWeight: 'bold' }} 
                            prefix={<CheckCircleFilled />} 
                        />
                    </Card>
                    <Card size="small" className="shadow-sm border-none">
                        <Statistic 
                            title="Thất bại" value={stats.fail} 
                            valueStyle={{ color: '#ef4444', fontWeight: 'bold' }} 
                            prefix={<CloseCircleFilled />} 
                        />
                    </Card>
                    <Card size="small" className="shadow-sm border-none">
                        <Statistic 
                            title={isBeast ? "Tiền phạt" : "Bỏ qua"} 
                            value={isBeast ? stats.totalMoney : stats.skip} 
                            suffix={isBeast ? 'đ' : ''}
                            valueStyle={{ color: isBeast ? '#ef4444' : '#9ca3af', fontWeight: 'bold' }} 
                        />
                    </Card>
                    <Card size="small" className="shadow-sm border-none bg-gradient-to-br from-purple-500 to-indigo-600">
                        <Statistic 
                            title={<span className="text-white/80">Streak hiện tại</span>} 
                            value={stats.currentStreak} 
                            suffix={<FireFilled />}
                            valueStyle={{ color: 'white', fontWeight: 'bold' }} 
                        />
                    </Card>
                </div>

                {/* CALENDAR & VISUALIZATION */}
                <div className="grid grid-cols-3 gap-6 mb-6">
                    {/* CỘT 1: BIG VISUAL (STREAK) */}
                    <div className="col-span-1 bg-white p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center border border-gray-100">
                        <div className="relative mb-4">
                            <div className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl opacity-10 ${isBeast ? 'bg-red-500 text-red-600' : 'bg-purple-500 text-purple-600'}`}>
                                <FireFilled />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-gray-800">
                                {stats.currentStreak}
                            </div>
                        </div>
                        <h3 className="font-bold text-gray-600">Chuỗi ngày liên tiếp</h3>
                        <p className="text-xs text-gray-400 mt-2 px-4">
                            {isBeast ? "Đừng để chuỗi đứt. Cái giá phải trả là tiền thật!" : "Một bước nhỏ mỗi ngày tạo nên thành công lớn."}
                        </p>
                    </div>

                    {/* CỘT 2+3: CUSTOM CALENDAR */}
                    <div className="col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6 border-b pb-4">
                            <div className="flex items-center gap-2">
                                <Button type="text" icon={<LeftOutlined />} onClick={() => setCurrentDate(d => d.subtract(1, 'month'))} />
                                <span className="text-lg font-bold capitalize">{currentDate.format('MMMM YYYY')}</span>
                                <Button type="text" icon={<RightOutlined />} onClick={() => setCurrentDate(d => d.add(1, 'month'))} />
                            </div>
                            <div className="flex gap-2 text-xs">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-600"></span> Xong</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-100 border border-red-200"></span> Fail</span>
                            </div>
                        </div>
                        
                        {/* Gọi hàm render lịch custom */}
                        {renderCalendar()}
                    </div>
                </div>

                {/* CHART */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700">Tần suất 7 ngày qua</h3>
                        <Segmented options={['Ngày', 'Tuần', 'Tháng']} size="small" />
                    </div>
                    <ResponsiveContainer width="100%" height="85%">
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                            <RechartsTooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                cursor={{fill: '#f3f4f6'}}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.status === 'DONE' ? themeColor : (entry.status === 'FAILED' ? '#ef4444' : '#e5e7eb')} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* --- RIGHT PANEL (SIDEBAR LOGS) --- */}
            <div className="w-80 bg-white border-l p-6 flex flex-col">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <EditOutlined /> Nhật ký & Ghi chú
                </h3>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    {data.logs.length === 0 && <Empty description="Chưa có ghi chú" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                    
                    {data.logs.map((log: any) => (
                        <div key={log.id} className="group relative pl-4 border-l-2 border-gray-100 hover:border-purple-500 transition-colors pb-4">
                            <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-gray-200 group-hover:bg-purple-500 transition-colors"></div>
                            <div className="text-xs text-gray-400 mb-1">{dayjs(log.completedAt).format('DD/MM • HH:mm')}</div>
                            
                            <div className="bg-gray-50 p-3 rounded-lg group-hover:bg-purple-50 transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                        log.status === 'DONE' ? 'bg-green-100 text-green-700' : 
                                        log.status === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'
                                    }`}>
                                        {log.status}
                                    </span>
                                    <span className="text-xs font-mono">{log.currentValue} {data.goalUnit}</span>
                                </div>
                                {log.note ? (
                                    <p className="text-sm text-gray-600 italic">"{log.note}"</p>
                                ) : (
                                    <p className="text-xs text-gray-400 italic">Không có ghi chú</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
    </Drawer>
  );
};