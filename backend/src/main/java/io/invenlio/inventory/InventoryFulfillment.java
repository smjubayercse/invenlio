package io.invenlio.inventory;
import java.math.BigDecimal;import java.util.*;
/** Published inventory boundary for reservation consumption during picking. */
public interface InventoryFulfillment{
 List<Allocation> allocations(UUID tenantId,Collection<UUID> reservationIds);
 UUID consumeToPacking(UUID tenantId,UUID actorId,String actorSubject,UUID reservationId,UUID allocationId,UUID packingLocationId,String idempotencyKey);
 /** Atomically removes sealed package contents from physical packing stock. */
 UUID dispatch(UUID tenantId,String actorSubject,UUID shipmentId,List<DispatchItem> items);
 record DispatchItem(UUID packageItemId,UUID variantId,UUID warehouseId,UUID packingLocationId,
                     UUID lotId,UUID serialId,BigDecimal quantity,String unitCode){}
 final class Allocation{final UUID reservationId,allocationId,variantId,warehouseId,locationId,lotId,serialId;final BigDecimal quantity;final String unitCode;final int locationSequence;public Allocation(UUID r,UUID a,UUID v,UUID w,UUID l,UUID lot,UUID serial,BigDecimal q,String u,int s){reservationId=r;allocationId=a;variantId=v;warehouseId=w;locationId=l;lotId=lot;serialId=serial;quantity=q;unitCode=u;locationSequence=s;}public UUID reservationId(){return reservationId;}public UUID allocationId(){return allocationId;}public UUID variantId(){return variantId;}public UUID warehouseId(){return warehouseId;}public UUID locationId(){return locationId;}public UUID lotId(){return lotId;}public UUID serialId(){return serialId;}public BigDecimal quantity(){return quantity;}public String unitCode(){return unitCode;}public int locationSequence(){return locationSequence;}public String toString(){return reservationId+":"+allocationId+":"+quantity;}}
}
