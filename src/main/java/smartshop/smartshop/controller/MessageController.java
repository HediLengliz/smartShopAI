package smartshop.smartshop.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import smartshop.smartshop.controller.dto.MessageDtos.*;
import smartshop.smartshop.model.Message;
import smartshop.smartshop.service.MessageService;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    public Message send(@RequestBody SendMessageRequest req) {
        return messageService.send(req.fromUserId(), req.toUserId(), req.content());
    }

    @GetMapping("/inbox/{userId}")
    public List<Message> inbox(@PathVariable String userId) {
        return messageService.inbox(userId);
    }

    @GetMapping("/outbox/{userId}")
    public List<Message> outbox(@PathVariable String userId) {
        return messageService.outbox(userId);
    }

    @PostMapping("/read")
    public ResponseEntity<Void> markRead(@RequestBody MarkReadRequest req) {
        messageService.markRead(req.messageId(), req.read());
        return ResponseEntity.ok().build();
    }
}

