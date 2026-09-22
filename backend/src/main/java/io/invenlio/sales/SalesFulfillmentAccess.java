package io.invenlio.sales;
import java.math.BigDecimal;import java.util.*;
/** Published sales boundary used by fulfillment. */
public interface SalesFulfillmentAccess{
 Order requireAllocated(UUID tenantId,UUID orderId);
 ShippingOrder requireShippable(UUID tenantId,UUID orderId);
 void pickingStarted(UUID tenantId,UUID orderId);
 void picked(UUID tenantId,UUID orderId,UUID lineId,BigDecimal quantity,boolean orderComplete);
 void packingStarted(UUID tenantId,UUID orderId);
 void packed(UUID tenantId,UUID orderId,Map<UUID,BigDecimal> packedByLine);
 boolean shipped(UUID tenantId,UUID orderId,Map<UUID,BigDecimal> shippedByLine);
 record Order(UUID id,String number,UUID warehouseId,String fulfillmentStatus,List<Allocation> allocations){}
 record Allocation(UUID lineId,UUID reservationId,BigDecimal quantity){}
 record ShippingOrder(UUID id,UUID warehouseId,String shippingAddress){}
}
