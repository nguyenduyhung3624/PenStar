import React from "react";
import { Select, Table, InputNumber, Button, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

export interface EquipmentSelection {
  equipment_id: number;
  equipment_name: string;
  quantity: number;
}

interface RoomTypeEquipmentSelectorProps {
  equipmentList: { id: number; name: string; type: string }[];
  value?: EquipmentSelection[];
  onChange?: (value: EquipmentSelection[]) => void;
}

const RoomTypeEquipmentSelector: React.FC<RoomTypeEquipmentSelectorProps> = ({
  equipmentList,
  value = [],
  onChange,
}) => {
  const triggerChange = (changedValue: EquipmentSelection[]) => {
    onChange?.(changedValue);
  };

  const addEquipment = (equipmentId: number) => {
    const equipment = equipmentList.find((e) => e.id === equipmentId);
    if (!equipment) return;

    if (value.some((e) => e.equipment_id === equipmentId)) {
      message.warning("Thiết bị này đã được chọn");
      return;
    }

    const newItem: EquipmentSelection = {
      equipment_id: equipment.id,
      equipment_name: equipment.name,
      quantity: 1,
    };

    triggerChange([...value, newItem]);
  };

  const removeEquipment = (equipmentId: number) => {
    triggerChange(value.filter((e) => e.equipment_id !== equipmentId));
  };

  const updateQuantity = (equipmentId: number, val: number) => {
    const newValue = value.map((e) =>
      e.equipment_id === equipmentId ? { ...e, quantity: val } : e
    );
    triggerChange(newValue);
  };

  const columns = [
    {
      title: "Thiết bị",
      dataIndex: "equipment_name",
      key: "equipment_name",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      width: 150,
      render: (_: any, record: EquipmentSelection) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(val) => updateQuantity(record.equipment_id, val || 1)}
          size="small"
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "",
      key: "action",
      width: 50,
      render: (_: any, record: EquipmentSelection) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeEquipment(record.equipment_id)}
        />
      ),
    },
  ];

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <Select
          placeholder="Chọn thiết bị để thêm"
          style={{ width: "100%" }}
          showSearch
          optionFilterProp="children"
          onChange={(val) => val !== undefined && addEquipment(val)}
          value={undefined}
        >
          {equipmentList
            .filter((eq) => !value.some((s) => s.equipment_id === eq.id))
            .map((eq) => (
              <Select.Option key={eq.id} value={eq.id}>
                {eq.name} ({eq.type})
              </Select.Option>
            ))}
        </Select>
      </div>
      {value.length > 0 && (
        <Table
          dataSource={value}
          rowKey="equipment_id"
          size="small"
          pagination={false}
          columns={columns}
        />
      )}
    </>
  );
};

export default RoomTypeEquipmentSelector;
