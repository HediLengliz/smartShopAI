package smartshop.smartshop.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import smartshop.smartshop.model.VerificationCode;

import java.util.Optional;

public interface VerificationCodeRepository extends MongoRepository<VerificationCode, String> {
    Optional<VerificationCode> findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(String email, String purpose);
    Optional<VerificationCode> findByEmailAndPurposeAndCodeAndUsedFalse(String email, String purpose, String code);
}

