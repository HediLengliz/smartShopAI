package smartshop.smartshop.controller.dto;

public class MessageDtos {
    public record SendMessageRequest(String fromUserId, String toUserId, String content) {}
    public record MarkReadRequest(String messageId, boolean read) {}
}

