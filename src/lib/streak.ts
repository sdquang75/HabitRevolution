import { db } from '@/lib/db';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const recalculateStreak = async (habitId: string) => {
  const logs = await db.habitLog.findMany({
    where: { habitId },
    orderBy: { completedAt: 'desc' },
  });

  if (logs.length === 0) {
    // Nếu không có log nào -> Streak = 0
    await db.habit.update({ where: { id: habitId }, data: { streak: 0 } });
    return 0;
  }

  // Map log theo Key ngày (YYYY-MM-DD) để tra cứu nhanh
  const logMap: Record<string, any> = {};
  logs.forEach(log => {
    // Lưu ý: completedAt trong DB là UTC. Ta format về YYYY-MM-DD
    const dateKey = dayjs(log.completedAt).format('YYYY-MM-DD');
    // Nếu một ngày có nhiều log (do sửa đi sửa lại), lấy log mới nhất
    if (!logMap[dateKey]) logMap[dateKey] = log;
  });

  let streak = 0;
  // Bắt đầu check từ Hôm nay
  let checkDate = dayjs(); 
  
  // Logic quan trọng:
  // Kiểm tra xem "Hôm nay" đã có log chưa?
  const todayKey = checkDate.format('YYYY-MM-DD');
  const todayLog = logMap[todayKey];

  // Nếu hôm nay CÓ log mà là FAILED -> Đứt chuỗi ngay lập tức (Streak = 0)
  if (todayLog && todayLog.status === 'FAILED') {
      // Dừng luôn, không cần check quá khứ
      await db.habit.update({ where: { id: habitId }, data: { streak: 0 } });
      return 0;
  }

  // Nếu hôm nay chưa có log (hoặc log là IN_PROGRESS), ta cho phép tính tiếp từ Hôm qua
  // (Để user không bị mất streak ngay khi vừa sang ngày mới)
  if (!todayLog || todayLog.status === 'IN_PROGRESS') {
      checkDate = checkDate.subtract(1, 'day');
  }

  // Vòng lặp đếm ngược 365 ngày
  for (let i = 0; i < 365; i++) {
    const dateKey = checkDate.format('YYYY-MM-DD');
    const log = logMap[dateKey];

    if (!log) {
      // Không có log -> Đứt chuỗi
      break; 
    }

    if (log.status === 'DONE') {
      streak++;
    } else if (log.status === 'SKIPPED') {
      // Skipped -> Bảo lưu chuỗi, đi tiếp ngày hôm trước
      // (Không tăng streak, nhưng không break)
    } else {
      // FAILED hoặc trạng thái lạ -> Đứt chuỗi
      break;
    }

    // Lùi về ngày hôm trước
    checkDate = checkDate.subtract(1, 'day');
  }

  await db.habit.update({
    where: { id: habitId },
    data: { streak: streak }
  });

  return streak;
};