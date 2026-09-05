package io.invenlio.warehouse;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="warehouse_zones") class WarehouseZone {
 enum Type {RECEIVING,STORAGE,PICKING,PACKING,SHIPPING,RETURNS,QUARANTINE,DAMAGED,QUALITY_CONTROL,STAGING,TRANSIT}
 enum Status {ACTIVE,INACTIVE,ARCHIVED}
 @Id UUID id; @Column(name="tenant_id") UUID tenantId; @Column(name="warehouse_id") UUID warehouseId;
 String code; @Column(name="normalized_code") String normalizedCode; String name; @Enumerated(EnumType.STRING) Type type;
 @Enumerated(EnumType.STRING) Status status; int sequence; @Column(name="created_at") Instant created; @Column(name="updated_at") Instant updated; @Version long version;
 protected WarehouseZone() {}
 WarehouseZone(UUID t,UUID w,String c,String n,Type type,int seq){id=UUID.randomUUID();tenantId=t;warehouseId=w;setCode(c);name=Warehouse.req(n,120);this.type=type;sequence=seq;status=Status.ACTIVE;created=updated=Instant.now();}
 void update(String c,String n,Type type,int seq,long v){check(v);if(status==Status.ARCHIVED)throw new WarehouseException("INVALID_ZONE_TRANSITION","Archived zone cannot be updated");setCode(c);name=Warehouse.req(n,120);this.type=type;sequence=seq;updated=Instant.now();}
 void archive(long v){check(v);if(status==Status.ARCHIVED)throw new WarehouseException("INVALID_ZONE_TRANSITION","Zone is already archived");status=Status.ARCHIVED;updated=Instant.now();}
 private void check(long v){if(version!=v)throw new WarehouseException("CONCURRENT_MODIFICATION","Stale zone version");}
 private void setCode(String value){code=normalizedCode=Warehouse.norm(value);}
}
