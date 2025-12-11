'use client';

import { Modal, Form, Input, Switch, Button, App, Select, InputNumber, DatePicker, TimePicker, Divider, Radio, Row, Col, Card } from 'antd';
import { useState, useEffect } from 'react';
import { 
  FireOutlined, SmileOutlined, ThunderboltFilled, 
  SyncOutlined, AimOutlined, SunOutlined, CalendarOutlined, 
  BellOutlined, UnorderedListOutlined,
  PlusOutlined, DeleteOutlined, EditOutlined, BulbOutlined,
  RobotOutlined, CheckSquareOutlined, FlagOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { generateHabitFromPrompt } from '@/lib/ai-habit';

const { Option } = Select;
const { TextArea } = Input;

interface HabitFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: any;
}

// Helper Row Component
const FormRow = ({ icon, label, children, danger = false, subLabel }: any) => (
  <div className="flex items-start gap-4 mb-5 border-b border-gray-50 pb-4 last:border-0">
    <div className={`mt-1 text-xl ${danger ? 'text-red-500' : 'text-gray-400'}`}>{icon}</div>
    <div className="flex-1">
        <div className={`text-sm font-semibold ${danger ? 'text-red-500' : 'text-gray-700'}`}>{label}</div>
        {subLabel && <div className="text-xs text-gray-400 mb-2">{subLabel}</div>}
        <div className="w-full mt-1">{children}</div>
    </div>
  </div>
);

export const HabitFormModal = ({ open, onClose, initialData }: HabitFormModalProps) => {
  const [form] = Form.useForm();
  const [isBeastMode, setIsBeastMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false); // Toggle AI Input
  const [aiPrompt, setAiPrompt] = useState('');
  
  // State quản lý điều kiện kết thúc
  const [endType, setEndType] = useState('NEVER');

  const { message } = App.useApp();
  const router = useRouter();
  const isEdit = !!initialData;

  useEffect(() => {
    if (open) {
      if (initialData) {
        setIsBeastMode(initialData.mode === 'BEAST');
        setEndType(initialData.endConditionType || 'NEVER');
        
        // Parse Reminders JSON
        let parsedReminders = [];
        try {
            const raw = initialData.reminders ? JSON.parse(initialData.reminders) : [];
            // Support backward compatibility (if reminder was just string array)
            parsedReminders = raw.map((r: any) => typeof r === 'string' ? { time: dayjs(r, 'HH:mm'), msg: '' } : { time: dayjs(r.time, 'HH:mm'), msg: r.msg });
        } catch {}

        form.setFieldsValue({
            ...initialData,
            startDate: dayjs(initialData.startDate),
            endDate: initialData.endDate ? dayjs(initialData.endDate) : null,
            timeOfDay: initialData.timeOfDay ? JSON.parse(initialData.timeOfDay) : [],
            reminders: parsedReminders,
        });
      } else {
        // Defaults
        setIsBeastMode(false);
        setEndType('NEVER');
        form.resetFields();
        form.setFieldsValue({ 
            frequency: 'daily', goalCount: 1, goalUnit: 'lần', difficulty: 1,
            startDate: dayjs(), endConditionType: 'NEVER'
        });
      }
    }
  }, [open, initialData, form]);

  // --- AI HANDLER ---
  const handleAiGenerate = () => {
      if (!aiPrompt.trim()) return;
      const aiData = generateHabitFromPrompt(aiPrompt);
      
      form.setFieldsValue(aiData);
      if (aiData.mode === 'BEAST') setIsBeastMode(true);
      
      message.success(<span>🤖 AI đã điền form: <b>{aiData.title}</b></span>);
      setShowAiInput(false);
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        mode: isBeastMode ? 'BEAST' : 'ATOMIC',
        startDate: values.startDate.toISOString(),
        endDate: values.endDate ? values.endDate.toISOString() : null,
        timeOfDay: JSON.stringify(values.timeOfDay || []),
        // Reminders: Map về JSON structure mới
        reminders: JSON.stringify(values.reminders?.map((r: any) => ({
            time: r.time.format('HH:mm'),
            msg: r.msg || ''
        })) || []),
        endConditionType: values.endConditionType,
        endConditionValue: values.endConditionValue
      };

      const url = isEdit ? `/api/habits/${initialData.id}` : '/api/habits';
      const method = isEdit ? 'PATCH' : 'POST'; // Cần update API route.ts để hứng PATCH create nếu chưa có

      // Tạm thời dùng endpoint [id] cho cả edit (PATCH) và create (POST logic trong route gốc)
      // Để đơn giản code này giả định endpoint /api/habits nhận POST
      const actualUrl = isEdit ? `/api/habits/${initialData.id}` : '/api/habits';
      const actualMethod = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(actualUrl, {
        method: actualMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();
    //   message.success(isEdit ? 'Đã cập nhật!' : 'Đã tạo thói quen!');
      onClose();
      router.refresh();
    } catch (error) { message.error('Có lỗi xảy ra.'); } 
    finally { setLoading(false); }
  };

  return (
    <Modal
      open={open} onCancel={onClose} footer={null} width={650} title={null}
      style={{ top: 20 }}
      className="habit-form-modal"
    >
        {/* HEADER & AI TOGGLE */}
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${isBeastMode ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-500'}`}>
                    {isEdit ? <EditOutlined /> : <PlusOutlined />}
                </div>
                <span className="font-bold text-lg">{isEdit ? 'Chỉnh sửa' : 'Thói quen mới'}</span>
            </div>
            {!isEdit && (
                <Button 
                    type={showAiInput ? 'primary' : 'dashed'} 
                    icon={<RobotOutlined />} 
                    onClick={() => setShowAiInput(!showAiInput)}
                    className={showAiInput ? "bg-purple-600" : "text-purple-600 border-purple-300"}
                >
                    AI Magic
                </Button>
            )}
        </div>

        {/* AI INPUT AREA */}
        {showAiInput && (
            <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100 animate-fade-in">
                <div className="flex gap-2">
                    <Input 
                        placeholder="VD: Tôi muốn đọc sách 30 phút mỗi tối và bị phạt 50k nếu lười" 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onPressEnter={handleAiGenerate}
                        prefix={<BulbOutlined className="text-yellow-500" />}
                    />
                    <Button type="primary" onClick={handleAiGenerate} className="bg-purple-600">Tạo</Button>
                </div>
                <div className="text-xs text-purple-400 mt-2 ml-1">AI sẽ tự động phân tích tên, mục tiêu, và chế độ Beast Mode.</div>
            </div>
        )}

        <Form form={form} layout="vertical" onFinish={onFinish}>
            
            {/* TÊN THÓI QUEN */}
            <div className="flex gap-3 items-start mb-4">
                 <div className="mt-3 text-gray-400 text-xl"><SmileOutlined /></div>
                 <Form.Item name="title" rules={[{ required: true, message: 'Nhập tên' }]} className="flex-1 mb-0">
                     <Input placeholder="Tên thói quen (VD: Uống nước)" className="text-xl font-bold border-none border-b rounded-none px-0 focus:shadow-none" />
                 </Form.Item>
            </div>

            {/* SWITCH BEAST MODE */}
            <div className={`flex items-center justify-between p-3 rounded-xl mb-6 border ${isBeastMode ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-center gap-3">
                    <Switch checked={isBeastMode} onChange={setIsBeastMode} className={isBeastMode ? "!bg-red-500" : "!bg-blue-500"} />
                    <div>
                        <div className={`font-bold text-sm ${isBeastMode ? 'text-red-600' : 'text-blue-700'}`}>
                            {isBeastMode ? 'BEAST MODE (Khắc nghiệt)' : 'Normal Mode (Thông thường)'}
                        </div>
                    </div>
                </div>
                {isBeastMode && <ThunderboltFilled className="text-red-500 text-xl" />}
            </div>

            {/* ROW 1: TẦN SUẤT & MỤC TIÊU */}
            <FormRow icon={<SyncOutlined />} label="Lặp lại & Mục tiêu">
                <div className="flex gap-2 mb-2">
                    <Form.Item name="frequency" noStyle><Select className="w-1/3"><Option value="daily">Hàng ngày</Option><Option value="weekly">Hàng tuần</Option></Select></Form.Item>
                    <Form.Item name="goalCount" noStyle><InputNumber min={1} className="w-20" /></Form.Item>
                    <Form.Item name="goalUnit" noStyle>
                        <Select className="flex-1"><Option value="lần">lần</Option><Option value="phút">phút</Option><Option value="km">km</Option><Option value="trang">trang</Option></Select>
                    </Form.Item>
                </div>
                {isBeastMode && (
                    <Form.Item name="stakeAmount" label={<span className="text-red-500 text-xs">Tiền phạt cam kết</span>} className="mb-0">
                        <InputNumber className="w-full border-red-300 text-red-600 font-bold" prefix="₫" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                    </Form.Item>
                )}
            </FormRow>

            {/* ROW 2: THỜI GIAN & THỜI HẠN */}
            <FormRow icon={<CalendarOutlined />} label="Thời gian thực hiện">
                <div className="flex gap-2 mb-3">
                    <div className="flex-1">
                        <div className="text-xs text-gray-400 mb-1">Bắt đầu</div>
                        <Form.Item name="startDate" noStyle><DatePicker format="DD/MM/YYYY" className="w-full" /></Form.Item>
                    </div>
                    {endType === 'DATE' && (
                        <div className="flex-1">
                            <div className="text-xs text-gray-400 mb-1">Kết thúc</div>
                            <Form.Item name="endDate" noStyle><DatePicker format="DD/MM/YYYY" className="w-full" /></Form.Item>
                        </div>
                    )}
                </div>
                
                {/* ĐIỀU KIỆN KẾT THÚC PHỨC TẠP */}
                <div className="bg-gray-50 p-2 rounded text-sm">
                    <div className="text-xs text-gray-400 mb-1">Điều kiện kết thúc:</div>
                    <Form.Item name="endConditionType" noStyle>
                        <Select 
                            className="w-full mb-2" 
                            onChange={setEndType}
                            disabled={isBeastMode} // Beast Mode mặc định NEVER
                        >
                            <Option value="NEVER">Không bao giờ (Vĩnh viễn)</Option>
                            <Option value="DATE">Đến ngày cụ thể</Option>
                            <Option value="COUNT">Sau số lần hoàn thành</Option>
                            <Option value="TOTAL">Khi đạt tổng giá trị (VD: 1000km)</Option>
                        </Select>
                    </Form.Item>
                    
                    {/* Input phụ thuộc vào Type */}
                    {(endType === 'COUNT' || endType === 'TOTAL') && (
                        <Form.Item name="endConditionValue" noStyle>
                            <InputNumber 
                                placeholder={endType === 'COUNT' ? "Nhập số lần (VD: 30)" : "Nhập tổng (VD: 1000)"} 
                                className="w-full" 
                                addonAfter={endType === 'COUNT' ? "lần" : form.getFieldValue('goalUnit')}
                            />
                        </Form.Item>
                    )}
                </div>
            </FormRow>

            {/* ROW 3: NHẮC NHỞ NÂNG CAO */}
            <FormRow icon={<BellOutlined />} label="Nhắc nhở (Tin nhắn động)">
                <Form.List name="reminders">
                    {(fields, { add, remove }) => (
                        <div className="space-y-2">
                            {fields.map(({ key, name, ...restField }) => (
                                <div key={key} className="flex gap-2 items-center bg-gray-50 p-1 rounded">
                                    <Form.Item {...restField} name={[name, 'time']} noStyle>
                                        <TimePicker format="HH:mm" className="w-24" placeholder="Giờ" />
                                    </Form.Item>
                                    <Form.Item {...restField} name={[name, 'msg']} noStyle>
                                        <Input placeholder="Lời nhắn (VD: Cố lên!)" className="flex-1 border-none bg-transparent" />
                                    </Form.Item>
                                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                </div>
                            ))}
                            <Button type="dashed" size="small" block icon={<PlusOutlined />} onClick={() => add({ time: dayjs('09:00', 'HH:mm'), msg: '' })}>
                                Thêm giờ nhắc
                            </Button>
                        </div>
                    )}
                </Form.List>
            </FormRow>

            {/* ROW 4: CHECKLIST */}
            <FormRow icon={<CheckSquareOutlined />} label="Quy trình (Checklist)">
                 <Form.List name="checklist">
                    {(fields, { add, remove }) => (
                        <div className="space-y-2">
                            {fields.map(({ key, name, ...restField }) => (
                                <div key={key} className="flex gap-2 items-center">
                                    <Form.Item {...restField} name={[name, 'content']} noStyle>
                                        <Input prefix="•" placeholder="Bước thực hiện..." className="bg-gray-50 border-gray-200" />
                                    </Form.Item>
                                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                                </div>
                            ))}
                            <Button type="text" icon={<PlusOutlined />} onClick={() => add()} className="text-purple-600 pl-0">
                                Thêm bước
                            </Button>
                        </div>
                    )}
                </Form.List>
            </FormRow>

            <Divider />
            <div className="flex justify-end gap-3">
                <Button size="large" onClick={onClose}>Đóng</Button>
                <Button 
                    type="primary" htmlType="submit" size="large" loading={loading}
                    className={`font-bold shadow-lg min-w-[150px] ${isBeastMode ? 'bg-red-500' : 'bg-blue-600'}`}
                >
                    {isEdit ? 'Lưu thay đổi' : 'Tạo thói quen'}
                </Button>
            </div>
        </Form>
    </Modal>
  );
};