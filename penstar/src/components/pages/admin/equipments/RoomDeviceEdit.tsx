import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Form, InputNumber, Button, message } from "antd";
import TextArea from "antd/es/input/TextArea";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRoomDevices, updateRoomDevice } from "@/services/roomDevicesApi";
const RoomDeviceEdit = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [minMax, setMinMax] = useState<{
    min_quantity: number;
    max_quantity: number;
  } | null>(null);
  const { data: roomDevices = [] } = useQuery({
    queryKey: ["room-devices-all"],
    queryFn: () => getRoomDevices({}),
  });
  const currentDevice = roomDevices.find(
    (rd: any) => String(rd.id) === String(id)
  );
  useEffect(() => {
    if (currentDevice) {
      form.setFieldsValue({
        quantity: currentDevice.quantity,
        note: currentDevice.note || "",
      });
    }
  }, [currentDevice, form]);
  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await updateRoomDevice(Number(id), values);
      await queryClient.invalidateQueries({ queryKey: ["room-devices"] });
      await queryClient.invalidateQueries({ queryKey: ["room-devices-all"] });
      message.success("Cập nhật tồn kho thành công");
      navigate(-1);
    } catch (err: any) {
      let msg = err?.response?.data?.message || "Lỗi khi cập nhật tồn kho";
      if (
        typeof minMax === "object" &&
        minMax !== null &&
        (values.quantity < minMax.min_quantity ||
          values.quantity > minMax.max_quantity)
      ) {
        msg += `\nTiêu chuẩn: tối thiểu ${minMax.min_quantity}, tối đa ${minMax.max_quantity}`;
      }
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Sửa tồn kho thiết bị phòng</h2>
      <Form
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
        form={form}
      >
        <Form.Item
          label="Số lượng"
          name="quantity"
          rules={[
            { required: true, message: "Nhập số lượng" },
            {
              validator: (_: any, value: number) => {
                if (value === undefined || value === null)
                  return Promise.resolve();
                if (value <= 0) {
                  return Promise.reject("Số lượng phải lớn hơn 0");
                }
                if (minMax) {
                  if (value < minMax.min_quantity) {
                    return Promise.reject(
                      `Số lượng không được nhỏ hơn tiêu chuẩn tối thiểu (${minMax.min_quantity})`
                    );
                  }
                  if (value > minMax.max_quantity) {
                    return Promise.reject(
                      `Số lượng không được vượt quá tiêu chuẩn tối đa (${minMax.max_quantity})`
                    );
                  }
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>
        {minMax && (
          <div style={{ color: "#888", marginBottom: 8 }}>
            Tiêu chuẩn: tối thiểu {minMax.min_quantity}, tối đa{" "}
            {minMax.max_quantity}
          </div>
        )}
        <Form.Item label="Ghi chú" name="note">
          <TextArea rows={2} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Lưu
          </Button>
          <Button className="ml-2" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};
export default RoomDeviceEdit;
