package io.invenlio.catalog;
import java.util.UUID;
final class CatalogEvents {private CatalogEvents(){} record ProductCreated(UUID tenantId,UUID productId){} record ProductActivated(UUID tenantId,UUID productId){} record ProductArchived(UUID tenantId,UUID productId){} record VariantCreated(UUID tenantId,UUID productId,UUID variantId){} record VariantActivated(UUID tenantId,UUID variantId){} record VariantArchived(UUID tenantId,UUID variantId){} }
