package io.invenlio.procurement;
final class ProcurementException extends RuntimeException{private final String code;ProcurementException(String code,String message){super(message);this.code=code;}String code(){return code;}}
