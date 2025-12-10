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

  // 2. Kiểm tra Ngày kết thúc (Nếu có)
  if (habit.endDate) {
    const end = dayjs(habit.endDate).endOf('day');
    if (targetDate.isAfter(end)) return { active: false, reason: 'ended' };
  }

  // 3. (Phát triển thêm) Kiểm tra Frequency (Ví dụ: Chỉ làm T2, T4, T6)
  // Logic này sẽ mở rộng sau khi cậu update DB để lưu frequency chi tiết hơn
  
  return { active: true, reason: 'active' };
};