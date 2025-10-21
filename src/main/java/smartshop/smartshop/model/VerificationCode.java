package smartshop.smartshop.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "verification_codes")
public class VerificationCode {
    @Id
    private String id;

    private String userId;
    private String email;
    private String code;
    private String purpose; // VERIFY_EMAIL, RESET_PASSWORD
    private Date expiresAt;
    private boolean used;
    private Date createdAt;
}

