import React, { useState, useEffect } from "react";
import { Upload, Button, message } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { RcFile, UploadFile } from "antd/lib/upload";
interface RoomTypeImage {
  id: number;
  image_url: string;
  is_thumbnail: boolean;
}
interface RoomTypeImageUploaderProps {
  thumbnail: RcFile | null;
  onThumbnailChange: (file: RcFile | null) => void;
  gallery: RcFile[];
  onGalleryChange: (files: RcFile[]) => void;
  existingThumbnailUrl?: string | null;
  existingGallery?: RoomTypeImage[];
  onDeleteExisting?: (id: number) => void;
}
type FileWithMeta = RcFile & { lastModified?: number };
const RoomTypeImageUploader: React.FC<RoomTypeImageUploaderProps> = ({
  thumbnail,
  onThumbnailChange,
  gallery,
  onGalleryChange,
  existingThumbnailUrl,
  existingGallery = [],
  onDeleteExisting,
}) => {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  useEffect(() => {
    return () => {
      Object.values(previews).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previews]);
  const handleThumbnailUpload = (file: RcFile) => {
    const url = URL.createObjectURL(file);
    setPreviews((prev) => ({ ...prev, thumb: url }));
    onThumbnailChange(file);
    return false;
  };
  const handleRemoveThumbnail = () => {
    onThumbnailChange(null);
    if (previews["thumb"]) {
      URL.revokeObjectURL(previews["thumb"]);
      setPreviews((prev) => {
        const copy = { ...prev };
        delete copy.thumb;
        return copy;
      });
    }
  };
  const handleGalleryUpload = (file: RcFile) => {
    const f = file as FileWithMeta;
    const exists = gallery.some(
      (p) =>
        p.name === f.name &&
        p.size === f.size &&
        (p as FileWithMeta).lastModified === f.lastModified
    );
    if (exists) {
      message.warning("Ảnh này đã được chọn");
      return false;
    }
    const key = `${f.name}-${f.size}-${f.lastModified}`;
    const url = URL.createObjectURL(f);
    setPreviews((prev) => ({ ...prev, [key]: url }));
    onGalleryChange([...gallery, f]);
    return false;
  };
  const handleRemoveGallery = (file: UploadFile) => {
    const origin = file.originFileObj as FileWithMeta;
    if (!origin) return true;
    const key = `${origin.name}-${origin.size}-${origin.lastModified}`;
    if (previews[key]) {
      URL.revokeObjectURL(previews[key]);
      setPreviews((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
    onGalleryChange(gallery.filter((f) => f !== origin));
    return true;
  };
  const thumbnailFileList: UploadFile[] = thumbnail
    ? [
        {
          uid: "new-thumb",
          name: thumbnail.name,
          status: "done",
          url: previews["thumb"],
          originFileObj: thumbnail,
        },
      ]
    : existingThumbnailUrl
      ? [
          {
            uid: "existing-thumb",
            name: "Thumbnail hiện tại",
            status: "done",
            url: existingThumbnailUrl.startsWith("http")
              ? existingThumbnailUrl
              : `${import.meta.env.VITE_BASE_URL?.replace(/\/api\/?$/, "")}${existingThumbnailUrl}`,
          },
        ]
      : [];
  const galleryFileList: UploadFile[] = gallery.map((f, i) => {
    const fm = f as FileWithMeta;
    const key = `${fm.name}-${fm.size}-${fm.lastModified}`;
    return {
      uid: `new-${i}`,
      name: f.name,
      status: "done",
      url: previews[key],
      originFileObj: f,
    };
  });
  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="font-semibold mb-2">Ảnh đại diện</div>
        <Upload
          accept="image/*"
          listType="picture-card"
          maxCount={1}
          fileList={thumbnailFileList}
          beforeUpload={handleThumbnailUpload}
          onRemove={handleRemoveThumbnail}
        >
          {thumbnailFileList.length === 0 && (
            <div className="flex flex-col items-center justify-center">
              <PlusOutlined className="text-2xl" />
              <div className="mt-2">Tải ảnh</div>
            </div>
          )}
        </Upload>
      </div>
      <div>
        <div className="font-semibold mb-2">Ảnh bổ sung (Gallery)</div>
        {}
        {existingGallery.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-500 mb-2">Ảnh đã có:</div>
            <div className="grid grid-cols-3 gap-2">
              {existingGallery.map((img) => (
                <div key={img.id} className="relative group w-24 h-24">
                  <img
                    src={
                      img.image_url.startsWith("http")
                        ? img.image_url
                        : `${import.meta.env.VITE_BASE_URL?.replace(/\/api\/?$/, "")}${img.image_url}`
                    }
                    alt=""
                    className="w-full h-full object-cover rounded border"
                  />
                  {onDeleteExisting && (
                    <Button
                      danger
                      type="primary"
                      size="small"
                      className="absolute top-0 right-0 scale-75 shadow-sm"
                      icon={<DeleteOutlined />}
                      onClick={() => onDeleteExisting(img.id)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <Upload
          accept="image/*"
          listType="picture-card"
          multiple
          fileList={galleryFileList}
          beforeUpload={handleGalleryUpload}
          onRemove={handleRemoveGallery}
        >
          <div className="flex flex-col items-center justify-center">
            <PlusOutlined className="text-2xl" />
            <div className="mt-2">Thêm ảnh</div>
          </div>
        </Upload>
        <div className="text-xs text-gray-500 mt-1">
          Đã chọn thêm: {gallery.length} ảnh
        </div>
      </div>
    </div>
  );
};
export default RoomTypeImageUploader;
