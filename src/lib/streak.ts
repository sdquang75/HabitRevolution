import { db } from '@/lib/db';
import dayjs from 'dayjs';

export const recalculateStreak = async (habitId: string) => {
  // 1. Lấy toàn bộ logs của habit này (Sắp xếp mới nhất trước)
  const logs = await db.habitLog.findMany({
    where: { habitId },
    orderBy: { completedAt: 'desc' },
  });

  let streak = 0;
  // Bắt đầu kiểm tra từ hôm nay
  let checkDate = dayjs().startOf('day'); 
  
  // Logic phụ: Nếu hôm nay chưa log gì cả, thì streak tính từ hôm qua
  // (Tránh việc vừa sang ngày mới streak bị reset về 0)
  const hasLogToday = logs.some(l => dayjs(l.completedAt).isSame(checkDate, 'day'));
  if (!hasLogToday) {
    checkDate = checkDate.subtract(1, 'day');
  }

  // 2. Vòng lặp kiểm tra quá khứ
  // Chúng ta sẽ lặp tối đa 365 ngày hoặc cho đến khi đứt chuỗi
  for (let i = 0; i < 365; i++) {
    const currentDate = checkDate.subtract(i, 'day');
    
    // Tìm log của ngày đang check
    const log = logs.find(l => dayjs(l.completedAt).isSame(currentDate, 'day'));

    if (!log) {
      // Nếu không có log -> ĐỨT CHUỖI (Trừ khi habit không yêu cầu làm ngày này - Future Feature)
      // Tạm thời coi như không làm là đứt
      break; 
    }

    if (log.status === 'DONE') {
      streak++;
    } else if (log.status === 'SKIPPED') {
      // SKIPPED: Cầu nối bảo lưu streak (Không tăng, nhưng không làm đứt)
      continue;
    } else {
      // FAILED hoặc IN_PROGRESS (của quá khứ) -> ĐỨT CHUỖI
      break;
    }
  }

  // 3. Cập nhật con số Streak mới vào bảng Habit
  await db.habit.update({
    where: { id: habitId },
    data: { streak: streak }
  });

  return streak;
};