'use client';

import { Card, Tag, Progress, Button, Tooltip } from 'antd';
import { 
  FireOutlined, CheckOutlined, 
  ThunderboltFilled, SmileFilled, 
  ClockCircleOutlined, TrophyOutlined 
} from '@ant-design/icons';

interface HabitCardProps {
  habit: any; // Tạm thời để any cho nhanh, sau này define type kỹ hơn
}

export const HabitCard = ({ habit }: HabitCardProps) => {
  const isBeast = habit.mode === 'BEAST';
  
  // Màu sắc chủ đạo
  const color = isBeast ? '#ef4444' : '#10b981';
  const bgColor = isBeast ? '#fef2f2' : '#ecfdf5';

  return (
    <Card 
      className="shadow-sm hover:shadow-md transition-all duration-300 border-t-4"
      style={{ borderTopColor: color, backgroundColor: 'white' }}
      bodyStyle={{ padding: '16px' }}
    >
      {/* Header: Tên & Badge Mode */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="text-lg font-bold m-0 text-gray-800 line-clamp-1" title={habit.title}>
            {habit.title}
          </h4>
          <span className="text-xs text-gray-500 flex items-center gap-1">
             <ClockCircleOutlined /> {habit.timeOfDay ? JSON.parse(habit.timeOfDay).join(', ') : 'Cả ngày'}
          </span>
        </div>
        <Tooltip title={isBeast ? "Chế độ Quái thú: Kỷ luật thép" : "Chế độ Nguyên tử: Tích tiểu thành đại"}>
            {isBeast ? (
                <ThunderboltFilled className="text-xl text-force-main animate-pulse" />
            ) : (
                <SmileFilled className="text-xl text-atomic-main" />
            )}
        </Tooltip>
      </div>

      {/* Thông tin phụ: Streak & Cam kết */}
      <div className="flex gap-2 mb-4">
        <Tag icon={<FireOutlined />} color={isBeast ? "red" : "green"}>
           Streak: {habit.streak}
        </Tag>
        {isBeast && habit.stakeAmount > 0 && (
           <Tag color="error">Phạt: {habit.stakeAmount.toLocaleString()}đ</Tag>
        )}
      </div>

      {/* Progress Bar (Tạm thời fix cứng, sau này nối logic check-in) */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1 text-gray-500">
            <span>Tiến độ hôm nay</span>
            <span>0/{habit.goalCount} {habit.goalUnit}</span>
        </div>
        <Progress 
            percent={0} 
            strokeColor={color} 
            showInfo={false} 
            size="small" 
        />
      </div>

      {/* Nút Action: Check-in */}
      <Button 
        type="primary" 
        block 
        icon={<CheckOutlined />}
        style={{ backgroundColor: color }}
        className="font-bold shadow-sm h-10 border-none"
        onClick={() => alert("Tính năng Check-in sẽ làm ở bài sau!")}
      >
        Check-in
      </Button>
    </Card>
  );
};