package smartshop.smartshop.controller.dto;

public class PaymentDtos {
    public record InitPaymentRequest(String orderId, String currency) {}
    public record UpdatePaymentStatusRequest(String providerPaymentId, String status) {}
    public record AttachPaymentRequest(String orderId, String providerPaymentId) {}
}

