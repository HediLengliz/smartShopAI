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
@Document(collection = "payments")
public class Payment {
    @Id
    private String id;

    private String orderId;
    private String userId;
    private long amount; // in smallest unit (e.g., cents)
    private String currency; // e.g., USD
    private String status; // pending, completed, failed
    private String provider; // e.g., stripe
    private String providerPaymentId; // Stripe PaymentIntent ID

    private Date createdAt;
    private Date updatedAt;
}