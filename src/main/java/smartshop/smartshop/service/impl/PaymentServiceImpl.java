package smartshop.smartshop.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import smartshop.smartshop.model.Order;
import smartshop.smartshop.model.Payment;
import smartshop.smartshop.repository.OrderRepository;
import smartshop.smartshop.repository.PaymentRepository;
import smartshop.smartshop.repository.UserRepository;
import smartshop.smartshop.service.EmailService;
import smartshop.smartshop.service.PaymentService;
import smartshop.smartshop.service.dto.PaymentInitResult;

import java.util.Date;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    // Reads from application.properties: stripe.api.key mapped from STRIPE_SECRET_KEY
    @Value("${stripe.api.key:}")
    private String stripeApiKey;

    private boolean isStripeConfigured() {
        return stripeApiKey != null && !stripeApiKey.isBlank();
    }

    @Override
    public PaymentInitResult createPaymentForOrder(Order order, String currency) {
        Payment payment = new Payment();
        payment.setUserId(order.getUserId());
        payment.setOrderId(order.getId());
        payment.setAmount(Math.round(order.getTotalAmount() * 100));
        payment.setCurrency(currency == null || currency.isBlank() ? "usd" : currency.toLowerCase());
        payment.setStatus("pending");
        payment.setProvider("stripe");
        payment.setCreatedAt(new Date());
        payment.setUpdatedAt(new Date());

        String clientSecret = null;
        if (isStripeConfigured()) {
            // In this build, we avoid direct Stripe SDK imports to keep compilation green in all environments.
            // At runtime, you can swap this implementation with a Stripe-backed bean.
            log.info("Stripe key configured, but using local fallback in this build. Integrate Stripe SDK to enable live intents.");
            payment.setProviderPaymentId("pi_local_" + order.getId() + "_" + System.currentTimeMillis());
        } else {
            log.warn("No Stripe secret key configured. Using local payment fallback for order {}", order.getId());
            payment.setProviderPaymentId("pi_local_" + order.getId() + "_" + System.currentTimeMillis());
        }
        payment = paymentRepository.save(payment);
        return new PaymentInitResult(payment, clientSecret);
    }

    @Override
    public Optional<Payment> findByProviderPaymentId(String providerPaymentId) {
        return paymentRepository.findByProviderPaymentId(providerPaymentId);
    }

    @Override
    public void updatePaymentStatus(String providerPaymentId, String status) {
        Payment payment = paymentRepository.findByProviderPaymentId(providerPaymentId).orElseThrow();
        payment.setStatus(status);
        payment.setUpdatedAt(new Date());
        paymentRepository.save(payment);

        // Update order status accordingly and send confirmation email if completed
        Order order = orderRepository.findById(payment.getOrderId()).orElse(null);
        if (order != null) {
            if ("succeeded".equalsIgnoreCase(status) || "completed".equalsIgnoreCase(status)) {
                order.setStatus("CONFIRMED");
            } else if ("processing".equalsIgnoreCase(status)) {
                order.setStatus("PENDING");
            } else if ("requires_payment_method".equalsIgnoreCase(status) || "canceled".equalsIgnoreCase(status) || "failed".equalsIgnoreCase(status)) {
                order.setStatus("CANCELLED");
            }
            orderRepository.save(order);

            if ("succeeded".equalsIgnoreCase(status) || "completed".equalsIgnoreCase(status)) {
                userRepository.findById(order.getUserId()).ifPresent(u -> {
                    StringBuilder body = new StringBuilder();
                    body.append("Your payment is confirmed for order #").append(order.getId()).append("\n\n");
                    if (order.getItems() != null) {
                        order.getItems().forEach(it -> body.append(it.getProductName()).append(" x ").append(it.getQuantity())
                                .append(" = ").append(it.getTotalPrice()).append("\n"));
                    }
                    body.append("Total: ").append(order.getTotalAmount()).append("\n");
                    body.append("Payment status: ").append(payment.getStatus());
                    emailService.sendEmail(u.getEmail(), "Order confirmed (#" + order.getId() + ")", body.toString());
                });
            }
        }
    }

    @Override
    public void attachPaymentToOrder(String orderId, String providerPaymentId) {
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setPaymentId(providerPaymentId);
        orderRepository.save(order);
    }
}
