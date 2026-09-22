package io.invenlio.receiving;final class ReceivingException extends RuntimeException{private final String code;ReceivingException(String c,String m){super(m);code=c;}String code(){return code;}}
