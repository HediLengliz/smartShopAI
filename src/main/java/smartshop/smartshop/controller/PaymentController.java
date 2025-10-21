package smartshop.smartshop.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import smartshop.smartshop.controller.dto.PaymentDtos.*;
import smartshop.smartshop.model.Order;
import smartshop.smartshop.model.Payment;
import smartshop.smartshop.repository.OrderRepository;
import smartshop.smartshop.service.PaymentService;
import smartshop.smartshop.service.dto.PaymentInitResult;

import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final OrderRepository orderRepository;

    @PostMapping("/init")
    public ResponseEntity<PaymentInitResult> init(@RequestBody InitPaymentRequest req) {
        Optional<Order> order = orderRepository.findById(req.orderId());
        if (order.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(paymentService.createPaymentForOrder(order.get(), req.currency()));
    }

    @PostMapping("/status")
    public ResponseEntity<Void> updateStatus(@RequestBody UpdatePaymentStatusRequest req) {
        paymentService.updatePaymentStatus(req.providerPaymentId(), req.status());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/attach")
    public ResponseEntity<Void> attach(@RequestBody AttachPaymentRequest req) {
        paymentService.attachPaymentToOrder(req.orderId(), req.providerPaymentId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{providerPaymentId}")
    public ResponseEntity<Payment> getByProviderId(@PathVariable String providerPaymentId) {
        return paymentService.findByProviderPaymentId(providerPaymentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}

