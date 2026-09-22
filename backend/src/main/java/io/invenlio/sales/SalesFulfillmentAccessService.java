package io.invenlio.sales;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class SalesFulfillmentAccessService implements SalesFulfillmentAccess {
    private final JdbcTemplate db;
    SalesFulfillmentAccessService(JdbcTemplate db) { this.db = db; }

    @Override @Transactional(readOnly = true)
    public Order requireAllocated(UUID tenant, UUID id) {
        var rows = db.query("SELECT id,sales_order_number,fulfillment_warehouse_id,fulfillment_status FROM sales_orders WHERE tenant_id=? AND id=? AND status IN('ALLOCATED','PARTIALLY_ALLOCATED')",
            (r,n) -> new Object[]{r.getObject(1),r.getString(2),r.getObject(3),r.getString(4)}, tenant,id);
        if (rows.isEmpty()) {
            Integer visible = db.queryForObject("SELECT count(*) FROM sales_orders WHERE tenant_id=? AND id=?",Integer.class,tenant,id);
            throw visible == null || visible == 0
                ? new SalesException("SALES_ORDER_NOT_FOUND","Sales order not found")
                : new SalesException("SALES_ORDER_NOT_ALLOCATED","Allocated sales order required");
        }
        var x = rows.getFirst();
        var allocations = db.query("SELECT a.sales_order_line_id,a.inventory_reservation_id,a.allocated_quantity FROM sales_allocations a JOIN inventory_reservations r ON r.tenant_id=a.tenant_id AND r.id=a.inventory_reservation_id WHERE a.tenant_id=? AND a.sales_order_id=? AND a.status='ACTIVE' AND r.status='ACTIVE' ORDER BY a.sales_order_line_id,a.id",
            (r,n) -> new Allocation((UUID)r.getObject(1),(UUID)r.getObject(2),r.getBigDecimal(3)),tenant,id);
        return new Order((UUID)x[0],(String)x[1],(UUID)x[2],(String)x[3],allocations);
    }

    @Override @Transactional(readOnly = true)
    public ShippingOrder requireShippable(UUID tenant, UUID id) {
        var rows = db.query("SELECT id,fulfillment_warehouse_id,shipping_address_snapshot FROM sales_orders WHERE tenant_id=? AND id=? AND status IN ('ALLOCATED','PARTIALLY_ALLOCATED')",
            (r,n) -> new ShippingOrder((UUID)r.getObject(1),(UUID)r.getObject(2),r.getString(3)),tenant,id);
        if (rows.isEmpty()) throw new SalesException("SALES_ORDER_NOT_FOUND","Shippable sales order not found");
        return rows.getFirst();
    }

    @Override @Transactional public void pickingStarted(UUID t,UUID o) {
        db.update("UPDATE sales_orders SET fulfillment_status='PICKING',updated_at=now(),version=version+1 WHERE tenant_id=? AND id=? AND fulfillment_status IN ('NOT_STARTED','PACKED')",t,o);
    }
    @Override @Transactional public void picked(UUID t,UUID o,UUID l,BigDecimal q,boolean complete) {
        int count=db.update("UPDATE sales_order_lines SET picked_quantity=picked_quantity+?,updated_at=now(),version=version+1 WHERE tenant_id=? AND sales_order_id=? AND id=? AND picked_quantity+?<=allocated_quantity",q,t,o,l,q);
        if(count!=1) throw new SalesException("PICK_PROJECTION_MISMATCH","Pick quantity exceeds allocation");
        if(complete) db.update("UPDATE sales_orders SET fulfillment_status='PICKED',updated_at=now(),version=version+1 WHERE tenant_id=? AND id=?",t,o);
    }
    @Override @Transactional public void packingStarted(UUID t,UUID o) {
        db.update("UPDATE sales_orders SET fulfillment_status='PACKING',updated_at=now(),version=version+1 WHERE tenant_id=? AND id=? AND fulfillment_status='PICKED'",t,o);
    }
    @Override @Transactional public void packed(UUID t,UUID o,Map<UUID,BigDecimal> qs) {
        qs.forEach((l,q) -> {
            int count=db.update("UPDATE sales_order_lines SET packed_quantity=packed_quantity+?,updated_at=now(),version=version+1 WHERE tenant_id=? AND sales_order_id=? AND id=? AND packed_quantity+?<=picked_quantity",q,t,o,l,q);
            if(count!=1) throw new SalesException("PACK_PROJECTION_MISMATCH","Packed quantity exceeds picked quantity");
        });
        db.update("UPDATE sales_orders SET fulfillment_status='PACKED',updated_at=now(),version=version+1 WHERE tenant_id=? AND id=?",t,o);
    }

    @Override @Transactional
    public boolean shipped(UUID tenant, UUID order, Map<UUID,BigDecimal> quantities) {
        var locked=db.query("SELECT status FROM sales_orders WHERE tenant_id=? AND id=? FOR UPDATE",
            (r,n)->r.getString(1),tenant,order);
        if(locked.isEmpty()) throw new SalesException("SALES_ORDER_NOT_FOUND","Sales order not found");
        if("COMPLETED".equals(locked.getFirst()) || "CANCELLED".equals(locked.getFirst()))
            throw new SalesException("SALES_ORDER_NOT_SHIPPABLE","Order is final");
        quantities.forEach((line,quantity)->{
            int count=db.update("UPDATE sales_order_lines SET shipped_quantity=shipped_quantity+?,updated_at=now(),version=version+1 WHERE tenant_id=? AND sales_order_id=? AND id=? AND shipped_quantity+?<=packed_quantity",
                quantity,tenant,order,line,quantity);
            if(count!=1) throw new SalesException("SHIPPED_PROJECTION_MISMATCH","Shipped quantity exceeds packed quantity");
        });
        boolean complete=Boolean.TRUE.equals(db.queryForObject("""
            SELECT NOT EXISTS(SELECT 1 FROM sales_order_lines WHERE tenant_id=? AND sales_order_id=?
              AND shipped_quantity<>ordered_quantity)
              AND NOT EXISTS(SELECT 1 FROM sales_allocations a JOIN inventory_reservations r
                ON r.tenant_id=a.tenant_id AND r.id=a.inventory_reservation_id
                WHERE a.tenant_id=? AND a.sales_order_id=? AND r.status='ACTIVE')
            """,Boolean.class,tenant,order,tenant,order));
        db.update("UPDATE sales_orders SET shipping_status=?,status=CASE WHEN ? THEN 'COMPLETED' ELSE status END,updated_at=now(),version=version+1 WHERE tenant_id=? AND id=?",
            complete?"SHIPPED":"PARTIALLY_SHIPPED",complete,tenant,order);
        return complete;
    }
}
