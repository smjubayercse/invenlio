package io.invenlio.inventory;
import java.math.BigDecimal;import java.time.LocalDate;import java.util.*;
/** Published inventory boundary for reservation-backed fulfillment modules. */
public interface InventoryReservationAllocation{
 List<Candidate>candidates(UUID tenantId,UUID variantId,UUID warehouseId,int limit);
 Optional<Reservation> reserve(UUID tenantId,UUID actorId,String idempotencyKey,String referenceId,UUID variantId,UUID warehouseId,UUID locationId,UUID lotId,UUID serialId,BigDecimal quantity);
 void release(UUID tenantId,UUID actorId,UUID reservationId);
 BigDecimal activeQuantity(UUID tenantId,UUID reservationId,String referenceId);
 record Candidate(UUID locationId,UUID lotId,UUID serialId,BigDecimal available,String unitCode,LocalDate expiresOn,String lotNumber,String serialNumber){}
 record Reservation(UUID id,BigDecimal quantity,String unitCode){}
}
