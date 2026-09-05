package io.invenlio.inventory;
import java.math.BigDecimal;import java.util.UUID;
public final class InventoryEvents{private InventoryEvents(){}public record InventoryMovementPosted(UUID tenantId,UUID movementId,UUID variantId,UUID warehouseId,UUID locationId,UUID lotId,UUID serialId,BigDecimal quantityDelta){}}
