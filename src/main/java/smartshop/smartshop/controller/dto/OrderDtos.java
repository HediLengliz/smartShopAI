package smartshop.smartshop.controller.dto;

public class OrderDtos {
    public record CreateOrderRequest(String userId, String shippingAddress, String paymentMethod) {}
    public record UpdateStatusRequest(String orderId, String status) {}
}

