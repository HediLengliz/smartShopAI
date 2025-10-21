package smartshop.smartshop.service.dto;

import smartshop.smartshop.model.Payment;

public record PaymentInitResult(Payment payment, String clientSecret) {}

