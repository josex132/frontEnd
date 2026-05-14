package TrabajoAPI.repository;

import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import TrabajoAPI.model.Producto;
@Repository
public class Productorepository {

    private Map<Long, Producto> productos = new HashMap<>();
    private long contadorId = 1;

    public Producto guardar(Producto producto) {
        if (producto.getId() == null) {
            producto.setId(contadorId);
            contadorId++;
        }
        productos.put(producto.getId(), producto);
        return producto;
    }

    public Producto buscarPorId(Long id) {
        return productos.get(id);
    }

    public List<Producto> buscarTodos() {
        List<Producto> lista = new ArrayList<>();
        for (Producto p : productos.values()) {
            lista.add(p);
        }
        return lista;
    }

    public boolean eliminar(Long id) {
        if (productos.containsKey(id)) {
            productos.remove(id);
            return true;
        }
        return false;
    }

    public boolean existeNombre(String nombre) {
        for (Producto p : productos.values()) {
            if (p.getNombre().equals(nombre)) {
                return true;
            }
        }
        return false;
    }

    public boolean existeNombreEnOtroProducto(String nombre, Long idActual) {
        for (Producto p : productos.values()) {
            if (p.getNombre().equals(nombre) && !p.getId().equals(idActual)) {
                return true;
            }
        }
        return false;
    }
}
