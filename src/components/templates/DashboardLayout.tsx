'use client';

import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, theme } from 'antd';
import {
  MenuFoldOutlined, MenuUnfoldOutlined,
  FireOutlined, LogoutOutlined, UserOutlined, SettingOutlined
} from '@ant-design/icons';
import { signOut, useSession } from 'next-auth/react'; // Hook lấy session
import { useRouter } from 'next/navigation';

const { Header, Sider, Content } = Layout;

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession(); // Lấy thông tin user đã đăng nhập
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Menu items cho Sidebar
  const menuItems = [
    {
      key: '1',
      icon: <FireOutlined />,
      label: 'Thói quen của tôi',
    },
    {
      key: '2',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
    },
  ];

  // Menu cho User Avatar (Dropdown góc phải)
  const userMenu = [
    {
      key: 'profile',
      label: (
        <div className="px-2 py-1">
          <div className="font-bold">{session?.user?.name || 'User'}</div>
          <div className="text-xs text-gray-500">{session?.user?.email}</div>
        </div>
      ),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: () => signOut({ callbackUrl: '/login' }), // NextAuth Logout
    },
  ];

  return (
    <Layout className="min-h-screen">
      {/* Sidebar bên trái */}
      <Sider trigger={null} collapsible collapsed={collapsed} className="!bg-gray-900">
        <div className="h-16 flex items-center justify-center">
          {/* Logo đơn giản */}
          <FireOutlined className="text-2xl text-atomic-main" />
          {!collapsed && <span className="ml-2 text-white font-bold text-lg">Habit Evo</span>}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          items={menuItems}
          className="!bg-transparent"
        />
      </Sider>

      <Layout>
        {/* Header ở trên */}
        <Header style={{ padding: 0, background: colorBgContainer }} className="flex justify-between items-center px-4 shadow-sm">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />

          {/* User Info & Avatar */}
          <div className="mr-4">
            <Dropdown menu={{ items: userMenu }} trigger={['click']}>
              <div className="cursor-pointer flex items-center gap-2 hover:bg-gray-100 px-3 py-1 rounded-full transition">
                <Avatar
                  style={{ backgroundColor: '#10b981' }}
                  icon={<UserOutlined />}
                >
                  {session?.user?.name?.[0]?.toUpperCase()}
                </Avatar>
                <span className="hidden md:block font-medium text-gray-700">
                  {session?.user?.name}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Nội dung chính (Page Content) */}
        <Content
          style={{
            margin: 0, // Bỏ margin ngoài
            padding: 0, // Bỏ padding để HabitBoard tràn viền
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: 'hidden' // Quan trọng: Chặn cuộn ở cấp Layout
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};