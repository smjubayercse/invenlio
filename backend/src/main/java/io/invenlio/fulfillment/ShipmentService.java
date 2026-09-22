package io.invenlio.fulfillment;

import io.invenlio.inventory.InventoryFulfillment;
import io.invenlio.organization.AuditTrail;
import io.invenlio.organization.AuthorizationService;
import io.invenlio.organization.Permission;
import io.invenlio.sales.SalesFulfillmentAccess;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.Year;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class ShipmentService {
    private final AuthorizationService auth;
    private final AuditTrail audit;
    private final JdbcTemplate db;
    private final SalesFulfillmentAccess sales;
    private final InventoryFulfillment inventory;
    private final ApplicationEventPublisher events;

    ShipmentService(AuthorizationService auth, AuditTrail audit, JdbcTemplate db,
                    SalesFulfillmentAccess sales, InventoryFulfillment inventory,
                    ApplicationEventPublisher events) {
        this.auth=auth; this.audit=audit; this.db=db; this.sales=sales;
        this.inventory=inventory; this.events=events;
    }

    @Transactional
    Shipment create(Create command) {
        var access=auth.require(Permission.SHIPPING_MANAGE);
        if(command.salesOrderId()==null || command.packageIds()==null || command.packageIds().isEmpty()
           || command.packageIds().size()>100 || new HashSet<>(command.packageIds()).size()!=command.packageIds().size())
            throw error("SHIPMENT_PACKAGES_REQUIRED");
        var order=sales.requireShippable(access.tenantId(),command.salesOrderId());
        var packageIds=command.packageIds().stream().sorted().toList();
        for(UUID packageId:packageIds) validatePackage(access.tenantId(),packageId,order.id(),order.warehouseId(),null);
        UUID id=UUID.randomUUID();
        db.update("""
            INSERT INTO shipments(id,tenant_id,shipment_number,sales_order_id,warehouse_id,status,
              carrier_name,service_name,tracking_number,shipping_address_snapshot,created_at,updated_at,created_by)
            VALUES(?,?,?,?,?,'DRAFT',?,?,?,?,now(),now(),?)
            """,id,access.tenantId(),number(access.tenantId()),order.id(),order.warehouseId(),
            field(command.carrierName(),"INVALID_CARRIER_NAME"),field(command.serviceName(),"INVALID_SERVICE_NAME"),
            tracking(command.trackingNumber()),order.shippingAddress(),access.userId());
        for(UUID packageId:packageIds)
            db.update("INSERT INTO shipment_packages(id,tenant_id,shipment_id,package_id,status,created_at) VALUES(?,?,?,?,'ASSIGNED',now())",
                UUID.randomUUID(),access.tenantId(),id,packageId);
        audit.record(access,"SHIPMENT_CREATED","shipment",id.toString());
        events.publishEvent(new FulfillmentEvents.ShipmentCreated(access.tenantId(),id,order.id()));
        return load(access.tenantId(),id,false);
    }

    @Transactional(readOnly=true)
    Shipment get(UUID id) {
        var access=auth.require(Permission.SHIPPING_READ);
        return load(access.tenantId(),id,false);
    }

    @Transactional(readOnly=true)
    List<Shipment> list(String number,UUID orderId,UUID warehouseId,String status,String carrier,
                        String tracking,Instant from,Instant to,int page,int size,String sort) {
        var access=auth.require(Permission.SHIPPING_READ);
        if(page<0 || size<1 || size>100 || (from!=null && to!=null && from.isAfter(to)))
            throw error("INVALID_PAGINATION");
        String order=switch(sort==null?"createdAt":sort) {
            case "createdAt" -> "created_at DESC";
            case "shipmentNumber" -> "shipment_number";
            case "status" -> "status";
            case "dispatchedAt" -> "dispatched_at DESC NULLS LAST";
            default -> throw error("INVALID_SORT");
        };
        return db.query("""
            SELECT id FROM shipments WHERE tenant_id=?
              AND (?::text IS NULL OR shipment_number=?::text)
              AND (?::uuid IS NULL OR sales_order_id=?::uuid)
              AND (?::uuid IS NULL OR warehouse_id=?::uuid)
              AND (?::text IS NULL OR status=?::text)
              AND (?::text IS NULL OR carrier_name=?::text)
              AND (?::text IS NULL OR tracking_number=?::text)
              AND (?::timestamptz IS NULL OR dispatched_at>=?::timestamptz)
              AND (?::timestamptz IS NULL OR dispatched_at<=?::timestamptz)
            """+" ORDER BY "+order+",id OFFSET ? LIMIT ?",
            (r,n)->load(access.tenantId(),(UUID)r.getObject(1),false),
            access.tenantId(),number,number,orderId,orderId,warehouseId,warehouseId,status,status,
            carrier,carrier,tracking,tracking,
            from==null?null:Timestamp.from(from),from==null?null:Timestamp.from(from),
            to==null?null:Timestamp.from(to),to==null?null:Timestamp.from(to),page*size,size);
    }

    @Transactional
    Shipment update(UUID id, Update command) {
        var access=auth.require(Permission.SHIPPING_MANAGE);
        Shipment current=load(access.tenantId(),id,true);
        if(!"DRAFT".equals(current.status())) throw error("SHIPMENT_NOT_EDITABLE");
        int count=db.update("""
            UPDATE shipments SET carrier_name=?,service_name=?,tracking_number=?,updated_at=now(),version=version+1
            WHERE tenant_id=? AND id=? AND status='DRAFT' AND version=?
            """,field(command.carrierName(),"INVALID_CARRIER_NAME"),
            field(command.serviceName(),"INVALID_SERVICE_NAME"),tracking(command.trackingNumber()),
            access.tenantId(),id,command.version());
        if(count!=1) throw error("CONCURRENT_MODIFICATION");
        audit.record(access,"SHIPMENT_UPDATED","shipment",id.toString());
        return load(access.tenantId(),id,false);
    }

    @Transactional
    Shipment cancel(UUID id,long version) {
        var access=auth.require(Permission.SHIPPING_MANAGE);
        Shipment current=load(access.tenantId(),id,true);
        if(!"DRAFT".equals(current.status())) throw error("INVALID_SHIPMENT_TRANSITION");
        if(db.update("UPDATE shipments SET status='CANCELLED',updated_at=now(),version=version+1 WHERE tenant_id=? AND id=? AND version=?",
            access.tenantId(),id,version)!=1) throw error("CONCURRENT_MODIFICATION");
        db.update("UPDATE shipment_packages SET status='CANCELLED' WHERE tenant_id=? AND shipment_id=? AND status='ASSIGNED'",
            access.tenantId(),id);
        audit.record(access,"SHIPMENT_CANCELLED","shipment",id.toString());
        events.publishEvent(new FulfillmentEvents.ShipmentCancelled(access.tenantId(),id,current.salesOrderId()));
        return load(access.tenantId(),id,false);
    }

    @Transactional
    Shipment dispatch(UUID id,String key) {
        var access=auth.require(Permission.SHIPPING_DISPATCH);
        if(key==null || key.isBlank() || key.length()>128) throw error("SHIPMENT_IDEMPOTENCY_KEY_REQUIRED");
        String fingerprint=hash(id.toString());
        db.queryForObject("SELECT pg_advisory_xact_lock(hashtextextended(?,0))",Object.class,
            access.tenantId()+":shipment-dispatch:"+key);
        var previous=db.query("SELECT shipment_id,request_fingerprint FROM shipment_dispatch_requests WHERE tenant_id=? AND idempotency_key=?",
            (r,n)->Map.entry((UUID)r.getObject(1),r.getString(2)),access.tenantId(),key);
        if(!previous.isEmpty()) {
            if(!fingerprint.equals(previous.getFirst().getValue())) throw error("SHIPMENT_IDEMPOTENCY_KEY_REUSED");
            return load(access.tenantId(),previous.getFirst().getKey(),false);
        }
        Shipment shipment=load(access.tenantId(),id,true);
        if(!"DRAFT".equals(shipment.status())) throw error("SHIPMENT_ALREADY_DISPATCHED");
        if(shipment.packageIds().isEmpty()) throw error("SHIPMENT_PACKAGES_REQUIRED");
        for(UUID packageId:shipment.packageIds()) {
            validatePackage(access.tenantId(),packageId,shipment.salesOrderId(),shipment.warehouseId(),id);
            Integer owned=db.queryForObject("SELECT count(*) FROM shipment_packages WHERE tenant_id=? AND shipment_id=? AND package_id=? AND status='ASSIGNED'",
                Integer.class,access.tenantId(),id,packageId);
            if(owned==null || owned!=1) throw error("PACKAGE_ALREADY_SHIPPED");
        }
        List<InventoryFulfillment.DispatchItem> items=db.query("""
            SELECT i.id,i.variant_id,l.warehouse_id,s.packing_location_id,i.lot_id,i.serial_id,i.quantity,i.unit_code
            FROM shipment_packages sp
            JOIN fulfillment_packages p ON p.tenant_id=sp.tenant_id AND p.id=sp.package_id
            JOIN packing_sessions s ON s.tenant_id=p.tenant_id AND s.id=p.packing_session_id
            JOIN pick_lists l ON l.tenant_id=s.tenant_id AND l.id=s.pick_list_id
            JOIN package_items i ON i.tenant_id=p.tenant_id AND i.package_id=p.id
            WHERE sp.tenant_id=? AND sp.shipment_id=? AND sp.status='ASSIGNED'
            ORDER BY i.id
            """,(r,n)->new InventoryFulfillment.DispatchItem((UUID)r.getObject(1),(UUID)r.getObject(2),
            (UUID)r.getObject(3),(UUID)r.getObject(4),(UUID)r.getObject(5),(UUID)r.getObject(6),
            r.getBigDecimal(7),r.getString(8)),access.tenantId(),id);
        if(items.isEmpty()) throw error("SHIPMENT_ITEMS_REQUIRED");
        UUID movement=inventory.dispatch(access.tenantId(),access.subject(),id,items);
        Map<UUID,BigDecimal> byLine=new HashMap<>();
        db.query("""
            SELECT i.sales_order_line_id,sum(i.quantity) FROM shipment_packages sp
            JOIN package_items i ON i.tenant_id=sp.tenant_id AND i.package_id=sp.package_id
            WHERE sp.tenant_id=? AND sp.shipment_id=? AND sp.status='ASSIGNED'
            GROUP BY i.sales_order_line_id
            """,r->{byLine.put((UUID)r.getObject(1),r.getBigDecimal(2));},access.tenantId(),id);
        boolean completed=sales.shipped(access.tenantId(),shipment.salesOrderId(),byLine);
        int count=db.update("UPDATE shipments SET status='DISPATCHED',dispatched_at=now(),updated_at=now(),version=version+1 WHERE tenant_id=? AND id=? AND status='DRAFT'",
            access.tenantId(),id);
        if(count!=1) throw error("CONCURRENT_MODIFICATION");
        db.update("UPDATE shipment_packages SET status='DISPATCHED' WHERE tenant_id=? AND shipment_id=? AND status='ASSIGNED'",
            access.tenantId(),id);
        db.update("INSERT INTO shipment_dispatch_requests(id,tenant_id,idempotency_key,shipment_id,request_fingerprint,created_at) VALUES(?,?,?,?,?,now())",
            UUID.randomUUID(),access.tenantId(),key,id,fingerprint);
        audit.record(access,"SHIPMENT_DISPATCHED","shipment",id.toString());
        events.publishEvent(new FulfillmentEvents.ShipmentDispatched(access.tenantId(),id,shipment.salesOrderId(),movement));
        if(completed) events.publishEvent(new FulfillmentEvents.SalesOrderCompleted(access.tenantId(),shipment.salesOrderId()));
        return load(access.tenantId(),id,false);
    }

    private void validatePackage(UUID tenant,UUID packageId,UUID orderId,UUID warehouseId,UUID currentShipment) {
        var rows=db.query("""
            SELECT p.status,s.status,s.sales_order_id,l.warehouse_id
            FROM fulfillment_packages p
            JOIN packing_sessions s ON s.tenant_id=p.tenant_id AND s.id=p.packing_session_id
            JOIN pick_lists l ON l.tenant_id=s.tenant_id AND l.id=s.pick_list_id
            WHERE p.tenant_id=? AND p.id=? FOR UPDATE OF p
            """,(r,n)->new Object[]{r.getString(1),r.getString(2),r.getObject(3),r.getObject(4)},tenant,packageId);
        if(rows.isEmpty()) throw error("FULFILLMENT_PACKAGE_NOT_FOUND");
        var x=rows.getFirst();
        if(!orderId.equals(x[2])) throw error("PACKAGE_SALES_ORDER_MISMATCH");
        if(!warehouseId.equals(x[3])) throw error("PACKAGE_WAREHOUSE_MISMATCH");
        if(!"PACKED".equals(x[0]) || !"PACKED".equals(x[1])) throw error("PACKAGE_NOT_PACKED");
        Boolean used=db.queryForObject("SELECT EXISTS(SELECT 1 FROM shipment_packages WHERE tenant_id=? AND package_id=? AND status IN('ASSIGNED','DISPATCHED') AND (?::uuid IS NULL OR shipment_id<>?::uuid))",
            Boolean.class,tenant,packageId,currentShipment,currentShipment);
        if(Boolean.TRUE.equals(used)) throw error("PACKAGE_ALREADY_SHIPPED");
    }

    private Shipment load(UUID tenant,UUID id,boolean lock) {
        var rows=db.query("""
            SELECT id,shipment_number,sales_order_id,warehouse_id,status,carrier_name,service_name,
              tracking_number,shipping_address_snapshot,dispatched_at,created_at,updated_at,version
            FROM shipments WHERE tenant_id=? AND id=?
            """+(lock?" FOR UPDATE":""),(r,n)->new Shipment((UUID)r.getObject(1),r.getString(2),
            (UUID)r.getObject(3),(UUID)r.getObject(4),r.getString(5),r.getString(6),r.getString(7),
            r.getString(8),r.getString(9),instant(r.getTimestamp(10)),instant(r.getTimestamp(11)),
            instant(r.getTimestamp(12)),r.getLong(13),packages(tenant,id)),tenant,id);
        if(rows.isEmpty()) throw error("SHIPMENT_NOT_FOUND");
        return rows.getFirst();
    }
    private List<UUID> packages(UUID tenant,UUID id) {
        return db.query("SELECT package_id FROM shipment_packages WHERE tenant_id=? AND shipment_id=? AND status<>'CANCELLED' ORDER BY package_id",
            (r,n)->(UUID)r.getObject(1),tenant,id);
    }
    private String number(UUID tenant) {
        int year=Year.now(ZoneOffset.UTC).getValue();
        long next=db.queryForObject("""
            INSERT INTO shipment_number_counters(tenant_id,shipment_year,next_value) VALUES(?,?,2)
            ON CONFLICT(tenant_id,shipment_year) DO UPDATE SET next_value=shipment_number_counters.next_value+1
            RETURNING next_value-1
            """,Long.class,tenant,year);
        return "SHP-"+year+"-"+String.format(Locale.ROOT,"%06d",next);
    }
    private static String field(String text,String code) {
        if(text==null || text.isBlank()) return null;
        String value=text.trim();
        if(value.length()>120 || value.chars().anyMatch(Character::isISOControl)) throw error(code);
        return value;
    }
    private static String tracking(String text) {
        String value=field(text,"INVALID_TRACKING_NUMBER");
        if(value!=null && !value.matches("[A-Za-z0-9][A-Za-z0-9 ._:/-]{0,119}"))
            throw error("INVALID_TRACKING_NUMBER");
        return value;
    }
    private static String hash(String text) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
            .digest(text.getBytes(StandardCharsets.UTF_8))); }
        catch(java.security.NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
    private static Instant instant(Timestamp t) { return t==null?null:t.toInstant(); }
    private static FulfillmentException error(String code) {
        return new FulfillmentException(code,code.replace('_',' ').toLowerCase(Locale.ROOT));
    }
    record Create(UUID salesOrderId,List<UUID> packageIds,String carrierName,String serviceName,String trackingNumber) {}
    record Update(String carrierName,String serviceName,String trackingNumber,long version) {}
    record Shipment(UUID id,String shipmentNumber,UUID salesOrderId,UUID warehouseId,String status,
                    String carrierName,String serviceName,String trackingNumber,String shippingAddress,
                    Instant dispatchedAt,Instant createdAt,Instant updatedAt,long version,List<UUID> packageIds) {}
}
