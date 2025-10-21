package smartshop.smartshop.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import smartshop.smartshop.model.*;
import smartshop.smartshop.repository.CartRepository;
import smartshop.smartshop.repository.OrderRepository;
import smartshop.smartshop.repository.ProductRepository;
import smartshop.smartshop.repository.UserRepository;
import smartshop.smartshop.service.EmailService;
import smartshop.smartshop.service.OrderService;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Override
    public Order createOrderFromCart(String userId, String shippingAddress, String paymentMethod) {
        Cart cart = cartRepository.findByUserId(userId).orElseThrow();
        if (cart.getItems() == null || cart.getItems().isEmpty()) throw new IllegalStateException("Cart is empty");

        List<OrderItem> orderItems = new ArrayList<>();
        double total = 0;
        for (CartItem ci : cart.getItems()) {
            Product p = productRepository.findById(ci.getProductId()).orElseThrow();
            OrderItem oi = new OrderItem();
            oi.setProductId(p.getId());
            oi.setProductName(p.getName());
            oi.setQuantity(ci.getQuantity());
            oi.setUnitPrice(p.getPrice());
            oi.setTotalPrice(ci.getQuantity() * p.getPrice());
            total += oi.getTotalPrice();
            orderItems.add(oi);
        }
        Order order = new Order();
        order.setUserId(userId);
        order.setItems(orderItems);
        order.setTotalAmount(total);
        order.setStatus("PENDING");
        order.setShippingAddress(shippingAddress);
        order.setPaymentMethod(paymentMethod);
        order.setOrderDate(new Date());
        Order saved = orderRepository.save(order);

        // Clear cart after creating order
        cart.setItems(new ArrayList<>());
        cart.setTotalAmount(0);
        cart.setUpdatedAt(new Date());
        cartRepository.save(cart);

        // Optionally send a preliminary order email
        final double finalTotal = total;
        userRepository.findById(userId).ifPresent(u -> {
            StringBuilder body = new StringBuilder();
            body.append("Thank you for your order #").append(saved.getId()).append("\n\n");
            for (OrderItem it : orderItems) {
                body.append(it.getProductName()).append(" x ").append(it.getQuantity())
                        .append(" @ ").append(it.getUnitPrice()).append(" = ")
                        .append(it.getTotalPrice()).append("\n");
            }
            body.append("Total: ").append(finalTotal).append("\n");
            body.append("Status: ").append(saved.getStatus());
            emailService.sendEmail(u.getEmail(), "Order created (#" + saved.getId() + ")", body.toString());
        });
        return saved;
    }

    @Override
    public Optional<Order> get(String id) {
        return orderRepository.findById(id);
    }

    @Override
    public List<Order> history(String userId) {
        return orderRepository.findByUserIdOrderByOrderDateDesc(userId);
    }

    @Override
    public Order updateStatus(String orderId, String status) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus(status);
        if ("DELIVERED".equalsIgnoreCase(status)) {
            order.setDeliveryDate(new Date());
        }
        return orderRepository.save(order);
    }
}