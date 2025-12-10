import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { db } from '@/lib/db';
import { auth } from '@/auth';

// 1. METHOD PATCH: Dùng để Update hoặc Tạo mới Log (Check-in)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return apiHandler(async () => {
    const session = await auth();
    // Validate User
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { id } = await params;
    const body = await req.json();
    // Lấy thêm 'note' từ body nếu có
    const { progress, status, date, note } = body; 

    // QUAN TRỌNG: Xác định ngày cần sửa (Lấy từ body gửi lên, nếu không có thì lấy hôm nay)
    const targetDate = date ? new Date(date) : new Date();
    
    // Tạo khung giờ 00:00 -> 23:59 của NGÀY CẦN SỬA (chứ không phải hôm nay)
    const searchStart = new Date(targetDate);
    searchStart.setHours(0, 0, 0, 0);
    const searchEnd = new Date(targetDate);
    searchEnd.setHours(23, 59, 59, 999);

    // Tìm log trong khoảng thời gian đó
    const existingLog = await db.habitLog.findFirst({
        where: {
            habitId: id,
            completedAt: { gte: searchStart, lte: searchEnd }
        }
    });

    const habit = await db.habit.findUnique({ where: { id } });
    if (!habit) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (existingLog) {
        // UPDATE
        const updatedLog = await db.habitLog.update({
            where: { id: existingLog.id },
            data: {
                currentValue: progress,
                status: status,
                targetValue: habit.goalCount,
                note: note !== undefined ? note : existingLog.note, // Cập nhật note nếu có
            }
        });
        return NextResponse.json(updatedLog);
    } else {
        // CREATE
        const newLog = await db.habitLog.create({
            data: {
                habitId: id,
                userId: userId,
                currentValue: progress || 0,
                targetValue: habit.goalCount,
                status: status || 'IN_PROGRESS',
                completedAt: targetDate, // Lưu đúng ngày được chọn
                note: note || null,
            }
        });
        return NextResponse.json(newLog);
    }
  });
}

// 2. METHOD DELETE: Dùng để Reset/Xóa Log của một ngày
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return apiHandler(async () => {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    // Lấy ngày cần xóa từ URL (Query Param)
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');
    
    if (!dateStr) return NextResponse.json({ error: "Missing date param" }, { status: 400 });

    const targetDate = new Date(dateStr);
    const start = new Date(targetDate.setHours(0,0,0,0));
    const end = new Date(targetDate.setHours(23,59,59,999));

    // Xóa tất cả log trong ngày đó của habit này
    await db.habitLog.deleteMany({
      where: {
        habitId: id,
        completedAt: { gte: start, lte: end }
      }
    });

    return NextResponse.json({ message: "Reset successfully" });
  });
}