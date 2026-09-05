package io.invenlio.warehouse;import java.util.*;
/** Stable internal boundary for the future inventory module. */
public interface WarehouseAvailability { Optional<UsableLocation> findUsableLocation(UUID tenantId,UUID warehouseId,UUID locationId);record UsableLocation(UUID warehouseId,UUID locationId,String type){} }
