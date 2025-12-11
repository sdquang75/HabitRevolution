import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { db } from '@/lib/db';
import { auth } from '@/auth';

// 1. GET: Lấy danh sách thói quen (Cho Dashboard)
export async function GET(req: Request) {
  return apiHandler(async () => {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const habits = await db.habit.findMany({
      where: { userId: session.user.id },
      include: { logs: true }, // Lấy kèm logs để tính toán
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(habits);
  });
}

// 2. POST: Tạo thói quen mới (Đã cập nhật Full tính năng)
export async function POST(req: Request) {
  return apiHandler(async () => {
    const session = await auth();
    if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
        title, description, difficulty, stakeAmount, 
        frequency, goalCount, goalUnit, timeOfDay, mode,
        // Các trường mới:
        startDate, endDate, reminders, checklist,
        endConditionType, endConditionValue
    } = body;

    // Validate cơ bản
    if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

    const newHabit = await db.habit.create({
      data: {
        userId: session.user.id,
        title,
        description,
        difficulty: difficulty || 1,
        stakeAmount: stakeAmount || 0,
        frequency: frequency || 'daily',
        goalCount: goalCount || 1,
        goalUnit: goalUnit || 'lần',
        timeOfDay: timeOfDay || '[]', // JSON string
        mode: mode || 'ATOMIC',
        
        // --- CÁC TRƯỜNG MỚI ---
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        reminders: reminders || '[]', // JSON string từ client gửi lên
        endConditionType: endConditionType || 'NEVER',
        endConditionValue: endConditionValue || 0,
        
        // Tạo checklist con ngay lập tức nếu có
        checklist: checklist && checklist.length > 0 ? {
            create: checklist.map((item: any) => ({
                content: item.content
            }))
        } : undefined
      }
    });

    return NextResponse.json(newHabit);
  });
}