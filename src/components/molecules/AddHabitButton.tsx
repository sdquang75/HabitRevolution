'use client';

import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { CreateHabitModal } from '../organisms/CreateHabitModal';

export const AddHabitButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          size="large"
          className="bg-atomic-main hover:!bg-atomic-hover shadow-md font-bold"
          onClick={() => setOpen(true)}
      >
          Thói quen mới
      </Button>

      <CreateHabitModal open={open} onClose={() => setOpen(false)} />
    </>
  );
};