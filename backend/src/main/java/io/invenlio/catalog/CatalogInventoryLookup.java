package io.invenlio.catalog;
import java.util.*;
public interface CatalogInventoryLookup{Optional<InventoryVariant>findInventoryVariant(UUID tenantId,UUID variantId);record InventoryVariant(UUID variantId,String status,String baseUnit,boolean discrete,String trackingMode,boolean expirationRequired){}}
