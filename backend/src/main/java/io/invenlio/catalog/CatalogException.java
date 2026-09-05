package io.invenlio.catalog;
public class CatalogException extends RuntimeException { private final String code; public CatalogException(String c,String m){super(m);code=c;} public String code(){return code;} }
