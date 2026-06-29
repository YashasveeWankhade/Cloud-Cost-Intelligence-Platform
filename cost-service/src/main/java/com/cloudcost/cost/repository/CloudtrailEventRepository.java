package com.cloudcost.cost.repository;

import com.cloudcost.cost.entity.CloudtrailEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface CloudtrailEventRepository extends JpaRepository<CloudtrailEvent, Long> {
    List<CloudtrailEvent> findByAccountIdAndServiceNameAndTimestampBetweenOrderByTimestampAsc(
            String accountId, String serviceName, LocalDateTime start, LocalDateTime end);

    List<CloudtrailEvent> findByAccountIdAndTimestampBetweenOrderByTimestampAsc(
            String accountId, LocalDateTime start, LocalDateTime end);
}
