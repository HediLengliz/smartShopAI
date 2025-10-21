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
@Document(collection = "facebook_links")
public class FacebookLink {
    @Id
    private String id;

    private String userId;
    private String facebookId;
    private String accessToken;
    private Date linkedAt;
}


