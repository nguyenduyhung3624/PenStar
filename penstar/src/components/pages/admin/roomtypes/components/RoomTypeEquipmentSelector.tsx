import React from "react";
import { Table, InputNumber, Button, Input } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

export interface EquipmentSelection {
  id?: number | string; // temp id for key
  name: string;
  quantity: number;
  price: number;
}

interface RoomTypeEquipmentSelectorProps {
  value?: EquipmentSelection[];
  onChange?: (value: EquipmentSelection[]) => void;
}

const RoomTypeEquipmentSelector: React.FC<RoomTypeEquipmentSelectorProps> = ({
  value = [],
  onChange,
}) => {
  const triggerChange = (changedValue: EquipmentSelection[]) => {
    onChange?.(changedValue);
  };

  const addEquipment = () => {
    const newItem: EquipmentSelection = {
      id: Date.now(),
      name: "",
      quantity: 1,
      price: 0,
    };
    triggerChange([...value, newItem]);
  };

  const removeEquipment = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    triggerChange(newValue);
  };

  const updateItem = (
    index: number,
    field: keyof EquipmentSelection,
    val: any
  ) => {
    const newValue = [...value];
    newValue[index] = { ...newValue[index], [field]: val };
    triggerChange(newValue);
  };

  const columns = [
    {
      title: "Tên thiết bị",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: EquipmentSelection, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateItem(index, "name", e.target.value)}
          placeholder="Nhập tên thiết bị"
        />
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 100,
      render: (val: number, _: any, index: number) => (
        <InputNumber
          min={1}
          value={val}
          onChange={(v) => updateItem(index, "quantity", v || 1)}
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Đơn giá",
      dataIndex: "price",
      key: "price",
      width: 150,
      render: (val: number, _: any, index: number) => (
        <InputNumber
          min={0}
          value={val}
          onChange={(v) => updateItem(index, "price", v || 0)}
          style={{ width: "100%" }}
          formatter={(value) =>
            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          }
          parser={(value) => Number(value?.replace(/\$\s?|(,*)/g, "") || 0)}
        />
      ),
    },
    {
      title: "",
      key: "action",
      width: 50,
      render: (_: any, __: any, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeEquipment(index)}
        />
      ),
    },
  ];

  return (
    <div>
      <Table
        dataSource={value}
        rowKey={(record) => record.id || Math.random()}
        size="small"
        pagination={false}
        columns={columns}
        footer={() => (
          <Button
            type="dashed"
            onClick={addEquipment}
            block
            icon={<PlusOutlined />}
          >
            Thêm thiết bị
          </Button>
        )}
      />
    </div>
  );
};

export default RoomTypeEquipmentSelector;
