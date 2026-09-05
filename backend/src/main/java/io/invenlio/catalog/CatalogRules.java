package io.invenlio.catalog;
import java.text.Normalizer; import java.util.*;
final class CatalogRules {
 private CatalogRules(){}
 static String required(String value,String field,int max){if(value==null||value.trim().isEmpty())throw new CatalogException("INVALID_"+field.toUpperCase(),field+" is required");var v=value.trim();if(v.length()>max)throw new CatalogException("INVALID_"+field.toUpperCase(),field+" is too long");return v;}
 static String normalized(String value){return required(value,"value",200).toUpperCase(Locale.ROOT).replaceAll("\\s+"," ");}
 static String sku(String value){var v=required(value,"sku",80).toUpperCase(Locale.ROOT).replaceAll("\\s+","-");if(!v.matches("[A-Z0-9][A-Z0-9._/-]*"))throw new CatalogException("INVALID_SKU","SKU contains unsupported characters");return v;}
 static String slug(String value){var v=Normalizer.normalize(required(value,"name",120),Normalizer.Form.NFD).replaceAll("\\p{M}","").toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+","-").replaceAll("(^-|-$)","");if(v.isBlank())throw new CatalogException("INVALID_SLUG","Name cannot form a slug");return v;}
}
