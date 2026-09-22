package io.invenlio.inventory;
import java.math.BigDecimal;import java.util.*;
/** Governed synchronous boundary for transactional physical inventory postings. */
public interface InventoryPosting{
 UUID receive(UUID tenantId,String actorSubject,String idempotencyKey,List<Stock> lines);
 UUID relocate(UUID tenantId,String actorSubject,String idempotencyKey,Stock stock,UUID destinationLocationId);
 record Stock(UUID variantId,UUID warehouseId,UUID locationId,UUID lotId,UUID serialId,BigDecimal quantity){}
}
