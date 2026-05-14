package TrabajoAPI.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import TrabajoAPI.dto.UsuarioRequisitos;
import TrabajoAPI.dto.Usuarioresponse;
import TrabajoAPI.service.Usuarioservice;
@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*") // <--- AQUÍ TAMBIÉN
public class Usuariocontroller {

    private Usuarioservice usuarioService;

    public Usuariocontroller(Usuarioservice usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping
    public ResponseEntity<Usuarioresponse> crear(@Valid @RequestBody UsuarioRequisitos request) {
        Usuarioresponse response = usuarioService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<Usuarioresponse>> obtenerTodos() {
        List<Usuarioresponse> lista = usuarioService.obtenerTodos();
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuarioresponse> obtenerPorId(@PathVariable Long id) {
        Usuarioresponse response = usuarioService.obtenerPorId(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Usuarioresponse> actualizar(@PathVariable Long id, @Valid @RequestBody UsuarioRequisitos request) {
        Usuarioresponse response = usuarioService.actualizar(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        usuarioService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
