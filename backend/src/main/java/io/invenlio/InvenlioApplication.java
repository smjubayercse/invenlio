package io.invenlio;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class InvenlioApplication {
    public static void main(String[] args) {
        SpringApplication.run(InvenlioApplication.class, args);
    }
}
