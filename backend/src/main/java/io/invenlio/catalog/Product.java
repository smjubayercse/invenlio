package io.invenlio.catalog;
import jakarta.persistence.*; import java.time.*; import java.util.*;
@Entity @Table(name="catalog_products") class Product {
 enum Status {DRAFT,ACTIVE,INACTIVE,ARCHIVED}
 @Id private UUID id; @Column(name="tenant_id",updatable=false) private UUID tenantId; private String name; private String description;
 @Enumerated(EnumType.STRING) private Status status; @Column(name="category_id") private UUID categoryId; @Column(name="brand_id") private UUID brandId;
 @Column(name="base_unit") private String baseUnit; @Column(name="created_at",updatable=false) private Instant createdAt; @Column(name="updated_at") private Instant updatedAt; @Version private long version;
 protected Product(){} Product(UUID tenant,String name,String description,UUID category,UUID brand,UnitOfMeasure unit){id=UUID.randomUUID();tenantId=tenant;this.name=CatalogRules.required(name,"name",200);this.description=description==null?null:description.trim();categoryId=category;brandId=brand;baseUnit=unit.name();status=Status.DRAFT;createdAt=updatedAt=Instant.now();}
 void update(String name,String description,UUID category,UUID brand,long expected){checkVersion(expected);if(status==Status.ARCHIVED)throw new CatalogException("INVALID_PRODUCT_STATUS_TRANSITION","Archived product is immutable");this.name=CatalogRules.required(name,"name",200);this.description=description==null?null:description.trim();categoryId=category;brandId=brand;updatedAt=Instant.now();}
 void transition(Status next){boolean ok=switch(status){case DRAFT->next==Status.ACTIVE||next==Status.ARCHIVED;case ACTIVE->next==Status.INACTIVE;case INACTIVE->next==Status.ACTIVE||next==Status.ARCHIVED;case ARCHIVED->false;};if(!ok)throw new CatalogException("INVALID_PRODUCT_STATUS_TRANSITION","Invalid product lifecycle transition");status=next;updatedAt=Instant.now();}
 void checkVersion(long expected){if(version!=expected)throw new CatalogException("CONCURRENT_MODIFICATION","Product was modified by another request");}
 UUID id(){return id;} UUID tenant(){return tenantId;} String name(){return name;} String description(){return description;} Status status(){return status;} UUID category(){return categoryId;} UUID brand(){return brandId;} String unit(){return baseUnit;} Instant created(){return createdAt;} Instant updated(){return updatedAt;} long version(){return version;}
}
