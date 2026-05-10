import React from 'react';
import { Button, InputNumber, Space } from 'antd';
import { PlusOutlined, MinusOutlined, DoubleLeftOutlined, DoubleRightOutlined } from '@ant-design/icons';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  width?: number;
  showClear?: boolean;
  showStep10?: boolean;
}

const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  precision,
  width = 320,
  showClear = false,
  showStep10 = false,
}) => {
  return (
    <Space.Compact style={{ width: width }}>
      {showStep10 && (
        <Button
          icon={<DoubleLeftOutlined />}
          disabled={value - 10 < min}
          onClick={() => onChange(Math.max(min, value - 10))}
        />
      )}
      <Button
        icon={<MinusOutlined />}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - step))}
      />
      <InputNumber
        value={value}
        onChange={(val) => onChange(val ?? 0)}
        min={min}
        max={max}
        step={step}
        precision={precision}
        style={{ width: '80px', textAlign: 'center' }}
        controls={false}
      />
      <Button
        icon={<PlusOutlined />}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + step))}
      />
      {showStep10 && (
        <Button
          icon={<DoubleRightOutlined />}
          disabled={value + 10 > max}
          onClick={() => onChange(Math.min(max, value + 10))}
        />
      )}
      {showClear && (
        <Button
          danger
          disabled={value === 0}
          onClick={() => onChange(0)}
        >
          清空
        </Button>
      )}
    </Space.Compact>
  );
};

export default NumberInput;