'use client';
import { HabitContextWrapper } from '../organisms/HabitContextWrapper';
import { useState, useEffect } from 'react';
import { Dropdown, MenuProps, InputNumber, Button, App } from 'antd';
import {
    CheckOutlined, CloseOutlined, StopOutlined,
    EditOutlined, DeleteOutlined, CheckCircleFilled,
    CloseCircleFilled, StepForwardFilled
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

interface HabitGridCellProps {
    habit: any;
    date: Date;
}

export const HabitGridCell = ({ habit, date }: HabitGridCellProps) => {

    const getLog = () => habit.logs.find((l: any) => dayjs(l.completedAt).isSame(dayjs(date), 'day'));
    const initialLog = getLog();
    const router = useRouter();
    const { message } = App.useApp();

    // Tìm log của ngày này
    const log = habit.logs.find((l: any) => dayjs(l.completedAt).isSame(dayjs(date), 'day'));

    const [currentVal, setCurrentVal] = useState(log?.currentValue || 0);
    const [status, setStatus] = useState(log?.status || 'IN_PROGRESS');
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const newLog = getLog();
        setCurrentVal(newLog?.currentValue || 0);
        setStatus(newLog?.status || 'IN_PROGRESS');
    }, [habit, date]);
    const goal = habit.goalCount || 1;
    const isBeast = habit.mode === 'BEAST';






    // --- API GỬI LOG ---
    const submitLog = async (val: number, newStatus: string) => {
        if (loading) return;
        setLoading(true);

        // Optimistic Update
        setCurrentVal(val);
        setStatus(newStatus);

        try {
            await fetch(`/api/habits/${habit.id}/log`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    progress: val,
                    status: newStatus,
                    date: date // Quan trọng: Gửi ngày của ô này lên
                }),
            });
            router.refresh();
            // message.success('Đã lưu');
        } catch (e) {
            message.error('Lỗi');
        } finally {
            setLoading(false);
        }
    };

    // --- LOGIC TOGGLE (CHUỘT TRÁI) ---
    const handleToggle = async () => {
        let nextStatus = 'DONE';
        let nextVal = goal;


        // Vòng lặp: IN_PROGRESS -> DONE -> FAILED -> SKIPPED -> IN_PROGRESS
        if (status === 'DONE') { nextStatus = 'FAILED'; nextVal = 0; }
        else if (status === 'FAILED') {
            if (isBeast) { nextStatus = 'IN_PROGRESS'; nextVal = 0; } // Beast ko có skip
            else { nextStatus = 'SKIPPED'; nextVal = 0; }
        }
        else if (status === 'SKIPPED') { nextStatus = 'IN_PROGRESS'; nextVal = 0; }

        // Nếu đang là IN_PROGRESS mà chưa xong -> Done luôn
        else if (status === 'IN_PROGRESS') { nextStatus = 'DONE'; nextVal = goal; }
        handleOptimisticUpdate(nextVal, nextStatus);
        submitLog(nextVal, nextStatus);

        handleOptimisticUpdate(nextVal, nextStatus);
        try {
            await fetch(`/api/habits/${habit.id}/log`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    progress: nextVal,
                    status: nextStatus,
                    date: date
                }),
            });
            // router.refresh(); // Không cần gọi refresh ở đây nếu muốn mượt, wrapper đã lo hoặc để tự nhiên
        } catch (e) { }
    };
    const handleOptimisticUpdate = (val: number, newStatus: string) => {
        setCurrentVal(val);
        setStatus(newStatus);
    };

    // --- MENU CHUỘT PHẢI ---
    const menuItems: MenuProps['items'] = [
        {
            key: 'done',
            label: 'Hoàn thành',
            icon: <CheckCircleFilled className="text-emerald-500" />,
            onClick: () => submitLog(goal, 'DONE'),
        },
        {
            key: 'input',
            label: 'Nhập số...',
            icon: <EditOutlined />,
            children: [{
                key: 'input_num',
                label: (
                    <div onClick={e => e.stopPropagation()} className="p-1">
                        <InputNumber
                            min={0} max={goal} value={currentVal}
                            onChange={(v) => submitLog(v || 0, (v || 0) >= goal ? 'DONE' : 'IN_PROGRESS')}
                            autoFocus
                        />
                    </div>
                )
            }]
        },
        { type: 'divider' },
        {
            key: 'skip',
            label: 'Bỏ qua',
            icon: <StepForwardFilled />,
            disabled: isBeast,
            onClick: () => submitLog(0, 'SKIPPED'),
        },
        {
            key: 'fail',
            label: 'Thất bại',
            icon: <CloseCircleFilled className="text-red-500" />,
            danger: true,
            onClick: () => submitLog(0, 'FAILED'),
        }
    ];

    // --- RENDER MÀU SẮC ---
    let icon = <div className="w-1.5 h-1.5 rounded-full bg-gray-200 mx-auto" />; // Chưa làm
    let bgClass = "hover:bg-gray-50 cursor-pointer";
    let borderClass = "border-transparent";

    // Logic hiển thị trạng thái
    const isDone = status === 'DONE' || (currentVal >= goal && goal > 0);

    if (isDone) {
        icon = <CheckOutlined className="text-emerald-600" />;
        bgClass = "bg-emerald-50 hover:bg-emerald-100 cursor-pointer";
    } else if (status === 'FAILED') {
        icon = <CloseOutlined className="text-red-500" />;
        bgClass = "bg-red-50 hover:bg-red-100 cursor-pointer";
    } else if (status === 'SKIPPED') {
        icon = <StopOutlined className="text-gray-400" />;
        bgClass = "bg-gray-100 hover:bg-gray-200 cursor-pointer";
    } else if (currentVal > 0) {
        // Đang làm dở (Vàng)
        icon = <span className="text-xs font-bold text-yellow-600">{currentVal}</span>;
        bgClass = "bg-yellow-50 hover:bg-yellow-100 cursor-pointer";
    }

    // Highlight ngày hôm nay
    const isToday = dayjs(date).isSame(dayjs(), 'day');
    if (isToday) borderClass = "border-blue-200 bg-blue-50/30";

    return (
        <HabitContextWrapper habit={habit} date={date}>
            <div
                className={`h-12 w-full flex items-center justify-center transition-all border ${borderClass} ${bgClass}`}
                onClick={handleToggle}
                title={`${dayjs(date).format('DD/MM')}: ${status}`}
            >
                {loading ? <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" /> : icon}
            </div>
        </HabitContextWrapper>
    );
};