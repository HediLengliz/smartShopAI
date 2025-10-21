package smartshop.smartshop.service;

import smartshop.smartshop.model.Message;

import java.util.List;

public interface MessageService {
    Message send(String fromUserId, String toUserId, String content);
    List<Message> inbox(String toUserId);
    List<Message> outbox(String fromUserId);
    void markRead(String messageId, boolean read);
}

