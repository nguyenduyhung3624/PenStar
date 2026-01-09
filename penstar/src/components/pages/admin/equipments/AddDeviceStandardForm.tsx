import { Form, InputNumber, Button, Select, message, Card } from "antd";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { upsertDeviceStandard } from "@/services/roomTypeEquipmentsAdminApi";
import { getRoomTypes, getEquipments } from "@/services/masterDataApi";
import React from "react";
interface AddDeviceStandardFormProps {
  equipmentId?: number;
}
const AddDeviceStandardForm: React.FC<AddDeviceStandardFormProps> = ({
  equipmentId,
}) => {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const { data: roomTypes = [], isLoading: loadingRoomTypes } = useQuery({
    queryKey: ["room-types"],
    queryFn: getRoomTypes,
  });
  const { data: equipments = [], isLoading: loadingEquipments } = useQuery({
    queryKey: ["equipments"],
    queryFn: getEquipments,
  });
  const mutation = useMutation({
    mutationFn: upsertDeviceStandard,
    onSuccess: () => {
      message.success("Cập nhật tiêu chuẩn thành công!");
      queryClient.invalidateQueries({ queryKey: ["device-standards"] });
      form.resetFields();
    },
    onError: () => message.error("Lỗi khi cập nhật tiêu chuẩn!"),
  });
  React.useEffect(() => {
    if (equipmentId && equipments.length > 0) {
      form.setFieldsValue({ master_equipment_id: equipmentId });
    }
  }, [equipmentId, equipments, form]);
  return (
    <Card
      style={{
        maxWidth: 700,
        margin: "40px auto",
        borderRadius: 12,
        boxShadow: "0 2px 8px #f0f1f2",
      }}
    >
      <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
        Thêm tiêu chuẩn thiết bị
      </h2>
      <div style={{ color: "#555", marginBottom: 24, fontSize: 15 }}>
        Nhập thông tin chi tiết cho tiêu chuẩn thiết bị phòng. Các trường có dấu{" "}
        <span style={{ color: "#ff4d4f" }}>*</span> là bắt buộc.
      </div>
      <Form
        layout="vertical"
        form={form}
        onFinish={mutation.mutate}
        style={{ maxWidth: 900, margin: "0 auto", overflowX: "auto" }}
      >
        <div
          style={{
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
            marginBottom: 0,
            justifyContent: "center",
          }}
        >
          <Form.Item
            name="room_type_id"
            label={
              <span style={{ fontWeight: 500 }}>
                Loại phòng <span style={{ color: "#ff4d4f" }}>*</span>
              </span>
            }
            rules={[{ required: true, message: "Vui lòng chọn loại phòng" }]}
            style={{ flex: 1, minWidth: 180 }}
          >
            <Select
              showSearch
              placeholder="Chọn loại phòng"
              style={{ width: "100%" }}
              options={roomTypes.map((r: any) => ({
                value: r.id,
                label: r.name,
              }))}
              loading={loadingRoomTypes}
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item
            name="master_equipment_id"
            label={
              <span style={{ fontWeight: 500 }}>
                Thiết bị <span style={{ color: "#ff4d4f" }}>*</span>
              </span>
            }
            rules={[{ required: true, message: "Vui lòng chọn thiết bị" }]}
            style={{ flex: 1, minWidth: 180 }}
          >
            <Select
              showSearch
              placeholder="Chọn thiết bị"
              style={{ width: "100%" }}
              options={equipments.map((e: any) => ({
                value: e.id,
                label: e.name,
              }))}
              loading={loadingEquipments}
              optionFilterProp="label"
              disabled={!!equipmentId}
            />
          </Form.Item>
          <Form.Item
            name="min_quantity"
            label={
              <span style={{ fontWeight: 500 }}>
                Số lượng tối thiểu <span style={{ color: "#ff4d4f" }}>*</span>
              </span>
            }
            rules={[
              {
                required: true,
                type: "number",
                min: 0,
                message: "Nhập số lượng tối thiểu",
              },
            ]}
            style={{ flex: 1, minWidth: 180 }}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              placeholder="Tối thiểu"
            />
          </Form.Item>
          <Form.Item
            name="max_quantity"
            label={
              <span style={{ fontWeight: 500 }}>
                Số lượng tối đa <span style={{ color: "#ff4d4f" }}>*</span>
              </span>
            }
            rules={[
              {
                required: true,
                type: "number",
                min: 1,
                message: "Nhập số lượng tối đa",
              },
            ]}
            style={{ flex: 1, minWidth: 180 }}
          >
            <InputNumber
              min={1}
              style={{ width: "100%" }}
              placeholder="Tối đa"
            />
          </Form.Item>
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            marginTop: 32,
          }}
        >
          <Button
            type="primary"
            htmlType="submit"
            loading={mutation.status === "pending"}
            style={{ minWidth: 120, fontWeight: 500, fontSize: 16 }}
          >
            Lưu
          </Button>
          <Button
            style={{ minWidth: 100 }}
            onClick={() => window.history.back()}
          >
            Quay lại
          </Button>
        </div>
      </Form>
    </Card>
  );
};
export default AddDeviceStandardForm;
