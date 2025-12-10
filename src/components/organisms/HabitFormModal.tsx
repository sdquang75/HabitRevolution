'use client';

import { Modal, Form, Input, Switch, Button, App, Select, InputNumber, DatePicker, TimePicker, Divider } from 'antd';
import { useState, useEffect } from 'react';
import { 
  FireOutlined, SmileOutlined, ThunderboltFilled, 
  SyncOutlined, AimOutlined, SunOutlined, CalendarOutlined, 
  BellOutlined, FolderOpenOutlined, UnorderedListOutlined,
  PlusOutlined, DeleteOutlined, 
  EditOutlined, // <--- Đã thêm cái này
  BulbOutlined  // <--- Thay MagicOutlined bằng cái này
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

const { Option } = Select;

interface HabitFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: any;
}

// Component con giúp layout đẹp như hình
const FormRow = ({ icon, label, children, danger = false }: any) => (
  <div className="flex items-start gap-4 mb-5">
    <div className={`mt-1.5 text-xl ${danger ? 'text-red-500' : 'text-gray-400'}`}>
        {icon}
    </div>
    <div className="flex-1">
        <div className={`text-sm font-semibold mb-1 ${danger ? 'text-red-500' : 'text-gray-700'}`}>
            {label}
        </div>
        <div className="w-full">{children}</div>
    </div>
  </div>
);

export const HabitFormModal = ({ open, onClose, initialData }: HabitFormModalProps) => {
  const [form] = Form.useForm();
  const [isBeastMode, setIsBeastMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const router = useRouter();

  const isEdit = !!initialData;

  useEffect(() => {
    if (open) {
      if (initialData) {
        setIsBeastMode(initialData.mode === 'BEAST');
        form.setFieldsValue({
            ...initialData,
            startDate: dayjs(initialData.startDate),
            endDate: initialData.endDate ? dayjs(initialData.endDate) : null,
            reminders: initialData.reminders ? JSON.parse(initialData.reminders).map((t: string) => dayjs(t, 'HH:mm')) : [],
            timeOfDay: initialData.timeOfDay ? JSON.parse(initialData.timeOfDay) : [],
        });
      } else {
        setIsBeastMode(false);
        form.resetFields();
        form.setFieldsValue({ 
            frequency: 'daily', goalCount: 1, goalUnit: 'lần', difficulty: 1,
            startDate: dayjs(), 
            endDate: null // Mặc định không bao giờ kết thúc
        });
      }
    }
  }, [open, initialData, form]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Chuẩn hóa dữ liệu
      const payload = {
        ...values,
        mode: isBeastMode ? 'BEAST' : 'ATOMIC',
        startDate: values.startDate.toISOString(),
        endDate: values.endDate ? values.endDate.toISOString() : null,
        reminders: values.reminders?.map((t: any) => t.format('HH:mm')) || [], // Convert dayjs -> string HH:mm
        timeOfDay: JSON.stringify(values.timeOfDay || []),
      };

      const url = isEdit ? `/api/habits/${initialData.id}` : '/api/habits';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      message.success(isEdit ? 'Đã cập nhật!' : 'Đã tạo thói quen!');
      onClose();
      router.refresh();
    } catch (error) {
      message.error('Có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  // Tính năng "Điền thông minh" (Mockup)
  const handleSmartFill = () => {
      form.setFieldsValue({
          title: "Đọc sách Deep Work",
          goalCount: 20,
          goalUnit: "trang",
          timeOfDay: ["evening"],
          description: "Đọc trước khi ngủ, không cầm điện thoại."
      });
      message.info("Đã điền mẫu gợi ý!");
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      title={null}
      className="habit-form-modal"
      style={{ top: 20 }}
    >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${isBeastMode ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                    {isEdit ? <EditOutlined /> : <PlusOutlined />}
                </div>
                <span className="font-bold text-lg">{isEdit ? 'Chỉnh sửa' : 'Thói quen mới'}</span>
            </div>
            
            {/* Nút Smart Fill */}
            {!isEdit && (
                <Button type="dashed" icon={<BulbOutlined />} onClick={handleSmartFill} className="text-purple-600 border-purple-300">
                    Điền thông minh
                </Button>
            )}
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
            
            {/* TÊN THÓI QUEN (Nổi bật) */}
            <div className="flex gap-3 items-start mb-6">
                 <div className="mt-2 text-gray-400 text-xl"><SmileOutlined /></div>
                 <Form.Item name="title" rules={[{ required: true, message: 'Nhập tên thói quen' }]} className="flex-1 mb-0">
                     <Input 
                        placeholder="Nhập tên thói quen" 
                        className="text-xl font-bold border-none border-b border-gray-200 rounded-none px-0 focus:shadow-none focus:border-purple-500 hover:border-gray-400 placeholder:font-normal" 
                     />
                 </Form.Item>
            </div>

            {/* SWITCH BEAST MODE */}
            <div className={`flex items-center justify-between p-3 rounded-xl mb-6 border ${isBeastMode ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                    <Switch 
                        checked={isBeastMode} onChange={setIsBeastMode}
                        className={isBeastMode ? "!bg-red-500" : "!bg-gray-400"}
                    />
                    <div>
                        <div className={`font-bold text-sm ${isBeastMode ? 'text-red-600' : 'text-gray-700'}`}>
                            {isBeastMode ? 'CHẾ ĐỘ QUÁI THÚ (BEAST MODE)' : 'Chế độ Nguyên tử (Atomic Mode)'}
                        </div>
                        <div className="text-xs text-gray-500">
                            {isBeastMode ? 'Không khoan nhượng. Không kết thúc.' : 'Xây dựng từ từ.'}
                        </div>
                    </div>
                </div>
                <div className="text-2xl">{isBeastMode ? <ThunderboltFilled className="text-red-500" /> : <SmileOutlined className="text-green-500" />}</div>
            </div>

            {/* SECTION: LỊCH TRÌNH */}
            <FormRow icon={<SyncOutlined />} label="Lặp lại">
                <div className="flex gap-2">
                    <Form.Item name="frequency" noStyle>
                        <Select className="w-full">
                            <Option value="daily">Hàng ngày</Option>
                            <Option value="weekly">Hàng tuần</Option>
                            <Option value="monthly">Hàng tháng</Option>
                        </Select>
                    </Form.Item>
                    {/* Phần mở rộng: Mỗi X ngày (Phát triển sau) */}
                    <Select defaultValue="1" disabled className="w-32">
                        <Option value="1">Mỗi ngày</Option>
                    </Select>
                </div>
            </FormRow>

            {/* SECTION: MỤC TIÊU */}
            <FormRow icon={<AimOutlined />} label="Mục tiêu">
                <div className="flex gap-2">
                    <Form.Item name="goalCount" noStyle><InputNumber min={1} className="w-24" /></Form.Item>
                    <Form.Item name="goalUnit" noStyle>
                        <Select className="flex-1">
                            <Option value="lần">lần</Option>
                            <Option value="phút">phút</Option>
                            <Option value="km">km</Option>
                            <Option value="trang">trang</Option>
                        </Select>
                    </Form.Item>
                    <Select defaultValue="day" className="w-32" disabled><Option value="day">mỗi ngày</Option></Select>
                </div>
            </FormRow>

            {/* BEAST MODE EXCLUSIVE: TIỀN PHẠT */}
            {isBeastMode && (
                 <FormRow icon={<FireOutlined />} label="Cam kết tiền phạt" danger>
                     <Form.Item name="stakeAmount" noStyle rules={[{ required: true, message: 'Nhập số tiền cam kết' }]}>
                        <InputNumber 
                            className="w-full border-red-300 text-red-600 font-bold" 
                            prefix="₫" 
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        />
                     </Form.Item>
                 </FormRow>
            )}

            {/* SECTION: THỜI ĐIỂM */}
            <FormRow icon={<SunOutlined />} label="Thời điểm trong ngày">
                 <Form.Item name="timeOfDay" noStyle>
                    <Select mode="multiple" placeholder="Bất kỳ lúc nào" className="w-full">
                        <Option value="morning">Buổi sáng (Morning)</Option>
                        <Option value="afternoon">Buổi chiều (Afternoon)</Option>
                        <Option value="evening">Buổi tối (Evening)</Option>
                    </Select>
                 </Form.Item>
            </FormRow>

            {/* SECTION: THỜI HẠN */}
            <FormRow icon={<CalendarOutlined />} label="Thời gian thực hiện">
                <div className="flex gap-2">
                    <Form.Item name="startDate" noStyle><DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Ngày bắt đầu" /></Form.Item>
                    <div className="text-gray-400 pt-1">➔</div>
                    <Form.Item name="endDate" noStyle>
                        <DatePicker 
                            format="DD/MM/YYYY" className="w-full" 
                            placeholder={isBeastMode ? "Không bao giờ" : "Ngày kết thúc"} 
                            disabled={isBeastMode} // Beast Mode là mãi mãi
                        />
                    </Form.Item>
                </div>
                {/* Logic phụ: Điều kiện kết thúc */}
                <div className="mt-2 text-xs text-gray-400 flex justify-between">
                     <span>Điều kiện kết thúc:</span>
                     <span className="font-bold">{isBeastMode ? 'Vĩnh viễn (Never)' : 'Theo ngày'}</span>
                </div>
            </FormRow>

            {/* SECTION: NHẮC NHỞ */}
            <FormRow icon={<BellOutlined />} label="Nhắc nhở">
                <Form.List name="reminders">
                    {(fields, { add, remove }) => (
                        <div className="space-y-2">
                            {fields.map(({ key, name, ...restField }) => (
                                <div key={key} className="flex gap-2 items-center">
                                    <Form.Item {...restField} name={name} noStyle>
                                        <TimePicker format="HH:mm" className="w-full" />
                                    </Form.Item>
                                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                </div>
                            ))}
                            <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add(dayjs('09:00', 'HH:mm'))}>
                                Thêm nhắc nhở mới
                            </Button>
                        </div>
                    )}
                </Form.List>
            </FormRow>

            {/* SECTION: CHECKLIST */}
            <FormRow icon={<UnorderedListOutlined />} label="Danh sách kiểm tra (Quy trình nhỏ)">
                 <Form.List name="checklist">
                    {(fields, { add, remove }) => (
                        <div className="space-y-2">
                            {fields.map(({ key, name, ...restField }) => (
                                <div key={key} className="flex gap-2 items-center">
                                    <Form.Item {...restField} name={[name, 'content']} noStyle>
                                        <Input placeholder="Bước nhỏ..." />
                                    </Form.Item>
                                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                </div>
                            ))}
                            <Button type="text" icon={<PlusOutlined />} onClick={() => add()} className="text-gray-500">
                                Thêm mục mới
                            </Button>
                        </div>
                    )}
                </Form.List>
            </FormRow>
            
            <Divider />

            {/* FOOTER BUTTONS */}
            <div className="flex justify-end gap-3">
                <Button size="large" onClick={onClose}>Đóng</Button>
                <Button 
                    type="primary" htmlType="submit" size="large" loading={loading}
                    className={`font-bold shadow-lg ${isBeastMode ? 'bg-red-500 hover:!bg-red-600' : 'bg-emerald-500 hover:!bg-emerald-600'}`}
                >
                    {isEdit ? 'Lưu thay đổi' : 'Tạo thói quen'}
                </Button>
            </div>

        </Form>
    </Modal>
  );
};