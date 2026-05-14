package TrabajoAPI.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

import TrabajoAPI.dto.ProductoRequisitos;
import TrabajoAPI.dto.Productoresponse;
import TrabajoAPI.exception.Badrequestexception;
import TrabajoAPI.exception.Resourcenotfoundexception;
import TrabajoAPI.model.Producto;
import TrabajoAPI.repository.Productorepository;
@Service
public class Productoservice {

    private Productorepository productoRepository;

    public Productoservice(Productorepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    public Productoresponse crear(ProductoRequisitos request) {
        if (productoRepository.existeNombre(request.getNombre())) {
            throw new Badrequestexception("Ya existe un producto con ese nombre");
        }

        Producto producto = new Producto();
        producto.setNombre(request.getNombre());
        producto.setDescripcion(request.getDescripcion());
        producto.setPrecio(request.getPrecio());
        producto.setStock(request.getStock());

        if (request.getStock() > 0) {
            producto.setDisponible(true);
        } else {
            producto.setDisponible(false);
        }

        productoRepository.guardar(producto);

        return convertirAResponse(producto);
    }

    public List<Productoresponse> obtenerTodos() {
        List<Producto> productos = productoRepository.buscarTodos();
        List<Productoresponse> respuesta = new ArrayList<>();

        for (Producto p : productos) {
            respuesta.add(convertirAResponse(p));
        }

        return respuesta;
    }

    public Productoresponse obtenerPorId(Long id) {
        Producto producto = productoRepository.buscarPorId(id);

        if (producto == null) {
            throw new Resourcenotfoundexception("No existe un producto con id " + id);
        }

        return convertirAResponse(producto);
    }

    public Productoresponse actualizar(Long id, ProductoRequisitos request) {
        Producto producto = productoRepository.buscarPorId(id);

        if (producto == null) {
            throw new Resourcenotfoundexception("No existe un producto con id " + id);
        }

        if (productoRepository.existeNombreEnOtroProducto(request.getNombre(), id)) {
            throw new Badrequestexception("Ese nombre ya lo usa otro producto");
        }

        producto.setNombre(request.getNombre());
        producto.setDescripcion(request.getDescripcion());
        producto.setPrecio(request.getPrecio());
        producto.setStock(request.getStock());

        if (request.getStock() > 0) {
            producto.setDisponible(true);
        } else {
            producto.setDisponible(false);
        }

        productoRepository.guardar(producto);

        return convertirAResponse(producto);
    }

    public void eliminar(Long id) {
        boolean eliminado = productoRepository.eliminar(id);

        if (!eliminado) {
            throw new Resourcenotfoundexception("No existe un producto con id " + id);
        }
    }

    private Productoresponse convertirAResponse(Producto producto) {
        Productoresponse response = new Productoresponse();
        response.setId(producto.getId());
        response.setNombre(producto.getNombre());
        response.setDescripcion(producto.getDescripcion());
        response.setPrecio(producto.getPrecio());
        response.setStock(producto.getStock());
        response.setDisponible(producto.isDisponible());
        return response;
    }
}
