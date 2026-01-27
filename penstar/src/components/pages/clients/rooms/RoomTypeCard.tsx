import React, { useState, useMemo, useEffect } from "react";
import {
  Button,
  Collapse,
  Row,
  Col,
  Alert,
  Modal,
  Select,
  Tabs,
  Card,
  Tag,
  Typography,
  Divider,
} from "antd";
import {
  LeftOutlined,
  RightOutlined,
  UserOutlined,
  CoffeeOutlined,
  ToolOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { FIXED_AMENITIES } from "@/utils/amenities";
import type { RoomTypeCardProps } from "@/types/roomBooking";
import {
  getRoomTypeEquipments,
  type RoomTypeEquipment,
} from "@/services/roomTypeApi";
import { getServices, type Services } from "@/services/servicesApi";

const { Title, Text } = Typography;
const { Panel } = Collapse;
const RoomTypeCard: React.FC<RoomTypeCardProps> = React.memo(
  ({ roomType, roomsInType, onSelectRoomType, roomsConfig }) => {
    const thumbnail = roomType?.thumbnail || "/placeholder-room.jpg";
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [amenitiesModalOpen, setAmenitiesModalOpen] = useState(false);
    const [policyModalOpen, setPolicyModalOpen] = useState(false);
    const [equipments, setEquipments] = useState<RoomTypeEquipment[]>([]);
    const [services, setServices] = useState<Services[]>([]);
    const [, setLoadingServices] = useState(false);

    useEffect(() => {
      if (amenitiesModalOpen && services.length === 0) {
        setLoadingServices(true);
        getServices()
          .then((data) => setServices(data))
          .catch((err) => console.error("Failed to fetch services", err))
          .finally(() => setLoadingServices(false));
      }
    }, [amenitiesModalOpen, services.length]);
    useEffect(() => {
      if (roomType?.id) {
        getRoomTypeEquipments(roomType?.id).then(setEquipments);
      }
    }, [roomType?.id]);
    const maxSelectableRooms = roomsInType.filter(
      (room) => room.is_available !== false && room.status === "available",
    ).length;
    const [selectedRoomsCount, setSelectedRoomsCount] = useState(0);
    const prevRoomsConfigLength = React.useRef(0);
    React.useEffect(() => {
      const currentRoomTypeCount = roomsConfig.filter(
        (config) => config.room_type_id === roomType?.id,
      ).length;
      if (currentRoomTypeCount < prevRoomsConfigLength.current) {
        console.log("✅ Reset to:", currentRoomTypeCount);
        setSelectedRoomsCount(currentRoomTypeCount);
        const currentConfigs = roomsConfig.filter(
          (config) => config.room_type_id === roomType?.id,
        );
        setNumAdultsList(currentConfigs.map((c) => c.num_adults || 1));
        setNumChildrenList(currentConfigs.map((c) => c.num_children || 0));
        setChildrenAgesList(currentConfigs.map(() => []));
      }
      prevRoomsConfigLength.current = currentRoomTypeCount;
    }, [roomsConfig, roomType?.id, roomType?.name, selectedRoomsCount]);
    const [numAdultsList, setNumAdultsList] = useState<number[]>([]);
    const [numChildrenList, setNumChildrenList] = useState<number[]>([]);
    const [childrenAgesList, setChildrenAgesList] = useState<number[][]>([]);
    React.useEffect(() => {
      setNumAdultsList((prev) => {
        const arr = [...prev];
        if (selectedRoomsCount > arr.length) {
          return arr.concat(Array(selectedRoomsCount - arr.length).fill(1));
        } else {
          return arr.slice(0, selectedRoomsCount);
        }
      });
      setNumChildrenList((prev) => {
        const arr = [...prev];
        if (selectedRoomsCount > arr.length) {
          return arr.concat(Array(selectedRoomsCount - arr.length).fill(0));
        } else {
          return arr.slice(0, selectedRoomsCount);
        }
      });
      setChildrenAgesList((prev) => {
        const arr = [...prev];
        if (selectedRoomsCount > arr.length) {
          return arr.concat(
            Array.from({ length: selectedRoomsCount - arr.length }, () => []),
          );
        } else {
          return arr.slice(0, selectedRoomsCount);
        }
      });
    }, [selectedRoomsCount]);
    const suitableRooms = useMemo(() => {
      return roomsInType.filter(
        (room) => room.is_available !== false && room.status === "available",
      );
    }, [roomsInType]);
    const calculateRoomExtraFees = React.useCallback(
      (roomIndex: number) => {
        const numAdults = numAdultsList[roomIndex] || 0;
        const numChildren = numChildrenList[roomIndex] || 0;
        const baseAdults = roomType?.base_adults || 0;
        const baseChildren = roomType?.base_children || 0;
        const extraAdultFee = Number(roomType?.extra_adult_fee) || 0;
        const extraChildFee = Number(roomType?.extra_child_fee) || 0;
        const extraAdults = Math.max(0, numAdults - baseAdults);
        const extraChildren = Math.max(0, numChildren - baseChildren);
        const adultFees = extraAdults * extraAdultFee;
        const childFees = extraChildren * extraChildFee;
        console.log(`💰 Phòng ${roomIndex + 1}:`, {
          numAdults,
          numChildren,
          baseAdults,
          baseChildren,
          extraAdults,
          extraChildren,
          extraAdultFee,
          extraChildFee,
          adultFees,
          childFees,
        });
        return {
          extraAdults,
          extraChildren,
          adultFees,
          childFees,
          totalExtraFees: adultFees + childFees,
        };
      },
      [
        numAdultsList,
        numChildrenList,
        roomType?.base_adults,
        roomType?.base_children,
        roomType?.extra_adult_fee,
        roomType?.extra_child_fee,
      ],
    );
    React.useEffect(() => {
      if (selectedRoomsCount > 0) {
        const newRoomsConfig = Array.from({
          length: selectedRoomsCount,
        }).map((_, idx) => {
          const fees = calculateRoomExtraFees(idx);
          const basePrice = roomType?.price || 0;
          const totalPrice = basePrice + fees.totalExtraFees;
          return {
            room_id: suitableRooms[idx]?.id || 0,
            room_type_id: roomType?.id || 0,
            num_adults: numAdultsList[idx] || 1,
            num_children: numChildrenList[idx] || 0,
            num_babies:
              childrenAgesList[idx]?.filter((age) => age <= 5).length || 0,
            price: totalPrice,
            base_price: basePrice,
            extra_fees: fees.totalExtraFees,
            extra_adult_fees: fees.adultFees,
            extra_child_fees: fees.childFees,
            extra_adults_count: fees.extraAdults,
            extra_children_count: fees.extraChildren,
            quantity: 1,
          };
        });
        onSelectRoomType(
          suitableRooms.slice(0, selectedRoomsCount),
          newRoomsConfig,
        );
      } else {
        onSelectRoomType([], []);
      }
    }, [
      selectedRoomsCount,
      numAdultsList,
      numChildrenList,
      childrenAgesList,
      suitableRooms,
      roomType?.id,
      roomType?.price,
      roomType?.base_adults,
      roomType?.base_children,
      roomType?.extra_adult_fee,
      roomType?.extra_child_fee,
      calculateRoomExtraFees,
      onSelectRoomType,
    ]);
    const isDisabled = selectedRoomsCount > maxSelectableRooms;
    const showNotEnoughRoomsWarning = selectedRoomsCount > maxSelectableRooms;
    const noRoomsAvailable = maxSelectableRooms === 0;
    return (
      <>
        <div
          className="bg-white overflow-hidden transition-all duration-200"
          style={{
            border: "1px solid #e0e0e0",
            marginBottom: "12px",
            opacity: isDisabled ? 0.75 : 1,
            pointerEvents: isDisabled && !isExpanded ? "none" : "auto",
          }}
        >
          <Collapse
            expandIcon={() => null}
            className="bg-transparent border-none"
            style={{ borderRadius: 0 }}
            activeKey={isExpanded ? ["1"] : []}
          >
            <Panel
              header={
                <div>
                  <Row gutter={16} align="middle">
                    {}
                    <Col xs={24} md={11}>
                      <div
                        style={{
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        {}
                        {roomType?.images && roomType?.images.length > 1 && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex((prev) =>
                                prev === 0
                                  ? roomType?.images!.length - 1
                                  : prev - 1,
                              );
                            }}
                            style={{
                              position: "absolute",
                              left: "8px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              width: "36px",
                              height: "36px",
                              background: "rgba(255, 255, 255, 0.95)",
                              border: "1px solid #ddd",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              zIndex: 10,
                              color: "#333",
                            }}
                          >
                            <LeftOutlined style={{ fontSize: "14px" }} />
                          </div>
                        )}
                        {}
                        <div
                          style={{
                            width: "100%",
                            height: "200px",
                            overflow: "hidden",
                          }}
                        >
                          {roomType?.images && roomType?.images.length > 0 ? (
                            (() => {
                              const imgPath =
                                roomType?.images[currentImageIndex];
                              let src = imgPath;
                              if (src && !src.startsWith("http")) {
                                const apiUrl =
                                  import.meta.env.VITE_BASE_URL ||
                                  import.meta.env.VITE_API_URL ||
                                  "https://penstar-backend.vercel.app";
                                const baseUrl = apiUrl
                                  .replace(/\/api\/?$/, "")
                                  .replace(/\/$/, "");
                                src =
                                  baseUrl +
                                  (src.startsWith("/") ? "" : "/") +
                                  src;
                              }
                              return (
                                <img
                                  src={src}
                                  alt={`${roomType?.name} - ${currentImageIndex + 1}`}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                  }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src =
                                      "https://via.placeholder.com/400x180?text=No+Image";
                                  }}
                                />
                              );
                            })()
                          ) : thumbnail ? (
                            (() => {
                              let src = thumbnail;
                              if (src && !src.startsWith("http")) {
                                const apiUrl =
                                  import.meta.env.VITE_BASE_URL ||
                                  import.meta.env.VITE_API_URL ||
                                  "https://penstar-backend.vercel.app";
                                const baseUrl = apiUrl
                                  .replace(/\/api\/?$/, "")
                                  .replace(/\/$/, "");
                                src =
                                  baseUrl +
                                  (src.startsWith("/") ? "" : "/") +
                                  src;
                              }
                              return (
                                <img
                                  src={src}
                                  alt={roomType?.name || "Room"}
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    display: "block",
                                  }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src =
                                      "https://via.placeholder.com/400x180?text=No+Image";
                                  }}
                                />
                              );
                            })()
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                background: "#ddd",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#999",
                              }}
                            >
                              No Image Available
                            </div>
                          )}
                        </div>
                        {}
                        {roomType?.images && roomType?.images.length > 1 && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentImageIndex((prev) =>
                                prev === roomType?.images!.length - 1
                                  ? 0
                                  : prev + 1,
                              );
                            }}
                            style={{
                              position: "absolute",
                              right: "8px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              width: "36px",
                              height: "36px",
                              background: "rgba(255, 255, 255, 0.95)",
                              border: "1px solid #ddd",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              zIndex: 10,
                              color: "#333",
                            }}
                          >
                            <RightOutlined style={{ fontSize: "14px" }} />
                          </div>
                        )}
                      </div>
                    </Col>
                    {}
                    <Col xs={24} md={13}>
                      <div
                        style={{
                          padding: "12px 0 8px 8px",
                          height: "200px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        {}
                        <div>
                          {}
                          <h3
                            style={{
                              color: "#333",
                              fontSize: "16px",
                              lineHeight: "22px",
                              fontWeight: "600",
                              marginBottom: "8px",
                            }}
                          >
                            {roomType?.name || "Loại phòng"}
                          </h3>
                          {}
                          <div
                            className="flex gap-3 items-center"
                            style={{ marginBottom: "8px" }}
                          >
                            <span
                              className="flex items-center gap-1"
                              style={{ color: "#666", fontSize: "13px" }}
                            >
                              <span>
                                {roomType?.bed_type || "1 giường queen size"}
                              </span>
                            </span>
                            <span
                              className="flex items-center gap-1"
                              style={{ color: "#666", fontSize: "13px" }}
                            >
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#888"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <rect
                                    x="3"
                                    y="3"
                                    width="18"
                                    height="18"
                                    rx="2"
                                  />
                                  <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
                                </svg>
                              </span>
                              <span>{roomType?.room_size || 30} m²</span>
                            </span>
                            {}
                            {roomType?.view_direction && (
                              <span
                                className="flex items-center gap-1"
                                style={{ color: "#666", fontSize: "13px" }}
                              >
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#888"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <circle cx="12" cy="12" r="3.2" />
                                    <path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10Z" />
                                  </svg>
                                </span>
                                <span>{roomType?.view_direction}</span>
                              </span>
                            )}
                            <span
                              className="flex items-center gap-1"
                              style={{ color: "#666", fontSize: "13px" }}
                            >
                              <UserOutlined />
                              <span>
                                Tối đa {roomType?.capacity || 2} khách
                              </span>
                            </span>
                          </div>
                          {}
                          <div
                            className="flex gap-3 items-center"
                            style={{ marginBottom: "10px" }}
                          >
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setAmenitiesModalOpen(true);
                              }}
                              style={{
                                color: "#1890ff",
                                fontSize: "14px",
                                textDecoration: "underline",
                                cursor: "pointer",
                              }}
                            >
                              Xem tất cả tiện nghi
                            </a>
                          </div>
                        </div>
                        {}
                        <div className="flex items-end justify-between">
                          <div>
                            <div
                              style={{
                                color: "#999",
                                fontSize: "12px",
                                marginBottom: "4px",
                              }}
                            >
                              Giá chỉ từ
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: "4px",
                              }}
                            >
                              <span
                                style={{
                                  color: "#f5a623",
                                  fontSize: "22px",
                                  fontWeight: "700",
                                  lineHeight: "1",
                                }}
                              >
                                {new Intl.NumberFormat("vi-VN").format(
                                  Number(roomType?.price) || 0,
                                )}{" "}
                                VND
                              </span>
                              <span style={{ color: "#999", fontSize: "12px" }}>
                                / đêm
                              </span>
                            </div>
                          </div>
                          {noRoomsAvailable ? (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                                gap: "4px",
                              }}
                            >
                              <span
                                style={{
                                  background: "#ff4d4f",
                                  color: "#fff",
                                  padding: "4px 12px",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                }}
                              >
                                Hết phòng
                              </span>
                            </div>
                          ) : (
                            <Button
                              disabled={isDisabled}
                              style={{
                                background: "#f5a623",
                                borderColor: "#f5a623",
                                color: "#fff",
                                fontWeight: "600",
                                height: "38px",
                                padding: "0 18px",
                                fontSize: "14px",
                                borderRadius: "4px",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                              }}
                            >
                              Chọn phòng
                            </Button>
                          )}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
              }
              key="1"
              className="bg-white"
            >
              {}
              <div
                className="bg-white"
                style={{ borderTop: "1px dashed #e0e0e0" }}
              >
                <div style={{ padding: "24px" }}>
                  {}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                    }}
                  >
                    {/* Room Capacity Info */}
                    <div
                      style={{
                        padding: "10px 14px",
                        backgroundColor: "#f0f7ff",
                        border: "1px solid #bae0ff",
                        borderRadius: "6px",
                        fontSize: "12px",
                        color: "#333",
                      }}
                    >
                      <span style={{ color: "#666" }}>Sức chứa:</span>{" "}
                      <strong style={{ color: "#1890ff", fontSize: "13px" }}>
                        {roomType?.capacity || 4} người
                      </strong>{" "}
                      | <span style={{ color: "#666" }}>Gốc:</span>{" "}
                      <strong>{roomType?.base_adults || 2} NL</strong>,{" "}
                      <strong>{roomType?.base_children || 1} TE</strong>
                    </div>

                    <div>
                      <select
                        aria-label="Chọn số lượng phòng"
                        style={{
                          padding: "8px 32px 8px 12px",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          fontSize: "14px",
                          cursor: "pointer",
                          appearance: "none",
                          backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23333' d='M6 9L1 4h10z'/%3E%3C/svg%3E\")",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 8px center",
                        }}
                        value={selectedRoomsCount}
                        onChange={(e) =>
                          setSelectedRoomsCount(Number(e.target.value))
                        }
                      >
                        <option value={0}>Không chọn</option>
                        {Array.from(
                          { length: Math.min(maxSelectableRooms, 5) },
                          (_, i) => i + 1,
                        ).map((num) => {
                          const roomNames = suitableRooms
                            .slice(0, num)
                            .map(
                              (r) =>
                                `${r.name}${r.floor_name ? ` (${r.floor_name})` : ""}`,
                            )
                            .join(", ");
                          return (
                            <option key={num} value={num} title={roomNames}>
                              {num} Phòng
                            </option>
                          );
                        })}
                      </select>
                      {}
                      {selectedRoomsCount > 0 && (
                        <div
                          style={{
                            marginTop: "8px",
                            fontSize: "12px",
                            color: "#666",
                          }}
                        >
                          {suitableRooms
                            .slice(0, selectedRoomsCount)
                            .map((room) => (
                              <span
                                key={room.id}
                                style={{
                                  display: "inline-block",
                                  background: "#f5f5f5",
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  marginRight: "6px",
                                  marginBottom: "4px",
                                }}
                              >
                                {room.name}
                                {room.floor_name && (
                                  <span style={{ color: "#999" }}>
                                    {" "}
                                    - {room.floor_name}
                                  </span>
                                )}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>{" "}
                  {}
                  {showNotEnoughRoomsWarning && (
                    <Alert
                      message="Không thể đặt loại phòng này"
                      description={
                        <span>
                          Đã chọn <strong>{selectedRoomsCount} phòng</strong>,
                          nhưng hiện chỉ còn{" "}
                          <strong>{suitableRooms.length} phòng trống</strong>.
                          Vui lòng chọn loại phòng khác hoặc giảm số lượng
                          phòng.
                        </span>
                      }
                      type="error"
                      showIcon
                      className="mb-6"
                    />
                  )}
                  {}
                  {selectedRoomsCount > 0 &&
                    Array.from({ length: selectedRoomsCount }).map(
                      (_, roomIndex) => {
                        const currentAdults = numAdultsList[roomIndex] || 1;
                        const currentChildren = numChildrenList[roomIndex] || 0;
                        const currentBabies =
                          childrenAgesList[roomIndex]?.filter((age) => age <= 5)
                            .length || 0;
                        const maxOccupancy = roomType?.capacity || 4;
                        const maxAdultsOptions = Math.min(
                          3,
                          maxOccupancy - currentChildren,
                        );
                        const maxChildrenOptions = Math.min(
                          3,
                          maxOccupancy - currentAdults,
                        );
                        const maxBabies = 3;
                        const fees = calculateRoomExtraFees(roomIndex);

                        return (
                          <div
                            key={roomIndex}
                            style={{
                              marginTop: "24px",
                              paddingBottom: "20px",
                              borderBottom: "1px solid #e8e8e8",
                            }}
                          >
                            <Row gutter={16} align="middle">
                              <Col xs={6} sm={6}>
                                <div
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#333",
                                  }}
                                >
                                  Chọn số người phòng {roomIndex + 1}
                                </div>
                              </Col>

                              {/* Info Column - Enhanced Design */}

                              <Col xs={6} sm={6}>
                                <label
                                  style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontSize: "13px",
                                    color: "#666",
                                    fontWeight: "400",
                                  }}
                                >
                                  Người lớn
                                </label>
                                <Select
                                  style={{ width: "100%" }}
                                  value={currentAdults}
                                  onChange={(value) => {
                                    const newList = [...numAdultsList];
                                    newList[roomIndex] = value;
                                    setNumAdultsList(newList);
                                    const total = value + currentChildren;
                                    if (
                                      total > maxOccupancy &&
                                      currentChildren > 0
                                    ) {
                                      const excess = total - maxOccupancy;
                                      const newChildren = Math.max(
                                        0,
                                        currentChildren - excess,
                                      );
                                      const newChildrenList = [
                                        ...numChildrenList,
                                      ];
                                      newChildrenList[roomIndex] = newChildren;
                                      setNumChildrenList(newChildrenList);
                                    }
                                  }}
                                  options={Array.from(
                                    { length: maxAdultsOptions },
                                    (_, i) => ({
                                      label: String(i + 1),
                                      value: i + 1,
                                    }),
                                  )}
                                />
                              </Col>
                              <Col xs={6} sm={6}>
                                <label
                                  style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontSize: "13px",
                                    color: "#666",
                                    fontWeight: "400",
                                  }}
                                >
                                  Trẻ em (6-11 tuổi)
                                </label>
                                <Select
                                  style={{ width: "100%" }}
                                  value={currentChildren}
                                  onChange={(value) => {
                                    const newList = [...numChildrenList];
                                    newList[roomIndex] = value;
                                    setNumChildrenList(newList);
                                  }}
                                  options={Array.from(
                                    { length: maxChildrenOptions + 1 },
                                    (_, i) => ({
                                      label: String(i),
                                      value: i,
                                    }),
                                  )}
                                />
                              </Col>
                              <Col xs={6} sm={6}>
                                <label
                                  style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontSize: "13px",
                                    color: "#666",
                                    fontWeight: "400",
                                  }}
                                >
                                  Em bé (0-5 tuổi)
                                </label>
                                <Select
                                  style={{ width: "100%" }}
                                  value={currentBabies}
                                  onChange={(value) => {
                                    const newAgesList = [...childrenAgesList];
                                    newAgesList[roomIndex] =
                                      Array(value).fill(2);
                                    setChildrenAgesList(newAgesList);
                                  }}
                                  options={Array.from(
                                    { length: maxBabies + 1 },
                                    (_, i) => ({
                                      label: String(i),
                                      value: i,
                                    }),
                                  )}
                                />
                              </Col>
                            </Row>

                            {/* Display Extra Fees */}
                            {fees.totalExtraFees > 0 && (
                              <div
                                style={{
                                  marginTop: "16px",
                                  padding: "12px 16px",
                                  backgroundColor: "#fff7e6",
                                  border: "1px solid #ffd591",
                                  borderRadius: "8px",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#fa8c16",
                                    marginBottom: "8px",
                                  }}
                                >
                                  💰 Phụ phí:{" "}
                                  {new Intl.NumberFormat("vi-VN").format(
                                    fees.totalExtraFees,
                                  )}{" "}
                                  đ
                                </div>
                                <div
                                  style={{ fontSize: "13px", color: "#666" }}
                                >
                                  {fees.extraAdults > 0 && (
                                    <div style={{ marginBottom: "4px" }}>
                                      • {fees.extraAdults} Người lớn thêm ×{" "}
                                      {new Intl.NumberFormat("vi-VN").format(
                                        Number(roomType?.extra_adult_fee),
                                      )}{" "}
                                      đ ={" "}
                                      {new Intl.NumberFormat("vi-VN").format(
                                        fees.adultFees,
                                      )}{" "}
                                      đ
                                    </div>
                                  )}
                                  {fees.extraChildren > 0 && (
                                    <div>
                                      • {fees.extraChildren} Trẻ em thêm ×{" "}
                                      {new Intl.NumberFormat("vi-VN").format(
                                        Number(roomType?.extra_child_fee),
                                      )}{" "}
                                      đ ={" "}
                                      {new Intl.NumberFormat("vi-VN").format(
                                        fees.childFees,
                                      )}{" "}
                                      đ
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      },
                    )}
                </div>
              </div>
            </Panel>
          </Collapse>
        </div>
        {}
        <Modal
          title={
            <div style={{ fontSize: 20, fontWeight: 700 }}>
              {roomType?.name}
            </div>
          }
          open={amenitiesModalOpen}
          onCancel={() => setAmenitiesModalOpen(false)}
          footer={null}
          width={1000}
          centered
          styles={{ body: { padding: "0 24px 24px 24px" } }}
        >
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: "1",
                label: "Tổng quan",
                children: (
                  <div className="py-4">
                    <Row gutter={[24, 24]}>
                      <Col span={24} md={10}>
                        <div
                          style={{
                            width: "100%",
                            height: "300px",
                            borderRadius: "12px",
                            overflow: "hidden",
                            border: "1px solid #f0f0f0",
                            position: "relative",
                          }}
                        >
                          <img
                            src={
                              roomType?.images && roomType?.images.length > 0
                                ? roomType?.images[0].startsWith("http")
                                  ? roomType?.images[0]
                                  : `http://localhost:5001${roomType?.images[0]}`
                                : roomType?.thumbnail?.startsWith("http")
                                  ? roomType?.thumbnail
                                  : `http://localhost:5001${roomType?.thumbnail}`
                            }
                            alt={roomType?.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src =
                                "https://via.placeholder.com/600x400?text=No+Image";
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              bottom: 12,
                              right: 12,
                              background: "rgba(0,0,0,0.6)",
                              color: "#fff",
                              padding: "4px 12px",
                              borderRadius: "20px",
                              fontSize: "12px",
                            }}
                          >
                            {roomType?.images?.length || 0} ảnh
                          </div>
                        </div>
                      </Col>
                      <Col span={24} md={14}>
                        <Title level={4} style={{ marginTop: 0 }}>
                          Thông tin phòng
                        </Title>
                        <div
                          style={{
                            display: "flex",
                            gap: "16px",
                            flexWrap: "wrap",
                            marginBottom: "24px",
                          }}
                        >
                          {roomType?.bed_type && (
                            <Tag
                              icon={<UserOutlined />}
                              color="yellow"
                              style={{
                                padding: "6px 12px",
                                fontSize: "14px",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {roomType?.bed_type}
                            </Tag>
                          )}
                          {roomType?.room_size && (
                            <Tag
                              icon={<ToolOutlined />}
                              color="cyan"
                              style={{
                                padding: "6px 12px",
                                fontSize: "14px",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {roomType?.room_size} m²
                            </Tag>
                          )}
                          {roomType?.view_direction && (
                            <Tag
                              icon={<CoffeeOutlined />}
                              color="green"
                              style={{
                                padding: "6px 12px",
                                fontSize: "14px",
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {roomType?.view_direction}
                            </Tag>
                          )}
                        </div>

                        <div style={{ marginBottom: "24px" }}>
                          <Title level={5}>Mô tả</Title>
                          {roomType?.description ? (
                            <div
                              style={{
                                color: "#555",
                                fontSize: "15px",
                                lineHeight: 1.6,
                                maxHeight: "200px",
                                overflowY: "auto",
                                padding: "16px",
                                background: "#f9f9f9",
                                borderRadius: "8px",
                              }}
                              dangerouslySetInnerHTML={{
                                __html: roomType?.description,
                              }}
                            />
                          ) : (
                            <Text type="secondary">
                              Chưa có mô tả chi tiết.
                            </Text>
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "#fff7e6",
                            padding: "16px",
                            borderRadius: "8px",
                            border: "1px solid #ffe58f",
                          }}
                        >
                          <div>
                            <Text type="secondary">Giá phòng / đêm</Text>
                            <div
                              style={{
                                fontSize: "24px",
                                fontWeight: "bold",
                                color: "#fa8c16",
                              }}
                            >
                              {new Intl.NumberFormat("vi-VN").format(
                                Number(roomType?.price) || 0,
                              )}{" "}
                              VND
                            </div>
                          </div>
                          <Button
                            type="primary"
                            size="large"
                            onClick={() => {
                              setAmenitiesModalOpen(false);
                              if (!isExpanded) setIsExpanded(true);
                            }}
                          >
                            Đặt ngay
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: "2",
                label: "Tiện nghi & Thiết bị",
                children: (
                  <div className="py-4">
                    <Row gutter={[24, 24]}>
                      <Col span={24}>
                        <Title
                          level={5}
                          style={{
                            marginBottom: "16px",
                            borderLeft: "4px solid #1890ff",
                            paddingLeft: "12px",
                          }}
                        >
                          Tiện nghi phòng
                        </Title>
                        {(() => {
                          const allAmenities = [
                            ...(roomType?.free_amenities || []),
                            ...(roomType?.paid_amenities || []),
                          ];
                          if (allAmenities.length === 0) {
                            return (
                              <Text type="secondary" italic>
                                Không có thông tin tiện nghi
                              </Text>
                            );
                          }
                          return (
                            <Row gutter={[16, 16]}>
                              {allAmenities.map((amenity, idx) => (
                                <Col span={12} md={8} key={idx}>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "10px",
                                      padding: "8px",
                                      background: "#f5f5f5",
                                      borderRadius: "6px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: "18px",
                                        color: "#1890ff",
                                      }}
                                    >
                                      {FIXED_AMENITIES.find(
                                        (a) => a.value === amenity,
                                      )?.icon || (
                                        <HomeOutlined
                                          style={{
                                            fontSize: "18px",
                                            color: "#222",
                                          }}
                                        />
                                      )}
                                    </span>
                                    <span style={{ fontWeight: 500 }}>
                                      {amenity}
                                    </span>
                                  </div>
                                </Col>
                              ))}
                            </Row>
                          );
                        })()}
                      </Col>

                      <Col span={24}>
                        <Divider />
                        <Title
                          level={5}
                          style={{
                            marginBottom: "16px",
                            borderLeft: "4px solid #52c41a",
                            paddingLeft: "12px",
                          }}
                        >
                          Thiết bị có sẵn
                        </Title>
                        {equipments.length > 0 ? (
                          <Row gutter={[16, 16]}>
                            {equipments.map((eq) => (
                              <Col xs={24} sm={12} md={8} lg={6} key={eq.id}>
                                <Card
                                  size="small"
                                  hoverable
                                  bodyStyle={{ padding: "12px" }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "start",
                                      marginBottom: "8px",
                                    }}
                                  >
                                    <Text strong style={{ fontSize: "14px" }}>
                                      {eq.name}
                                    </Text>
                                  </div>
                                  <div
                                    style={{ fontSize: "12px", color: "#666" }}
                                  >
                                    Số lượng: <Text strong>{eq.quantity}</Text>
                                  </div>
                                </Card>
                              </Col>
                            ))}
                          </Row>
                        ) : (
                          <Text type="secondary" italic>
                            Chưa có thông tin thiết bị.
                          </Text>
                        )}
                      </Col>
                    </Row>
                  </div>
                ),
              },
            ]}
          />
        </Modal>
        {}
        <Modal
          title={roomType?.name.toUpperCase()}
          open={policyModalOpen}
          onCancel={() => setPolicyModalOpen(false)}
          footer={[
            <Button
              key="close"
              type="primary"
              onClick={() => setPolicyModalOpen(false)}
              style={{
                background: "#f5a623",
                borderColor: "#f5a623",
                fontWeight: "600",
              }}
            >
              Đóng
            </Button>,
          ]}
          width={800}
        >
          <div style={{ fontSize: "14px", lineHeight: "1.8" }}>
            {}
            {roomType?.free_amenities &&
              roomType?.free_amenities.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <div
                    style={{
                      fontWeight: "600",
                      marginBottom: "16px",
                      fontSize: "16px",
                      color: "#333",
                    }}
                  >
                    Tiện nghi phòng
                  </div>
                  <Row gutter={[16, 16]}>
                    {roomType?.free_amenities
                      .concat(roomType?.paid_amenities || [])
                      .map((amenity: string, idx: number) => (
                        <Col span={12} key={`free-${idx}`}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "8px 0",
                            }}
                          >
                            <div
                              style={{
                                color: "#222",
                                width: "24px",
                                textAlign: "center",
                              }}
                            >
                              {FIXED_AMENITIES.find((a) => a.value === amenity)
                                ?.icon || (
                                <HomeOutlined
                                  style={{ fontSize: "18px", color: "#222" }}
                                />
                              )}
                            </div>
                            <span style={{ color: "#333", fontSize: "14px" }}>
                              {amenity}
                            </span>
                          </div>
                        </Col>
                      ))}
                  </Row>
                </div>
              )}
            {}
            {roomType?.policies?.payment && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                  Thanh toán
                </div>
                <div style={{ color: "#666" }}>
                  {typeof roomType?.policies.payment === "string"
                    ? roomType?.policies.payment
                    : "Thanh toán toàn bộ giá trị tiền đặt phòng."}
                </div>
              </div>
            )}
            {}
            <div style={{ marginBottom: "8px" }}>
              <strong>Nhận phòng:</strong>{" "}
              {roomType?.policies?.checkin &&
              typeof roomType?.policies.checkin === "string"
                ? roomType?.policies.checkin
                : "14:00"}
            </div>
            {}
            <div style={{ marginBottom: "16px" }}>
              <strong>Trả phòng:</strong>{" "}
              {roomType?.policies?.checkout &&
              typeof roomType?.policies.checkout === "string"
                ? roomType?.policies.checkout
                : "14:00"}
            </div>
            {}
            <div style={{ marginBottom: "8px" }}>
              <strong>Phụ thu người lớn:</strong>{" "}
              {roomType?.extra_adult_fee
                ? `${new Intl.NumberFormat("vi-VN").format(Number(roomType?.extra_adult_fee))} VND /đêm`
                : "Không có"}
            </div>
            {}
            <div style={{ marginBottom: "16px" }}>
              <strong>Phụ thu trẻ em:</strong>{" "}
              {roomType?.extra_child_fee
                ? `${new Intl.NumberFormat("vi-VN").format(Number(roomType?.extra_child_fee))} VND /đêm`
                : "Không có"}
            </div>
            {}
            {roomType?.policies?.other_policies &&
              roomType?.policies.other_policies.length > 0 && (
                <div>
                  <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                    Chính sách khác
                  </div>
                  <div style={{ color: "#666" }}>
                    {roomType?.policies.other_policies.map(
                      (policy: string, idx: number) => (
                        <div key={idx}>{policy}</div>
                      ),
                    )}
                  </div>
                </div>
              )}
          </div>
        </Modal>
      </>
    );
  },
);
export default RoomTypeCard;
