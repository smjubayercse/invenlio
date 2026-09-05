package io.invenlio.catalog;
import jakarta.persistence.*; import java.util.*;
@Entity @Table(name="catalog_product_options") class ProductOption {@Id UUID id;@Column(name="tenant_id")UUID tenantId;@Column(name="product_id")UUID productId;String name;@Column(name="normalized_name")String normalizedName;int position;protected ProductOption(){}ProductOption(UUID t,UUID p,String n,int pos){id=UUID.randomUUID();tenantId=t;productId=p;name=CatalogRules.required(n,"option name",80);normalizedName=CatalogRules.normalized(name);position=pos;}}
