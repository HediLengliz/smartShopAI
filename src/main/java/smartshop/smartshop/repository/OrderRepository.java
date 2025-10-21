package smartshop.smartshop.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import smartshop.smartshop.model.Order;

import java.util.Date;
import java.util.List;

public interface OrderRepository extends MongoRepository<Order, String> {
    List<Order> findByUserIdOrderByOrderDateDesc(String userId);
    List<Order> findByStatus(String status);
    List<Order> findByOrderDateBetween(Date start, Date end);
}

