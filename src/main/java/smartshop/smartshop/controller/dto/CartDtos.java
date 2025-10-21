package smartshop.smartshop.controller.dto;

public class CartDtos {
    public record AddItemRequest(String userId, String productId, int quantity) {}
    public record RemoveItemRequest(String userId, String productId) {}
    public record ClearRequest(String userId) {}
}
