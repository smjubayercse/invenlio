ALTER TABLE inventory_movements DROP CONSTRAINT inventory_movements_movement_type_check;
ALTER TABLE inventory_movements ADD CONSTRAINT inventory_movements_movement_type_check CHECK (movement_type IN ('OPENING_BALANCE','MANUAL_ADJUSTMENT','GOODS_RECEIPT','PUT_AWAY','PICKING_RELOCATION','SHIPMENT_DISPATCH'));
ALTER TABLE inventory_movements DROP CONSTRAINT inventory_movements_reason_code_check;
ALTER TABLE inventory_movements ADD CONSTRAINT inventory_movements_reason_code_check CHECK (reason_code IN ('INITIAL_LOAD','MANUAL_CORRECTION','FOUND','DAMAGE','OTHER','GOODS_RECEIPT','PUT_AWAY','PICKING_RELOCATION','SHIPMENT_DISPATCH'));

ALTER TABLE sales_orders DROP CONSTRAINT sales_orders_status_check;
ALTER TABLE sales_orders ADD CONSTRAINT sales_orders_status_check CHECK (status IN ('DRAFT','CONFIRMED','PARTIALLY_ALLOCATED','ALLOCATED','CANCELLED','COMPLETED'));
ALTER TABLE sales_orders ADD COLUMN shipping_status VARCHAR(20) NOT NULL DEFAULT 'NOT_SHIPPED' CHECK (shipping_status IN ('NOT_SHIPPED','PARTIALLY_SHIPPED','SHIPPED'));
ALTER TABLE sales_order_lines ADD COLUMN shipped_quantity NUMERIC(19,6) NOT NULL DEFAULT 0 CHECK (shipped_quantity>=0 AND shipped_quantity<=packed_quantity);
ALTER TABLE pick_lists DROP CONSTRAINT pick_lists_tenant_id_sales_order_id_key;
ALTER TABLE packing_sessions DROP CONSTRAINT packing_sessions_tenant_id_sales_order_id_key;
CREATE INDEX idx_pick_lists_order ON pick_lists(tenant_id,sales_order_id,created_at DESC);
CREATE INDEX idx_packing_sessions_order ON packing_sessions(tenant_id,sales_order_id,created_at DESC);
CREATE UNIQUE INDEX uq_active_pick_cycle ON pick_lists(tenant_id,sales_order_id) WHERE status IN ('CREATED','IN_PROGRESS');
CREATE UNIQUE INDEX uq_open_packing_cycle ON packing_sessions(tenant_id,sales_order_id) WHERE status='OPEN';

CREATE TABLE shipment_number_counters (
 tenant_id UUID NOT NULL REFERENCES organizations(id), shipment_year INTEGER NOT NULL,
 next_value BIGINT NOT NULL CHECK (next_value>0), PRIMARY KEY (tenant_id,shipment_year)
);
CREATE TABLE shipments (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL, shipment_number VARCHAR(32) NOT NULL,
 sales_order_id UUID NOT NULL, warehouse_id UUID NOT NULL, status VARCHAR(16) NOT NULL,
 carrier_name VARCHAR(120), service_name VARCHAR(120), tracking_number VARCHAR(120),
 shipping_address_snapshot VARCHAR(1000) NOT NULL, dispatched_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL, created_by UUID NOT NULL,
 version BIGINT NOT NULL DEFAULT 0, UNIQUE (tenant_id,id), UNIQUE (tenant_id,shipment_number),
 UNIQUE (tenant_id,id,sales_order_id,warehouse_id),
 FOREIGN KEY (tenant_id,sales_order_id) REFERENCES sales_orders(tenant_id,id) ON DELETE RESTRICT,
 FOREIGN KEY (tenant_id,warehouse_id) REFERENCES warehouses(tenant_id,id) ON DELETE RESTRICT,
 CHECK (status IN ('DRAFT','DISPATCHED','CANCELLED')),
 CHECK ((status='DISPATCHED')=(dispatched_at IS NOT NULL))
);
CREATE TABLE shipment_packages (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL, shipment_id UUID NOT NULL,
 package_id UUID NOT NULL, status VARCHAR(16) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL, UNIQUE (tenant_id,id),
 UNIQUE (tenant_id,shipment_id,package_id),
 FOREIGN KEY (tenant_id,shipment_id) REFERENCES shipments(tenant_id,id) ON DELETE RESTRICT,
 FOREIGN KEY (tenant_id,package_id) REFERENCES fulfillment_packages(tenant_id,id) ON DELETE RESTRICT,
 CHECK (status IN ('ASSIGNED','DISPATCHED','CANCELLED'))
);
CREATE UNIQUE INDEX uq_shipment_package_active ON shipment_packages(tenant_id,package_id) WHERE status IN ('ASSIGNED','DISPATCHED');
CREATE INDEX idx_shipments_query ON shipments(tenant_id,status,warehouse_id,created_at DESC);
CREATE INDEX idx_shipments_order ON shipments(tenant_id,sales_order_id);
CREATE INDEX idx_shipments_tracking ON shipments(tenant_id,tracking_number);
CREATE INDEX idx_shipments_dispatched ON shipments(tenant_id,dispatched_at);
CREATE TABLE shipment_dispatch_requests (
 id UUID PRIMARY KEY, tenant_id UUID NOT NULL, idempotency_key VARCHAR(128) NOT NULL,
 shipment_id UUID NOT NULL, request_fingerprint CHAR(64) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL, UNIQUE (tenant_id,idempotency_key),
 FOREIGN KEY (tenant_id,shipment_id) REFERENCES shipments(tenant_id,id) ON DELETE RESTRICT
);

INSERT INTO permissions(permission_key,description) VALUES
 ('shipping:read','Read shipments'),('shipping:manage','Manage draft shipments'),('shipping:dispatch','Dispatch shipments') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(tenant_id,role_id,permission_key)
 SELECT r.tenant_id,r.id,p.permission_key FROM roles r CROSS JOIN permissions p
 WHERE r.system_role AND r.name='ORGANIZATION_ADMIN' AND p.permission_key IN ('shipping:read','shipping:manage','shipping:dispatch') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(tenant_id,role_id,permission_key)
 SELECT r.tenant_id,r.id,p.permission_key FROM roles r CROSS JOIN permissions p
 WHERE r.system_role AND r.name IN ('READ_ONLY','AUDITOR') AND p.permission_key='shipping:read' ON CONFLICT DO NOTHING;

CREATE FUNCTION guard_completed_sales_order() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.status='COMPLETED' AND NEW IS DISTINCT FROM OLD THEN
  RAISE EXCEPTION 'completed sales order is immutable' USING ERRCODE='55000';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER completed_sales_order_guard BEFORE UPDATE ON sales_orders FOR EACH ROW EXECUTE FUNCTION guard_completed_sales_order();
CREATE FUNCTION guard_completed_sales_line() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS (SELECT 1 FROM sales_orders WHERE tenant_id=OLD.tenant_id AND id=OLD.sales_order_id AND status='COMPLETED') THEN
  RAISE EXCEPTION 'completed sales order line is immutable' USING ERRCODE='55000';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER completed_sales_line_guard BEFORE UPDATE ON sales_order_lines FOR EACH ROW EXECUTE FUNCTION guard_completed_sales_line();

CREATE FUNCTION guard_packed_package_items() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE package_status VARCHAR(16);
BEGIN
 IF TG_OP='DELETE' THEN
  SELECT status INTO package_status FROM fulfillment_packages
  WHERE tenant_id=OLD.tenant_id AND id=OLD.package_id;
 ELSE
  SELECT status INTO package_status FROM fulfillment_packages
  WHERE tenant_id=NEW.tenant_id AND id=NEW.package_id;
 END IF;
 IF package_status='PACKED' THEN
  RAISE EXCEPTION 'packed package contents are immutable' USING ERRCODE='55000';
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER packed_package_items_guard BEFORE INSERT OR UPDATE OR DELETE ON package_items
 FOR EACH ROW EXECUTE FUNCTION guard_packed_package_items();
CREATE FUNCTION guard_packed_package_status() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.status='PACKED' AND NEW.status<>'PACKED' THEN
  RAISE EXCEPTION 'packed package cannot be reopened' USING ERRCODE='55000';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER packed_package_status_guard BEFORE UPDATE ON fulfillment_packages
 FOR EACH ROW EXECUTE FUNCTION guard_packed_package_status();
