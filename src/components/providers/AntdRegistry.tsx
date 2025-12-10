'use client';

import React from 'react';
import '@ant-design/v5-patch-for-react-19';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import type Entity from '@ant-design/cssinjs/lib/Cache';
import { useServerInsertedHTML } from 'next/navigation';
import { ConfigProvider, theme, App } from 'antd';


const StyledComponentsRegistry = ({ children }: { children: React.ReactNode }) => {
    const cache = React.useMemo<Entity>(() => createCache(), []);
    useServerInsertedHTML(() => (
        <style id="antd" dangerouslySetInnerHTML={{ __html: extractStyle(cache, true) }} />
    ));

    return (
        <StyleProvider cache={cache}>
            <ConfigProvider
                theme={{
                    algorithm: theme.defaultAlgorithm, // Hoặc theme.darkAlgorithm cho Beast Mode
                    token: {
                        colorPrimary: '#1677ff', // Màu chủ đạo (Atomic Mode)
                        fontFamily: 'var(--font-inter)', // Đồng bộ với Tailwind font
                    },
                }}
            >
                <App>{children}</App>
            </ConfigProvider>
        </StyleProvider>
    );
};

export default StyledComponentsRegistry;