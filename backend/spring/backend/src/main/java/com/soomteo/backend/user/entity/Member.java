package com.soomteo.backend.user.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Member {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(length = 50)
    private String name;

    @Column
    private Integer age;

    @Column
    private String gender; // "MALE" or "FEMALE" or null

    @Column(length = 20)
    private String guardianPhone;

    @Column(length = 255)
    private String profileImageUrl;

    @Column(length = 255)
    private String statusMessage;

    // statusMessage removed (no longer used)

    // Additional setters for updates
    public void updateInfo(String name, Integer age, String gender, String guardianPhone, String profileImageUrl, String statusMessage) {
        if (name != null) this.name = name;
        if (age != null) this.age = age;
        if (gender != null) this.gender = gender;
        if (guardianPhone != null) this.guardianPhone = guardianPhone;
        if (profileImageUrl != null) this.profileImageUrl = profileImageUrl;
        // statusMessage removed
    }
}
