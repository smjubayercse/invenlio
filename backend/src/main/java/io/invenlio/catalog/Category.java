package io.invenlio.catalog;
import jakarta.persistence.*; import java.time.*; import java.util.*;
@Entity @Table(name="catalog_categories") class Category {
 enum Status{ACTIVE,ARCHIVED} @Id private UUID id; @Column(name="tenant_id",updatable=false) private UUID tenantId; private String name; private String slug; @Column(name="normalized_name") private String normalizedName; @Column(name="parent_id") private UUID parentId; @Enumerated(EnumType.STRING) private Status status; @Column(name="created_at",updatable=false) private Instant createdAt; @Column(name="updated_at") private Instant updatedAt; @Version private long version;
 protected Category(){} Category(UUID tenant,String name,UUID parent){id=UUID.randomUUID();tenantId=tenant;setName(name);parentId=parent;status=Status.ACTIVE;createdAt=updatedAt=Instant.now();}
 void update(String name,UUID parent,long expected){if(version!=expected)throw new CatalogException("CONCURRENT_MODIFICATION","Category was modified");if(status==Status.ARCHIVED)throw new CatalogException("CATEGORY_ARCHIVED","Archived category is immutable");if(id.equals(parent))throw new CatalogException("CATEGORY_CYCLE","Category cannot parent itself");setName(name);parentId=parent;updatedAt=Instant.now();}
 void archive(){status=Status.ARCHIVED;updatedAt=Instant.now();} private void setName(String n){name=CatalogRules.required(n,"name",120);normalizedName=CatalogRules.normalized(name);slug=CatalogRules.slug(name);}
 UUID id(){return id;} UUID tenant(){return tenantId;} String name(){return name;} String slug(){return slug;} UUID parent(){return parentId;} Status status(){return status;} Instant created(){return createdAt;} Instant updated(){return updatedAt;} long version(){return version;}
}
