import { useEffect } from 'react';
import dayjs from 'dayjs';

export const useHabitNotification = (habits: any[]) => {
  useEffect(() => {
    // 1. Xin quyền thông báo
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    // 2. Hàm kiểm tra và bắn noti
    const checkReminders = () => {
      const now = dayjs().format('HH:mm');
      
      habits.forEach(habit => {
        if (!habit.reminders) return;
        const reminders = JSON.parse(habit.reminders); // ["08:00", "20:00"]
        
        if (reminders.includes(now)) {
           // Bắn thông báo
           new Notification(`Đến giờ rồi: ${habit.title}`, {
             body: habit.mode === 'BEAST' 
                ? `Đứng dậy ngay! Tiền phạt đang chờ đấy.` 
                : `Dành chút thời gian cho bản thân nào.`,
             icon: '/icon.png' // (Nếu có)
           });
        }
      });
    };

    // 3. Chạy kiểm tra mỗi phút
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [habits]);
};