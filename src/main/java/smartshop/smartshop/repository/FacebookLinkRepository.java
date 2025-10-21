package smartshop.smartshop.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import smartshop.smartshop.model.FacebookLink;

import java.util.Optional;

public interface FacebookLinkRepository extends MongoRepository<FacebookLink, String> {
    Optional<FacebookLink> findByUserId(String userId);
}


