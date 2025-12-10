import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
        colors: {
            // Định nghĩa màu ngữ nghĩa cho App
            'atomic-green': '#10b981', // Màu cho chế độ dễ
            'force-red': '#ef4444',    // Màu cho chế độ khó
            'bg-dark': '#0f172a'
        }
    },
  },
  plugins: [],
//   corePlugins: {
//     // preflight: false, // Cân nhắc tắt cái này nếu Antd bị vỡ style, nhưng thường v5 không cần tắt.
//   }
};
export default config;