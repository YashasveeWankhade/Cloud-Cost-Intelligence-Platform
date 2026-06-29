package com.cloudcost.notification.repository;

import com.cloudcost.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByAccountIdOrderByCreatedAtDesc(String accountId);
    List<Notification> findAllByOrderByCreatedAtDesc();
    List<Notification> findByStatusOrderByCreatedAtDesc(Notification.NotificationStatus status);
}
