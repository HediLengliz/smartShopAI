package smartshop.smartshop.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import smartshop.smartshop.model.Message;
import smartshop.smartshop.repository.MessageRepository;
import smartshop.smartshop.service.MessageService;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;

    @Override
    public Message send(String fromUserId, String toUserId, String content) {
        Message m = new Message();
        m.setFromUserId(fromUserId);
        m.setToUserId(toUserId);
        m.setContent(content);
        m.setRead(false);
        m.setCreatedAt(new Date());
        return messageRepository.save(m);
    }

    @Override
    public List<Message> inbox(String toUserId) {
        return messageRepository.findByToUserIdOrderByCreatedAtDesc(toUserId);
    }

    @Override
    public List<Message> outbox(String fromUserId) {
        return messageRepository.findByFromUserIdOrderByCreatedAtDesc(fromUserId);
    }

    @Override
    public void markRead(String messageId, boolean read) {
        Message m = messageRepository.findById(messageId).orElseThrow();
        m.setRead(read);
        messageRepository.save(m);
    }
}

