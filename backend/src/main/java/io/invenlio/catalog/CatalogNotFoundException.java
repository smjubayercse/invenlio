package io.invenlio.catalog;
public class CatalogNotFoundException extends RuntimeException { private final String code; CatalogNotFoundException(String c,String m){super(m);code=c;} public String code(){return code;} }
