package com.cloudcost.cost;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class CostServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(CostServiceApplication.class, args);
    }
}
