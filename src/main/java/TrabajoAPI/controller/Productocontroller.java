package TrabajoAPI.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import TrabajoAPI.dto.ProductoRequisitos;
import TrabajoAPI.dto.Productoresponse;
import TrabajoAPI.service.Productoservice;
@RestController
@RequestMapping("/api/productos")
@CrossOrigin(origins = "*")
public class Productocontroller {

    private Productoservice productoService;

    public Productocontroller(Productoservice productoService) {
        this.productoService = productoService;
    }

    @PostMapping
    public ResponseEntity<Productoresponse> crear(@Valid @RequestBody ProductoRequisitos request) {
        Productoresponse response = productoService.crear(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<Productoresponse>> obtenerTodos() {
        List<Productoresponse> lista = productoService.obtenerTodos();
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Productoresponse> obtenerPorId(@PathVariable Long id) {
        Productoresponse response = productoService.obtenerPorId(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Productoresponse> actualizar(@PathVariable Long id, @Valid @RequestBody ProductoRequisitos request) {
        Productoresponse response = productoService.actualizar(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        productoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
