'use client';

import { Modal, Form, Input, Switch, Slider, Button, App, Tabs, Checkbox, Select, InputNumber, Space } from 'antd';
import { useState } from 'react';
import { FireOutlined, SmileOutlined, ThunderboltOutlined, PlusOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

interface CreateHabitModalProps {
  open: boolean;
  onClose: () => void;
}

const { Option } = Select;

export const CreateHabitModal = ({ open, onClose }: CreateHabitModalProps) => {
  const [form] = Form.useForm();
  const [isBeastMode, setIsBeastMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const router = useRouter();

  const themeColor = isBeastMode ? '#ef4444' : '#10b981';

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Chuẩn hóa dữ liệu trước khi gửi
      const payload = {
        title: values.title,
        description: values.description,
        mode: isBeastMode ? 'BEAST' : 'ATOMIC',
        difficulty: values.difficulty || 1,
        stakeAmount: values.stakeAmount || 0,
        frequency: values.frequency,
        goalCount: values.goalCount,
        goalUnit: values.goalUnit,
        timeOfDay: JSON.stringify(values.timeOfDay || []), // Convert mảng sang string
        checklist: values.checklist || [], // Mảng các việc nhỏ
      };

      // Gửi lên API (Lưu ý: Bạn cần update API route để nhận các trường mới này)
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed');

      message.success(isBeastMode ? 'Thử thách đã được chấp nhận!' : 'Đã tạo thói quen mới!');
      form.resetFields();
      setIsBeastMode(false);
      onClose();
      router.refresh();
    } catch (error) {
      message.error('Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // --- NỘI DUNG TAB 1: THIẾT LẬP CHUNG ---
  const GeneralTab = () => (
    <div className="pt-2">
       {/* Switch Mode - Đặt lên đầu để gây chú ý */}
       <div className={`flex items-center justify-between p-4 rounded-lg mb-6 border transition-all ${
          isBeastMode ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
       }`}>
          <div>
            <span className={`font-bold block ${isBeastMode ? 'text-force-main' : 'text-atomic-main'}`}>
                {isBeastMode ? 'CHẾ ĐỘ QUÁI THÚ (BEAST MODE)' : 'Chế độ Nguyên tử (Atomic Mode)'}
            </span>
            <span className="text-xs text-gray-500">
                {isBeastMode ? 'Không khoan nhượng. Không nhắc nhở. Phạt tiền.' : 'Nhẹ nhàng, xây dựng thói quen từ từ.'}
            </span>
          </div>
          <Switch 
              checked={isBeastMode} 
              onChange={setIsBeastMode}
              checkedChildren={<FireOutlined />}
              unCheckedChildren={<SmileOutlined />}
              className={isBeastMode ? "!bg-force-main" : "!bg-atomic-main"}
          />
      </div>

      <Form.Item name="title" rules={[{ required: true, message: 'Nhập tên thói quen' }]}>
        <Input 
          placeholder="Tên thói quen (VD: Đọc sách)" 
          size="large" 
          className="font-semibold text-lg"
          suffix={isBeastMode ? <ThunderboltOutlined className="text-force-main"/> : <SmileOutlined className="text-atomic-main"/>}
        />
      </Form.Item>

      <Form.Item name="description">
          <Input.TextArea placeholder="Mô tả hoặc cam kết của bạn..." rows={2} />
      </Form.Item>

      <Form.Item label="Độ khó">
          <Slider 
              min={1} max={10} defaultValue={1}
              trackStyle={{ backgroundColor: themeColor }}
              handleStyle={{ borderColor: themeColor }}
          />
      </Form.Item>

      {isBeastMode && (
         <Form.Item name="stakeAmount" label="Tiền phạt cam kết (VNĐ)" rules={[{ required: true }]}>
            <InputNumber 
                style={{ width: '100%' }} 
                prefix="₫" 
                size="large" 
                className="border-red-500 text-red-600 font-bold"
            />
         </Form.Item>
      )}
    </div>
  );

  // --- NỘI DUNG TAB 2: LỊCH TRÌNH & CHECKLIST (Giống ảnh mẫu) ---
  const ScheduleTab = () => (
    <div className="pt-2">
      <Space.Compact block className="mb-4">
        <Form.Item name="frequency" initialValue="daily" noStyle>
            <Select style={{ width: '40%' }}>
                <Option value="daily">Hàng ngày</Option>
                <Option value="weekly">Hàng tuần</Option>
                {/* Beast Mode khóa tùy chọn này nếu muốn hard-core */}
                <Option value="monthly" disabled={isBeastMode}>Hàng tháng</Option>
            </Select>
        </Form.Item>
        <Form.Item name="goalCount" initialValue={1} noStyle>
             <InputNumber min={1} style={{ width: '30%' }} />
        </Form.Item>
        <Form.Item name="goalUnit" initialValue="lần" noStyle>
             <Select style={{ width: '30%' }}>
                <Option value="lần">lần</Option>
                <Option value="phút">phút</Option>
                <Option value="km">km</Option>
                <Option value="trang">trang</Option>
             </Select>
        </Form.Item>
      </Space.Compact>

      <Form.Item label="Thời điểm trong ngày" name="timeOfDay">
        <Checkbox.Group className="w-full">
            <div className="grid grid-cols-3 gap-2">
                <div className="border rounded p-2 text-center hover:bg-gray-50 cursor-pointer">
                    <Checkbox value="morning">Sáng</Checkbox>
                </div>
                <div className="border rounded p-2 text-center hover:bg-gray-50 cursor-pointer">
                    <Checkbox value="afternoon">Chiều</Checkbox>
                </div>
                <div className="border rounded p-2 text-center hover:bg-gray-50 cursor-pointer">
                    <Checkbox value="evening">Tối</Checkbox>
                </div>
            </div>
        </Checkbox.Group>
      </Form.Item>

      {/* --- PHÁT TRIỂN THÊM: CHECKLIST (Chia nhỏ công việc) --- */}
      <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-600">Quy trình (Checklist)</span>
            <span className="text-xs text-gray-400">Chia nhỏ để dễ làm hơn</span>
          </div>
          
          <Form.List name="checklist">
            {(fields, { add, remove }) => (
                <>
                {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="flex gap-2 mb-2">
                        <Form.Item {...restField} name={[name, 'content']} noStyle>
                            <Input placeholder="Bước nhỏ (VD: Mở sách ra)" />
                        </Form.Item>
                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                    </div>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Thêm bước nhỏ
                </Button>
                </>
            )}
          </Form.List>
      </div>
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={600} // Rộng hơn chút để chứa nhiều info
      className="create-habit-modal"
      title={null}
    >
        {/* Custom Header */}
        <div className={`-mt-5 -mx-6 px-6 py-4 rounded-t-lg flex items-center gap-3 transition-colors ${
             isBeastMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800 border-b'
        }`}>
            {isBeastMode ? <FireOutlined className="text-red-500 text-xl"/> : <PlusOutlined className="text-xl"/>}
            <span className="font-bold text-lg">Tạo thói quen mới</span>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} className="mt-4">
            <Tabs 
                defaultActiveKey="1"
                items={[
                    { key: '1', label: 'Cơ bản', children: <GeneralTab /> },
                    { key: '2', label: 'Chi tiết & Lịch', children: <ScheduleTab /> },
                ]}
            />
            
            <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                <Button onClick={onClose} size="large">Đóng</Button>
                <Button 
                    type="primary" 
                    htmlType="submit" 
                    size="large" 
                    loading={loading}
                    style={{ backgroundColor: themeColor }}
                    className="font-bold shadow-md"
                >
                    Lưu thói quen
                </Button>
            </div>
        </Form>
    </Modal>
  );
};