package io.invenlio.inventory;
final class InventoryException extends RuntimeException{private final String code;InventoryException(String code,String message){super(message);this.code=code;}String code(){return code;}}
