package smartshop.smartshop.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import smartshop.smartshop.model.FAQ;

public interface FAQRepository extends MongoRepository<FAQ, String> {
}

