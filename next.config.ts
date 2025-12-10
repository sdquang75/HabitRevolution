import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

// Tạo plugin bọc lấy file request cấu hình i18n
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  /* Các config khác nếu có thì để ở đây */
};

// Export default với hàm bọc của next-intl
export default withNextIntl(nextConfig);