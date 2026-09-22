package io.invenlio.warehouse;import java.util.*;
/** Stable internal boundary for the future inventory module. */
public interface WarehouseAvailability { Optional<UsableWarehouse> findActiveWarehouse(UUID tenantId,UUID warehouseId);Optional<UsableLocation> findUsableLocation(UUID tenantId,UUID warehouseId,UUID locationId);record UsableWarehouse(UUID warehouseId,String code,String name){}record UsableLocation(UUID warehouseId,UUID locationId,String type){} }
