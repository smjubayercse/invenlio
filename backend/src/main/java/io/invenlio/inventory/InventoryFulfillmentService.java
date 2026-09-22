package io.invenlio.inventory;

import io.invenlio.warehouse.WarehouseAvailability;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Collection;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class InventoryFulfillmentService implements InventoryFulfillment {
    private final JdbcTemplate db;
    private final WarehouseAvailability warehouses;

    InventoryFulfillmentService(JdbcTemplate db, WarehouseAvailability warehouses) {
        this.db = db;
        this.warehouses = warehouses;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Allocation> allocations(UUID tenant, Collection<UUID> reservationIds) {
        if (reservationIds == null || reservationIds.isEmpty()) return List.of();
        return db.query("""
            SELECT a.reservation_id,a.id,a.variant_id,a.warehouse_id,a.location_id,a.lot_id,a.serial_id,
                   a.quantity,a.unit_code,l.sequence
            FROM inventory_reservation_allocations a
            JOIN inventory_reservations r ON r.tenant_id=a.tenant_id AND r.id=a.reservation_id
            JOIN warehouse_locations l ON l.tenant_id=a.tenant_id AND l.warehouse_id=a.warehouse_id AND l.id=a.location_id
            JOIN warehouse_zones z ON z.tenant_id=l.tenant_id AND z.warehouse_id=l.warehouse_id AND z.id=l.zone_id
            WHERE a.tenant_id=? AND a.reservation_id=ANY(?) AND r.status='ACTIVE'
            ORDER BY z.sequence,l.sequence,l.normalized_code,a.id
            """, (rs, n) -> map(rs), tenant, reservationIds.toArray(UUID[]::new));
    }

    @Override
    @Transactional
    public UUID consumeToPacking(UUID tenant, UUID actor, String subject, UUID reservationId,
                                 UUID allocationId, UUID destination, String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank() || idempotencyKey.length() > 128)
            throw error("PICK_IDEMPOTENCY_KEY_REQUIRED");
        Allocation a = allocation(tenant, reservationId, allocationId);
        var packing = warehouses.findUsableLocation(tenant, a.warehouseId(), destination)
            .orElseThrow(() -> error("INVALID_PACKING_LOCATION"));
        if (!"PACKING".equals(packing.type()) || a.locationId().equals(destination))
            throw error("INVALID_PACKING_LOCATION");
        if (a.serialId() != null && a.quantity().compareTo(BigDecimal.ONE) != 0)
            throw error("INVALID_SERIAL_PICK_QUANTITY");

        Instant now = Instant.now();
        UUID movement = UUID.randomUUID();
        db.update("""
            INSERT INTO inventory_movements(id,tenant_id,movement_type,idempotency_key,request_fingerprint,
                reason_code,actor_subject,occurred_at,recorded_at)
            VALUES(?,?,'PICKING_RELOCATION',?,?,'PICKING_RELOCATION',?,?,?)
            """, movement, tenant, idempotencyKey, fingerprint(a, destination), subject,
            Timestamp.from(now), Timestamp.from(now));
        int source = db.update("""
            UPDATE inventory_balances SET on_hand_quantity=on_hand_quantity-?,
                reserved_quantity=reserved_quantity-?,updated_at=?,version=version+1
            WHERE tenant_id=? AND variant_id=? AND warehouse_id=? AND location_id=?
                AND lot_id IS NOT DISTINCT FROM ? AND serial_id IS NOT DISTINCT FROM ?
                AND on_hand_quantity>=? AND reserved_quantity>=?
            """, a.quantity(), a.quantity(), Timestamp.from(now), tenant,
            a.variantId(), a.warehouseId(), a.locationId(), a.lotId(), a.serialId(),
            a.quantity(), a.quantity());
        if (source != 1) throw error("INSUFFICIENT_PICK_SOURCE_STOCK");

        db.update("""
            INSERT INTO inventory_balances(id,tenant_id,variant_id,warehouse_id,location_id,
                on_hand_quantity,reserved_quantity,unit_code,updated_at,version,lot_id,serial_id)
            VALUES(?,?,?,?,?,?,0,?,?,0,?,?) ON CONFLICT DO NOTHING
            """, UUID.randomUUID(), tenant, a.variantId(), a.warehouseId(), destination,
            BigDecimal.ZERO, a.unitCode(), Timestamp.from(now), a.lotId(), a.serialId());
        int target = db.update("""
            UPDATE inventory_balances SET on_hand_quantity=on_hand_quantity+?,updated_at=?,version=version+1
            WHERE tenant_id=? AND variant_id=? AND warehouse_id=? AND location_id=?
                AND lot_id IS NOT DISTINCT FROM ? AND serial_id IS NOT DISTINCT FROM ?
            """, a.quantity(), Timestamp.from(now), tenant, a.variantId(),
            a.warehouseId(), destination, a.lotId(), a.serialId());
        if (target != 1) throw error("PICK_DESTINATION_PROJECTION_MISMATCH");

        ledger(tenant, movement, 0, a, a.locationId(), a.quantity().negate(), now);
        ledger(tenant, movement, 1, a, destination, a.quantity(), now);
        db.update("""
            INSERT INTO inventory_reservation_consumptions(id,tenant_id,reservation_id,reservation_allocation_id,
                inventory_movement_id,quantity,consumed_at,consumed_by)
            VALUES(?,?,?,?,?,?,?,?)
            """, UUID.randomUUID(), tenant, reservationId, allocationId, movement,
            a.quantity(), Timestamp.from(now), actor);
        db.update("""
            UPDATE inventory_reservations SET status='CONSUMED',updated_at=now(),version=version+1
            WHERE tenant_id=? AND id=? AND status='ACTIVE'
                AND NOT EXISTS(SELECT 1 FROM inventory_reservation_allocations x
                    WHERE x.tenant_id=? AND x.reservation_id=? AND NOT EXISTS(
                        SELECT 1 FROM inventory_reservation_consumptions c
                        WHERE c.tenant_id=x.tenant_id AND c.reservation_allocation_id=x.id))
            """, tenant, reservationId, tenant, reservationId);
        return movement;
    }

    private Allocation allocation(UUID tenant, UUID reservationId, UUID allocationId) {
        var rows = db.query("""
            SELECT a.reservation_id,a.id,a.variant_id,a.warehouse_id,a.location_id,a.lot_id,a.serial_id,
                   a.quantity,a.unit_code,l.sequence
            FROM inventory_reservation_allocations a
            JOIN inventory_reservations r ON r.tenant_id=a.tenant_id AND r.id=a.reservation_id
            JOIN warehouse_locations l ON l.tenant_id=a.tenant_id AND l.warehouse_id=a.warehouse_id AND l.id=a.location_id
            WHERE a.tenant_id=? AND a.reservation_id=? AND a.id=? AND r.status='ACTIVE'
            FOR UPDATE OF a,r
            """, (rs, n) -> map(rs), tenant, reservationId, allocationId);
        if (rows.isEmpty()) throw error("PICK_RESERVATION_NOT_ACTIVE");
        return rows.getFirst();
    }

    private static Allocation map(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new Allocation((UUID) rs.getObject(1), (UUID) rs.getObject(2),
            (UUID) rs.getObject(3), (UUID) rs.getObject(4), (UUID) rs.getObject(5),
            (UUID) rs.getObject(6), (UUID) rs.getObject(7), rs.getBigDecimal(8),
            rs.getString(9), rs.getInt(10));
    }

    private void ledger(UUID tenant, UUID movement, int sequence, Allocation a, UUID location,
                        BigDecimal delta, Instant now) {
        db.update("""
            INSERT INTO inventory_ledger_entries(id,tenant_id,movement_id,sequence,variant_id,warehouse_id,
                location_id,quantity_delta,unit_code,occurred_at,recorded_at,lot_id,serial_id)
            VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, UUID.randomUUID(), tenant, movement, sequence, a.variantId(), a.warehouseId(),
            location, delta, a.unitCode(), Timestamp.from(now), Timestamp.from(now),
            a.lotId(), a.serialId());
    }

    private static String fingerprint(Allocation a, UUID destination) {
        try {
            byte[] value = (a.allocationId() + "|" + destination).getBytes(StandardCharsets.UTF_8);
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value));
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    private static InventoryException error(String code) {
        return new InventoryException(code, code.replace('_', ' ').toLowerCase());
    }
}
