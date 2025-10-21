package smartshop.smartshop.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import smartshop.smartshop.model.Message;

import java.util.List;

public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findByToUserIdOrderByCreatedAtDesc(String toUserId);
    List<Message> findByFromUserIdOrderByCreatedAtDesc(String fromUserId);
}

