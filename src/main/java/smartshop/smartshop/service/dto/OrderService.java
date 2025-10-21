package smartshop.smartshop.service.dto;

import smartshop.smartshop.model.Order;

import java.util.List;
import java.util.Optional;

public interface OrderService {
    Order createOrderFromCart(String userId, String shippingAddress, String paymentMethod);
    Optional<Order> get(String id);
    List<Order> history(String userId);
    Order updateStatus(String orderId, String status);
}
