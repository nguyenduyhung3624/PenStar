
Table "booking_bill_logs" {
  "id" integer [pk, not null]
  "booking_id" integer [not null]
  "user_id" integer
  "printed_at" timestamp [default: `now()`]
  "bill_number" text
  "note" text
}

Table "booking_incidents" {
  "id" integer [pk, not null]
  "booking_id" integer
  "room_id" integer
  "equipment_id" integer
  "quantity" integer [not null]
  "reason" text
  "amount" numeric(15,2) [not null]
  "created_at" timestamp [default: `CURRENT_TIMESTAMP`]
  "compensation_price" numeric
  "deleted_at" timestamp
  "deleted_by" integer
  "deleted_reason" text
}

Table "booking_items" {
  "id" integer [pk, not null]
  "booking_id" integer
  "room_id" integer
  "check_in" timestamp [not null]
  "check_out" timestamp [not null]
  "num_adults" integer [default: 1]
  "num_children" integer [default: 0]
  "special_requests" text
  "room_type_id" integer
  "room_type_price" numeric
  "quantity" integer [default: 1]
  "extra_adult_fees" numeric [default: 0]
  "extra_child_fees" numeric [default: 0]
  "extra_fees" numeric [default: 0]
  "num_babies" integer [default: 0]
  "refund_amount" integer [default: 0]
}

Table "booking_service_logs" {
  "id" integer [pk, not null]
  "booking_service_id" integer
  "action" "character varying(20)"
  "action_by" integer
  "action_at" timestamp [default: `now()`]
  "note" text
}

Table "booking_services" {
  "id" integer [pk, not null]
  "booking_id" integer
  "service_id" integer
  "quantity" integer [default: 1]
  "total_service_price" numeric(10,2) [not null]
  "booking_item_id" integer
  "created_by" integer
  "created_at" timestamp [default: `now()`]
  "note" text
}

Table "bookings" {
  "id" integer [pk, not null]
  "customer_name" "character varying(100)"
  "total_price" numeric(10,2) [default: 0]
  "payment_status" "character varying(30)" [default: `'unpaid'::charactervarying`]
  "booking_method" "character varying(30)" [not null]
  "stay_status_id" integer
  "created_at" timestamp [default: `CURRENT_TIMESTAMP`]
  "is_refunded" boolean [default: false]
  "user_id" integer
  "notes" text
  "payment_method" "character varying(50)" [default: `NULL::charactervarying`, note: 'Ph╞░╞íng thß╗⌐c thanh to├ín: cash, card, transfer, momo, vnpay, cod']
  "change_count" integer [default: 0, note: 'Sß╗æ lß║ºn ─æ├ú ─æß╗òi ph├▓ng (tß╗æi ─æa 1 lß║ºn)']
  "checked_in_by" integer
  "checked_out_by" integer
  "cancel_reason" text
  "canceled_by" integer
  "canceled_at" timestamp
  "discount_code" "character varying(32)"
  "discount_amount" numeric [default: 0]
  "refund_amount" integer [default: 0]

  Checks {
    `(change_count <= 1)` [name: 'check_change_count_limit']
  }
}

Table "discount_code_usages" {
  "id" integer [pk, not null]
  "discount_code_id" integer
  "user_id" integer
  "booking_id" integer
  "used_at" timestamp [default: `now()`]
}

Table "discount_codes" {
  "id" integer [pk, not null]
  "code" "character varying(32)" [unique, not null]
  "type" "character varying(16)" [not null]
  "value" numeric [not null]
  "min_total" numeric [default: 0]
  "max_uses" integer [default: 1]
  "max_uses_per_user" integer [default: 1]
  "start_date" timestamp
  "end_date" timestamp
  "status" "character varying(16)" [default: `'active'::charactervarying`]
  "description" text
  "created_at" timestamp [default: `now()`]
}

Table "equipment_stock_logs" {
  "id" integer [pk, not null]
  "equipment_id" integer [not null]
  "type" "character varying(20)" [not null]
  "quantity" integer [not null]
  "from_room_id" integer
  "to_room_id" integer
  "note" text
  "created_at" timestamp [default: `CURRENT_TIMESTAMP`]
  "created_by" integer
  "action" "character varying(20)"
}

Table "floors" {
  "id" integer [pk, not null]
  "name" "character varying(50)" [not null]
  "description" text
  "created_at" timestamp [default: `now()`]
}

Table "master_equipments" {
  "id" integer [pk, not null]
  "name" "character varying(255)" [not null]
  "type" "character varying(50)"
  "import_price" numeric(15,2)
  "compensation_price" numeric(15,2)
  "total_stock" integer [default: 0]
  "created_at" timestamp [default: `CURRENT_TIMESTAMP`]
}

Table "refund_policies" {
  "id" integer [pk, not null]
  "room_type_id" integer [not null]
  "refundable" boolean [not null, default: false]
  "refund_percent" integer
  "refund_deadline_hours" integer
  "non_refundable" boolean [not null, default: false]
  "notes" text
}

Table "roles" {
  "id" integer [pk, not null]
  "name" "character varying(50)" [unique, note: 'admin, receptionist, manager, user...']
  "description" text
}

Table "room_devices" {
  "id" integer [pk, not null]
  "master_equipment_id" integer [not null]
  "device_name" "character varying(255)" [not null]
  "device_type" "character varying(100)" [not null]
  "status" "character varying(50)" [default: `'working'::charactervarying`]
  "room_id" integer [not null]
  "quantity" integer [default: 1]
  "note" text
  "images" text
  "created_at" timestamp [default: `CURRENT_TIMESTAMP`]
  "updated_at" timestamp [default: `CURRENT_TIMESTAMP`]
}

Table "room_images" {
  "id" integer [pk, not null]
  "room_id" integer [not null]
  "image_url" text [not null]
  "is_thumbnail" boolean [default: false]
  "created_at" timestamp [default: `now()`]
  "file_hash" "character varying(64)"
}

Table "room_type_equipments" {
  "id" integer [pk, not null]
  "room_type_id" integer [not null]
  "equipment_type_id" integer [not null]
  "min_quantity" integer [default: 1]
  "max_quantity" integer [default: 1]

  Indexes {
    (room_type_id, equipment_type_id) [unique, name: "unique_room_type_equipment"]
  }
}

Table "room_type_images" {
  "id" integer [pk, not null]
  "room_type_id" integer [not null]
  "image_url" text [not null]
  "is_thumbnail" boolean [default: false]
  "created_at" timestamp [default: `CURRENT_TIMESTAMP`]
  "updated_at" timestamp [default: `CURRENT_TIMESTAMP`]
  "file_hash" "character varying(64)"

  Indexes {
    room_type_id [type: btree, name: "idx_room_type_images_room_type_id"]
  }
}

Table "room_types" {
  "id" integer [pk, not null]
  "name" "character varying(50)" [unique, note: 'Deluxe, Suite, VIP...']
  "description" text
  "created_at" timestamp [default: `CURRENT_TIMESTAMP`]
  "thumbnail" "character varying(500)" [note: 'ß║ónh ─æß║íi diß╗çn cß╗ºa loß║íi ph├▓ng (URL hoß║╖c path)']
  "capacity" integer [default: 2]
  "price" numeric(10,2) [default: 0]
  "bed_type" "character varying(50)"
  "view_direction" "character varying(100)"
  "free_amenities" "text[]"
  "room_size" numeric
  "base_adults" integer [default: 2]
  "base_children" integer [default: 1]
  "extra_adult_fee" numeric(10,2) [default: 0]
  "extra_child_fee" numeric(10,2) [default: 0]
  "child_age_limit" integer [default: 12]
  "policies" jsonb
  "paid_amenities" "text[]"

  Indexes {
    bed_type [type: btree, name: "idx_room_types_bed_type"]
  }
}

Table "rooms" {
  "id" integer [pk, not null]
  "name" "character varying(100)"
  "type_id" integer
  "status" "character varying(20)" [default: `'available'::charactervarying`, note: 'available, maintenance, booked']
  "created_at" timestamp [default: `CURRENT_TIMESTAMP`]
  "thumbnail" "character varying(255)"
  "floor_id" integer
  "short_desc" text
  "long_desc" text
  "updated_at" timestamp [default: `now()`]
}

Table "services" {
  "id" integer [pk, not null]
  "name" "character varying(100)" [not null]
  "price" numeric(10,2) [not null]
  "description" text
  "is_included" boolean [default: false]
  "image_url" "character varying(255)"
  "note" text
  "created_at" timestamp [default: `CURRENT_TIMESTAMP`]
  "updated_at" timestamp [default: `CURRENT_TIMESTAMP`]
  "thumbnail" text

  Indexes {
    is_included [type: btree, name: "idx_services_is_included"]
  }
}

Table "stay_status" {
  "id" integer [pk, not null]
  "name" "character varying(30)" [unique, not null]
  "description" text
}

Table "users" {
  "id" integer [pk, not null]
  "full_name" "character varying(100)" [not null]
  "email" "character varying(150)" [unique, not null]
  "password" "character varying(255)" [not null]
  "phone" "character varying(20)"
  "role_id" integer
  "created_at" timestamp [default: `CURRENT_TIMESTAMP`]
  "updated_at" timestamp [default: `now()`]
  "status" "character varying(50)" [default: `'active'::charactervarying`]

  Checks {
    `((status)::text = ANY (ARRAY[('active'::character varying)::text, ('banned'::character varying)::text]))` [name: 'users_status_check']
  }
}

Ref "booking_bill_logs_booking_id_fkey":"bookings"."id" < "booking_bill_logs"."booking_id"

Ref "booking_incidents_booking_id_fkey":"bookings"."id" < "booking_incidents"."booking_id"

Ref "booking_incidents_equipment_id_fkey":"master_equipments"."id" < "booking_incidents"."equipment_id"

Ref "booking_items_booking_id_fkey":"bookings"."id" < "booking_items"."booking_id" [delete: cascade]

Ref "booking_items_room_id_fkey":"rooms"."id" < "booking_items"."room_id"

Ref "booking_service_logs_booking_service_id_fkey":"booking_services"."id" < "booking_service_logs"."booking_service_id" [delete: cascade]

Ref "booking_services_booking_id_fkey":"bookings"."id" < "booking_services"."booking_id" [delete: cascade]

Ref "booking_services_booking_item_id_fkey":"booking_items"."id" < "booking_services"."booking_item_id"

Ref "booking_services_service_id_fkey":"services"."id" < "booking_services"."service_id"

Ref "bookings_canceled_by_fkey":"users"."id" < "bookings"."canceled_by"

Ref "bookings_checked_in_by_fkey":"users"."id" < "bookings"."checked_in_by" [delete: set null]

Ref "bookings_checked_out_by_fkey":"users"."id" < "bookings"."checked_out_by" [delete: set null]

Ref "bookings_stay_status_id_fkey":"stay_status"."id" < "bookings"."stay_status_id"

Ref "bookings_user_id_fkey":"users"."id" < "bookings"."user_id" [delete: set null]

Ref "discount_code_usages_discount_code_id_fkey":"discount_codes"."id" < "discount_code_usages"."discount_code_id"

Ref "equipment_stock_logs_equipment_id_fkey":"master_equipments"."id" < "equipment_stock_logs"."equipment_id" [delete: cascade]

Ref "fk_floor":"floors"."id" < "rooms"."floor_id" [update: cascade, delete: set null]

Ref "fk_users_role":"roles"."id" < "users"."role_id" [update: cascade, delete: cascade]

Ref "refund_policies_room_type_id_fkey":"room_types"."id" < "refund_policies"."room_type_id" [delete: cascade]

Ref "room_devices_master_equipment_id_fkey":"master_equipments"."id" < "room_devices"."master_equipment_id" [delete: restrict]

Ref "room_devices_room_id_fkey":"rooms"."id" < "room_devices"."room_id" [delete: cascade]

Ref "room_images_room_id_fkey":"rooms"."id" < "room_images"."room_id" [delete: cascade]

Ref "room_type_equipments_equipment_type_id_fkey":"master_equipments"."id" < "room_type_equipments"."equipment_type_id"

Ref "room_type_equipments_room_type_id_fkey":"room_types"."id" < "room_type_equipments"."room_type_id"

Ref "room_type_images_room_type_id_fkey":"room_types"."id" < "room_type_images"."room_type_id" [delete: cascade]

Ref "rooms_type_id_fkey":"room_types"."id" < "rooms"."type_id"
