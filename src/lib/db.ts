import { PrismaClient } from '@prisma/client';

// Khai báo biến global để TypeScript không báo lỗi khi gán vào globalThis
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Nếu đã có instance trong global thì dùng lại, nếu chưa thì tạo mới
export const db = globalForPrisma.prisma ?? new PrismaClient();

// Nếu không phải môi trường production (tức là đang dev), thì lưu instance vào global
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}