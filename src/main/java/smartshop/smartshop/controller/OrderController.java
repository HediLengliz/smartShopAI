package smartshop.smartshop.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import smartshop.smartshop.controller.dto.OrderDtos.*;
import smartshop.smartshop.model.Order;
import smartshop.smartshop.service.OrderService;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<Order> create(@RequestBody CreateOrderRequest req) {
        try {
            Order o = orderService.createOrderFromCart(req.userId(), req.shippingAddress(), req.paymentMethod());
            return ResponseEntity.ok(o);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<Order> get(@PathVariable String orderId) {
        Optional<Order> o = orderService.get(orderId);
        return o.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public List<Order> history(@PathVariable String userId) {
        return orderService.history(userId);
    }

    @PostMapping("/status")
    public ResponseEntity<Order> updateStatus(@RequestBody UpdateStatusRequest req) {
        return ResponseEntity.ok(orderService.updateStatus(req.orderId(), req.status()));
    }
}

