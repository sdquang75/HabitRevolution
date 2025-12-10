'use client';

import React from 'react';
import { Card, Typography } from 'antd';
import { RocketOutlined } from '@ant-design/icons'; // Icon đại diện cho thói quen

const { Title, Text } = Typography;

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    // Tailwind: Căn giữa theo chiều dọc/ngang, nền xám nhẹ
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      
      {/* Antd Card: Khung chứa nội dung, responsive width */}
      <Card 
        className="w-full max-w-md shadow-lg rounded-xl border-t-4 border-atomic-main"
       variant="borderless"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-atomic-light mb-4">
            <RocketOutlined className="text-2xl text-atomic-main" />
          </div>
          <Title level={2} className="!mb-2 !text-gray-900">
            {title}
          </Title>
          <Text type="secondary">
            {subtitle}
          </Text>
        </div>

        {children}
      </Card>

      {/* Footer nhỏ */}
      <div className="fixed bottom-4 text-center w-full">
        <Text type="secondary" className="text-xs">
          © 2025 Habit Evolution. Built for discipline.
        </Text>
      </div>
    </div>
  );
};