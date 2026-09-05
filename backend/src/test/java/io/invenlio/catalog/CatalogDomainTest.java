package io.invenlio.catalog;
import java.util.*;import org.junit.jupiter.api.*;import static org.junit.jupiter.api.Assertions.*;
class CatalogDomainTest {
 @Test void productCreationNormalizesAndStartsDraft(){var p=new Product(UUID.randomUUID(),"  USB Cable  ",null,null,null,UnitOfMeasure.EA);assertEquals("USB Cable",p.name());assertEquals(Product.Status.DRAFT,p.status());}
 @Test void blankProductNameRejected(){assertThrows(CatalogException.class,()->new Product(UUID.randomUUID()," ",null,null,null,UnitOfMeasure.EA));}
 @Test void validProductLifecycle(){var p=product();p.transition(Product.Status.ACTIVE);p.transition(Product.Status.INACTIVE);p.transition(Product.Status.ACTIVE);p.transition(Product.Status.INACTIVE);p.transition(Product.Status.ARCHIVED);assertEquals(Product.Status.ARCHIVED,p.status());}
 @Test void invalidProductTransitionsAndResurrectionRejected(){var p=product();assertThrows(CatalogException.class,()->p.transition(Product.Status.INACTIVE));p.transition(Product.Status.ARCHIVED);assertThrows(CatalogException.class,()->p.transition(Product.Status.ACTIVE));}
 @Test void skuIsNormalizedAndWhitespaceSafe(){var v=variant(" ab c-1 ");assertEquals("AB-C-1",v.sku());}
 @Test void activeSkuIsImmutable(){var v=variant("ABC");v.transition(Product.Status.ACTIVE);assertThrows(CatalogException.class,()->v.update("NEW",null,null,null,null,null,0));}
 @Test void activeVariantAllowsNonSkuMasterDataUpdate(){var v=variant("ABC");v.transition(Product.Status.ACTIVE);v.update("abc","Label",10L,20L,30L,40L,0);assertEquals(10L,v.weight());}
 @Test void invalidPhysicalMeasuresRejected(){assertThrows(CatalogException.class,()->new ProductVariant(UUID.randomUUID(),UUID.randomUUID(),"SKU",null,UnitOfMeasure.EA,-1L,null,null,null,"DEFAULT"));assertThrows(CatalogException.class,()->new ProductVariant(UUID.randomUUID(),UUID.randomUUID(),"SKU",null,UnitOfMeasure.EA,null,10_000_001L,null,null,"DEFAULT"));}
 @Test void slugIsPredictableAndUnicodeSafe(){assertEquals("cafe-creme",CatalogRules.slug(" Café Crème "));}
 @Test void unsupportedUomRejected(){assertThrows(CatalogException.class,()->UnitOfMeasure.parse("bucket"));}
 @Test void categoryRejectsSelfParent(){var c=new Category(UUID.randomUUID(),"A",null);assertThrows(CatalogException.class,()->c.update("A",c.id(),0));}
 @Test void archivedMasterDataIsImmutable(){var c=new Category(UUID.randomUUID(),"A",null);c.archive();assertThrows(CatalogException.class,()->c.update("B",null,0));var b=new Brand(UUID.randomUUID(),"Acme");b.archive();assertThrows(CatalogException.class,()->b.update("Other",0));}
 @Test void inactiveBarcodeCannotBecomePrimary(){var b=new Barcode(UUID.randomUUID(),UUID.randomUUID(),Barcode.Type.INTERNAL,"internal-1",false);b.deactivate();assertThrows(CatalogException.class,b::makePrimary);}
 private static Product product(){return new Product(UUID.randomUUID(),"Product",null,null,null,UnitOfMeasure.EA);}private static ProductVariant variant(String sku){return new ProductVariant(UUID.randomUUID(),UUID.randomUUID(),sku,null,UnitOfMeasure.EA,null,null,null,null,"DEFAULT");}
}
