package io.invenlio.catalog;
import org.junit.jupiter.params.ParameterizedTest;import org.junit.jupiter.params.provider.CsvSource;import static org.junit.jupiter.api.Assertions.*;
class GtinValidationTest {
 @ParameterizedTest @CsvSource({"GTIN_8,96385074","GTIN_12,036000291452","GTIN_13,4006381333931","GTIN_14,10012345000017"}) void acceptsValidGtin(String type,String value){assertEquals(value,Barcode.normalize(Barcode.Type.valueOf(type),value));}
 @ParameterizedTest @CsvSource({"GTIN_8,96385075","GTIN_12,036000291453","GTIN_13,4006381333932","GTIN_14,10012345000018"}) void rejectsInvalidCheckDigit(String type,String value){assertThrows(CatalogException.class,()->Barcode.normalize(Barcode.Type.valueOf(type),value));}
 @ParameterizedTest @CsvSource({"GTIN_8,1234567","GTIN_12,123","GTIN_13,ABCDEFGHIJKLM","GTIN_14,123456789012345"}) void rejectsInvalidLengthOrCharacters(String type,String value){assertThrows(CatalogException.class,()->Barcode.normalize(Barcode.Type.valueOf(type),value));}
}
