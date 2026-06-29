package com.cloudcost.cost.config;

import com.cloudcost.cost.provider.CloudProvider;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
@Slf4j
public class CloudProviderConfig {

    @Value("${cloud.provider:mock}")
    private String providerName;

    @Bean
    @Primary
    public CloudProvider cloudProvider(
            @Qualifier("mockCloudProvider") CloudProvider mockProvider) {
        log.info("Active cloud provider: {}", providerName);
        return mockProvider;
    }
}
