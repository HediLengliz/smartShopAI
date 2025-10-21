package smartshop.smartshop.controller.dto;

public class FacebookDtos {
    public record LinkRequest(String userId, String facebookId, String accessToken) {}
}

