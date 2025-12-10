'use client';

import { Table } from 'antd';
import { FireFilled } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { HabitGridCell } from '../atoms/HabitGridCell'; // Import component mới

dayjs.locale('vi');

export const HabitGrid = ({ habits, startDate }: { habits: any[], startDate: Date }) => {
  
  // Tạo mảng 7 ngày (hoặc 14 ngày nếu muốn rộng hơn)
  const days = Array.from({ length: 10 }).map((_, i) => {
    return dayjs(startDate).subtract(9 - i, 'day'); // Hiển thị 10 ngày gần nhất
  });

  const columns: any = [
    {
      title: 'Thói quen',
      dataIndex: 'title',
      key: 'title',
      fixed: 'left',
      width: 180,
      render: (text: string, record: any) => (
        <div className="flex items-center gap-2 px-2">
           <span className={`w-1 h-6 rounded-full ${record.mode === 'BEAST' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
           <div className="flex flex-col">
               <span className="font-semibold text-gray-700 truncate max-w-[120px]" title={text}>{text}</span>
               {record.mode === 'BEAST' && <span className="text-[10px] text-red-500 flex items-center gap-1"><FireFilled/> Beast</span>}
           </div>
        </div>
      )
    },
    ...days.map(day => ({
      title: (
        <div className="text-center">
          <div className="text-[10px] uppercase text-gray-400">{day.format('dd')}</div>
          <div className={`font-bold text-xs ${day.isSame(dayjs(), 'day') ? 'text-blue-600' : ''}`}>
            {day.format('DD')}
          </div>
        </div>
      ),
      key: day.format('YYYY-MM-DD'),
      align: 'center',
      width: 50,
      padding: 0,
      onCell: () => ({ style: { padding: 0 } }), // Xóa padding mặc định của ô để Cell tràn viền
      render: (_: any, habit: any) => (
        <HabitGridCell 
            habit={habit} 
            date={day.toDate()} 
        />
      )
    }))
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
       <Table 
          dataSource={habits} 
          columns={columns} 
          pagination={false} 
          rowKey="id"
          scroll={{ x: 'max-content' }}
          size="small"
          bordered
       />
    </div>
  );
};