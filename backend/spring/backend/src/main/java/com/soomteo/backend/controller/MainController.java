package com.soomteo.backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@Controller
public class MainController {

    @GetMapping("/")
    public String greet() {
        return "Hello World!!!!";
    }

    @GetMapping("/websocketTest")
    public String websocketTest() {
        return "websocketTest";  // templates/websocketTest.html
    }
}
