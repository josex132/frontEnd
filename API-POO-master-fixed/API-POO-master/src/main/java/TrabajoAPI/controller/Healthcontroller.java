package TrabajoAPI.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class Healthcontroller {

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> respuesta = new HashMap<>();
        respuesta.put("status", "UP");
        respuesta.put("mensaje", "La API esta funcionando correctamente");
        return ResponseEntity.ok(respuesta);
    }
}
