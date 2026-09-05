package io.invenlio.inventory;
import java.math.BigDecimal;import java.util.*;
public interface InventoryOnHandQuery{Optional<OnHand>findOnHand(UUID tenantId,UUID variantId,UUID warehouseId,UUID locationId);record OnHand(BigDecimal quantity,String unitCode){}}
