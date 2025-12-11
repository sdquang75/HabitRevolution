import dayjs from 'dayjs';

export const generateHabitFromPrompt = (prompt: string) => {
  const p = prompt.toLowerCase();
  
  // Template mặc định
  let result = {
    title: "Thói quen mới",
    description: "Tạo từ AI: " + prompt,
    frequency: "daily",
    goalCount: 1,
    goalUnit: "lần",
    timeOfDay: [] as string[],
    difficulty: 1,
    reminders: [] as any[],
    mode: "ATOMIC", // Mặc định Atomic cho dễ thở
    stakeAmount: 0
  };

  // 1. Phân tích Tên & Chủ đề
  if (p.includes("nước")) { result.title = "Uống nước"; result.goalCount = 2000; result.goalUnit = "ml"; }
  else if (p.includes("chạy")) { result.title = "Chạy bộ"; result.goalCount = 5; result.goalUnit = "km"; result.timeOfDay = ["morning"]; }
  else if (p.includes("sách")) { result.title = "Đọc sách"; result.goalCount = 20; result.goalUnit = "trang"; result.timeOfDay = ["evening"]; }
  else if (p.includes("ngủ")) { result.title = "Ngủ sớm"; result.goalCount = 1; result.goalUnit = "lần"; result.reminders = [{time: "22:30", message: "Tắt điện thoại!"}]; }
  else if (p.includes("code") || p.includes("lập trình")) { result.title = "Luyện Code"; result.goalCount = 2; result.goalUnit = "giờ"; result.mode = "BEAST"; result.stakeAmount = 50000; }

  // 2. Phân tích Thời gian
  if (p.includes("sáng")) result.timeOfDay.push("morning");
  if (p.includes("tối")) result.timeOfDay.push("evening");
  if (p.includes("chiều")) result.timeOfDay.push("afternoon");

  // 3. Phân tích Số lượng
  const numbers = p.match(/\d+/g);
  if (numbers && numbers.length > 0) {
      result.goalCount = parseInt(numbers[0]);
  }

  // 4. Phân tích Chế độ
  if (p.includes("nghiêm túc") || p.includes("phạt") || p.includes("beast")) {
      result.mode = "BEAST";
      result.stakeAmount = 100000;
  }

  return result;
};