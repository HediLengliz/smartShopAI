package smartshop.smartshop.service;

import smartshop.smartshop.model.Order;
import smartshop.smartshop.model.Payment;
import smartshop.smartshop.service.dto.PaymentInitResult;

import java.util.Optional;

public interface PaymentService {
    PaymentInitResult createPaymentForOrder(Order order, String currency);
    Optional<Payment> findByProviderPaymentId(String providerPaymentId);
    void updatePaymentStatus(String providerPaymentId, String status);
    void attachPaymentToOrder(String orderId, String providerPaymentId);
}

