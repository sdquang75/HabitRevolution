import { NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  return apiHandler(async () => {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");

    const body = await req.json();
    const { progress, status } = body; // progress: số lượng, status: COMPLETED/FAILED/SKIPPED

    // 1. Tìm log của ngày hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset về đầu ngày

    // Tìm xem hôm nay đã có log chưa
    const existingLog = await db.habitLog.findFirst({
        where: {
            habitId: params.id,
            completedAt: { gte: today }
        }
    });

    if (existingLog) {
        // Update log cũ
        const updatedLog = await db.habitLog.update({
            where: { id: existingLog.id },
            data: { 
                currentValue: progress, // Cần thêm trường này vào schema nếu chưa có, tạm thời mình giả định logic
                // Ở schema cũ mình chỉ có completedAt, giờ mình sẽ đơn giản hóa:
                // Nếu progress >= goal -> Tạo log mới là xong. 
                // Nhưng để làm đúng ảnh (0/2), ta nên update schema HabitLog thêm field `currentValue`.
            }
        });
        return NextResponse.json(updatedLog);
    } else {
        // Tạo log mới
        const newLog = await db.habitLog.create({
            data: {
                habitId: params.id,
                userId: session.user.id,
                completedAt: new Date(),
                // currentValue: progress
            }
        });
        return NextResponse.json(newLog);
    }
  });
}