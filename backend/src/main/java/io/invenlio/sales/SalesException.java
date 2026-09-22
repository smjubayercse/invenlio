package io.invenlio.sales;final class SalesException extends RuntimeException{private final String code;SalesException(String c,String m){super(m);code=c;}String code(){return code;}}
