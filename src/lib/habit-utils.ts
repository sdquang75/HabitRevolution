import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);
// Hàm tính chuỗi liên tiếp (Streak) hiện tại
export const calculateStreak = (logs: any[], frequency: string = 'daily'): number => {
  if (!logs || logs.length === 0) return 0;

  // Sắp xếp log mới nhất lên đầu
  const sortedLogs = [...logs].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  
  let streak = 0;
  // Bắt đầu kiểm tra từ hôm nay (hoặc hôm qua nếu hôm nay chưa làm)
  let checkDate = dayjs();
  
  // Nếu hôm nay chưa có log DONE, thì streak tính từ hôm qua
  const hasToday = sortedLogs.some(l => dayjs(l.completedAt).isSame(checkDate, 'day') && l.status === 'DONE');
  if (!hasToday) {
    checkDate = checkDate.subtract(1, 'day');
  }

  // Vòng lặp đếm ngược
  while (true) {
    const log = sortedLogs.find(l => dayjs(l.completedAt).isSame(checkDate, 'day'));
    
    if (log && log.status === 'DONE') {
      streak++;
      checkDate = checkDate.subtract(1, 'day');
    } else {
      // Nếu không tìm thấy log DONE của ngày này -> Đứt chuỗi
      break; 
    }
  }
  return streak;
};

// Hàm lấy trạng thái 7 ngày gần nhất (để vẽ mini chart)
export const getLast7DaysStatus = (logs: any[]) => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day');
    const log = logs?.find((l: any) => dayjs(l.completedAt).isSame(date, 'day'));
    days.push({
      date: date,
      status: log?.status || 'NONE', // NONE, DONE, FAILED, SKIPPED, IN_PROGRESS
      value: log?.currentValue || 0
    });
  }
  return days;
};









// Hàm kiểm tra Habit có hiệu lực vào ngày 'date' hay không
export const isHabitActive = (habit: any, date: Date | string) => {
  const targetDate = dayjs(date).startOf('day');
  const start = dayjs(habit.startDate).startOf('day');
  
  // 1. Kiểm tra Ngày bắt đầu
  if (targetDate.isBefore(start)) return { active: false, reason: 'not_started' };

// --- LOGIC KẾT THÚC NÂNG CAO ---
  const type = habit.endConditionType || 'NEVER';
  const val = habit.endConditionValue || 0;

  // 1. Kết thúc theo Ngày
  if (type === 'DATE' && habit.endDate) {
      if (targetDate.isAfter(dayjs(habit.endDate).endOf('day'))) return { active: false, reason: 'ended' };
  }

  // 2. Kết thúc theo Số lần hoàn thành (COUNT)
  if (type === 'COUNT') {
      const doneCount = habit.logs?.filter((l: any) => l.status === 'DONE').length || 0;
      if (doneCount >= val && targetDate.isAfter(dayjs())) return { active: false, reason: 'completed_quota' };
  }

  // 3. Kết thúc theo Tổng giá trị (TOTAL) - VD: Chạy đủ 1000km
  if (type === 'TOTAL') {
      const total = habit.logs?.reduce((sum: number, l: any) => sum + (l.status === 'DONE' ? l.currentValue : 0), 0) || 0;
      if (total >= val && targetDate.isAfter(dayjs())) return { active: false, reason: 'completed_goal' };
  }

  // Beast Mode thì không bao giờ kết thúc trừ khi user xóa
  if (habit.mode === 'BEAST' && type !== 'NEVER') {
      // Beast mode overrides endings normally, but we respect explicit setup if logic demands
  }

  return { active: true, reason: 'active' };
};